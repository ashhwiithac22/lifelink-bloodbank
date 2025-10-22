// src/pages/RecordDonation.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { donationsAPI } from '../services/api';

const RecordDonation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bloodGroup: user?.bloodGroup || '',
    unitsDonated: 1, // FIXED: Changed from 'units' to 'unitsDonated'
    hospitalName: '', // FIXED: Changed from 'location' to 'hospitalName'
    helpRestock: false, // ADDED: This field is required by backend
    restockMessage: '', // ADDED: This field is required by backend
    contactNumber: user?.contact || '', // ADDED
    city: user?.city || '' // ADDED
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      console.log('📤 Sending donation data:', formData); // Debug log
      
      const response = await donationsAPI.create({
        ...formData,
        // REMOVED: donorId and donorName - backend gets these from token
        // REMOVED: status - backend sets default to 'completed'
      });
      
      console.log('✅ Donation recorded successfully:', response.data);
      alert('Donation recorded successfully!');
      navigate('/donations');
    } catch (error) {
      console.error('❌ Error recording donation:', error);
      console.error('Error details:', error.response?.data);
      alert(`Error recording donation: ${error.response?.data?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Record Blood Donation</h1>
        <p>Add your blood donation to your history</p>
      </div>

      <div className="auth-container">
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Blood Group</label>
            <select 
              name="bloodGroup" 
              value={formData.bloodGroup}
              onChange={handleChange}
              required
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="form-group">
            <label>Units Donated</label>
            <input
              type="number"
              name="unitsDonated" // FIXED: Changed from 'units' to 'unitsDonated'
              value={formData.unitsDonated}
              onChange={handleChange}
              min="1"
              max="2"
              required
            />
          </div>

          <div className="form-group">
            <label>Hospital/Donation Center Name</label> {/* FIXED: Updated label */}
            <input
              type="text"
              name="hospitalName" // FIXED: Changed from 'location' to 'hospitalName'
              value={formData.hospitalName}
              onChange={handleChange}
              placeholder="e.g., City Blood Bank, Red Cross Center"
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="Your contact number"
              required
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Your city"
              required
            />
          </div>

          {/* ADDED: Help Restock Section */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="helpRestock"
                checked={formData.helpRestock}
                onChange={handleChange}
              />
              <span>I want to help restock the blood inventory</span>
            </label>
          </div>

          {formData.helpRestock && (
            <div className="form-group">
              <label>Restock Message (Optional)</label>
              <textarea
                name="restockMessage"
                value={formData.restockMessage}
                onChange={handleChange}
                placeholder="Any message for the blood bank..."
                rows="3"
              />
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Recording...' : 'Record Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordDonation;