const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const staffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  role: {
    type: String,
    required: true,
    enum: ["MESS", "WIFI", "CLEANING", "REPAIR"],
  },
  password: { type: String, required: true }, // Add password field
});

// Pre-save hook to hash password before saving
staffSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords
staffSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
