/*lifelink-frontend/src/pages/Dashboard.js*/
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { donorsAPI, requestsAPI, adminAPI, inventoryAPI, donationsAPI } from '../services/api';
import BloodInventory from '../components/BloodInventory';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentDonors, setRecentDonors] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({});
  const [availability, setAvailability] = useState(user?.availability || false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      if (user?.role === 'admin') {
        const [dashboardResponse, requestsResponse, donorsResponse, donationsResponse, inventoryResponse] = await Promise.all([
          adminAPI.getDashboard(),
          requestsAPI.getAll({ status: 'pending' }),
          donorsAPI.getAll({ availability: true }),
          donationsAPI.getStats(),
          inventoryAPI.getAll()
        ]);
        
        setStats(dashboardResponse.data);
        setRecentRequests(requestsResponse.data.slice(0, 6));
        setRecentDonors(donorsResponse.data.slice(0, 6));
        setRecentDonations(donationsResponse.data.donationsByBloodGroup || []);
        calculateInventoryStats(inventoryResponse.data);
      } else if (user?.role === 'hospital') {
        const [requestsResponse, inventoryResponse, donorsResponse, donationsResponse] = await Promise.all([
          requestsAPI.getAll(),
          inventoryAPI.getAll(),
          donorsAPI.getAll({ availability: true }),
          donationsAPI.getStats()
        ]);
        
        setStats({ 
          totalRequests: requestsResponse.data.length,
          pendingRequests: requestsResponse.data.filter(req => req.status === 'pending').length,
          approvedRequests: requestsResponse.data.filter(req => req.status === 'approved').length
        });
        setRecentRequests(requestsResponse.data.slice(0, 5));
        setRecentDonors(donorsResponse.data.slice(0, 4));
        calculateInventoryStats(inventoryResponse.data);
      } else if (user?.role === 'donor') {
        const [inventoryResponse, donationsResponse] = await Promise.all([
          inventoryAPI.getAll(),
          donationsAPI.getAll()
        ]);
        
        setStats({ 
          totalDonations: donationsResponse.data.length,
          totalUnits: donationsResponse.data.reduce((sum, donation) => sum + donation.unitsDonated, 0)
        });
        setRecentDonations(donationsResponse.data.slice(0, 4));
        calculateInventoryStats(inventoryResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Enhanced Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Welcome back, {user?.name}! 👋</h1>
              <p>Here's what's happening with your blood bank today</p>
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
          {/* Left Column - Stats & Quick Actions */}
          <div className="dashboard-column">
            {/* Quick Actions */}
            <div className="quick-actions-card">
              <h2>🚀 Quick Actions</h2>
              <div className="actions-grid">
                {user?.role === 'donor' && (
                  <>
                    <Link to="/help-restock" className="action-card">
                      <div className="action-icon">🩸</div>
                      <div className="action-content">
                        <h3>Record Donation</h3>
                        <p>Help restock blood inventory</p>
                      </div>
                    </Link>
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
                  </>
                )}
                
                {user?.role === 'hospital' && (
                  <>
                    <Link to="/requests" className="action-card">
                      <div className="action-icon">🆕</div>
                      <div className="action-content">
                        <h3>New Request</h3>
                        <p>Create blood request</p>
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
                    <Link to="/requests" className="action-card">
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

            {/* Role-Specific Statistics */}
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
                        <span className="stat-trend trend-up">+12%</span>
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
                        <span className="stat-trend trend-down">-5%</span>
                      </div>
                    </div>
                  </>
                )}

                {user?.role === 'hospital' && (
                  <>
                    <div className="stat-item">
                      <div className="stat-icon">📋</div>
                      <div className="stat-info">
                        <h3>My Requests</h3>
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
                    <div className="stat-item">
                      <div className="stat-icon">✅</div>
                      <div className="stat-info">
                        <h3>Approved</h3>
                        <p className="stat-number">{stats.approvedRequests || 0}</p>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">🩸</div>
                      <div className="stat-info">
                        <h3>Available Donors</h3>
                        <p className="stat-number">{recentDonors.length}</p>
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

          {/* Right Column - Activity & Inventory */}
          <div className="dashboard-column">
            {/* Recent Activity */}
            {(user?.role === 'admin' || user?.role === 'hospital') && (
              <div className="activity-card">
                <div className="card-header">
                  <h2>📋 Recent Requests</h2>
                  <Link to="/requests" className="view-all">View All →</Link>
                </div>
                <div className="activity-list">
                  {recentRequests.length > 0 ? (
                    recentRequests.map(request => (
                      <div key={request._id} className="activity-item">
                        <div className="activity-icon">🏥</div>
                        <div className="activity-content">
                          <h4>{request.hospitalName}</h4>
                          <p>
                            <span className="blood-type">{request.bloodGroup}</span> • 
                            {request.unitsRequired} units • 
                            {getUrgencyBadge(request.urgency)}
                          </p>
                          <span className="activity-time">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="activity-status">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No recent requests</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Donors for Admin */}
            {user?.role === 'admin' && (
              <div className="donors-card">
                <div className="card-header">
                  <h2>👥 Available Donors</h2>
                  <Link to="/donors" className="view-all">View All →</Link>
                </div>
                <div className="donors-list">
                  {recentDonors.length > 0 ? (
                    recentDonors.map(donor => (
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
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No available donors</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Donations for Donors */}
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