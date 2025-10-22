import React, { useState, useEffect } from 'react';
import { donationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Donations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadDonations();
    loadDonationStats();
  }, []);

  const loadDonations = async () => {
    try {
      const response = await donationsAPI.getAll();
      setDonations(response.data);
    } catch (error) {
      console.error('Error loading donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDonationStats = async () => {
    try {
      const response = await donationsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading donation stats:', error);
    }
  };

  return (
    <div className="donations-page">
      <div className="container">
        <div className="page-header">
          <h1>My Donation History</h1>
          <p>View your past blood donations and contribution history</p>
        </div>

        {/* Donation Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Donations</h3>
            <p className="stat-number">{stats.totalDonations || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Units Donated</h3>
            <p className="stat-number">{stats.totalUnits || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Lives Impacted</h3>
            <p className="stat-number">{stats.totalUnits ? stats.totalUnits * 3 : 0}</p>
            <small>~3 lives saved per donation</small>
          </div>
        </div>

        {/* Donations List */}
        {loading ? (
          <div className="loading">Loading your donations...</div>
        ) : (
          <div className="donations-list">
            <h3>Your Donation Records</h3>
            
            {donations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💉</div>
                <h4>No donations recorded yet</h4>
                <p>Start making a difference by recording your first donation!</p>
                <button 
                  onClick={() => window.location.href = '/help-restock'}
                  className="btn btn-primary"
                >
                  🩸 Record First Donation
                </button>
              </div>
            ) : (
              <div className="donations-grid">
                {donations.map(donation => (
                  <div key={donation._id} className="donation-card">
                    <div className="donation-header">
                      <h4>{donation.bloodGroup} Blood Donation</h4>
                      <span className={`status status-${donation.status}`}>
                        {donation.status}
                      </span>
                    </div>
                    
                    <div className="donation-details">
                      <p><strong>Date:</strong> {new Date(donation.donationDate).toLocaleDateString()}</p>
                      <p><strong>Units:</strong> {donation.unitsDonated} unit(s)</p>
                      <p><strong>Type:</strong> {donation.helpRestock ? 'Help Restock' : 'Regular Donation'}</p>
                      
                      {donation.hospitalName && (
                        <p><strong>Hospital:</strong> {donation.hospitalName}</p>
                      )}
                      
                      {donation.restockMessage && (
                        <p><strong>Notes:</strong> {donation.restockMessage}</p>
                      )}
                    </div>
                    
                    <div className="donation-impact">
                      <span className="impact-badge">
                        💖 Saved ~{donation.unitsDonated * 3} lives
                      </span>
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

export default Donations;