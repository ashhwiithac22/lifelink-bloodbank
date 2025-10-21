const mongoose = require('mongoose');
require('dotenv').config();

async function checkRealData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const Inventory = require('./models/Inventory');
    const inventory = await Inventory.find().sort({ bloodGroup: 1 });
    
    console.log('\n📊 REAL DATABASE INVENTORY:');
    console.log('==========================');
    
    if (inventory.length === 0) {
      console.log('❌ No inventory data found!');
    } else {
      inventory.forEach(item => {
        console.log(`🩸 ${item.bloodGroup}: ${item.unitsAvailable} units`);
      });
      
      const totalUnits = inventory.reduce((sum, item) => sum + item.unitsAvailable, 0);
      console.log(`\n📈 TOTAL UNITS IN DB: ${totalUnits}`);
    }
    
    // Also check donations
    const Donation = require('./models/Donation');
    const donations = await Donation.find();
    console.log(`\n🎁 TOTAL DONATIONS: ${donations.length}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRealData();