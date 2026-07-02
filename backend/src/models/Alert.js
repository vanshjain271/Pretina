const mongoose = require('mongoose');

// Alert = the scrolling marquee announcement strip on the home page
const alertSchema = new mongoose.Schema({
  message:   { type: String, required: true, trim: true },
  isActive:  { type: Boolean, default: true },
  priority:  { type: Number, default: 0 }, // Higher = shown first
  startDate: { type: Date },
  endDate:   { type: Date },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Alert', alertSchema);
