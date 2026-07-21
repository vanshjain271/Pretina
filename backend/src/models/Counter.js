const mongoose = require('mongoose');

/**
 * Counter model — used for atomic, race-condition-free sequence generation.
 * Usage: Counter.getNextSequence('orderNumber') → returns next integer atomically.
 */
const counterSchema = new mongoose.Schema({
  _id:  { type: String, required: true }, // e.g. 'orderNumber'
  seq:  { type: Number, default: 0 },
});

counterSchema.statics.getNextSequence = async function (name) {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
