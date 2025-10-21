import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { donationsAPI } from '../services/api';
import DonationForm from '../components/DonationForm';

const Donations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    try {
      const [donationsResponse, statsResponse] = await Promise.all([
        donationsAPI.getAll(),
        donationsAPI.getStats()
      ]);
      
      setDonations(donationsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonationSuccess = () => {
    setShowForm(false);
    loadDonations(); // Refresh the list
  };

  if (loading) return <div className="loading">Loading donations...</div>;

  return (
    <div className="donations-page">
      <div className="container">
        <div className="page-header">
          <h1>Blood Donations</h1>
          {user?.role === 'donor' && (
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              🩸 Record Donation
            </button>
          )}
        </div>

        {/* Donation Statistics */}
        <div className="donation-stats">
          <h2>Donation Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <h3>Total Donations</h3>
              <p>{stats.totalDonations || 0}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🩸</div>
              <h3>Total Units</h3>
              <p>{stats.totalUnits || 0}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <h3>Active Donors</h3>
              <p>{stats.totalDonations || 0}</p>
            </div>
          </div>
        </div>

        {/* Donation Form Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <DonationForm 
                onSuccess={handleDonationSuccess}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}

        {/* Donations List */}
        <div className="donations-list">
          <h2>Recent Donations</h2>
          {donations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🩸</div>
              <h3>No Donations Yet</h3>
              <p>Be the first to record a blood donation!</p>
            </div>
          ) : (
            <div className="donations-grid">
              {donations.map(donation => (
                <div key={donation._id} className="donation-card">
                  <div className="donation-header">
                    <h3>{donation.donorName}</h3>
                    <span className={`status-badge ${donation.status}`}>
                      {donation.status}
                    </span>
                  </div>
                  <div className="donation-details">
                    <p><strong>Blood Group:</strong> {donation.bloodGroup}</p>
                    <p><strong>Units Donated:</strong> {donation.unitsDonated}</p>
                    <p><strong>Date:</strong> {new Date(donation.donationDate).toLocaleDateString()}</p>
                    {donation.hospitalName && (
                      <p><strong>Hospital:</strong> {donation.hospitalName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Donations;