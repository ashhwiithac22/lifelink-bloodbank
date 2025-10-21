import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BloodInventory from '../components/BloodInventory';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Save Lives with LifeLink</h1>
          <p>Connecting blood donors with those in need. Your donation can save up to 3 lives.</p>
          <div className="hero-buttons">
            {!user ? (
              <>
                <Link to="/register?role=donor" className="btn btn-primary">
                  Become a Donor
                </Link>
                <Link to="/register?role=hospital" className="btn btn-secondary">
                  Hospital Registration
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2>How LifeLink Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🩸</div>
              <h3>Register as Donor</h3>
              <p>Sign up as a blood donor and update your availability status</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏥</div>
              <h3>Hospital Requests</h3>
              <p>Hospitals can request specific blood types in emergency situations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Find Donors</h3>
              <p>Search and filter donors by blood group and location</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-time Inventory</h3>
              <p>Track blood stock levels across all blood types</p>
            </div>
          </div>
        </div>
      </section>

      <section className="inventory-section">
        <div className="container">
          <h2>Current Blood Availability</h2>
          <BloodInventory />
        </div>
      </section>
    </div>
  );
};

export default Home;