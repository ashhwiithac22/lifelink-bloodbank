const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  recipientDonorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending'
  },
  messageId: {
    type: String
  },
  error: {
    type: String
  },
  sentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
emailLogSchema.index({ senderId: 1, createdAt: -1 });
emailLogSchema.index({ recipientDonorId: 1, createdAt: -1 });
emailLogSchema.index({ status: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);