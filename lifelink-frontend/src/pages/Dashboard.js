/*lifelink-frontend/src/pages/Dashboard.js*/
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { donorsAPI, requestsAPI, adminAPI } from '../services/api';
import BloodInventory from '../components/BloodInventory';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [availability, setAvailability] = useState(user?.availability || false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (user?.role === 'admin') {
        const response = await adminAPI.getDashboard();
        setStats(response.data);
      } else if (user?.role === 'hospital') {
        const requestsResponse = await requestsAPI.getAll();
        setStats({ totalRequests: requestsResponse.data.length });
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
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <div className="container">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}!</p>

        {user?.role === 'donor' && (
          <div className="donor-dashboard">
            <div className="availability-toggle">
              <h3>Availability Status</h3>
              <button 
                onClick={handleAvailabilityToggle}
                className={`toggle-btn ${availability ? 'available' : 'unavailable'}`}
              >
                {availability ? 'Mark as Unavailable' : 'Mark as Available'}
              </button>
              <p>Current status: <strong>{availability ? 'Available' : 'Unavailable'}</strong></p>
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="admin-stats">
            <h2>System Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Donors</h3>
                <p>{stats.totalDonors}</p>
              </div>
              <div className="stat-card">
                <h3>Total Hospitals</h3>
                <p>{stats.totalHospitals}</p>
              </div>
              <div className="stat-card">
                <h3>Total Requests</h3>
                <p>{stats.totalRequests}</p>
              </div>
              <div className="stat-card">
                <h3>Pending Requests</h3>
                <p>{stats.pendingRequests}</p>
              </div>
            </div>
          </div>
        )}

        <BloodInventory />
      </div>
    </div>
  );
};

export default Dashboard;