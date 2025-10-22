/*lifelink-frontend/src/pages/DonorSearch.js*/
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
  const [stats, setStats] = useState({});

  useEffect(() => {
    searchDonors();
    loadDonorStats();
  }, []);

  const searchDonors = async (searchFilters = filters) => {
    setLoading(true);
    try {
      const response = await donorsAPI.getAll(searchFilters);
      console.log('Donors found:', response.data);
      setDonors(response.data);
    } catch (error) {
      console.error('Error searching donors:', error);
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
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value
    };
    setFilters(newFilters);
    searchDonors(newFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchDonors();
  };

  return (
    <div className="donor-search-page">
      <div className="container">
        <div className="page-header">
          <h1>Find Blood Donors</h1>
          <p>Search for available donors by blood type, location, and availability</p>
        </div>

        {/* Donor Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Donors</h3>
            <p className="stat-number">{stats.totalDonors || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Available Now</h3>
            <p className="stat-number">{stats.availableDonors || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Cities Covered</h3>
            <p className="stat-number">{stats.donorsByCity?.length || 0}</p>
          </div>
        </div>

        {/* Search Filters */}
        <div className="search-filters">
          <div className="filter-group">
            <label>Blood Group</label>
            <select name="bloodGroup" value={filters.bloodGroup} onChange={handleFilterChange}>
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
            <label>City</label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="Enter city name"
            />
          </div>

          <div className="filter-group">
            <label>Availability</label>
            <select name="availability" value={filters.availability} onChange={handleFilterChange}>
              <option value="">All Donors</option>
              <option value="true">Available Now</option>
              <option value="false">Not Available</option>
            </select>
          </div>

          <button onClick={handleSearch} className="btn btn-primary">
            🔍 Search Donors
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="loading">Searching donors...</div>
        ) : (
          <div className="search-results">
            <div className="results-header">
              <h3>Found {donors.length} Donor{donors.length !== 1 ? 's' : ''}</h3>
            </div>
            
            {donors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h4>No donors found</h4>
                <p>Try adjusting your search filters or check back later.</p>
              </div>
            ) : (
              <div className="donors-grid">
                {donors.map(donor => (
                  <div key={donor._id} className="donor-card">
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorSearch;