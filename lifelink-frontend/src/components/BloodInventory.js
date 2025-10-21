import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';

const BloodInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await inventoryAPI.getAll();
      setInventory(response.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
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

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div className="inventory-section">
      <h3>Blood Inventory</h3>
      <div className="inventory-grid">
        {inventory.map(item => (
          <div key={item.bloodGroup} className={`blood-card ${getStockLevel(item.unitsAvailable)}`}>
            <div className="blood-group">{item.bloodGroup}</div>
            <div className="units-available">{item.unitsAvailable} Units</div>
            <div className="stock-level">{getStockLevel(item.unitsAvailable)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BloodInventory;