//models/Request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  city: {
    type: String,
    required: true
  },
  unitsRequired: {
    type: Number,
    required: true,
    min: 1
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled'],
    default: 'pending'
  },
  contactPerson: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  // New fields for donor request tracking
  donorRequests: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    donorEmail: String,
    donorName: String,
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: Date,
    donorResponded: {
      type: Boolean,
      default: false
    },
    responseStatus: {
      type: String,
      enum: ['accepted', 'declined', 'pending'],
      default: 'pending'
    },
    responseDate: Date
  }],
  totalEmailsSent: {
    type: Number,
    default: 0
  },
  responsesReceived: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
requestSchema.index({ hospitalId: 1, createdAt: -1 });
requestSchema.index({ status: 1 });
requestSchema.index({ bloodGroup: 1 });

module.exports = mongoose.model('Request', requestSchema);