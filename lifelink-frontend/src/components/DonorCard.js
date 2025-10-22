/*lifelink-frontend/src/components/DonorCard.js*/
import React from 'react';

const DonorCard = ({ donor }) => {
  return (
    <div className="donor-card">
      <div className="donor-header">
        <h3>{donor.name}</h3>
        <span className={`availability ${donor.availability ? 'available' : 'unavailable'}`}>
          {donor.availability ? '✅ Available' : '❌ Not Available'}
        </span>
      </div>
      
      <div className="donor-details">
        <p><strong>Blood Group:</strong> <span className="blood-group">{donor.bloodGroup}</span></p>
        <p><strong>Age:</strong> {donor.age} years</p>
        <p><strong>City:</strong> {donor.city}</p>
        <p><strong>Contact:</strong> {donor.contact}</p>
        <p><strong>Last Active:</strong> {new Date(donor.updatedAt).toLocaleDateString()}</p>
      </div>
      
      <div className="donor-actions">
        {donor.availability && (
          <button className="btn btn-primary btn-sm">
            📞 Contact Donor
          </button>
        )}
        <button className="btn btn-outline btn-sm">
          💾 Save Contact
        </button>
      </div>
    </div>
  );
};

export default DonorCard;