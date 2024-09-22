const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the admin schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  wing: { 
    type: String, 
    enum: ["MALE", "FEMALE", "ALL"], 
    required: true 
  }
});

// Pre-save hook for hashing password before saving the document
adminSchema.pre("save", async function (next) {
  const admin = this;

  // Only hash the password if it has been modified (or is new)
  if (!admin.isModified("password")) return next();

  try {
    // Hash the password with a salt round of 10
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin.password, salt);
    admin.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update hook for hashing password when updating
adminSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  // If password is being updated, hash it
  if (update.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Create the Admin model
const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
