import React, { useState } from 'react';
import { adminAPI } from '../services/api';
import './EmailModal.css';

const EmailModal = ({ donor, isOpen, onClose, onEmailSent }) => {
  const [formData, setFormData] = useState({
    subject: '',
    body: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateSelect = (templateType) => {
    const templates = {
      urgent: {
        subject: `🩸 Urgent Blood Donation Request - ${donor.bloodGroup} Blood Needed`,
        body: `Dear ${donor.name},

We hope this message finds you well.

We are reaching out to you regarding an urgent need for ${donor.bloodGroup} blood at our facility. Your blood type matches the current requirement, and your donation could potentially save lives.

Request Details:
• Blood Group Required: ${donor.bloodGroup}
• Urgency Level: High
• Hospital: LifeLink Blood Bank
• Contact Person: Admin Team
• Contact Number: 0422-3566580

Your previous registration as a blood donor shows your commitment to helping others in need. We would be grateful if you could visit our blood bank at your earliest convenience.

Please bring your donor ID and a valid government-issued photo ID.

Thank you for considering this urgent request. Your generosity makes a difference!

Warm regards,
LifeLink Blood Bank Team
Emergency Helpline: 0422-3566580
Email: support@lifelink.com`
      },
      general: {
        subject: `Blood Donation Appeal - Your ${donor.bloodGroup} Blood Can Save Lives`,
        body: `Dear ${donor.name},

We hope you are doing well.

As a registered ${donor.bloodGroup} blood donor with LifeLink Blood Bank, we wanted to reach out regarding the ongoing need for blood donations in our community.

Your blood type (${donor.bloodGroup}) is always in demand, and regular donations are crucial to maintaining adequate blood supply for emergencies and scheduled medical procedures.

We encourage you to consider visiting our blood donation center when you're available. Each donation can save up to three lives!

Donation Details:
• Blood Bank: LifeLink Blood Bank
• Your Blood Group: ${donor.bloodGroup}
• Contact: 0422-3566580
• Requirements: Please bring valid ID

Thank you for being part of our life-saving mission.

Best regards,
LifeLink Blood Bank Team
0422-3566580 | support@lifelink.com`
      },
      appreciation: {
        subject: `Thank You for Being a Registered Blood Donor - ${donor.name}`,
        body: `Dear ${donor.name},

We wanted to take a moment to express our sincere appreciation for your registration as a blood donor with LifeLink Blood Bank.

Your commitment to helping save lives through blood donation is truly commendable. Donors like you are the backbone of our healthcare system and make it possible for us to respond to emergencies and medical needs.

While we don't have an immediate requirement, we may reach out in the future when there's a need for ${donor.bloodGroup} blood.

Please keep your contact information updated and let us know if your availability changes.

Thank you for being a hero in our community!

With gratitude,
LifeLink Blood Bank Team
Saving Lives Together
0422-3566580 | support@lifelink.com`
      }
    };

    setFormData(templates[templateType]);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.body.trim()) {
      setError('Please fill in both subject and body');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminAPI.sendEmailToDonor({
        donorId: donor._id,
        subject: formData.subject,
        body: formData.body
      });

      setSuccess('Email sent successfully!');
      
      // Reset form and close modal after success
      setTimeout(() => {
        setFormData({ subject: '', body: '' });
        onEmailSent && onEmailSent();
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ subject: '', body: '' });
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="email-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Send Email to Donor</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="donor-info">
            <h4>{donor.name}</h4>
            <p className="donor-details">
              <span className="blood-group">{donor.bloodGroup}</span> • {donor.email} • {donor.city}
            </p>
          </div>

          {/* Template Selection */}
          <div className="template-section">
            <label>Quick Templates:</label>
            <div className="template-buttons">
              <button 
                type="button"
                className="btn-template urgent"
                onClick={() => handleTemplateSelect('urgent')}
              >
                🚨 Urgent Request
              </button>
              <button 
                type="button"
                className="btn-template general"
                onClick={() => handleTemplateSelect('general')}
              >
                📋 General Appeal
              </button>
              <button 
                type="button"
                className="btn-template appreciation"
                onClick={() => handleTemplateSelect('appreciation')}
              >
                🙏 Appreciation
              </button>
            </div>
          </div>

          <form onSubmit={handleSendEmail} className="email-form">
            <div className="form-group">
              <label htmlFor="subject">Subject:</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Enter email subject..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="body">Email Body:</label>
              <textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                placeholder="Compose your email message..."
                rows="12"
                required
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-send"
                disabled={loading}
              >
                {loading ? '⏳ Sending...' : '📧 Send Email'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;