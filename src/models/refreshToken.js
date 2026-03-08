const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    token:     { type: String, required: true, unique: true }, // SHA-256 hash of raw token
    userId:    { type: String, required: true },               // studentId / admin _id / staffId
    role:      { type: String, required: true },               // student | admin | MESS | WIFI | …
    expiresAt: { type: Date,   required: true },
  },
  { timestamps: true }
);

// MongoDB TTL index — automatically removes expired documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
