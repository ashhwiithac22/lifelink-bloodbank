const mongoose = require('mongoose');
const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorName: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  unitsDonated: {
    type: Number,
    required: true,
    min: 1,
    max: 2
  },
  donationDate: {
    type: Date,
    default: Date.now
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hospitalName: {
    type: String
  },
  status: {
    type: String,
    enum: ['completed', 'scheduled', 'cancelled'],
    default: 'completed'
  },
  // ✅ ADD THESE FIELDS FOR HELP RESTOCK
  helpRestock: {
    type: Boolean,
    default: false
  },
  restockMessage: {
    type: String
  },
  contactNumber: {
    type: String
  },
  city: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Donation', donationSchema);