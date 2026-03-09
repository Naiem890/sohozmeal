const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  noticeFor: {
    type: String,
    required: true,
    enum: ["MALE", "FEMALE", "ALL"],
  },
}, { timestamps: true });

const Notice = mongoose.model("Notice", noticeSchema);

module.exports = Notice;
