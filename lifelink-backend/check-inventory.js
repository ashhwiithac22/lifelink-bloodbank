const mongoose = require('mongoose');
require('dotenv').config();

async function checkInventory() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Inventory = require('./models/Inventory');
    const inventory = await Inventory.find();
    
    console.log('\n📊 CURRENT INVENTORY STATUS:');
    console.log('============================');
    
    if (inventory.length === 0) {
      console.log('❌ Inventory collection is EMPTY!');
      console.log('\n🔄 INITIALIZING INVENTORY...');
      console.log('============================');
      
      // Initialize inventory with sample data
      const inventoryData = [
        { bloodGroup: 'A+', unitsAvailable: 15 },
        { bloodGroup: 'A-', unitsAvailable: 8 },
        { bloodGroup: 'B+', unitsAvailable: 12 },
        { bloodGroup: 'B-', unitsAvailable: 5 },
        { bloodGroup: 'AB+', unitsAvailable: 4 },
        { bloodGroup: 'AB-', unitsAvailable: 2 },
        { bloodGroup: 'O+', unitsAvailable: 20 },
        { bloodGroup: 'O-', unitsAvailable: 7 }
      ];
      
      // Insert new inventory
      await Inventory.insertMany(inventoryData);
      console.log('✅ Inventory initialized with sample data!');
      
      // Show the new inventory
      const newInventory = await Inventory.find().sort({ bloodGroup: 1 });
      console.log('\n📋 NEW INVENTORY DATA:');
      console.log('=====================');
      newInventory.forEach(item => {
        console.log(`🩸 ${item.bloodGroup}: ${item.unitsAvailable} units`);
      });
      
      const totalUnits = newInventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
      console.log(`\n📈 TOTAL UNITS: ${totalUnits}`);
      
    } else {
      console.log(`📦 Found ${inventory.length} blood groups in inventory`);
      
      inventory.forEach(item => {
        console.log(`🩸 ${item.bloodGroup}: ${item.unitsAvailable} units`);
      });
      
      const totalUnits = inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
      console.log(`\n📈 TOTAL UNITS: ${totalUnits}`);
    }
    
    await mongoose.connection.close();
    console.log('\n🎉 Inventory check completed!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('1. Check if MongoDB Atlas is connected');
    console.log('2. Verify your MONGODB_URI in .env file');
    console.log('3. Make sure Inventory model exists');
  }
}

// Run the function
checkInventory();