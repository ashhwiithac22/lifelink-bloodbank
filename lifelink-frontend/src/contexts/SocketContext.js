import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server via Socket.io');
      setIsConnected(true);
      
      // Join hospital-specific room if user is a hospital
      if (user && user.role === 'hospital') {
        newSocket.emit('joinHospitalRoom', user._id);
        console.log(`🏥 Joined hospital room: ${user._id}`);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [user]);

  // Rejoin room when user changes
  useEffect(() => {
    if (socket && isConnected && user && user.role === 'hospital') {
      socket.emit('joinHospitalRoom', user._id);
      console.log(`🏥 Rejoined hospital room: ${user._id}`);
    }
  }, [socket, isConnected, user]);

  const value = {
    socket,
    isConnected,
    emitEvent: (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      }
    },
    listenToEvent: (event, callback) => {
      if (socket && isConnected) {
        socket.on(event, callback);
        
        // Return cleanup function
        return () => socket.off(event, callback);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};