const mongoose = require("mongoose");

const stockItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Set uniqueness constraint on the name field
    set: (value) => value.charAt(0).toUpperCase() + value.substring(1),
  },
  unit: {
    type: String,
    enum: ["PCS", "KG", "LTR"],
    set: (value) => value.toUpperCase(),
    required: true,
  },
  category: {
    type: String,
    enum: ["STORED", "NON_STORED"],
    set: (value) => value.toUpperCase(),
    default: "STORED",
  },
});

// Define a unique index on the 'name' field
stockItemSchema.index({ name: 1 }, { unique: true });

const StockItem = mongoose.model("StockItem", stockItemSchema);

const stockSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockItem", // Reference the StockItem model
    },
  },
  {
    timestamps: true,
  }
);

// Define a unique index on the 'item' field
stockSchema.index({ item: 1 }, { unique: true });

const Stock = mongoose.model("Stock", stockSchema);

module.exports = { Stock, StockItem };
