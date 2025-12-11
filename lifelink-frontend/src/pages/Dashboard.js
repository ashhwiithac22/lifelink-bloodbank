import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { donorsAPI, requestsAPI, adminAPI, inventoryAPI, donationsAPI } from '../services/api';
import BloodInventory from '../components/BloodInventory';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentDonors, setRecentDonors] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({});
  const [availability, setAvailability] = useState(user?.availability || false);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // FIXED: Moved loadAdminRecentRequests function inside component
  const loadAdminRecentRequests = async () => {
    try {
      const response = adminAPI.getRequests ? await adminAPI.getRequests() : await requestsAPI.getAll();
      
      // FIX: Handle non-array responses
      const requests = Array.isArray(response.data) ? response.data : [];
      setRecentRequests(requests.slice(0, 5));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error polling for admin requests:', error);
      
      // Don't clear requests on error, just log it
      if (error.response?.status === 403) {
        console.log('Admin access denied. User may not be logged in as admin.');
      }
    }
  };

  const loadRecentRequests = async () => {
    try {
      if (user?.role === 'hospital') {
        const response = await requestsAPI.getHospitalDonorRequests();
        const requests = response.data || [];
        
        // Filter unique requests and update state
        const uniqueRequests = filterUniqueRequests(requests).slice(0, 5);
        setRecentRequests(uniqueRequests);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error polling for requests:', error);
    }
  };

  // FIXED: Moved filterUniqueRequests inside component
  const filterUniqueRequests = (requests) => {
    const uniqueMap = new Map();
    
    requests.forEach(request => {
      request.donorRequests.forEach(donorReq => {
        const key = `${donorReq.donorId}_${request.bloodGroup}`;
        if (!uniqueMap.has(key) || new Date(request.createdAt) > new Date(uniqueMap.get(key).createdAt)) {
          uniqueMap.set(key, {
            ...request,
            displayDonorRequest: donorReq,
            totalDonorsContacted: request.donorRequests.length,
            emailsSent: request.donorRequests.filter(dr => dr.emailSent).length,
            donorsResponded: request.donorRequests.filter(dr => dr.donorResponded).length
          });
        }
      });
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading dashboard data for:', user?.role);
      
      if (user?.role === 'admin') {
        const [dashboardResponse, usersResponse, inventoryResponse] = await Promise.all([
          adminAPI.getDashboard(),
          adminAPI.getUsers(),
          inventoryAPI.getAll()
        ]);
        
        console.log('📊 Admin dashboard response:', dashboardResponse.data);
        console.log('👥 Users response count:', usersResponse.data?.length);
        console.log('🩸 Inventory response:', inventoryResponse.data);
        
        // Set stats from dashboard response
        setStats(dashboardResponse.data);
        
        // Calculate inventory stats - FIXED: inventoryAPI.getAll() returns {data: array}
        const inventoryData = inventoryResponse.data || []; // Already an array from fixed API
        const totalUnits = Array.isArray(inventoryData) 
          ? inventoryData.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0)
          : 0;
        const criticalStock = Array.isArray(inventoryData)
          ? inventoryData.filter(item => (item.unitsAvailable || 0) < 5).length
          : 0;
        
        setInventoryStats({
          totalUnits,
          criticalStock,
          totalBloodGroups: Array.isArray(inventoryData) ? inventoryData.length : 8
        });
        
        // Get donors for display
        const donors = usersResponse.data.filter(u => u.role === 'donor');
        setRecentDonors(donors.slice(0, 6));
        
        // Get requests
        try {
          const requestsResponse = await adminAPI.getRequests();
          setRecentRequests(requestsResponse.data.slice(0, 5));
        } catch (reqError) {
          console.log('Could not load requests:', reqError.message);
        }
        
      } else if (user?.role === 'hospital') {
        const [inventoryResponse, donorsResponse] = await Promise.all([
          inventoryAPI.getAll(),
          donorsAPI.getAll({ availability: true })
        ]);
        
        console.log('🏥 Hospital inventory:', inventoryResponse.data);
        console.log('🏥 Hospital donors:', donorsResponse.data?.length);
        
        // Calculate inventory stats - FIXED
        const inventoryData = inventoryResponse.data || [];
        const totalUnits = Array.isArray(inventoryData) 
          ? inventoryData.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0)
          : 0;
        const criticalStock = Array.isArray(inventoryData)
          ? inventoryData.filter(item => (item.unitsAvailable || 0) < 5).length
          : 0;
        
        setInventoryStats({
          totalUnits,
          criticalStock,
          totalBloodGroups: Array.isArray(inventoryData) ? inventoryData.length : 8
        });
        
        // Set donors
        setRecentDonors(donorsResponse.data.slice(0, 4));
        
        // Get requests
        try {
          const requestsResponse = await requestsAPI.getHospitalDonorRequests();
          const requests = requestsResponse.data || [];
          const uniqueRequests = filterUniqueRequests(requests);
          
          setStats({ 
            totalRequests: uniqueRequests.length,
            pendingRequests: uniqueRequests.filter(req => req.status === 'pending').length,
            approvedRequests: uniqueRequests.filter(req => req.status === 'approved').length,
            totalDonorsContacted: uniqueRequests.reduce((sum, req) => sum + (req.totalDonorsContacted || 0), 0),
            emailsSent: uniqueRequests.reduce((sum, req) => sum + (req.emailsSent || 0), 0),
            availableDonors: donorsResponse.data.length
          });
          
          setRecentRequests(uniqueRequests.slice(0, 5));
        } catch (reqError) {
          console.log('Could not load hospital requests:', reqError.message);
          setStats({
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            totalDonorsContacted: 0,
            emailsSent: 0,
            availableDonors: donorsResponse.data.length
          });
        }
        
      } else if (user?.role === 'donor') {
        const [inventoryResponse, donationsResponse] = await Promise.all([
          inventoryAPI.getAll(),
          donationsAPI.getAll({ donorId: user._id })
        ]);
        
        // Calculate inventory stats - FIXED
        const inventoryData = inventoryResponse.data || [];
        const totalUnits = Array.isArray(inventoryData) 
          ? inventoryData.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0)
          : 0;
        const criticalStock = Array.isArray(inventoryData)
          ? inventoryData.filter(item => (item.unitsAvailable || 0) < 5).length
          : 0;
        
        setInventoryStats({
          totalUnits,
          criticalStock,
          totalBloodGroups: Array.isArray(inventoryData) ? inventoryData.length : 8
        });
        
        const donorDonations = donationsResponse.data || [];
        setStats({ 
          totalDonations: donorDonations.length,
          totalUnits: donorDonations.reduce((sum, donation) => sum + (donation.unitsDonated || 1), 0)
        });
        setRecentDonations(donorDonations.slice(0, 4));
      }
      
      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      
      // Set default stats
      setInventoryStats({
        totalUnits: 0,
        criticalStock: 0,
        totalBloodGroups: 8
      });
      
      if (user?.role === 'donor') {
        setStats({ 
          totalDonations: 0,
          totalUnits: 0
        });
        setRecentDonations([]);
      } else if (user?.role === 'hospital') {
        setStats({ 
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          totalDonorsContacted: 0,
          emailsSent: 0,
          availableDonors: 0
        });
        setRecentRequests([]);
        setRecentDonors([]);
      } else if (user?.role === 'admin') {
        setStats({ 
          totalDonors: 0,
          totalHospitals: 0,
          totalRequests: 0,
          pendingRequests: 0
        });
        setRecentRequests([]);
        setRecentDonors([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Proper useEffect with dependency array
  useEffect(() => {
    loadDashboardData();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      if (user?.role === 'hospital') {
        loadRecentRequests();
      } else if (user?.role === 'admin') {
        loadAdminRecentRequests();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]); // Add user as dependency

  const calculateInventoryStats = (inventory) => {
    const totalUnits = inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0);
    const criticalStock = inventory.filter(item => (item.unitsAvailable || 0) < 5).length;
    const lowStock = inventory.filter(item => (item.unitsAvailable || 0) < 10).length;
    
    setInventoryStats({
      totalUnits,
      criticalStock,
      lowStock,
      totalBloodGroups: inventory.length
    });
  };

  const handleAvailabilityToggle = async () => {
    try {
      await donorsAPI.updateAvailability(!availability);
      setAvailability(!availability);
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleRecordDonation = () => {
    navigate('/record-donation');
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      fulfilled: 'status-fulfilled'
    };
    return <span className={`status-badge ${statusClasses[status]}`}>{status}</span>;
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyClasses = {
      low: 'urgency-low',
      medium: 'urgency-medium',
      high: 'urgency-high'
    };
    return <span className={`urgency-badge ${urgencyClasses[urgency]}`}>{urgency}</span>;
  };

  const formatAdminRequestInfo = (request) => {
    if (request.isAuto) {
      return '🤖 Auto-generated • Low inventory alert';
    }
    
    if (request.donorName) {
      return `To: ${request.donorName} • ${request.donorEmail}`;
    }
    
    return 'System request';
  };

  const formatDonorInfo = (request) => {
    const contactedDonors = request.totalDonorsContacted || 1;
    const respondedDonors = request.donorsResponded || 0;
    const emailSentDonors = request.emailsSent || 1;
    
    return `${contactedDonors} donor${contactedDonors !== 1 ? 's' : ''} • ${emailSentDonors} email${emailSentDonors !== 1 ? 's' : ''} sent • ${respondedDonors} responded`;
  };

  const getDonorNames = (request) => {
    if (!request.displayDonorRequest) return '';
    return request.displayDonorRequest.donorName || 'Unknown';
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDashboardData();
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  // Rest of your JSX remains the same...
  return (
    <div className="dashboard-page">
      {/* YOUR EXISTING JSX CODE - Keep it exactly as you have it */}
    </div>
  );
};

export default Dashboard;