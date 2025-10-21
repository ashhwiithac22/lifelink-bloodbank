/*lifelink-frontend/src/pages/Dashboard.js*/
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { donorsAPI, requestsAPI, adminAPI, inventoryAPI } from '../services/api';
import BloodInventory from '../components/BloodInventory';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentDonors, setRecentDonors] = useState([]);
  const [availability, setAvailability] = useState(user?.availability || false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      if (user?.role === 'admin') {
        const [dashboardResponse, requestsResponse, donorsResponse] = await Promise.all([
          adminAPI.getDashboard(),
          requestsAPI.getAll({ status: 'pending' }),
          donorsAPI.getAll()
        ]);
        
        setStats(dashboardResponse.data);
        setRecentRequests(requestsResponse.data.slice(0, 5));
        setRecentDonors(donorsResponse.data.slice(0, 5));
      } else if (user?.role === 'hospital') {
        const [requestsResponse, inventoryResponse] = await Promise.all([
          requestsAPI.getAll(),
          inventoryAPI.getAll()
        ]);
        
        setStats({ 
          totalRequests: requestsResponse.data.length,
          pendingRequests: requestsResponse.data.filter(req => req.status === 'pending').length
        });
        setRecentRequests(requestsResponse.data.slice(0, 5));
      } else if (user?.role === 'donor') {
        const inventoryResponse = await inventoryAPI.getAll();
        setStats({ bloodInventory: inventoryResponse.data });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      await donorsAPI.updateAvailability(!availability);
      setAvailability(!availability);
      alert(`You are now ${!availability ? 'available' : 'unavailable'} for donations`);
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

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
          <div className="user-role-badge">
            Role: <span className={`role-${user?.role}`}>{user?.role}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {user?.role === 'donor' && (
              <>
                <button className="action-card" onClick={handleAvailabilityToggle}>
                  <div className="action-icon">🩸</div>
                  <h3>Update Availability</h3>
                  <p>Mark yourself as {availability ? 'unavailable' : 'available'}</p>
                </button>
                <div className="action-card">
                  <div className="action-icon">📊</div>
                  <h3>My Donations</h3>
                  <p>View your donation history</p>
                </div>
              </>
            )}
            
            {user?.role === 'hospital' && (
              <>
                <button className="action-card" onClick={() => window.location.href = '/requests'}>
                  <div className="action-icon">🆕</div>
                  <h3>New Request</h3>
                  <p>Create blood request</p>
                </button>
                <button className="action-card" onClick={() => window.location.href = '/donors'}>
                  <div className="action-icon">🔍</div>
                  <h3>Find Donors</h3>
                  <p>Search available donors</p>
                </button>
              </>
            )}
            
            {user?.role === 'admin' && (
              <>
                <button className="action-card" onClick={() => window.location.href = '/admin'}>
                  <div className="action-icon">⚙️</div>
                  <h3>Manage Users</h3>
                  <p>View all system users</p>
                </button>
                <button className="action-card" onClick={() => window.location.href = '/requests'}>
                  <div className="action-icon">📋</div>
                  <h3>Manage Requests</h3>
                  <p>Approve/reject requests</p>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Statistics Section */}
        {user?.role === 'admin' && (
          <div className="admin-stats">
            <h2>System Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <h3>Total Donors</h3>
                <p>{stats.totalDonors || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏥</div>
                <h3>Total Hospitals</h3>
                <p>{stats.totalHospitals || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <h3>Total Requests</h3>
                <p>{stats.totalRequests || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <h3>Pending Requests</h3>
                <p>{stats.pendingRequests || 0}</p>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'hospital' && (
          <div className="hospital-stats">
            <h2>Hospital Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <h3>My Requests</h3>
                <p>{stats.totalRequests || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <h3>Pending</h3>
                <p>{stats.pendingRequests || 0}</p>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'donor' && (
          <div className="donor-dashboard">
            <div className="availability-section">
              <div className="availability-card">
                <h3>🩸 Donor Status</h3>
                <div className="status-indicator">
                  <span className={`status-dot ${availability ? 'available' : 'unavailable'}`}></span>
                  <span className="status-text">
                    You are currently <strong>{availability ? 'Available' : 'Unavailable'}</strong> for donations
                  </span>
                </div>
                <button 
                  onClick={handleAvailabilityToggle}
                  className={`toggle-btn ${availability ? 'available' : 'unavailable'}`}
                >
                  {availability ? 'Mark as Unavailable' : 'Mark as Available'}
                </button>
                <p className="status-note">
                  {availability 
                    ? 'Hospitals can see you as available for blood donation requests.' 
                    : 'You will not appear in donor search results.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {(user?.role === 'admin' || user?.role === 'hospital') && recentRequests.length > 0 && (
          <div className="recent-activity">
            <h2>Recent Requests</h2>
            <div className="activity-list">
              {recentRequests.map(request => (
                <div key={request._id} className="activity-item">
                  <div className="activity-content">
                    <h4>{request.hospitalName} - {request.bloodGroup}</h4>
                    <p>{request.unitsRequired} units • {request.urgency} urgency</p>
                    <span className="activity-time">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="activity-status">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Donors for Admin */}
        {user?.role === 'admin' && recentDonors.length > 0 && (
          <div className="recent-donors">
            <h2>Recent Donors</h2>
            <div className="donors-list">
              {recentDonors.map(donor => (
                <div key={donor._id} className="donor-item">
                  <div className="donor-avatar">{donor.name.charAt(0)}</div>
                  <div className="donor-info">
                    <h4>{donor.name}</h4>
                    <p>{donor.bloodGroup} • {donor.city}</p>
                  </div>
                  <div className={`availability-status ${donor.availability ? 'available' : 'unavailable'}`}>
                    {donor.availability ? 'Available' : 'Unavailable'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blood Inventory */}
        <div className="inventory-section">
          <h2>Blood Inventory</h2>
          <BloodInventory />
        </div>

        {/* Emergency Contact */}
        <div className="emergency-contact">
          <div className="emergency-card">
            <div className="emergency-icon">🚨</div>
            <div className="emergency-content">
              <h3>Emergency Blood Need?</h3>
              <p>For urgent blood requirements, contact our emergency helpline</p>
              <div className="emergency-contact-info">
                <strong>📞 Emergency Helpline: +1-800-LIFELINK</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;