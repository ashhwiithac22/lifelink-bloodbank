//src/components/BloodInventory.js
import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';

const BloodInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inventoryAPI.getAll();
      console.log('🩸 REAL Inventory API Response:', response.data);
      
      if (response.data && response.data.length > 0) {
        setInventory(response.data);
      } else {
        setError('No inventory data found in database');
        setInventory([]);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setError('Failed to load inventory data from server');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStockLevel = (units) => {
    if (units === 0) return 'critical';
    if (units < 5) return 'low';
    if (units < 10) return 'medium';
    return 'high';
  };

  const getStockMessage = (units) => {
    if (units === 0) return 'Urgent Need';
    if (units < 5) return 'Low Stock';
    if (units < 10) return 'Moderate';
    return 'Good Stock';
  };

  if (loading) {
    return (
      <div className="inventory-loading">
        <div className="loading-spinner"></div>
        <p>Loading real blood inventory data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-error">
        <p>⚠️ {error}</p>
        <p className="error-help">
          The inventory data is not loading from the database. 
          This might be because the inventory collection is empty or there's a connection issue.
        </p>
        <button onClick={loadInventory} className="btn btn-primary">
          🔄 Retry Loading
        </button>
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div className="inventory-empty">
        <div className="empty-icon">📭</div>
        <h3>No Inventory Data</h3>
        <p>The blood inventory database is currently empty.</p>
        <button onClick={loadInventory} className="btn btn-primary">
          🔄 Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="inventory-section">
      <div className="inventory-header">
        <h3>🩸 Live Blood Inventory</h3>
        <p className="inventory-subtitle">Real data from database - Updates automatically</p>
        <button onClick={loadInventory} className="btn-refresh">
          🔄 Refresh
        </button>
      </div>
      
      <div className="inventory-grid">
        {inventory.map(item => (
          <div key={item.bloodGroup} className={`blood-card ${getStockLevel(item.unitsAvailable)}`}>
            <div className="blood-card-header">
              <div className="blood-group">{item.bloodGroup}</div>
              <div className="blood-badge">{getStockMessage(item.unitsAvailable)}</div>
            </div>
            <div className="units-available">{item.unitsAvailable} Units</div>
            <div className="stock-bar">
              <div 
                className={`stock-fill ${getStockLevel(item.unitsAvailable)}`}
                style={{ width: `${Math.min((item.unitsAvailable / 20) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="stock-info">
              <span className="stock-level">{getStockLevel(item.unitsAvailable).toUpperCase()}</span>
              <span className="stock-percentage">
                {Math.min(Math.round((item.unitsAvailable / 20) * 100), 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="inventory-summary">
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <h4>Total Available</h4>
            <p className="summary-number">
              {inventory.reduce((sum, item) => sum + item.unitsAvailable, 0)} units
            </p>
            <small>From database</small>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">⚠️</div>
          <div className="summary-content">
            <h4>Critical Types</h4>
            <p className="summary-number">
              {inventory.filter(item => item.unitsAvailable < 5).length} types
            </p>
            <small>Less than 5 units</small>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h4>Well Stocked</h4>
            <p className="summary-number">
              {inventory.filter(item => item.unitsAvailable >= 10).length} types
            </p>
            <small>10+ units</small>
          </div>
        </div>
      </div>

      <div className="data-source">
        <small>📡 Data source: MongoDB Atlas • Last updated: {new Date().toLocaleTimeString()}</small>
      </div>
    </div>
  );
};

export default BloodInventory;