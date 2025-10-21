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
  }
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

module.exports = mongoose.model('Inventory', inventorySchema);