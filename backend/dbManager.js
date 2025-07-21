require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Sale = require('./models/Sale');
const { autoSeed } = require('./config/autoSeed');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function resetDatabase() {
  console.log('🔄 Resetting database...');
  
  // Clear all data
  await User.deleteMany({});
  await Product.deleteMany({});
  await Sale.deleteMany({});
  
  console.log('🗑️ All data cleared');
  
  // Reseed with sample data
  await autoSeed();
  console.log('✅ Database reset and seeded successfully');
}

async function checkDatabase() {
  const userCount = await User.countDocuments();
  const productCount = await Product.countDocuments();
  const saleCount = await Sale.countDocuments();

  console.log('\n📊 Database Status:');
  console.log(`   👥 Users: ${userCount}`);
  console.log(`   📦 Products: ${productCount}`);
  console.log(`   💰 Sales: ${saleCount}`);
  console.log('');
}

async function addSampleData() {
  console.log('➕ Running auto-seed (will skip if data exists)...');
  await autoSeed();
}

// Command line interface
const command = process.argv[2];

connectDB().then(async () => {
  try {
    switch (command) {
      case 'reset':
        await resetDatabase();
        break;
      case 'check':
        await checkDatabase();
        break;
      case 'seed':
        await addSampleData();
        break;
      default:
        console.log('\n🛠️  Database Management Commands:');
        console.log('   node dbManager.js reset  - ⚠️  Reset and reseed database (DELETES ALL DATA)');
        console.log('   node dbManager.js check  - 📊 Check database status');
        console.log('   node dbManager.js seed   - 🌱 Add sample data (only if empty)');
        console.log('');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
});
