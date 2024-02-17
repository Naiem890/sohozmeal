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

// Middleware to ensure no StockItem _id is present in Stock or StockTransaction models before deleting
stockItemSchema.pre('remove', { document: true, query: false }, async function(next) {
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
      // required: true,
      enum: ["STORED", "NON_STORED"],
      set: (value) => value.toUpperCase(),
    },
    meal: {
      type: String,
      required: true,
      enum: ["BREAKFAST", "LUNCH", "DINNER", "-"], // "-" for stock in transactions
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

const StockTransaction = mongoose.model(
  "StockTransaction",
  stockTransactionSchema
);

module.exports = { Stock, StockItem, StockTransaction };
