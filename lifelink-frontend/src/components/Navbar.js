/*lifelink-frontend/src/components/Navbar.js*/
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🩸 LifeLink
        </Link>
        
        <div className="nav-menu">
          <Link to="/" className="nav-link">Home</Link>
          
         {user ? (
  <>
    <Link to="/dashboard" className="nav-link">Dashboard</Link>
    
    {/* HOSPITAL & ADMIN: Can access donors and requests */}
    {(user.role === 'hospital' || user.role === 'admin') && (
      <>
        <Link to="/donors" className="nav-link">Find Donors</Link>
        <Link to="/requests" className="nav-link">Requests</Link>
      </>
    )}
    
    {/* ADMIN: Admin panel access */}
    {user.role === 'admin' && (
      <Link to="/admin" className="nav-link">Admin Panel</Link>
    )}
    
    {/* DONOR: Donations access */}
    {user.role === 'donor' && (
      <Link to="/donations" className="nav-link">My Donations</Link>
    )}
    
    {/* ALL ROLES: Help Restock */}
    <Link to="/help-restock" className="nav-link">Help Restock</Link>

    <div className="nav-user">
      <span>Welcome, {user.name} ({user.role})</span>
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </div>
  </>
) : (
  <div className="nav-auth">
    <Link to="/login" className="nav-link">Login</Link>
    <Link to="/register" className="nav-link">Register</Link>
  </div>
)}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;