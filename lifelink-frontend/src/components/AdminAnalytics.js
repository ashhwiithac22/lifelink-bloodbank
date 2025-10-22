  import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const response = await analyticsAPI.exportData(type);
      
      // Create download link
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lifelink-${type}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`✅ ${type} data exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Export failed');
    } finally {
      setExporting('');
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (!analytics) return <div>Error loading analytics</div>;

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <h2>📊 System Analytics</h2>
        <div className="export-buttons">
          <button 
            onClick={() => handleExport('donations')}
            disabled={exporting}
            className="btn btn-outline btn-sm"
          >
            {exporting === 'donations' ? 'Exporting...' : 'Export Donations'}
          </button>
          <button 
            onClick={() => handleExport('requests')}
            disabled={exporting}
            className="btn btn-outline btn-sm"
          >
            {exporting === 'requests' ? 'Exporting...' : 'Export Requests'}
          </button>
          <button 
            onClick={() => handleExport('inventory')}
            disabled={exporting}
            className="btn btn-outline btn-sm"
          >
            {exporting === 'inventory' ? 'Exporting...' : 'Export Inventory'}
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="overview-stats">
        <h3>System Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h4>Total Donors</h4>
              <p className="stat-number">{analytics.overview.totalDonors}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏥</div>
            <div className="stat-content">
              <h4>Total Hospitals</h4>
              <p className="stat-number">{analytics.overview.totalHospitals}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🩸</div>
            <div className="stat-content">
              <h4>Total Donations</h4>
              <p className="stat-number">{analytics.overview.totalDonations}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h4>Total Requests</h4>
              <p className="stat-number">{analytics.overview.totalRequests}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-content">
              <h4>Total Units</h4>
              <p className="stat-number">{analytics.overview.totalUnits}</p>
            </div>
          </div>
          <div className="stat-card critical">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <h4>Critical Stocks</h4>
              <p className="stat-number">{analytics.overview.criticalStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="inventory-summary">
        <h3>Blood Inventory Status</h3>
        <div className="inventory-grid">
          {analytics.inventory.map(item => (
            <div key={item.bloodGroup} className={`inventory-item ${item.unitsAvailable < 5 ? 'critical' : item.unitsAvailable < 10 ? 'low' : 'good'}`}>
              <div className="blood-group">{item.bloodGroup}</div>
              <div className="units">{item.unitsAvailable} units</div>
              <div className="status">
                {item.unitsAvailable < 5 ? 'CRITICAL' : item.unitsAvailable < 10 ? 'LOW' : 'GOOD'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-section">
          <h3>Recent Donations</h3>
          <div className="activity-list">
            {analytics.recentActivity.donations.map(donation => (
              <div key={donation._id} className="activity-item">
                <div className="activity-icon">🩸</div>
                <div className="activity-content">
                  <p><strong>{donation.donorId?.name}</strong> donated {donation.unitsDonated} units of {donation.bloodGroup}</p>
                  <small>{new Date(donation.donationDate).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="activity-section">
          <h3>Recent Requests</h3>
          <div className="activity-list">
            {analytics.recentActivity.requests.map(request => (
              <div key={request._id} className="activity-item">
                <div className="activity-icon">🏥</div>
                <div className="activity-content">
                  <p><strong>{request.hospitalId?.hospitalName}</strong> requested {request.unitsRequired} units of {request.bloodGroup}</p>
                  <small>Status: <span className={`status-${request.status}`}>{request.status}</span></small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;