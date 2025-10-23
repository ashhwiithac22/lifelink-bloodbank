//src/pages/BloodRequest.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { donorsAPI, requestsAPI } from '../services/api';

const BloodRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Quick request form state - SIMPLIFIED
  const [quickRequest, setQuickRequest] = useState({
    bloodGroup: '',
    unitsRequired: 1,
    urgency: 'medium',
    purpose: 'Emergency blood requirement'
  });

  // Filters state
  const [filters, setFilters] = useState({
    bloodGroup: '',
    city: '',
    availability: 'true'
  });

  useEffect(() => {
    if (user?.role !== 'hospital') {
      navigate('/dashboard');
      return;
    }
    loadDonors();
  }, [user, navigate]);

  const loadDonors = async () => {
    setLoading(true);
    try {
      const response = await donorsAPI.getAll(filters);
      setDonors(response.data);
      setFilteredDonors(response.data);
    } catch (error) {
      console.error('Error loading donors:', error);
      setError('Failed to load donors');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);
    
    // Apply filters locally for immediate response
    let filtered = donors;
    
    if (newFilters.bloodGroup) {
      filtered = filtered.filter(donor => donor.bloodGroup === newFilters.bloodGroup);
    }
    
    if (newFilters.city) {
      filtered = filtered.filter(donor => 
        donor.city.toLowerCase().includes(newFilters.city.toLowerCase())
      );
    }
    
    if (newFilters.availability !== '') {
      filtered = filtered.filter(donor => donor.availability === (newFilters.availability === 'true'));
    }
    
    setFilteredDonors(filtered);
  };

  const handleQuickRequestChange = (e) => {
    const { name, value } = e.target;
    setQuickRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateQuickRequest = () => {
    if (!quickRequest.bloodGroup) {
      setError('Please select blood group needed');
      return false;
    }
    if (!quickRequest.unitsRequired || quickRequest.unitsRequired < 1) {
      setError('Please enter valid units required');
      return false;
    }
    return true;
  };

  const sendRequestToDonor = async (donor) => {
    if (!validateQuickRequest()) return;

    setSendingRequest(true);
    setError('');
    
    try {
      const requestData = {
        donorId: donor._id,
        bloodGroup: quickRequest.bloodGroup,
        unitsRequired: parseInt(quickRequest.unitsRequired),
        urgency: quickRequest.urgency,
        contactPerson: user?.name || 'Hospital Staff',
        contactNumber: user?.contact || 'Not provided',
        purpose: quickRequest.purpose
      };

      const response = await requestsAPI.sendToDonor(requestData);
      
      setMessage(`✅ Request sent to ${donor.name}! Email dispatched successfully.`);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
      
    } catch (error) {
      console.error('Error sending request:', error);
      setError(error.response?.data?.message || 'Failed to send request to donor');
    } finally {
      setSendingRequest(false);
    }
  };

  const sendBulkRequests = async (selectedDonors) => {
    if (!validateQuickRequest()) return;

    setSendingRequest(true);
    setError('');
    
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const donor of selectedDonors) {
        try {
          const requestData = {
            donorId: donor._id,
            bloodGroup: quickRequest.bloodGroup,
            unitsRequired: parseInt(quickRequest.unitsRequired),
            urgency: quickRequest.urgency,
            contactPerson: user?.name || 'Hospital Staff',
            contactNumber: user?.contact || 'Not provided',
            purpose: quickRequest.purpose
          };

          await requestsAPI.sendToDonor(requestData);
          successCount++;
        } catch (error) {
          console.error(`Failed to send to ${donor.name}:`, error);
          errorCount++;
        }
      }

      setMessage(`✅ Sent ${successCount} requests successfully! ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
      
    } catch (error) {
      console.error('Error in bulk sending:', error);
      setError('Failed to send some requests');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadDonors();
  };

  const clearFilters = () => {
    setFilters({
      bloodGroup: '',
      city: '',
      availability: 'true'
    });
    setFilteredDonors(donors);
  };

  // Get available donors for selected blood group
  const availableDonorsForRequest = filteredDonors.filter(donor => 
    donor.availability && (!quickRequest.bloodGroup || donor.bloodGroup === quickRequest.bloodGroup)
  );

  if (user?.role !== 'hospital') {
    return (
      <div className="access-denied" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>🔒 Access Restricted</h2>
        <p>Only hospital users can access the blood request feature.</p>
      </div>
    );
  }

  return (
    <div className="blood-request-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#dc3545', marginBottom: '10px' }}>🩸 Send Blood Request to Donors</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Select available donors and send them blood request emails instantly
        </p>
      </div>

      {/* Quick Request Setup */}
      <div className="quick-request-section" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '25px', 
        borderRadius: '15px',
        marginBottom: '30px',
        color: 'white'
      }}>
        <h2 style={{ marginBottom: '20px', color: 'white' }}>⚡ Quick Request Setup</h2>
        
        {message && (
          <div style={{ 
            background: 'rgba(255,255,255,0.9)', 
            color: '#155724', 
            padding: '12px', 
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb',
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}
        
        {error && (
          <div style={{ 
            background: 'rgba(255,255,255,0.9)', 
            color: '#721c24', 
            padding: '12px', 
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'white' }}>
              Blood Group Needed *
            </label>
            <select 
              name="bloodGroup" 
              value={quickRequest.bloodGroup}
              onChange={handleQuickRequestChange}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: 'none',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
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
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'white' }}>
              Units Required *
            </label>
            <input
              type="number"
              name="unitsRequired"
              value={quickRequest.unitsRequired}
              onChange={handleQuickRequestChange}
              min="1"
              max="10"
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: 'none',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'white' }}>
              Urgency Level
            </label>
            <select 
              name="urgency" 
              value={quickRequest.urgency}
              onChange={handleQuickRequestChange}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: 'none',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'white' }}>
              Purpose
            </label>
            <input
              type="text"
              name="purpose"
              value={quickRequest.purpose}
              onChange={handleQuickRequestChange}
              placeholder="Emergency blood requirement"
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: 'none',
                fontSize: '16px',
                backgroundColor: 'white'
              }}
            />
          </div>
        </div>

        {quickRequest.bloodGroup && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>
              Ready to send requests for <span style={{ color: '#ffeb3b' }}>{quickRequest.bloodGroup}</span> blood
              {availableDonorsForRequest.length > 0 && (
                <span> - {availableDonorsForRequest.length} donors available</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Donor Selection */}
      <div className="donor-selection-section">
        <div className="section-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h2 style={{ color: '#333', margin: 0 }}>👥 Available Donors</h2>
            <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>
              Click "Send Request" on any donor to instantly email them
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666', background: '#f8f9fa', padding: '8px 12px', borderRadius: '6px' }}>
              <strong>{filteredDonors.length}</strong> donor{filteredDonors.length !== 1 ? 's' : ''} found
              {quickRequest.bloodGroup && (
                <span> • <strong>{availableDonorsForRequest.length}</strong> matching {quickRequest.bloodGroup}</span>
              )}
            </div>
            
            {availableDonorsForRequest.length > 0 && (
              <button 
                onClick={() => sendBulkRequests(availableDonorsForRequest.slice(0, 5))}
                disabled={sendingRequest || !quickRequest.bloodGroup}
                style={{
                  padding: '10px 16px',
                  backgroundColor: sendingRequest || !quickRequest.bloodGroup ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: sendingRequest || !quickRequest.bloodGroup ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                📧 Send to First 5
              </button>
            )}
          </div>
        </div>

        {/* Search Filters */}
        <div className="search-filters" style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '15px',
            alignItems: 'end'
          }}>
            <div className="filter-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                Blood Group
              </label>
              <select 
                name="bloodGroup" 
                value={filters.bloodGroup} 
                onChange={handleFilterChange}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              >
                <option value="">All Blood Groups</option>
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
            
            <div className="filter-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                City
              </label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Enter city"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="filter-group">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                Availability
              </label>
              <select 
                name="availability" 
                value={filters.availability} 
                onChange={handleFilterChange}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              >
                <option value="true">Available Now</option>
                <option value="false">Not Available</option>
                <option value="">All Donors</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleSearch}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                🔍 Search
              </button>
              <button 
                onClick={clearFilters}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* Donors Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>Loading donors...</h3>
            <p style={{ color: '#999' }}>Fetching available donors from the database</p>
          </div>
        ) : filteredDonors.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>No donors found</h3>
            <p style={{ color: '#999', marginBottom: '20px' }}>Try adjusting your search filters or check back later.</p>
            <button 
              onClick={clearFilters}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Show All Donors
            </button>
          </div>
        ) : (
          <div className="donors-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '20px' 
          }}>
            {filteredDonors.map(donor => (
              <div key={donor._id} className="donor-card" style={{ 
                background: 'white',
                border: `2px solid ${donor.availability ? '#28a745' : '#dc3545'}`,
                borderRadius: '12px', 
                padding: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: donor.availability ? 1 : 0.7
              }}>
                <div className="donor-header" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '18px' }}>{donor.name}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{donor.email}</p>
                  </div>
                  <span 
                    className={`availability ${donor.availability ? 'available' : 'unavailable'}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: donor.availability ? '#d4edda' : '#f8d7da',
                      color: donor.availability ? '#155724' : '#721c24',
                      border: `1px solid ${donor.availability ? '#c3e6cb' : '#f5c6cb'}`
                    }}
                  >
                    {donor.availability ? '✅ Available' : '❌ Not Available'}
                  </span>
                </div>
                
                <div className="donor-details" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#333' }}>Blood:</span>
                      <span style={{ 
                        color: '#dc3545', 
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        backgroundColor: '#ffe6e6',
                        borderRadius: '4px'
                      }}>
                        {donor.bloodGroup}
                      </span>
                    </div>
                    <div>
                      <strong>Age:</strong> {donor.age} years
                    </div>
                    <div>
                      <strong>City:</strong> {donor.city}
                    </div>
                    <div>
                      <strong>Contact:</strong> {donor.contact}
                    </div>
                  </div>
                </div>
                
                <div className="donor-actions" style={{ 
                  display: 'flex', 
                  gap: '10px'
                }}>
                  <button 
                    onClick={() => sendRequestToDonor(donor)}
                    disabled={!donor.availability || sendingRequest || !quickRequest.bloodGroup}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: donor.availability && quickRequest.bloodGroup ? '#28a745' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: donor.availability && quickRequest.bloodGroup ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      flex: 1,
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (donor.availability && quickRequest.bloodGroup) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (donor.availability && quickRequest.bloodGroup) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {sendingRequest ? '📧 Sending...' : '📧 Send Request'}
                  </button>
                  
                  <button 
                    onClick={() => alert(`Contact: ${donor.contact}\nEmail: ${donor.email}\nCity: ${donor.city}`)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📞 Contact
                  </button>
                </div>

                {!quickRequest.bloodGroup && donor.availability && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px',
                    background: '#fff3cd',
                    color: '#856404',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textAlign: 'center',
                    border: '1px solid #ffeaa7'
                  }}>
                    ⚠️ Select blood group above to enable requests
                  </div>
                )}

                {quickRequest.bloodGroup && donor.bloodGroup !== quickRequest.bloodGroup && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '8px',
                    background: '#f8f9fa',
                    color: '#6c757d',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textAlign: 'center',
                    border: '1px solid #e9ecef'
                  }}>
                    ℹ️ Donor has {donor.bloodGroup}, you need {quickRequest.bloodGroup}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Guide */}
      <div className="quick-guide" style={{ 
        marginTop: '40px',
        padding: '25px',
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        borderRadius: '12px',
        border: '1px solid #ffd7c2'
      }}>
        <h3 style={{ color: '#d35400', marginBottom: '15px', textAlign: 'center' }}>🚀 Quick Guide</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>1️⃣</div>
            <p style={{ margin: 0, color: '#333', fontWeight: '500' }}>Select blood group & units needed</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>2️⃣</div>
            <p style={{ margin: 0, color: '#333', fontWeight: '500' }}>Filter donors by location/availability</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>3️⃣</div>
            <p style={{ margin: 0, color: '#333', fontWeight: '500' }}>Click "Send Request" on any donor</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>4️⃣</div>
            <p style={{ margin: 0, color: '#333', fontWeight: '500' }}>Email sent instantly to donor!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodRequest;