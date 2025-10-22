import React from 'react';

const About = () => {
  return (
    <div className="about-page">
      <div className="container">
        <div className="page-header">
          <h1>About LifeLink Blood Bank</h1>
          <p>Learn more about our mission to save lives through blood donation</p>
        </div>

        <div className="about-content">
          <div className="about-section">
            <h2>Our Mission</h2>
            <p>
              LifeLink Blood Bank is dedicated to connecting compassionate blood donors with hospitals 
              and patients in need. We believe that every individual has the power to save lives through 
              blood donation, and we've built a platform to make this process seamless and efficient.
            </p>
          </div>

          <div className="about-section">
            <h2>How We Help</h2>
            <div className="help-grid">
              <div className="help-item">
                <h3>🩸 For Donors</h3>
                <p>Easy registration, donation tracking, and seeing the real impact of your contributions.</p>
              </div>
              <div className="help-item">
                <h3>🏥 For Hospitals</h3>
                <p>Quick access to blood inventory, donor search, and emergency request management.</p>
              </div>
              <div className="help-item">
                <h3>💖 For Patients</h3>
                <p>Ensuring blood availability when it's needed most, saving countless lives.</p>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h2>Blood Donation Facts</h2>
            <div className="facts-grid">
              <div className="fact-card">
                <h3>1 Donation</h3>
                <p>Can save up to 3 lives</p>
              </div>
              <div className="fact-card">
                <h3>Every 2 Seconds</h3>
                <p>Someone needs blood in the US</p>
              </div>
              <div className="fact-card">
                <h3>38%</h3>
                <p>Of population is eligible to donate</p>
              </div>
              <div className="fact-card">
                <h3>Only 3%</h3>
                <p>Actually donate each year</p>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h2>Join Our Community</h2>
            <p>
              Whether you're a regular donor, a hospital professional, or someone looking to make a difference, 
              LifeLink provides the tools and platform to ensure blood is available when and where it's needed most.
            </p>
            <div className="cta-actions">
              <a href="/register?role=donor" className="btn btn-primary">
                Become a Donor
              </a>
              <a href="/register?role=hospital" className="btn btn-secondary">
                Hospital Registration
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;