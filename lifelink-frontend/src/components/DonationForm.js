import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { donationsAPI, inventoryAPI } from '../services/api';

const DonationForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bloodGroup: user?.bloodGroup || '',
    unitsDonated: 1,
    hospitalName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check current inventory
      const inventoryResponse = await inventoryAPI.getAll();
      const currentBloodGroup = inventoryResponse.data.find(
        item => item.bloodGroup === formData.bloodGroup
      );

      if (!currentBloodGroup) {
        setError('Selected blood group not found in inventory');
        return;
      }

      // Record the donation
      await donationsAPI.create(formData);
      
      alert(`✅ Thank you for your donation! ${formData.unitsDonated} unit(s) of ${formData.bloodGroup} blood has been added to inventory.`);
      onSuccess();
      
    } catch (error) {
      console.error('Donation error:', error);
      setError(error.response?.data?.message || 'Failed to record donation');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="donation-form">
      <h2>Record Blood Donation</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
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
          <select 
            name="unitsDonated" 
            value={formData.unitsDonated}
            onChange={handleChange}
            required
          >
            <option value={1}>1 Unit</option>
            <option value={2}>2 Units</option>
          </select>
          <small>Typically 1-2 units per donation</small>
        </div>

        <div className="form-group">
          <label>Hospital/Collection Center (Optional)</label>
          <input
            type="text"
            name="hospitalName"
            value={formData.hospitalName}
            onChange={handleChange}
            placeholder="Enter hospital name if applicable"
          />
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Recording...' : 'Record Donation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DonationForm;