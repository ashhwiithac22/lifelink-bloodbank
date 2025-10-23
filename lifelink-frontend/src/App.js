//frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DonorSearch from './pages/DonorSearch';
import HospitalRequests from './pages/HospitalRequests';
import AdminPanel from './pages/AdminPanel';
import AdminManageRequests from './pages/AdminManageRequests'; // NEW
import Donations from './pages/Donations';
import HelpRestock from './pages/HelpRestock';
import About from './pages/About';
import RecordDonation from './pages/RecordDonation';
import BloodRequest from './pages/BloodRequest';
import './App.css';

// Simple ProtectedRoute component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              
              {/* Blood Request Route */}
              <Route 
                path="/blood-request" 
                element={
                  <ProtectedRoute allowedRoles={['hospital']}>
                    <BloodRequest />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/record-donation" 
                element={
                  <ProtectedRoute allowedRoles={['donor']}>
                    <RecordDonation />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/donors" 
                element={
                  <ProtectedRoute allowedRoles={['hospital', 'admin']}>
                    <DonorSearch />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/requests" 
                element={
                  <ProtectedRoute allowedRoles={['hospital', 'admin']}>
                    <HospitalRequests />
                  </ProtectedRoute>
                } 
              />
              
              {/* NEW: Admin Manage Requests Route */}
              <Route 
                path="/admin/manage-requests" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminManageRequests />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/donations" 
                element={
                  <ProtectedRoute allowedRoles={['donor', 'admin', 'hospital']}>
                    <Donations />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/help-restock" 
                element={
                  <ProtectedRoute allowedRoles={['donor', 'hospital', 'admin']}>
                    <HelpRestock />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;