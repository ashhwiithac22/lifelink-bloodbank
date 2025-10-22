import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { donationsAPI } from '../services/api';

const HelpRestock = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bloodGroup: user?.bloodGroup || '',
    unitsDonated: 1,
    donationDate: new Date().toISOString().split('T')[0],
    message: '',
    contactNumber: user?.contact || '',
    city: user?.city || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await donationsAPI.create({
        bloodGroup: formData.bloodGroup,
        unitsDonated: formData.unitsDonated,
        donationDate: formData.donationDate,
        hospitalName: "LifeLink Community Restock",
        helpRestock: true,
        restockMessage: formData.message,
        contactNumber: formData.contactNumber,
        city: formData.city
      });

      setSuccess('✅ Thank you for helping restock our blood inventory! Your contribution has been recorded.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit restock help. Please try again.');
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
    <div className="help-restock-page">
      <div className="container">
        <div className="page-header">
          <h1>Help Restock Our Blood Inventory</h1>
          <p>Record your blood donation to help replenish our community blood supply.</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="restock-form">
          <div className="form-group">
            <label>Blood Group *</label>
            <select 
              name="bloodGroup" 
              value={formData.bloodGroup}
              onChange={handleChange}
              required
            >
              <option value="">Select Your Blood Group</option>
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

          <div className="form-row">
            <div className="form-group">
              <label>Units Donated *</label>
              <select 
                name="unitsDonated" 
                value={formData.unitsDonated}
                onChange={handleChange}
                required
              >
                <option value={1}>1 Unit</option>
                <option value={2}>2 Units</option>
              </select>
            </div>

            <div className="form-group">
              <label>Donation Date *</label>
              <input
                type="date"
                name="donationDate"
                value={formData.donationDate}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contact Number *</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="Your contact number"
              required
            />
          </div>

          <div className="form-group">
            <label>City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Your city"
              required
            />
          </div>

          <div className="form-group">
            <label>Additional Notes (Optional)</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Any additional information about your donation..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Submitting...' : 'Submit Restock Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ✅ MAKE SURE THIS IS DEFAULT EXPORT
export default HelpRestock;