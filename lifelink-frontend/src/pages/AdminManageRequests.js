//frontend/src/pages/AdminManageRequests.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, inventoryAPI } from '../services/api';

const AdminManageRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [urgentInventory, setUrgentInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all');

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
      const [requestsResponse, inventoryResponse] = await Promise.all([
        adminAPI.getRequests(),
        inventoryAPI.getAll()
      ]);
      
      setRequests(requestsResponse.data);
      
      // Calculate urgent inventory (≤ 3 units)
      const urgent = inventoryResponse.data.filter(item => item.unitsAvailable <= 3);
      setUrgentInventory(urgent);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await adminAPI.updateRequestStatus(requestId, status);
      alert(`Request ${status} successfully!`);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Error updating request: ' + error.response?.data?.message);
    }
  };

  const handleNotifyHospitals = async (bloodGroup) => {
    try {
      await adminAPI.notifyHospitals(bloodGroup);
      alert(`Notification sent to hospitals for ${bloodGroup} blood!`);
    } catch (error) {
      console.error('Error notifying hospitals:', error);
      alert('Error sending notification: ' + error.response?.data?.message);
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

  const getStockLevel = (units) => {
    if (units === 0) return 'critical';
    if (units <= 3) return 'low';
    return 'good';
  };

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') return true;
    if (activeTab === 'urgent') return request.isAuto || request.urgency === 'high';
    if (activeTab === 'auto') return request.isAuto;
    return request.status === activeTab;
  });

  if (loading) return <div className="loading">Loading requests...</div>;

  return (
    <div className="admin-manage-requests">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>🛠️ Manage Blood Requests</h1>
            <p>Approve, reject, and monitor all blood requests in the system</p>
            <div className="connection-status connected">
              🔄 Auto-update active (30s) • Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="refresh-btn"
              onClick={loadData}
              title="Refresh data"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📋 All Requests ({requests.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'urgent' ? 'active' : ''}`}
            onClick={() => setActiveTab('urgent')}
          >
            🚨 Urgent ({requests.filter(r => r.isAuto || r.urgency === 'high').length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            ⏳ Pending ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'auto' ? 'active' : ''}`}
            onClick={() => setActiveTab('auto')}
          >
            🤖 Auto-Generated ({requests.filter(r => r.isAuto).length})
          </button>
        </div>

        <div className="admin-content-grid">
          {/* Left Column - Requests */}
          <div className="requests-column">
            <div className="section-card">
              <div className="card-header">
                <h2>📋 Blood Requests</h2>
                <span className="badge">{filteredRequests.length} requests</span>
              </div>

              <div className="requests-list">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map(request => (
                    <div key={request._id} className={`request-card ${request.isAuto ? 'auto-request' : ''}`}>
                      <div className="request-header">
                        <div className="request-title">
                          <h4>
                            {request.hospitalName} 
                            {request.isAuto && <span className="auto-badge">🤖 Auto</span>}
                          </h4>
                          <div className="request-meta">
                            <span className="blood-type">{request.bloodGroup}</span>
                            <span>{request.unitsRequired} unit(s)</span>
                            {getUrgencyBadge(request.urgency)}
                          </div>
                        </div>
                        <div className="request-status">
                          {getStatusBadge(request.status)}
                          {request.hasDuplicates && (
                            <div className="duplicate-warning" title="This request has duplicates">
                              ⚠️
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="request-details">
                        <div className="detail-grid">
                          <div className="detail-item">
                            <strong>Hospital:</strong>
                            <span>{request.hospitalName}</span>
                          </div>
                          <div className="detail-item">
                            <strong>Contact:</strong>
                            <span>{request.contactPerson} • {request.contactNumber}</span>
                          </div>
                          <div className="detail-item">
                            <strong>City:</strong>
                            <span>{request.city}</span>
                          </div>
                          <div className="detail-item">
                            <strong>Purpose:</strong>
                            <span>{request.purpose}</span>
                          </div>
                          {request.donorName && (
                            <div className="detail-item">
                              <strong>Donor:</strong>
                              <span>{request.donorName} • {request.donorEmail}</span>
                            </div>
                          )}
                          <div className="detail-item">
                            <strong>Requested:</strong>
                            <span>{new Date(request.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="request-actions">
                        {request.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateRequestStatus(request._id, 'approved')}
                              className="btn btn-success"
                            >
                              ✅ Approve
                            </button>
                            <button 
                              onClick={() => handleUpdateRequestStatus(request._id, 'rejected')}
                              className="btn btn-danger"
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <button 
                            onClick={() => handleUpdateRequestStatus(request._id, 'fulfilled')}
                            className="btn btn-info"
                          >
                            ✅ Mark Fulfilled
                          </button>
                        )}
                        {(request.status === 'rejected' || request.status === 'fulfilled') && (
                          <span className="action-complete">
                            Request {request.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No requests found</h3>
                    <p>No blood requests match your current filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Urgent Inventory */}
          <div className="inventory-column">
            {/* Urgent Inventory Alert */}
            <div className="section-card urgent-inventory">
              <div className="card-header">
                <h2>🚨 Urgent Inventory</h2>
                <span className="badge critical">{urgentInventory.length} critical</span>
              </div>

              <div className="inventory-list">
                {urgentInventory.length > 0 ? (
                  urgentInventory.map(item => (
                    <div key={item.bloodGroup} className={`inventory-item ${getStockLevel(item.unitsAvailable)}`}>
                      <div className="inventory-info">
                        <div className="blood-group">{item.bloodGroup}</div>
                        <div className="units-available">
                          {item.unitsAvailable} unit(s) available
                        </div>
                        <div className="stock-status">
                          {getStockLevel(item.unitsAvailable).toUpperCase()}
                        </div>
                      </div>
                      <div className="inventory-actions">
                        <button 
                          onClick={() => handleNotifyHospitals(item.bloodGroup)}
                          className="btn btn-warning btn-sm"
                        >
                          📢 Notify Hospitals
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h3>Inventory Stable</h3>
                    <p>All blood groups have sufficient stock.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="section-card quick-stats">
              <div className="card-header">
                <h2>📊 Quick Stats</h2>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">{requests.length}</div>
                  <div className="stat-label">Total Requests</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{requests.filter(r => r.status === 'pending').length}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{requests.filter(r => r.isAuto).length}</div>
                  <div className="stat-label">Auto-Generated</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{urgentInventory.length}</div>
                  <div className="stat-label">Critical Stock</div>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="section-card system-info">
              <div className="card-header">
                <h2>ℹ️ System Info</h2>
              </div>
              <div className="info-list">
                <div className="info-item">
                  <strong>Auto-Requests:</strong>
                  <span>Generated when inventory ≤ 3 units</span>
                </div>
                <div className="info-item">
                  <strong>Deduplication:</strong>
                  <span>Same hospital+donor+blood group combined</span>
                </div>
                <div className="info-item">
                  <strong>Real-time Updates:</strong>
                  <span>Auto-refresh every 30 seconds</span>
                </div>
                <div className="info-item">
                  <strong>Critical Threshold:</strong>
                  <span>≤ 3 units triggers alerts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-manage-requests {
          padding: 20px 0;
          min-height: 100vh;
          background: #f8f9fa;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header-content h1 {
          margin: 0 0 10px 0;
          color: #2c3e50;
        }

        .header-content p {
          margin: 0 0 10px 0;
          color: #7f8c8d;
        }

        .connection-status {
          font-size: 14px;
          color: #27ae60;
          background: #d5f4e6;
          padding: 8px 12px;
          border-radius: 6px;
          display: inline-block;
        }

        .refresh-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }

        .refresh-btn:hover {
          background: #2980b9;
        }

        .admin-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .tab-btn {
          background: white;
          border: 2px solid #e9ecef;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: #3498db;
          color: white;
          border-color: #3498db;
        }

        .tab-btn:hover:not(.active) {
          border-color: #3498db;
        }

        .admin-content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
        }

        .section-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 25px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f8f9fa;
        }

        .card-header h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.4rem;
        }

        .badge {
          background: #e9ecef;
          color: #6c757d;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }

        .badge.critical {
          background: #f8d7da;
          color: #721c24;
        }

        .request-card {
          border: 2px solid #e9ecef;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          transition: all 0.2s;
        }

        .request-card:hover {
          border-color: #3498db;
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
        }

        .request-card.auto-request {
          border-left: 4px solid #e74c3c;
          background: #fff5f5;
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .request-title h4 {
          margin: 0 0 8px 0;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .auto-badge {
          background: #e74c3c;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
        }

        .request-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .blood-type {
          background: #dc3545;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: capitalize;
        }

        .status-pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-approved {
          background: #d1ecf1;
          color: #0c5460;
        }

        .status-rejected {
          background: #f8d7da;
          color: #721c24;
        }

        .status-fulfilled {
          background: #d4edda;
          color: #155724;
        }

        .urgency-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
          text-transform: capitalize;
        }

        .urgency-low {
          background: #d4edda;
          color: #155724;
        }

        .urgency-medium {
          background: #fff3cd;
          color: #856404;
        }

        .urgency-high {
          background: #f8d7da;
          color: #721c24;
        }

        .duplicate-warning {
          color: #e74c3c;
          font-size: 14px;
          cursor: help;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 15px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-item strong {
          color: #6c757d;
          font-size: 12px;
        }

        .detail-item span {
          color: #2c3e50;
          font-weight: 500;
        }

        .request-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover {
          background: #218838;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .btn-info {
          background: #17a2b8;
          color: white;
        }

        .btn-info:hover {
          background: #138496;
        }

        .btn-warning {
          background: #ffc107;
          color: #212529;
        }

        .btn-warning:hover {
          background: #e0a800;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .action-complete {
          color: #6c757d;
          font-style: italic;
          padding: 8px 0;
        }

        .urgent-inventory {
          border-left: 4px solid #e74c3c;
        }

        .inventory-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          margin-bottom: 12px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .inventory-item.critical {
          background: #f8d7da;
          border-color: #f5c6cb;
        }

        .inventory-item.low {
          background: #fff3cd;
          border-color: #ffeaa7;
        }

        .inventory-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .blood-group {
          font-size: 18px;
          font-weight: bold;
          color: #dc3545;
          min-width: 40px;
        }

        .units-available {
          color: #2c3e50;
          font-weight: 500;
        }

        .stock-status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .inventory-item.critical .stock-status {
          background: #dc3545;
          color: white;
        }

        .inventory-item.low .stock-status {
          background: #ffc107;
          color: #212529;
        }

        .quick-stats .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .stat-item {
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #3498db;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 12px;
          color: #6c757d;
          text-transform: uppercase;
          font-weight: 500;
        }

        .system-info .info-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f8f9fa;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-item strong {
          color: #2c3e50;
          font-size: 14px;
        }

        .info-item span {
          color: #6c757d;
          font-size: 12px;
          text-align: right;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #6c757d;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .admin-content-grid {
            grid-template-columns: 1fr;
          }
          
          .page-header {
            flex-direction: column;
            gap: 15px;
          }
          
          .detail-grid {
            grid-template-columns: 1fr;
          }
          
          .request-header {
            flex-direction: column;
            gap: 10px;
          }
          
          .admin-tabs {
            overflow-x: auto;
            padding-bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminManageRequests;