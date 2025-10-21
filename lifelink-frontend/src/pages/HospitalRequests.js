/*lifelink-frontend/src/pages/HospitalRequests.js*/
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requestsAPI } from '../services/api';

const HospitalRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: '',
    unitsRequired: 1,
    urgency: 'medium',
    contactPerson: '',
    contactNumber: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await requestsAPI.getAll();
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await requestsAPI.create({
        ...formData,
        city: user.city
      });
      setShowForm(false);
      setFormData({
        bloodGroup: '',
        unitsRequired: 1,
        urgency: 'medium',
        contactPerson: '',
        contactNumber: '',
        purpose: ''
      });
      loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      fulfilled: 'status-fulfilled'
    };
    return <span className={`status-badge ${statusClasses[status]}`}>{status}</span>;
  };

  return (
    <div className="requests-page">
      <div className="container">
        <div className="page-header">
          <h1>Blood Requests</h1>
          {user?.role === 'hospital' && (
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              New Request
            </button>
          )}
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Create Blood Request</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select 
                      name="bloodGroup" 
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
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
                    <label>Units Required</label>
                    <input
                      type="number"
                      name="unitsRequired"
                      value={formData.unitsRequired}
                      onChange={(e) => setFormData({...formData, unitsRequired: parseInt(e.target.value)})}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Urgency</label>
                  <select 
                    name="urgency" 
                    value={formData.urgency}
                    onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Purpose</label>
                  <textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    required
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="requests-list">
          {requests.map(request => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <h3>{request.bloodGroup} Blood - {request.unitsRequired} Units</h3>
                {getStatusBadge(request.status)}
              </div>
              <div className="request-details">
                <p><strong>Hospital:</strong> {request.hospitalName}</p>
                <p><strong>City:</strong> {request.city}</p>
                <p><strong>Urgency:</strong> {request.urgency}</p>
                <p><strong>Contact:</strong> {request.contactPerson} ({request.contactNumber})</p>
                <p><strong>Purpose:</strong> {request.purpose}</p>
                <p><strong>Date:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HospitalRequests;