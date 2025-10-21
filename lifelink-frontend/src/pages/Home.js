import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI } from '../services/api';
import BloodInventory from '../components/BloodInventory';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeStats();
  }, []);

  const loadHomeStats = async () => {
    try {
      const inventory = await inventoryAPI.getAll();
      const totalUnits = inventory.data.reduce((sum, item) => sum + item.unitsAvailable, 0);
      const criticalStock = inventory.data.filter(item => item.unitsAvailable < 5).length;
      
      setStats({
        totalUnits,
        criticalStock,
        totalBloodGroups: inventory.data.length
      });
    } catch (error) {
      console.error('Error loading home stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🩸 Save Lives Today</div>
          <h1>LifeLink Blood Bank</h1>
          <p className="hero-subtitle">
            Connecting compassionate donors with hospitals in need. Every donation can save up to 3 lives.
          </p>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-number">{stats.totalUnits || 0}</div>
              <div className="stat-label">Units Available</div>
            </div>
            <div className="hero-stat">
              <div className="stat-number">{stats.criticalStock || 0}</div>
              <div className="stat-label">Critical Stocks</div>
            </div>
            <div className="hero-stat">
              <div className="stat-number">{stats.totalBloodGroups || 8}</div>
              <div className="stat-label">Blood Types</div>
            </div>
          </div>

          <div className="hero-buttons">
            {!user ? (
              <>
                <Link to="/register?role=donor" className="btn btn-primary btn-large">
                  🩸 Become a Donor
                </Link>
                <Link to="/register?role=hospital" className="btn btn-secondary btn-large">
                  🏥 Hospital Registration
                </Link>
                <Link to="/login" className="btn btn-outline btn-large">
                  🔐 Existing User
                </Link>
              </>
            ) : (
              <div className="user-welcome-buttons">
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  📊 Go to Dashboard
                </Link>
                {user.role === 'hospital' && (
                  <Link to="/requests" className="btn btn-secondary btn-large">
                    📋 Make a Request
                  </Link>
                )}
                {user.role === 'donor' && (
                  <Link to="/donors" className="btn btn-secondary btn-large">
                    🔍 Find Donors
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>How LifeLink Works</h2>
            <p className="section-subtitle">
              A seamless process connecting donors, hospitals, and patients in real-time
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Easy Registration</h3>
              <p>Sign up as a donor, hospital, or administrator in minutes with our simple registration process.</p>
              <ul className="feature-list">
                <li>Donor profiles with blood type</li>
                <li>Hospital verification</li>
                <li>Role-based access</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Smart Matching</h3>
              <p>Advanced search to find compatible donors based on blood type, location, and availability.</p>
              <ul className="feature-list">
                <li>Location-based filtering</li>
                <li>Real-time availability</li>
                <li>Emergency matching</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🚨</div>
              <h3>Emergency Requests</h3>
              <p>Hospitals can create urgent blood requests with priority handling and instant notifications.</p>
              <ul className="feature-list">
                <li>Priority status</li>
                <li>Quick approval</li>
                <li>Donor alerts</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Live Inventory</h3>
              <p>Real-time tracking of blood stock levels across all blood types with automated alerts.</p>
              <ul className="feature-list">
                <li>Stock level monitoring</li>
                <li>Low stock alerts</li>
                <li>Usage analytics</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Secure Platform</h3>
              <p>Enterprise-grade security protecting donor information and hospital data with encryption.</p>
              <ul className="feature-list">
                <li>Data encryption</li>
                <li>Secure authentication</li>
                <li>Privacy protection</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Fully responsive design that works perfectly on all devices - desktop, tablet, and mobile.</p>
              <ul className="feature-list">
                <li>Responsive design</li>
                <li>Fast loading</li>
                <li>Touch-friendly</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Blood Types Info */}
      <section className="blood-types-section">
        <div className="container">
          <div className="section-header">
            <h2>Blood Types & Compatibility</h2>
            <p className="section-subtitle">
              Understanding blood types is crucial for safe transfusions
            </p>
          </div>
          
          <div className="blood-types-grid">
            <div className="blood-type-card a-plus">
              <div className="blood-type-header">
                <h3>A+</h3>
                <span className="blood-percentage">34%</span>
              </div>
              <p>Can donate to: A+, AB+</p>
              <p>Can receive from: A+, A-, O+, O-</p>
            </div>
            
            <div className="blood-type-card o-plus">
              <div className="blood-type-header">
                <h3>O+</h3>
                <span className="blood-percentage">38%</span>
              </div>
              <p>Can donate to: O+, A+, B+, AB+</p>
              <p>Can receive from: O+, O-</p>
            </div>
            
            <div className="blood-type-card b-plus">
              <div className="blood-type-header">
                <h3>B+</h3>
                <span className="blood-percentage">9%</span>
              </div>
              <p>Can donate to: B+, AB+</p>
              <p>Can receive from: B+, B-, O+, O-</p>
            </div>
            
            <div className="blood-type-card ab-plus">
              <div className="blood-type-header">
                <h3>AB+</h3>
                <span className="blood-percentage">3%</span>
              </div>
              <p>Can donate to: AB+</p>
              <p>Can receive from: All blood types</p>
            </div>
          </div>
        </div>
      </section>

      {/* Inventory Section */}
      <section className="inventory-section">
        <div className="container">
          <div className="section-header">
            <h2>Current Blood Availability</h2>
            <p className="section-subtitle">
              Real-time blood stock levels across all blood types
            </p>
          </div>
          <BloodInventory />
          
          <div className="inventory-actions">
            <Link to="/register?role=donor" className="btn btn-primary">
              🩸 Help Restock
            </Link>
            <Link to="/login" className="btn btn-outline">
              📊 View Details
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Make a Difference?</h2>
            <p>
              Join thousands of life-savers in our community. Your single donation can help multiple patients.
            </p>
            <div className="cta-buttons">
              <Link to="/register?role=donor" className="btn btn-primary btn-large">
                Start Saving Lives Today
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;