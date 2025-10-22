import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor',
    bloodGroup: '',
    age: '',
    city: '',
    contact: '',
    hospitalName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get role from URL parameter if present
  const urlRole = searchParams.get('role');
  if (urlRole && ['donor', 'hospital'].includes(urlRole)) {
    formData.role = urlRole;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Registration data:', formData);
      
      // Validate required fields based on role
      if (formData.role === 'donor' && (!formData.bloodGroup || !formData.age)) {
        throw new Error('Blood group and age are required for donors');
      }
      
      if (formData.role === 'hospital' && !formData.hospitalName) {
        throw new Error('Hospital name is required for hospitals');
      }

      await register(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error details:', error);
      setError(error.response?.data?.message || error.message || 'Registration failed');
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
    <div className="auth-page">
      <div className="auth-container">
        <h2>Join LifeLink</h2>
        
        {error && (
          <div className="error-message">
            <strong>Registration Failed:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="donor">Blood Donor</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>

          {/* Donor-specific fields */}
          {formData.role === 'donor' && (
            <>
              <div className="form-group">
                <label>Blood Group *</label>
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
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="18"
                  max="65"
                />
              </div>
            </>
          )}

          {/* Hospital-specific fields */}
          {formData.role === 'hospital' && (
            <div className="form-group">
              <label>Hospital Name *</label>
              <input
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {/* Common fields for all roles */}
          <div className="form-group">
            <label>City *</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number *</label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-link">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>

        {/* Debug info */}
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '5px', fontSize: '12px' }}>
          <strong>Debug Info:</strong> Make sure all required fields are filled. Donors need blood group and age.
        </div>
      </div>
    </div>
  );
};

export default Register;