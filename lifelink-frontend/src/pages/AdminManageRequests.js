// src/pages/AdminManageRequests.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, inventoryAPI } from '../services/api';

const AdminManageRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch requests from admin API
      const requestsResponse = await adminAPI.getRequests();
      console.log('Requests response:', requestsResponse.data);
      
      // Fetch inventory
      const inventoryResponse = await inventoryAPI.getAll();
      console.log('Inventory response:', inventoryResponse.data);
      
      // Handle requests data
      let requestsData = [];
      if (requestsResponse.data) {
        if (Array.isArray(requestsResponse.data)) {
          requestsData = requestsResponse.data;
        } else if (requestsResponse.data.data && Array.isArray(requestsResponse.data.data)) {
          requestsData = requestsResponse.data.data;
        }
      }
      
      setRequests(requestsData);
      
      // Handle inventory data
      let inventoryData = [];
      if (inventoryResponse.data) {
        if (Array.isArray(inventoryResponse.data)) {
          inventoryData = inventoryResponse.data;
        } else if (inventoryResponse.data.data && Array.isArray(inventoryResponse.data.data)) {
          inventoryData = inventoryResponse.data.data;
        }
      }
      
      setInventory(inventoryData);
      setLastUpdate(new Date());
      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please check console for details.');
      setRequests([]);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      // First try adminAPI.updateRequestStatus, fallback to regular API
      const response = await adminAPI.updateRequestStatus?.(requestId, status) || 
                       fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/requests/${requestId}`, {
                         method: 'PUT',
                         headers: {
                           'Content-Type': 'application/json',
                           'Authorization': `Bearer ${localStorage.getItem('token')}`
                         },
                         body: JSON.stringify({ status })
                       }).then(res => res.json());
      
      alert(`Request ${status} successfully!`);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Error updating request: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      fulfilled: 'status-fulfilled'
    };
    return <span className={`status-badge ${statusClasses[status] || ''}`}>{status}</span>;
  };

  const getUrgencyBadge = (urgency) => {
    const urgencyClasses = {
      low: 'urgency-low',
      medium: 'urgency-medium',
      high: 'urgency-high'
    };
    return <span className={`urgency-badge ${urgencyClasses[urgency] || ''}`}>{urgency}</span>;
  };

  const getStockLevel = (units) => {
    if (units === 0) return 'critical';
    if (units <= 3) return 'low';
    return 'good';
  };

  // Filter requests based on active tab
  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return request.status === 'pending';
    if (activeTab === 'approved') return request.status === 'approved';
    if (activeTab === 'rejected') return request.status === 'rejected';
    if (activeTab === 'fulfilled') return request.status === 'fulfilled';
    return true;
  });

  const criticalInventory = inventory.filter(item => item && item.unitsAvailable <= 3);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Loading requests...</p>
    </div>
  );

  return (
    <div className="admin-manage-requests">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>📋 Manage Blood Requests</h1>
            <p>Approve, reject, and monitor all blood requests in the system</p>
            
            {error && (
              <div className="alert alert-danger">
                ⚠️ {error}
              </div>
            )}
            
            <div className="connection-status">
              🔄 Auto-update active • Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/admin')}
            >
              ← Back to Admin Panel
            </button>
          </div>
        </div>

        {/* Critical Inventory Alert */}
        {criticalInventory.length > 0 && (
          <div className="alert alert-warning">
            <h4>🚨 Critical Stock Alert</h4>
            <p>The following blood groups are running low:</p>
            <div className="critical-stocks">
              {criticalInventory.map(item => (
                <span key={item.bloodGroup} className="critical-stock-item">
                  {item.bloodGroup}: {item.unitsAvailable} units
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="request-tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Requests ({requests.length})
          </button>
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button 
            className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({requests.filter(r => r.status === 'approved').length})
          </button>
          <button 
            className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({requests.filter(r => r.status === 'rejected').length})
          </button>
          <button 
            className={`tab ${activeTab === 'fulfilled' ? 'active' : ''}`}
            onClick={() => setActiveTab('fulfilled')}
          >
            Fulfilled ({requests.filter(r => r.status === 'fulfilled').length})
          </button>
        </div>

        {/* Requests Table */}
        <div className="requests-table-container">
          {filteredRequests.length === 0 ? (
            <div className="no-requests">
              <p>No requests found for the selected filter.</p>
            </div>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(request => (
                  <tr key={request._id} className={`request-row status-${request.status}`}>
                    <td className="request-id">
                      {request._id.substring(0, 8)}...
                    </td>
                    <td className="hospital-info">
                      <div className="hospital-name">
                        {request.hospitalId?.hospitalName || request.hospitalName || 'Unknown Hospital'}
                      </div>
                      <div className="hospital-contact">
                        {request.hospitalId?.contact || 'No contact'}
                      </div>
                    </td>
                    <td className="blood-group">
                      <span className="blood-type-badge">{request.bloodGroup}</span>
                    </td>
                    <td className="units-required">
                      {request.unitsRequired}
                    </td>
                    <td className="urgency">
                      {getUrgencyBadge(request.urgency || 'medium')}
                    </td>
                    <td className="status">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="request-date">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="actions">
                      {request.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleUpdateRequestStatus(request._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleUpdateRequestStatus(request._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdateRequestStatus(request._id, 'fulfilled')}
                        >
                          Mark as Fulfilled
                        </button>
                      )}
                      <button 
                        className="btn btn-info btn-sm"
                        onClick={() => navigate(`/requests/${request._id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Statistics */}
        <div className="request-stats">
          <div className="stat-card">
            <h4>📊 Request Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Requests:</span>
                <span className="stat-value">{requests.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pending:</span>
                <span className="stat-value">{requests.filter(r => r.status === 'pending').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Approved:</span>
                <span className="stat-value">{requests.filter(r => r.status === 'approved').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Fulfilled:</span>
                <span className="stat-value">{requests.filter(r => r.status === 'fulfilled').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Rejected:</span>
                <span className="stat-value">{requests.filter(r => r.status === 'rejected').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx>{`
        .admin-manage-requests {
          padding: 20px;
          background: #f8f9fa;
          min-height: 100vh;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .header-content h1 {
          color: #dc3545;
          margin-bottom: 10px;
        }
        
        .header-content p {
          color: #666;
          margin-bottom: 10px;
        }
        
        .connection-status {
          background: #e7f3ff;
          padding: 8px 12px;
          border-radius: 6px;
          display: inline-block;
          font-size: 14px;
          color: #0066cc;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
        }
        
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }
        
        .btn-primary {
          background: #dc3545;
          color: white;
        }
        
        .btn-primary:hover {
          background: #c82333;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #545b62;
        }
        
        .btn-success {
          background: #28a745;
          color: white;
        }
        
        .btn-danger {
          background: #dc3545;
          color: white;
        }
        
        .btn-info {
          background: #17a2b8;
          color: white;
        }
        
        .btn-sm {
          padding: 5px 10px;
          font-size: 12px;
          margin-right: 5px;
        }
        
        .alert {
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .alert-warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          color: #856404;
        }
        
        .alert-danger {
          background: #f8d7da;
          border-left: 4px solid #dc3545;
          color: #721c24;
        }
        
        .critical-stocks {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        
        .critical-stock-item {
          background: #dc3545;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .request-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .tab {
          padding: 10px 20px;
          background: #e9ecef;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .tab.active {
          background: #dc3545;
          color: white;
        }
        
        .requests-table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
          margin-bottom: 30px;
        }
        
        .requests-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .requests-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          border-bottom: 2px solid #dee2e6;
          font-weight: 600;
        }
        
        .requests-table td {
          padding: 15px;
          border-bottom: 1px solid #dee2e6;
        }
        
        .request-row:hover {
          background: #f8f9fa;
        }
        
        .request-id {
          font-family: monospace;
          color: #666;
        }
        
        .hospital-name {
          font-weight: 600;
        }
        
        .hospital-contact {
          font-size: 12px;
          color: #666;
        }
        
        .blood-type-badge {
          background: #dc3545;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: 600;
        }
        
        .status-badge {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-pending {
          background: #ffc107;
          color: #856404;
        }
        
        .status-approved {
          background: #28a745;
          color: white;
        }
        
        .status-rejected {
          background: #dc3545;
          color: white;
        }
        
        .status-fulfilled {
          background: #17a2b8;
          color: white;
        }
        
        .urgency-badge {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .urgency-low {
          background: #28a745;
          color: white;
        }
        
        .urgency-medium {
          background: #ffc107;
          color: #856404;
        }
        
        .urgency-high {
          background: #dc3545;
          color: white;
        }
        
        .no-requests {
          text-align: center;
          padding: 40px;
          color: #666;
        }
        
        .request-stats {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .stat-label {
          color: #666;
        }
        
        .stat-value {
          font-weight: 600;
          color: #dc3545;
        }
        
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
        }
        
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #dc3545;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminManageRequests;