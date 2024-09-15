const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true }, // Reference to student
  roomNo: {type: String, required: true},
  complaintType: {
    type: String,
    required: true,
    enum: ["MESS", "WIFI", "CLEANING", "REPAIR"], 
  },
  description: { type: String, required: true }, 
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED"],
    default: "PENDING",
  },
  completedAt: { type: Date, default: null }, 
  staffConfirmed: { type: Boolean, default: false }, // Staff confirmation
  studentConfirmed: { type: Boolean, default: false }, // Student confirmation
  images: [
    {
      url: { type: String },
    },
  ],
}, { timestamps: { createdAt: true, updatedAt: false } });

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
