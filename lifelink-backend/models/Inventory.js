//models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
    unique: true
  },
  unitsAvailable: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lastChecked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create initial inventory documents
inventorySchema.statics.initializeInventory = async function() {
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  for (const group of bloodGroups) {
    const exists = await this.findOne({ bloodGroup: group });
    if (!exists) {
      await this.create({ bloodGroup: group, unitsAvailable: 0 });
    }
  }
};

// Check for low inventory after save/update
inventorySchema.post('save', async function(doc) {
  try {
    // If units are ≤ 3, trigger auto-request creation
    if (doc.unitsAvailable <= 3) {
      const Request = require('./Request');
      
      // Use setTimeout to avoid blocking the save operation
      setTimeout(async () => {
        try {
          await Request.checkLowInventoryAndCreateRequests();
          console.log(`✅ Auto-request check triggered for ${doc.bloodGroup} (${doc.unitsAvailable} units)`);
        } catch (error) {
          console.error('Error in auto-request trigger:', error);
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Error in inventory post-save hook:', error);
  }
});

// Update lastChecked when inventory is modified
inventorySchema.pre('save', function(next) {
  this.lastChecked = new Date();
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);