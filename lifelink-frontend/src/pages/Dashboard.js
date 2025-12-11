import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { donorsAPI, requestsAPI, adminAPI, inventoryAPI, donationsAPI } from '../services/api';
import BloodInventory from '../components/BloodInventory';
// Use inventoryAPI.getAll() which now handles both formats
const inventoryResponse = await inventoryAPI.getAll();
const inventoryData = inventoryResponse.data || [];

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
  }, [user]);

 // In the loadAdminRecentRequests function, update it:

const loadAdminRecentRequests = async () => {
  try {
    const response = await adminAPI.getRequests ? await adminAPI.getRequests() : await requestsAPI.getAll();
    
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

// Also update the useEffect to check if user is admin before polling
useEffect(() => {
  loadDashboardData();
  
  // Set up polling only if user is admin
  if (user?.role === 'admin') {
    const interval = setInterval(() => {
      loadAdminRecentRequests();
    }, 30000);

    return () => clearInterval(interval);
  }
}, [user]); // Add user as dependency

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
      
      // Calculate inventory stats
      const inventory = inventoryResponse.data.inventory || inventoryResponse.data;
      const totalUnits = Array.isArray(inventory) 
        ? inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0)
        : 0;
      const criticalStock = Array.isArray(inventory)
        ? inventory.filter(item => (item.unitsAvailable || 0) < 5).length
        : 0;
      
      setInventoryStats({
        totalUnits,
        criticalStock,
        totalBloodGroups: Array.isArray(inventory) ? inventory.length : 8
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
      
      // Calculate inventory stats
      const inventory = inventoryResponse.data.inventory || inventoryResponse.data;
      const totalUnits = Array.isArray(inventory) 
        ? inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0)
        : 0;
      const criticalStock = Array.isArray(inventory)
        ? inventory.filter(item => (item.unitsAvailable || 0) < 5).length
        : 0;
      
      setInventoryStats({
        totalUnits,
        criticalStock,
        totalBloodGroups: Array.isArray(inventory) ? inventory.length : 8
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
      
      // Calculate inventory stats
      const inventory = inventoryResponse.data.inventory || inventoryResponse.data;
      const totalUnits = Array.isArray(inventory) 
        ? inventory.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0)
        : 0;
      const criticalStock = Array.isArray(inventory)
        ? inventory.filter(item => (item.unitsAvailable || 0) < 5).length
        : 0;
      
      setInventoryStats({
        totalUnits,
        criticalStock,
        totalBloodGroups: Array.isArray(inventory) ? inventory.length : 8
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

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Welcome back, {user?.name}! 👋</h1>
              <p>Here's what's happening with your blood bank today</p>
              <div className="connection-status connected">
                🔄 Auto-update active (30s)
              </div>
            </div>
            <div className="header-badges">
              <div className="role-badge">
                <span className={`role role-${user?.role}`}>{user?.role?.toUpperCase()}</span>
              </div>
              {user?.role === 'donor' && (
                <div className={`availability-badge ${availability ? 'available' : 'unavailable'}`}>
                  {availability ? '🟢 Available' : '🔴 Unavailable'}
                </div>
              )}
              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                title="Refresh data"
              >
                🔄
              </button>
            </div>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <span className="stat-label">Blood Units Available</span>
              <span className="stat-value">{inventoryStats.totalUnits || 0}</span>
            </div>
            <div className="header-stat">
              <span className="stat-label">Critical Stocks</span>
              <span className="stat-value critical">{inventoryStats.criticalStock || 0}</span>
            </div>
            <div className="header-stat">
              <span className="stat-label">Blood Types</span>
              <span className="stat-value">{inventoryStats.totalBloodGroups || 8}</span>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="dashboard-column">
            {/* Quick Actions */}
            <div className="quick-actions-card">
              <h2>🚀 Quick Actions</h2>
              <div className="actions-grid">
                {user?.role === 'donor' && (
                  <>
                    <div className="action-card" onClick={handleRecordDonation}>
                      <div className="action-icon">🩸</div>
                      <div className="action-content">
                        <h3>Record Donation</h3>
                        <p>Add a new blood donation</p>
                      </div>
                    </div>
                    
                    <div className="action-card" onClick={handleAvailabilityToggle}>
                      <div className="action-icon">📱</div>
                      <div className="action-content">
                        <h3>Update Status</h3>
                        <p>Mark as {availability ? 'unavailable' : 'available'}</p>
                      </div>
                    </div>
                    
                    <Link to="/donations" className="action-card">
                      <div className="action-icon">📊</div>
                      <div className="action-content">
                        <h3>My Donations</h3>
                        <p>View donation history</p>
                      </div>
                    </Link>
                    
                    <Link to="/help-restock" className="action-card">
                      <div className="action-icon">💪</div>
                      <div className="action-content">
                        <h3>Help Restock</h3>
                        <p>Find urgent needs</p>
                      </div>
                    </Link>
                  </>
                )}
                
                {user?.role === 'hospital' && (
                  <>
                    <Link to="/blood-request" className="action-card">
                      <div className="action-icon">🆕</div>
                      <div className="action-content">
                        <h3>New Request</h3>
                        <p>Send request to donors via email</p>
                      </div>
                    </Link>
                    <Link to="/donors" className="action-card">
                      <div className="action-icon">🔍</div>
                      <div className="action-content">
                        <h3>Find Donors</h3>
                        <p>Search available donors</p>
                      </div>
                    </Link>
                    <Link to="/requests" className="action-card">
                      <div className="action-icon">📋</div>
                      <div className="action-content">
                        <h3>My Requests</h3>
                        <p>View all requests</p>
                      </div>
                    </Link>
                  </>
                )}
                
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin" className="action-card">
                      <div className="action-icon">👥</div>
                      <div className="action-content">
                        <h3>Manage Users</h3>
                        <p>View all system users</p>
                      </div>
                    </Link>
                    <Link to="/admin/manage-requests" className="action-card">
                      <div className="action-icon">📋</div>
                      <div className="action-content">
                        <h3>Manage Requests</h3>
                        <p>Approve/reject requests</p>
                      </div>
                    </Link>
                    <Link to="/donors" className="action-card">
                      <div className="action-icon">🔍</div>
                      <div className="action-content">
                        <h3>View Donors</h3>
                        <p>See all registered donors</p>
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="stats-card">
              <h2>📈 Statistics Overview</h2>
              <div className="stats-grid">
                {user?.role === 'admin' && (
                  <>
                    <div className="stat-item">
                      <div className="stat-icon">👥</div>
                      <div className="stat-info">
                        <h3>Total Donors</h3>
                        <p className="stat-number">{stats.totalDonors || 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">🏥</div>
                      <div className="stat-info">
                        <h3>Hospitals</h3>
                        <p className="stat-number">{stats.totalHospitals || 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">📋</div>
                      <div className="stat-info">
                        <h3>Total Requests</h3>
                        <p className="stat-number">{stats.totalRequests || 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">⏳</div>
                      <div className="stat-info">
                        <h3>Pending</h3>
                        <p className="stat-number">{stats.pendingRequests || 0}</p>
                      </div>
                    </div>
                  </>
                )}

                {user?.role === 'hospital' && (
                  <>
                    <div className="stat-item">
                      <div className="stat-icon">📧</div>
                      <div className="stat-info">
                        <h3>My Requests</h3>
                        <p className="stat-number">{stats.totalRequests || 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">👥</div>
                      <div className="stat-info">
                        <h3>Donors Contacted</h3>
                        <p className="stat-number">{stats.totalDonorsContacted || 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">✅</div>
                      <div className="stat-info">
                        <h3>Emails Sent</h3>
                        <p className="stat-number">{stats.emailsSent || 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">🩸</div>
                      <div className="stat-info">
                        <h3>Available Donors</h3>
                        <p className="stat-number">{stats.availableDonors || 0}</p>
                      </div>
                    </div>
                  </>
                )}

                {user?.role === 'donor' && (
                  <>
                    <div className="stat-item">
                      <div className="stat-icon">💉</div>
                      <div className="stat-info">
                        <h3>Total Donations</h3>
                        <p className="stat-number">{stats.totalDonations || 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">🩸</div>
                      <div className="stat-info">
                        <h3>Units Donated</h3>
                        <p className="stat-number">{stats.totalUnits || 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">💖</div>
                      <div className="stat-info">
                        <h3>Lives Impacted</h3>
                        <p className="stat-number">{stats.totalUnits ? stats.totalUnits * 3 : 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">📅</div>
                      <div className="stat-info">
                        <h3>Last Donation</h3>
                        <p className="stat-number">
                          {recentDonations[0] 
                            ? new Date(recentDonations[0].donationDate).toLocaleDateString() 
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="dashboard-column">
            {/* Recent Requests - DIFFERENT VIEW FOR ADMIN */}
            {(user?.role === 'admin' || user?.role === 'hospital') && (
              <div className="activity-card">
                <div className="card-header">
                  <div className="header-title">
                    <h2>
                      {user?.role === 'admin' ? '📋 System Requests' : '📧 My Email Requests'}
                    </h2>
                    <span className="live-badge">AUTO-UPDATE</span>
                  </div>
                  <div className="header-actions">
                    <span className="last-update">
                      Updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                    <Link to={user?.role === 'admin' ? "/admin/manage-requests" : "/requests"} className="view-all">
                      View All →
                    </Link>
                  </div>
                </div>
                <div className="activity-list">
                  {recentRequests.length > 0 ? (
                    recentRequests.map(request => (
                      <div key={request._id} className="activity-item">
                        <div className="activity-icon">
                          {request.isAuto ? '🤖' : '📋'}
                        </div>
                        <div className="activity-content">
                          <h4>
                            {request.isAuto ? 'Low Inventory Alert' : 'Blood Request'}
                            {request.hasDuplicates && <span title="Has duplicates"> ⚠️</span>}
                          </h4>
                          <p>
                            <span className="blood-type">{request.bloodGroup}</span> • 
                            {request.unitsRequired} unit{request.unitsRequired !== 1 ? 's' : ''} • 
                            {getUrgencyBadge(request.urgency)}
                          </p>
                          <p className="request-info">
                            {user?.role === 'admin' 
                              ? formatAdminRequestInfo(request)
                              : `To: ${getDonorNames(request)}`
                            }
                          </p>
                          {user?.role === 'hospital' && (
                            <p className="email-status">
                              {formatDonorInfo(request)}
                            </p>
                          )}
                          <span className="activity-time">
                            {request.isAuto ? 'Generated' : 'Sent'} {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="activity-status">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No requests found</p>
                      {user?.role === 'hospital' && (
                        <Link to="/blood-request" className="btn btn-primary btn-sm">
                          Send Your First Request
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <p className="small">Auto-requests appear when inventory is low</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other dashboard components remain the same */}
            {user?.role === 'admin' && recentDonors.length > 0 && (
              <div className="donors-card">
                <div className="card-header">
                  <h2>👥 Available Donors</h2>
                  <Link to="/donors" className="view-all">View All →</Link>
                </div>
                <div className="donors-list">
                  {recentDonors.map(donor => (
                    <div key={donor._id} className="donor-item">
                      <div className="donor-avatar">
                        {donor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="donor-info">
                        <h4>{donor.name}</h4>
                        <p>
                          <span className="blood-type">{donor.bloodGroup}</span> • 
                          {donor.city} • {donor.age} yrs
                        </p>
                      </div>
                      <div className={`availability-status ${donor.availability ? 'available' : 'unavailable'}`}>
                        {donor.availability ? '🟢' : '🔴'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user?.role === 'donor' && recentDonations.length > 0 && (
              <div className="donations-card">
                <div className="card-header">
                  <h2>💉 Recent Donations</h2>
                  <Link to="/donations" className="view-all">View All →</Link>
                </div>
                <div className="donations-list">
                  {recentDonations.map(donation => (
                    <div key={donation._id} className="donation-item">
                      <div className="donation-icon">🩸</div>
                      <div className="donation-content">
                        <h4>{donation.bloodGroup} Donation</h4>
                        <p>{donation.unitsDonated} unit(s) • {new Date(donation.donationDate).toLocaleDateString()}</p>
                        {donation.hospitalName && (
                          <span className="hospital-name">{donation.hospitalName}</span>
                        )}
                      </div>
                      <div className="donation-impact">
                        <span className="impact-badge">
                          💖 {donation.unitsDonated * 3} lives
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blood Inventory */}
            <div className="inventory-card">
              <div className="card-header">
                <h2>🩸 Blood Inventory</h2>
                <div className="inventory-summary">
                  <span className="summary-item">
                    Total: <strong>{inventoryStats.totalUnits || 0}</strong> units
                  </span>
                  <span className="summary-item critical">
                    Critical: <strong>{inventoryStats.criticalStock || 0}</strong>
                  </span>
                </div>
              </div>
              <BloodInventory compact={true} />
            </div>

            {/* Emergency Contact */}
            <div className="emergency-card">
              <div className="emergency-content">
                <div className="emergency-icon">🚨</div>
                <div className="emergency-text">
                  <h3>Emergency Blood Need?</h3>
                  <p>24/7 emergency helpline for urgent blood requirements</p>
                  <div className="emergency-contact">
                    <strong>📞0422-3566580</strong>
                    <span className="emergency-note">Available 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;