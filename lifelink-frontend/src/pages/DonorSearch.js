//src/pages/DonorSearch.js
import React, { useState, useEffect } from 'react';
import { donorsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DonorSearch = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [filters, setFilters] = useState({
    bloodGroup: '',
    city: '',
    availability: ''
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalDonors: 0,
    availableDonors: 0,
    citiesCovered: 0
  });
  const [error, setError] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);

  useEffect(() => {
    loadDonorStats();
    searchDonors();
  }, []);

  const searchDonors = async (searchFilters = filters) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Searching donors with filters:', searchFilters);
      
      const response = await donorsAPI.getAll(searchFilters);
      console.log('Donors API response:', response.data);
      
      setDonors(response.data);
    } catch (error) {
      console.error('Error searching donors:', error);
      const errorMessage = error.response?.data?.message || 'Failed to search donors';
      setError(errorMessage);
      
      if (error.response?.status === 403) {
        setError('Access denied. Only hospitals and admins can view donors.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDonorStats = async () => {
    try {
      const response = await donorsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading donor stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchDonors();
  };

  const clearFilters = () => {
    const resetFilters = {
      bloodGroup: '',
      city: '',
      availability: ''
    };
    setFilters(resetFilters);
    searchDonors(resetFilters);
  };

  const showDonorDetails = (donor) => {
    setSelectedDonor(donor);
  };

  const closeDonorDetails = () => {
    setSelectedDonor(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Check if user can view donors
  const canViewDonors = user && (user.role === 'hospital' || user.role === 'admin');

  if (!canViewDonors) {
    return (
      <div className="donor-search-page">
        <div className="container">
          <div className="access-denied">
            <h2>🔒 Access Restricted</h2>
            <p>Only hospital and admin users can access the donor search feature.</p>
            <p>Please contact an administrator if you need access to this feature.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-search-page">
      <div className="container">
        <div className="page-header">
          <h1>Find Blood Donors</h1>
          <p>Search for available donors by blood type, location, and availability</p>
          <p style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '14px' }}>
            🔍 Full contact information available for hospitals and administrators
          </p>
        </div>

        {/* Donor Statistics */}
        <div className="stats-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div className="stat-card" style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#6c757d' }}>Total Donors</h3>
            <p className="stat-number" style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#dc3545' 
            }}>
              {stats.totalDonors || 0}
            </p>
          </div>
          <div className="stat-card" style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#6c757d' }}>Available Now</h3>
            <p className="stat-number" style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#28a745' 
            }}>
              {stats.availableDonors || 0}
            </p>
          </div>
          <div className="stat-card" style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#6c757d' }}>Cities Covered</h3>
            <p className="stat-number" style={{ 
              margin: 0, 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#007bff' 
            }}>
              {stats.citiesCovered || 0}
            </p>
          </div>
        </div>

        {/* Search Filters */}
        <div className="search-filters" style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '30px' 
        }}>
          <form onSubmit={handleSearch}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px',
              alignItems: 'end'
            }}>
              <div className="filter-group">
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Blood Group
                </label>
                <select 
                  name="bloodGroup" 
                  value={filters.bloodGroup} 
                  onChange={handleFilterChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ced4da' 
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  placeholder="Enter city name"
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ced4da' 
                  }}
                />
              </div>

              <div className="filter-group">
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Availability
                </label>
                <select 
                  name="availability" 
                  value={filters.availability} 
                  onChange={handleFilterChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px', 
                    border: '1px solid #ced4da' 
                  }}
                >
                  <option value="">All Donors</option>
                  <option value="true">Available Now</option>
                  <option value="false">Not Available</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔍 Search Donors
                </button>
                <button 
                  type="button" 
                  onClick={clearFilters}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Clear
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{ 
            color: '#721c24', 
            backgroundColor: '#f8d7da', 
            padding: '12px', 
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="loading" style={{ 
            textAlign: 'center', 
            padding: '40px', 
            fontSize: '18px', 
            color: '#6c757d' 
          }}>
            🔍 Searching donors...
          </div>
        ) : (
          <div className="search-results">
            <div className="results-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3>Found {donors.length} Donor{donors.length !== 1 ? 's' : ''}</h3>
              {donors.length > 0 && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => window.print()} 
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📄 Print List
                  </button>
                </div>
              )}
            </div>
            
            {donors.length === 0 ? (
              <div className="empty-state" style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#6c757d' 
              }}>
                <div className="empty-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h4>No donors found</h4>
                <p>Try adjusting your search filters or check back later.</p>
              </div>
            ) : (
              <div className="donors-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: '20px' 
              }}>
                {donors.map(donor => (
                  <div key={donor._id} className="donor-card" style={{ 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px', 
                    padding: '20px',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => showDonorDetails(donor)}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-5px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                  >
                    <div className="donor-header" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '15px'
                    }}>
                      <div>
                        <h3 style={{ margin: 0, color: '#343a40' }}>{donor.name}</h3>
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                          📧 {donor.email}
                        </p>
                      </div>
                      <span 
                        className={`availability ${donor.availability ? 'available' : 'unavailable'}`}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: donor.availability ? '#d4edda' : '#f8d7da',
                          color: donor.availability ? '#155724' : '#721c24'
                        }}
                      >
                        {donor.availability ? '✅ Available' : '❌ Not Available'}
                      </span>
                    </div>
                    
                    <div className="donor-details" style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Blood Group:</strong>
                          <span 
                            className="blood-group" 
                            style={{ 
                              color: '#dc3545', 
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              backgroundColor: '#ffe6e6',
                              borderRadius: '4px'
                            }}
                          >
                            {donor.bloodGroup}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>Age:</strong>
                          <span>{donor.age} years</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>City:</strong>
                          <span>{donor.city}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Contact:</strong>
                          <span style={{ 
                            color: '#007bff', 
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            📞 {donor.contact}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="donor-actions" style={{ 
                      display: 'flex', 
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          flex: 1
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Contact ${donor.name} at:\n📞 Phone: ${donor.contact}\n📧 Email: ${donor.email}\n🏙️ City: ${donor.city}`);
                        }}
                      >
                        👁️ View Details
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          color: '#28a745',
                          border: '1px solid #28a745',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(`${donor.name} | Phone: ${donor.contact} | Email: ${donor.email} | Blood: ${donor.bloodGroup} | City: ${donor.city}`);
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Donor Details Modal */}
        {selectedDonor && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={closeDonorDetails}
          >
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={closeDonorDetails}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>

              <h2 style={{ color: '#343a40', marginBottom: '20px', borderBottom: '2px solid #dc3545', paddingBottom: '10px' }}>
                Donor Details
              </h2>

              <div style={{ display: 'grid', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                  <strong>Name:</strong>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedDonor.name}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                  <strong>Blood Group:</strong>
                  <span style={{ 
                    color: '#dc3545', 
                    fontWeight: 'bold',
                    fontSize: '18px',
                    padding: '4px 12px',
                    backgroundColor: '#ffe6e6',
                    borderRadius: '20px'
                  }}>
                    {selectedDonor.bloodGroup}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                  <strong>Phone:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>
                      📞 {selectedDonor.contact}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(selectedDonor.contact)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
                  <strong>Email:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      📧 {selectedDonor.email}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(selectedDonor.email)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '10px', background: '#e7f3ff', borderRadius: '6px' }}>
                    <strong>Age:</strong><br />
                    <span>{selectedDonor.age} years</span>
                  </div>
                  <div style={{ padding: '10px', background: '#e7f3ff', borderRadius: '6px' }}>
                    <strong>City:</strong><br />
                    <span>{selectedDonor.city}</span>
                  </div>
                </div>

                <div style={{ padding: '10px', background: selectedDonor.availability ? '#d4edda' : '#f8d7da', borderRadius: '6px', textAlign: 'center' }}>
                  <strong>Availability:</strong><br />
                  <span style={{ 
                    color: selectedDonor.availability ? '#155724' : '#721c24',
                    fontWeight: 'bold'
                  }}>
                    {selectedDonor.availability ? '✅ AVAILABLE FOR DONATION' : '❌ CURRENTLY UNAVAILABLE'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      flex: 1,
                      fontSize: '14px'
                    }}
                    onClick={() => window.open(`tel:${selectedDonor.contact}`, '_self')}
                  >
                    📞 Call Now
                  </button>
                  <button 
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      flex: 1,
                      fontSize: '14px'
                    }}
                    onClick={() => window.open(`mailto:${selectedDonor.email}`, '_self')}
                  >
                    📧 Send Email
                  </button>
                </div>

                <button 
                  style={{
                    padding: '10px 15px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: '10px'
                  }}
                  onClick={() => copyToClipboard(
                    `DONOR CONTACT:\nName: ${selectedDonor.name}\nPhone: ${selectedDonor.contact}\nEmail: ${selectedDonor.email}\nBlood Group: ${selectedDonor.bloodGroup}\nAge: ${selectedDonor.age}\nCity: ${selectedDonor.city}\nAvailability: ${selectedDonor.availability ? 'Available' : 'Not Available'}`
                  )}
                >
                  📋 Copy All Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorSearch;