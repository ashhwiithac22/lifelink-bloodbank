/*lifelink-frontend/src/pages/AdminPanel.js*/
import React, { useState, useEffect } from 'react';
import { adminAPI, inventoryAPI, requestsAPI } from '../services/api';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

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
          const requestsResponse = await requestsAPI.getAll();
          setRequests(requestsResponse.data);
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

  const handleUpdateInventory = async (bloodGroup, unitsAvailable) => {
    try {
      await inventoryAPI.update({ bloodGroup, unitsAvailable });
      loadData();
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await requestsAPI.updateStatus(requestId, status);
      loadData();
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(userId);
        loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className="admin-panel">
      <div className="container">
        <h1>Admin Panel</h1>
        
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button 
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="tab-content">
            {activeTab === 'users' && (
              <div className="users-table">
                <h2>All Users</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>City</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.city}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteUser(user._id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="inventory-management">
                <h2>Manage Inventory</h2>
                <div className="inventory-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Blood Group</th>
                        <th>Units Available</th>
                        <th>Update Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(item => (
                        <tr key={item.bloodGroup}>
                          <td>{item.bloodGroup}</td>
                          <td>{item.unitsAvailable}</td>
                          <td>
                            <input
                              type="number"
                              defaultValue={item.unitsAvailable}
                              onBlur={(e) => handleUpdateInventory(item.bloodGroup, parseInt(e.target.value))}
                              min="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="requests-management">
                <h2>Manage Requests</h2>
                {requests.map(request => (
                  <div key={request._id} className="request-item">
                    <div className="request-info">
                      <h4>{request.hospitalName} - {request.bloodGroup}</h4>
                      <p>Units: {request.unitsRequired} | City: {request.city}</p>
                      <p>Status: {request.status}</p>
                    </div>
                    <div className="request-actions">
                      {request.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateRequestStatus(request._id, 'approved')}
                            className="btn btn-success btn-sm"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateRequestStatus(request._id, 'rejected')}
                            className="btn btn-danger btn-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;