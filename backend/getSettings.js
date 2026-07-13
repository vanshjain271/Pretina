const mongoose = require('mongoose');
const Settings = require('./src/models/Settings');
require('dotenv').config();

const getSettings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const settings = await Settings.findOne();
    console.log(settings);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

getSettings();
