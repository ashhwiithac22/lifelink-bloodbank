/*lifelink-frontend/src/pages/DonorSearch.js*/
import React, { useState, useEffect } from 'react';
import { donorsAPI } from '../services/api';
import DonorCard from '../components/DonorCard';

const DonorSearch = () => {
  const [donors, setDonors] = useState([]);
  const [filters, setFilters] = useState({
    bloodGroup: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    searchDonors();
  }, []);

  const searchDonors = async (searchFilters = filters) => {
    setLoading(true);
    try {
      const response = await donorsAPI.getAll(searchFilters);
      setDonors(response.data);
    } catch (error) {
      console.error('Error searching donors:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="donor-search-page">
      <div className="container">
        <h1>Find Blood Donors</h1>
        
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
        </div>

        {loading ? (
          <div>Searching donors...</div>
        ) : (
          <div className="donors-grid">
            {donors.length === 0 ? (
              <p>No donors found matching your criteria.</p>
            ) : (
              donors.map(donor => (
                <DonorCard key={donor._id} donor={donor} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorSearch;