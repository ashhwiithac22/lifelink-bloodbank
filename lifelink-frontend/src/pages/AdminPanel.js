//frontend/src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, inventoryAPI, requestsAPI, donorsAPI, donationsAPI } from '../services/api';
import ContactModal from '../components/ContactModal';
import EmailModal from '../components/EmailModal';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    bloodGroup: '',
    status: '',
    hospitalName: ''
  });

  // NEW: Modal states
  const [contactModal, setContactModal] = useState({ isOpen: false, donor: null });
  const [emailModal, setEmailModal] = useState({ isOpen: false, donor: null });

  useEffect(() => {
    loadDashboardStats();
    if (activeTab !== 'dashboard') {
      loadData();
    }
  }, [activeTab]);

  const loadDashboardStats = async () => {
    try {
      const [statsResponse, inventoryResponse, recentDonationsResponse] = await Promise.all([
        adminAPI.getDashboard(),
        inventoryAPI.getAll(),
        donationsAPI.getAll({ limit: 5 })
      ]);
      
      setStats(statsResponse.data);
      setInventory(inventoryResponse.data);
      setDonations(recentDonationsResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'users':
          const usersResponse = await adminAPI.getUsers();
          setUsers(usersResponse.data);
          break;
        case 'inventory':
          const inventoryResponse = await inventoryAPI.getAll();
          setInventory(inventoryResponse.data);
          break;
        case 'requests':
          const requestsResponse = await requestsAPI.getAdminAll(searchFilters);
          setRequests(requestsResponse.data);
          break;
        case 'donors':
          const donorsResponse = await donorsAPI.getAll();
          setDonors(donorsResponse.data);
          break;
        case 'donations':
          const donationsResponse = await donationsAPI.getAll();
          setDonations(donationsResponse.data);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Contact Donor handler
  const handleContactDonor = (donor) => {
    setContactModal({ isOpen: true, donor });
  };

  // NEW: Send Email handler
  const handleSendEmail = (donor) => {
    setEmailModal({ isOpen: true, donor });
  };

  // NEW: Email sent callback
  const handleEmailSent = () => {
    // Refresh data or show notification
    console.log('Email sent successfully');
    // You can add toast notification here
  };

  const handleUpdateInventory = async (bloodGroup, unitsAvailable) => {
    try {
      await inventoryAPI.adjust({ 
        bloodGroup, 
        adjustment: unitsAvailable, 
        reason: 'Manual adjustment by admin' 
      });
      loadData();
      loadDashboardStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Error updating inventory: ' + error.response?.data?.message);
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await requestsAPI.updateStatus(requestId, status);
      alert(`Request ${status} successfully!`);
      loadData();
      loadDashboardStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Error updating request: ' + error.response?.data?.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(userId);
        alert('User deleted successfully!');
        loadData();
        loadDashboardStats(); // Refresh stats
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.response?.data?.message);
      }
    }
  };

  const handleSearchChange = (e) => {
    const newFilters = {
      ...searchFilters,
      [e.target.name]: e.target.value
    };
    setSearchFilters(newFilters);
    
    if (activeTab === 'requests') {
      loadRequestsWithFilters(newFilters);
    }
  };

  const loadRequestsWithFilters = async (filters) => {
    setLoading(true);
    try {
      const response = await requestsAPI.getAdminAll(filters);
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading filtered requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockLevel = (units) => {
    if (units < 5) return 'critical';
    if (units < 10) return 'low';
    return 'good';
  };

  return (
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <h1>🛠️ Admin Panel</h1>
          <p>Complete system administration and management</p>
        </div>
        
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users ({stats.totalDonors + stats.totalHospitals || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            🩸 Inventory
          </button>
          <Link 
            to="/admin/manage-requests"
            className="tab-btn"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            📋 Manage Requests ({stats.pendingRequests || 0})
          </Link>
          <button 
            className={`tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
            onClick={() => setActiveTab('donors')}
          >
            🔍 Donors ({stats.totalDonors || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('donations')}
          >
            💉 Donations
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="tab-content">
            {/* Admin Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="admin-dashboard">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <h3>Total Donors</h3>
                      <p className="stat-number">{stats.totalDonors || 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🏥</div>
                    <div className="stat-info">
                      <h3>Total Hospitals</h3>
                      <p className="stat-number">{stats.totalHospitals || 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                      <h3>Total Requests</h3>
                      <p className="stat-number">{stats.totalRequests || 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                      <h3>Pending Requests</h3>
                      <p className="stat-number">{stats.pendingRequests || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Inventory Overview */}
                <div className="inventory-overview">
                  <h3>🩸 Blood Inventory Overview</h3>
                  <div className="inventory-summary-grid">
                    {inventory.map(item => (
                      <div key={item.bloodGroup} className={`inventory-summary-item ${getStockLevel(item.unitsAvailable)}`}>
                        <span className="blood-group">{item.bloodGroup}</span>
                        <span className="units">{item.unitsAvailable} units</span>
                        <span className="stock-level">{getStockLevel(item.unitsAvailable).toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Donations */}
                <div className="recent-donations">
                  <h3>Recent Donations</h3>
                  <div className="donations-list">
                    {donations.length > 0 ? (
                      donations.map(donation => (
                        <div key={donation._id} className="donation-item">
                          <div className="donation-details">
                            <strong>{donation.donorName}</strong> donated{' '}
                            <span className="blood-type">{donation.bloodGroup}</span> -{' '}
                            {donation.unitsDonated} unit(s)
                          </div>
                          <div className="donation-date">
                            {new Date(donation.donationDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No recent donations</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Users Management */}
            {activeTab === 'users' && (
              <div className="users-management">
                <div className="section-header">
                  <h2>User Management</h2>
                  <p>Manage all system users (Donors, Hospitals, Admins)</p>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>City</th>
                        <th>Blood Group</th>
                        <th>Hospital</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id}>
                          <td>
                            <div className="user-info">
                              <strong>{user.name}</strong>
                              {user.availability !== undefined && (
                                <span className={`availability-dot ${user.availability ? 'available' : 'unavailable'}`}></span>
                              )}
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge ${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>{user.city}</td>
                          <td>{user.bloodGroup || '-'}</td>
                          <td>{user.hospitalName || '-'}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button 
                              onClick={() => handleDeleteUser(user._id)}
                              className="btn btn-danger btn-sm"
                              disabled={user.role === 'admin'}
                              title={user.role === 'admin' ? 'Cannot delete admin users' : 'Delete user'}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inventory Management */}
            {activeTab === 'inventory' && (
              <div className="inventory-management">
                <div className="section-header">
                  <h2>Blood Inventory Management</h2>
                  <p>Manage blood stock levels and monitor inventory status</p>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Blood Group</th>
                        <th>Units Available</th>
                        <th>Stock Status</th>
                        <th>Last Updated</th>
                        <th>Update Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(item => (
                        <tr key={item.bloodGroup} className={`stock-${getStockLevel(item.unitsAvailable)}`}>
                          <td><strong>{item.bloodGroup}</strong></td>
                          <td>
                            <span className={`units-count ${getStockLevel(item.unitsAvailable)}`}>
                              {item.unitsAvailable}
                            </span>
                          </td>
                          <td>
                            <span className={`stock-status ${getStockLevel(item.unitsAvailable)}`}>
                              {getStockLevel(item.unitsAvailable).toUpperCase()}
                            </span>
                          </td>
                          <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                          <td>
                            <div className="inventory-controls">
                              <input
                                type="number"
                                defaultValue={item.unitsAvailable}
                                min="0"
                                className="inventory-input"
                                onBlur={(e) => {
                                  const newValue = parseInt(e.target.value);
                                  if (!isNaN(newValue) && newValue >= 0) {
                                    handleUpdateInventory(item.bloodGroup, newValue - item.unitsAvailable);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleUpdateInventory(item.bloodGroup, 1)}
                                className="btn btn-success btn-sm"
                                title="Add 1 unit"
                              >
                                +
                              </button>
                              <button
                                onClick={() => handleUpdateInventory(item.bloodGroup, -1)}
                                className="btn btn-danger btn-sm"
                                disabled={item.unitsAvailable <= 0}
                                title="Remove 1 unit"
                              >
                                -
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Requests Management - REMOVED since we have dedicated page */}
            {activeTab === 'requests' && (
              <div className="redirect-notice">
                <div className="notice-content">
                  <h2>📋 Manage Requests</h2>
                  <p>Blood request management has been moved to a dedicated page for better organization and real-time updates.</p>
                  <Link to="/admin/manage-requests" className="btn btn-primary">
                    🚀 Go to Manage Requests
                  </Link>
                </div>
              </div>
            )}

            {/* Donors Management - UPDATED WITH NEW FUNCTIONALITY */}
            {activeTab === 'donors' && (
              <div className="donors-management">
                <div className="section-header">
                  <h2>Donor Management</h2>
                  <p>View and manage all registered blood donors</p>
                </div>
                <div className="donors-grid">
                  {donors.map(donor => (
                    <div key={donor._id} className="donor-card">
                      <div className="donor-header">
                        <h4>{donor.name}</h4>
                        <span className={`availability ${donor.availability ? 'available' : 'unavailable'}`}>
                          {donor.availability ? '✅ Available' : '❌ Unavailable'}
                        </span>
                      </div>
                      <div className="donor-details">
                        <div className="detail-row">
                          <strong>Blood Group:</strong>
                          <span className="blood-group">{donor.bloodGroup}</span>
                        </div>
                        <div className="detail-row">
                          <strong>Age:</strong>
                          <span>{donor.age} years</span>
                        </div>
                        <div className="detail-row">
                          <strong>City:</strong>
                          <span>{donor.city}</span>
                        </div>
                        <div className="detail-row">
                          <strong>Contact:</strong>
                          <span>{donor.contact}</span>
                        </div>
                        <div className="detail-row">
                          <strong>Email:</strong>
                          <span>{donor.email}</span>
                        </div>
                        <div className="detail-row">
                          <strong>Joined:</strong>
                          <span>{new Date(donor.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="donor-actions">
                        {/* UPDATED: Working Contact Donor button */}
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleContactDonor(donor)}
                        >
                          📞 Contact Donor
                        </button>
                        {/* UPDATED: Working Send Email button */}
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleSendEmail(donor)}
                        >
                          📧 Send Email
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Donations Management */}
            {activeTab === 'donations' && (
              <div className="donations-management">
                <div className="section-header">
                  <h2>Donation History</h2>
                  <p>View all blood donations recorded in the system</p>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Donor</th>
                        <th>Blood Group</th>
                        <th>Units</th>
                        <th>Hospital</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map(donation => (
                        <tr key={donation._id}>
                          <td>{donation.donorName}</td>
                          <td><span className="blood-type">{donation.bloodGroup}</span></td>
                          <td>{donation.unitsDonated}</td>
                          <td>{donation.hospitalName || 'Community Donation'}</td>
                          <td>{new Date(donation.donationDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${donation.status}`}>
                              {donation.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEW: Contact Modal */}
        <ContactModal
          donor={contactModal.donor}
          isOpen={contactModal.isOpen}
          onClose={() => setContactModal({ isOpen: false, donor: null })}
        />

        {/* NEW: Email Modal */}
        <EmailModal
          donor={emailModal.donor}
          isOpen={emailModal.isOpen}
          onClose={() => setEmailModal({ isOpen: false, donor: null })}
          onEmailSent={handleEmailSent}
        />
      </div>
    </div>
  );
};

export default AdminPanel;