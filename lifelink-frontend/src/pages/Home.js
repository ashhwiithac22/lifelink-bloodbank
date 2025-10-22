//src/pages/Home.js
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

  // In your Home.js, update the loadHomeStats function:
const loadHomeStats = async () => {
  try {
    const response = await inventoryAPI.getAll();
    console.log('🏠 Home Stats - Real API Data:', response.data);
    
    if (response.data && response.data.length > 0) {
      const totalUnits = response.data.reduce((sum, item) => sum + (item.unitsAvailable || 0), 0);
      const criticalStock = response.data.filter(item => (item.unitsAvailable || 0) < 5).length;
      const totalBloodGroups = response.data.length;
      
      console.log(`📊 Calculated Stats: ${totalUnits} units, ${criticalStock} critical, ${totalBloodGroups} types`);
      
      setStats({
        totalUnits,
        criticalStock,
        totalBloodGroups
      });
    } else {
      console.log('❌ No data from inventory API');
      setStats({
        totalUnits: 0,
        criticalStock: 0,
        totalBloodGroups: 0
      });
    }
  } catch (error) {
    console.error('❌ Error loading home stats:', error);
    setStats({
      totalUnits: 0,
      criticalStock: 0,
      totalBloodGroups: 0
    });
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
  
  {/* HOSPITAL: Can make requests and find donors */}
  {user.role === 'hospital' && (
    <>
      <Link to="/requests" className="btn btn-secondary btn-large">
        📋 Make a Request
      </Link>
      <Link to="/donors" className="btn btn-secondary btn-large">
        🔍 Find Donors
      </Link>
    </>
  )}
  
  {/* ADMIN: Can find donors and access admin panel */}
  {user.role === 'admin' && (
    <>
      <Link to="/donors" className="btn btn-secondary btn-large">
        🔍 Find Donors
      </Link>
      <Link to="/admin" className="btn btn-secondary btn-large">
        ⚙️ Admin Panel
      </Link>
    </>
  )}
  
  {/* DONOR: Can view donations and help restock */}
  {user.role === 'donor' && (
    <>
      <Link to="/donations" className="btn btn-secondary btn-large">
        💉 My Donations
      </Link>
      <Link to="/help-restock" className="btn btn-secondary btn-large">
        🩸 Help Restock
      </Link>
    </>
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
              <div className="feature-icon">👥</div>
              <h3>Donor Management</h3>
              <p>Comprehensive donor profiles with availability status and contact information.</p>
             <ul className="feature-list">
             <li>Donor availability status</li>
             <li>Contact information</li>
             <li>Donation history records</li>
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
      {/* A+ */}
      <div className="blood-type-card a-plus">
        <div className="blood-type-header">
          <h3>A+</h3>
          <span className="blood-percentage">34%</span>
        </div>
        <div className="compatibility-info">
          <p className="donate-to">🩸 Can donate to: <strong>A+, AB+</strong></p>
          <p className="receive-from"> Can receive from: <strong>A+, A-, O+, O-</strong></p>
        </div>
        <div className="blood-type-footer">
          <span className="universal-recipient">Universal Recipient: No</span>
        </div>
      </div>
      
      {/* A- */}
      <div className="blood-type-card a-minus">
        <div className="blood-type-header">
          <h3>A-</h3>
          <span className="blood-percentage">6%</span>
        </div>
        <div className="compatibility-info">
          <p className="donate-to">🩸 Can donate to: <strong>A+, A-, AB+, AB-</strong></p>
          <p className="receive-from"> Can receive from: <strong>A-, O-</strong></p>
        </div>
        <div className="blood-type-footer">
          <span className="universal-donor">Universal Donor: No</span>
        </div>
      </div>
      
      {/* B+ */}
      <div className="blood-type-card b-plus">
        <div className="blood-type-header">
          <h3>B+</h3>
          <span className="blood-percentage">9%</span>
        </div>
        <div className="compatibility-info">
          <p className="donate-to">🩸 Can donate to: <strong>B+, AB+</strong></p>
          <p className="receive-from"> Can receive from: <strong>B+, B-, O+, O-</strong></p>
        </div>
        <div className="blood-type-footer">
          <span className="universal-recipient">Universal Recipient: No</span>
        </div>
      </div>
      
      {/* B- */}
      <div className="blood-type-card b-minus">
        <div className="blood-type-header">
          <h3>B-</h3>
          <span className="blood-percentage">2%</span>
        </div>
        <div className="compatibility-info">
          <p className="donate-to">🩸 Can donate to: <strong>B+, B-, AB+, AB-</strong></p>
          <p className="receive-from"> Can receive from: <strong>B-, O-</strong></p>
        </div>
        <div className="blood-type-footer">
          <span className="universal-donor">Universal Donor: No</span>
        </div>
      </div>
      
      {/* AB+ */}
      <div className="blood-type-card ab-plus">
        <div className="blood-type-header">
          <h3>AB+</h3>
          <span className="blood-percentage">3%</span>
        </div>
        <div className="compatibility-info">
          <p className="donate-to">🩸 Can donate to: <strong>AB+</strong></p>
          <p className="receive-from"> Can receive from: <strong>All blood types</strong></p>
        </div>
        <div className="blood-type-footer">
          <span className="universal-recipient special"> Universal Recipient</span>
        </div>
      </div>
      
      {/* AB- */}
      <div className="blood-type-card ab-minus">
        <div className="blood-type-header">
          <h3>AB-</h3>
          <span className="blood-percentage">1%</span>
        </div>
        <div className="compatibility-info">
          <p className="donate-to">🩸 Can donate to: <strong>AB+, AB-</strong></p>
          <p className="receive-from"> Can receive from: <strong>AB-, A-, B-, O-</strong></p>
        </div>
        <div className="blood-type-footer">
          <span className="universal-recipient">Universal Recipient: No</span>
        </div>
      </div>
      
      {/* O+ */}
      <div className="blood-type-card o-plus">
        <div className="blood-type-header">
          <h3>O+</h3>
          <span className="blood-percentage">38%</span>
        </div>
        <div className="compatibility-info">
          <p className="donate-to">🩸 Can donate to: <strong>O+, A+, B+, AB+</strong></p>
          <p className="receive-from"> Can receive from: <strong>O+, O-</strong></p>
        </div>
        <div className="blood-type-footer">
          <span className="universal-donor">Universal Donor: No</span>
        </div>
      </div>
      
      {/* O- */}
      <div className="blood-type-card o-minus">
        <div className="blood-type-header">
          <h3>O-</h3>
          <span className="blood-percentage">7%</span>
        </div>
        <div className="compatibility-info">
          <p className="donate-to">🩸 Can donate to: <strong>All blood types</strong></p>
          <p className="receive-from"> Can receive from: <strong>O-</strong></p>
        </div>
        <div className="blood-type-footer">
          <span className="universal-donor special"> Universal Donor</span>
        </div>
      </div>
    </div>

    {/* Blood Type Legend */}
    <div className="blood-type-legend">
      <div className="legend-item">
        <div className="legend-color universal-donor"></div>
        <span>Universal Donor</span>
      </div>
      <div className="legend-item">
        <div className="legend-color universal-recipient"></div>
        <span>Universal Recipient</span>
      </div>
      <div className="legend-item">
        <div className="legend-color rare-type"></div>
        <span>Rare Blood Type</span>
      </div>
    </div>
  </div>
</section>

   <div className="inventory-actions">
  {!user ? (
    <Link to="/register?role=donor" className="btn btn-primary">
      🩸 Help Restock
    </Link>
  ) : (
    <Link to="/help-restock" className="btn btn-primary">
      🩸 Help Restock
    </Link>
  )}
  
  {/* Smart redirect based on user role */}
  {!user ? (
    <Link to="/login" className="btn btn-outline">
      🔍 Find Donors
    </Link>
  ) : user.role === 'hospital' || user.role === 'admin' ? (
    <Link to="/donors" className="btn btn-outline">
      🔍 Find Donors
    </Link>
  ) : (
    <Link to="/donations" className="btn btn-outline">
      💉 My Donations
    </Link>
  )}
</div>

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
  <Link to="/about" className="btn btn-outline btn-large">
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