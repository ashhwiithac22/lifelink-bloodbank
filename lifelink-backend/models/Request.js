const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  // Hospital Information
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Request Details
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsRequired: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Patient Information
  patientName: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    trim: true
  },
  
  // Contact Information
  contactPerson: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  
  // Location
  location: {
    type: String,
    trim: true
  },
  
  // Donor Information (if sent to specific donor)
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  donorName: {
    type: String,
    trim: true
  },
  donorEmail: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled', 'sent', 'cancelled'],
    default: 'pending'
  },
  
  // Email Tracking
  emailSent: {
    type: Boolean,
    default: false
  },
  emailMessageId: {
    type: String
  },
  emailSentAt: {
    type: Date
  },
  
  // Additional Info
  notes: {
    type: String,
    trim: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  fulfilledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Update updatedAt on save
requestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for faster queries
requestSchema.index({ hospitalId: 1, createdAt: -1 });
requestSchema.index({ bloodGroup: 1, status: 1 });
requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ donorId: 1, createdAt: -1 });
requestSchema.index({ emailSent: 1 });

// Virtual for formatted date
requestSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
});

// Method to check if request is urgent
requestSchema.methods.isUrgent = function() {
  return this.urgency === 'high' || this.urgency === 'critical';
};

// Method to get status color
requestSchema.methods.getStatusColor = function() {
  const colors = {
    pending: 'warning',
    approved: 'info',
    rejected: 'danger',
    fulfilled: 'success',
    sent: 'primary',
    cancelled: 'secondary'
  };
  return colors[this.status] || 'secondary';
};

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;