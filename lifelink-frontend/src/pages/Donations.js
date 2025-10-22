// src/pages/Donations.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { donationsAPI } from '../services/api';

const Donations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalUnits: 0,
    livesImpacted: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDonations();
  }, [user]);

 // In your Donations.js, update the loadDonations function:
// In your Donations.js, update the loadDonations function:
const loadDonations = async () => {
  try {
    setLoading(true);
    
    // ✅ FIXED: Backend automatically filters by donor based on token
    const response = await donationsAPI.getAll();
    const donorDonations = response.data || [];
    
    console.log('📊 Loaded donations:', donorDonations);
    
    setDonations(donorDonations);
    
    const totalUnits = donorDonations.reduce((sum, donation) => sum + (donation.unitsDonated || 1), 0);
    setStats({
      totalDonations: donorDonations.length,
      totalUnits: totalUnits,
      livesImpacted: totalUnits * 3
    });
  } catch (error) {
    console.error('Error loading donations:', error);
    setDonations([]);
    setStats({
      totalDonations: 0,
      totalUnits: 0,
      livesImpacted: 0
    });
  } finally {
    setLoading(false);
  }
};
  // FIXED: Handle Record Donation click
  const handleRecordDonation = () => {
    // Direct navigation for logged-in users
    navigate('/record-donation');
  };

  if (loading) {
    return (
      <div className="donations-page">
        <div className="container">
          <div className="loading">Loading your donations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="donations-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>My Donation History</h1>
            <p>View your past blood donations and contribution history</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={handleRecordDonation}
            >
              🩸 Record New Donation
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💉</div>
            <div className="stat-content">
              <h3>Total Donations</h3>
              <p className="stat-number">{stats.totalDonations}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🩸</div>
            <div className="stat-content">
              <h3>Total Units Donated</h3>
              <p className="stat-number">{stats.totalUnits}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💖</div>
            <div className="stat-content">
              <h3>Lives Impacted</h3>
              <p className="stat-number">{stats.livesImpacted}</p>
              <span className="stat-note">~3 lives saved per donation</span>
            </div>
          </div>
        </div>

        {/* Donations List */}
        <div className="donations-section">
          <h2>Your Donation Records</h2>
          
          {donations.length > 0 ? (
            <div className="donations-list">
              {donations.map((donation, index) => (
                <div key={donation._id || index} className="donation-card">
                  <div className="donation-icon">💉</div>
                  <div className="donation-content">
                    <div className="donation-header">
                      <h3>{donation.bloodGroup} Blood Donation</h3>
                      <span className="donation-date">
                        {new Date(donation.donationDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="donation-details">
                      <p><strong>{donation.unitsDonated || 1} unit(s)</strong> donated at <strong>{donation.location || 'Blood Bank'}</strong></p>
                      {donation.notes && (
                        <p className="donation-notes">📝 {donation.notes}</p>
                      )}
                    </div>
                    <div className="donation-impact">
                      <span className="impact-badge">
                        💖 Saved approximately {donation.unitsDonated * 3} lives
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* FIXED: Empty state with proper button handler */
            <div className="empty-state">
              <div className="empty-icon">💉</div>
              <div className="empty-content">
                <h3>No donations recorded yet</h3>
                <p>Start making a difference by recording your first donation!</p>
                <button 
                  className="btn btn-primary btn-large"
                  onClick={handleRecordDonation}
                >
                  🩸 Record First Donation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {donations.length > 0 && (
          <div className="quick-actions-section">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button 
                className="action-card"
                onClick={handleRecordDonation}
              >
                <div className="action-icon">🩸</div>
                <div className="action-content">
                  <h4>Record New Donation</h4>
                  <p>Add another donation to your history</p>
                </div>
              </button>
              
              <Link to="/help-restock" className="action-card">
                <div className="action-icon">💪</div>
                <div className="action-content">
                  <h4>Help Restock</h4>
                  <p>Find urgent blood needs in your area</p>
                </div>
              </Link>
              
              <Link to="/dashboard" className="action-card">
                <div className="action-icon">📊</div>
                <div className="action-content">
                  <h4>View Dashboard</h4>
                  <p>See your overall impact</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Donations;