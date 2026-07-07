require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Settings = require('../models/Settings');

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  // Create admin user
  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log(`ℹ️  Admin already exists: ${existing.email}`);
  } else {
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Pretina Admin',
      email: process.env.ADMIN_EMAIL || 'admin@pretina.com',
      phone: '0000000000',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      isPhoneVerified: true,
      permissions: {
        manageProducts: true,
        manageOrders: true,
        manageUsers: true,
      },
    });
    console.log(`✅ Admin created: ${admin.email}`);
  }

  // Initialize global settings
  const settings = await Settings.findById('global');
  if (!settings) {
    await Settings.create({ _id: 'global' });
    console.log('✅ Global settings initialized');
  } else {
    console.log('ℹ️  Settings already exist');
  }

  console.log('🎉 Seed complete');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
