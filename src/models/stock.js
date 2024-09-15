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
  wing: {
    type: String,
    enum: ["MALE", "FEMALE"],
    required: true, // Add wing field for both male and female wings
  },
});

// Create a compound index to enforce uniqueness of `name` within the same `wing`
stockItemSchema.index({ name: 1, wing: 1 }, { unique: true });

// Middleware to ensure no StockItem _id is present in Stock or StockTransaction models before deleting
stockItemSchema.pre('remove', { document: true, query: false }, async function (next) {
  const itemId = this._id;
  const stockCount = await mongoose.model('Stock').countDocuments({ item: itemId });
  const transactionCount = await mongoose.model('StockTransaction').countDocuments({ item: itemId });

  if (stockCount > 0 || transactionCount > 0) {
    const error = new Error('Cannot delete StockItem because it is referenced in Stock or StockTransaction.');
    return next(error);
  }

  next();
});

const StockItem = mongoose.model("StockItem", stockItemSchema);

const stockSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'], // Prevent negative quantity
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'], // Prevent negative price
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockItem", // Reference the StockItem model
    },
    wing: {
      type: String,
      enum: ["MALE", "FEMALE"],
      required: true, // Add wing field for both male and female wings
    },
  },
  {
    timestamps: true,
  }
);

// Define a unique index on the 'item' field
stockSchema.index({ item: 1 }, { unique: true });

const Stock = mongoose.model("Stock", stockSchema);

const stockTransactionSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockItem",
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      required: true,
      enum: ["IN", "OUT"],
    },
    category: {
      type: String,
      enum: ["STORED", "NON_STORED"],
      set: (value) => value.toUpperCase(),
    },
    meal: {
      type: String,
      required: true,
      enum: ["BREAKFAST", "LUNCH", "DINNER", "-"], // "-" for stock in transactions
    },
    wing: {
      type: String,
      enum: ["MALE", "FEMALE"],
      required: true, // Add wing field for both male and female wings
    },
    transactionAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const StockTransaction = mongoose.model("StockTransaction", stockTransactionSchema);

module.exports = { Stock, StockItem, StockTransaction };
