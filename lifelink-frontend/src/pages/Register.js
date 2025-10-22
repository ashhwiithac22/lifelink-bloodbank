//src/pages/Register.js
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
    hospitalName: '',
    adminCode: '' // New field for admin registration
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
      
      // Validate admin registration
      if (formData.role === 'admin') {
        if (formData.adminCode !== 'ADMIN2024') { // You can change this secret code
          throw new Error('Invalid admin registration code');
        }
      }
      
      // Validate required fields based on role
      if (formData.role === 'donor' && (!formData.bloodGroup || !formData.age)) {
        throw new Error('Blood group and age are required for donors');
      }
      
      if (formData.role === 'hospital' && !formData.hospitalName) {
        throw new Error('Hospital name is required for hospitals');
      }

      // Remove adminCode from data sent to backend (it's only for frontend validation)
      const { adminCode, ...registrationData } = formData;
      
      await register(registrationData);
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
              placeholder="Enter your full name"
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
              placeholder="Enter your email address"
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
              placeholder="Enter a strong password (min 6 characters)"
            />
          </div>

          <div className="form-group">
            <label>Role *</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="donor">Blood Donor</option>
              <option value="hospital">Hospital</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Admin-specific fields */}
          {formData.role === 'admin' && (
            <div className="form-group">
              <label>Admin Registration Code *</label>
              <input
                type="password"
                name="adminCode"
                value={formData.adminCode}
                onChange={handleChange}
                required
                placeholder="Enter admin registration code"
              />
              <small style={{color: '#6c757d', fontSize: '0.8rem'}}>
                Contact system administrator to get the registration code
              </small>
            </div>
          )}

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
                  placeholder="Enter your age (18-65)"
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
                placeholder="Enter hospital name"
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
              placeholder="Enter your city"
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
              placeholder="Enter contact number"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-link">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>

        {/* Registration Info */}
        <div className="registration-info">
          <h4>Registration Types:</h4>
          <ul>
            <li><strong>Blood Donor:</strong> Can donate blood and view donation history</li>
            <li><strong>Hospital:</strong> Can request blood and search for donors</li>
            <li><strong>Administrator:</strong> Full system access and management</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;