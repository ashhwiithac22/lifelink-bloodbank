import React from 'react';

const DonorCard = ({ donor }) => {
  return (
    <div className="donor-card">
      <div className="donor-header">
        <h4>{donor.name}</h4>
        <span className={`availability ${donor.availability ? 'available' : 'unavailable'}`}>
          {donor.availability ? 'Available' : 'Unavailable'}
        </span>
      </div>
      <div className="donor-details">
        <p><strong>Blood Group:</strong> {donor.bloodGroup}</p>
        <p><strong>Age:</strong> {donor.age}</p>
        <p><strong>City:</strong> {donor.city}</p>
        <p><strong>Contact:</strong> {donor.contact}</p>
      </div>
    </div>
  );
};

export default DonorCard;