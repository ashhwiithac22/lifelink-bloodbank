const mongoose = require('mongoose');
require('dotenv').config();

async function resetInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Inventory = require('./models/Inventory');
    
    // Delete all existing inventory
    await Inventory.deleteMany({});
    console.log('🗑️ All inventory data deleted');
    
    // Create EMPTY inventory (0 units for all blood types)
    const emptyInventory = [
      { bloodGroup: 'A+', unitsAvailable: 0 },
      { bloodGroup: 'A-', unitsAvailable: 0 },
      { bloodGroup: 'B+', unitsAvailable: 0 },
      { bloodGroup: 'B-', unitsAvailable: 0 },
      { bloodGroup: 'AB+', unitsAvailable: 0 },
      { bloodGroup: 'AB-', unitsAvailable: 0 },
      { bloodGroup: 'O+', unitsAvailable: 0 },
      { bloodGroup: 'O-', unitsAvailable: 0 }
    ];
    
    await Inventory.insertMany(emptyInventory);
    console.log('✅ Empty inventory created (0 units for all blood types)');
    
    // Verify
    const inventory = await Inventory.find().sort({ bloodGroup: 1 });
    console.log('\n📊 CURRENT EMPTY INVENTORY:');
    console.log('==========================');
    inventory.forEach(item => {
      console.log(`🩸 ${item.bloodGroup}: ${item.unitsAvailable} units`);
    });
    
    await mongoose.connection.close();
    console.log('\n🎉 Inventory reset complete! Start with 0 units.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetInventory();