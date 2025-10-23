import React, { useState, useRef } from 'react';
import './ContactModal.css';

const ContactModal = ({ donor, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const phoneNumberRef = useRef(null);

  if (!isOpen) return null;

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(donor.contact);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCall = () => {
    window.open(`tel:${donor.contact}`, '_self');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Contact Donor</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="donor-info">
            <h4>{donor.name}</h4>
            <p className="donor-details">
              <span className="blood-group">{donor.bloodGroup}</span> • {donor.city}
            </p>
          </div>

          <div className="contact-section">
            <div className="phone-display">
              <span className="phone-label">Phone Number:</span>
              <div className="phone-number" ref={phoneNumberRef}>
                {donor.contact}
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-call"
                onClick={handleCall}
              >
                📞 Call Now
              </button>
              <button 
                className="btn btn-copy"
                onClick={handleCopyPhone}
              >
                {copied ? '✅ Copied!' : '📋 Copy Number'}
              </button>
            </div>

            {copied && (
              <div className="copy-confirmation">
                Phone number copied to clipboard!
              </div>
            )}
          </div>

          <div className="contact-note">
            <p>💡 <strong>Tip:</strong> Click "Call Now" to directly call the donor on mobile devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;