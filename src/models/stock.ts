import mongoose, { Document, Schema, Types } from 'mongoose';

export type StockUnit = 'PCS' | 'KG' | 'LTR';
export type StockCategory = 'STORED' | 'NON_STORED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | '-';
export type Wing = 'MALE' | 'FEMALE';
export type TransactionType = 'IN' | 'OUT';

export interface IStockItem extends Document {
  name: string;
  unit: StockUnit;
  category: StockCategory;
  wing: Wing;
}

const stockItemSchema = new Schema<IStockItem>({
  name: {
    type: String,
    required: true,
    set: (value: string) => value.charAt(0).toUpperCase() + value.substring(1),
  },
  unit: {
    type: String,
    enum: ['PCS', 'KG', 'LTR'],
    set: (value: string) => value.toUpperCase(),
    required: true,
  },
  category: {
    type: String,
    enum: ['STORED', 'NON_STORED'],
    set: (value: string) => value.toUpperCase(),
    default: 'STORED',
  },
  wing: { type: String, enum: ['MALE', 'FEMALE'], required: true },
});

stockItemSchema.index({ name: 1, wing: 1 }, { unique: true });

stockItemSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const itemId = (this as any)._id;
  const stockCount = await mongoose.model('Stock').countDocuments({ item: itemId });
  const transactionCount = await mongoose.model('StockTransaction').countDocuments({ item: itemId });
  if (stockCount > 0 || transactionCount > 0) {
    const error = new Error('Cannot delete StockItem because it is referenced in Stock or StockTransaction.');
    return next(error);
  }
  next();
});

export const StockItem = mongoose.model<IStockItem>('StockItem', stockItemSchema);

export interface IStock extends Document {
  quantity: number;
  price: number;
  item: Types.ObjectId | IStockItem;
  wing: Wing;
  createdAt: Date;
  updatedAt: Date;
}

const stockSchema = new Schema<IStock>(
  {
    quantity: { type: Number, default: 0, min: [0, 'Quantity cannot be negative'] },
    price: { type: Number, default: 0, min: [0, 'Price cannot be negative'] },
    item: { type: Schema.Types.ObjectId, ref: 'StockItem' },
    wing: { type: String, enum: ['MALE', 'FEMALE'], required: true },
  },
  { timestamps: true }
);

stockSchema.index({ item: 1 }, { unique: true });

export const Stock = mongoose.model<IStock>('Stock', stockSchema);

export interface IStockTransaction extends Document {
  item: Types.ObjectId | IStockItem;
  quantityChange: number;
  unitPrice: number;
  date: Date;
  type: TransactionType;
  category?: StockCategory;
  meal: MealType;
  wing: Wing;
  transactionAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const stockTransactionSchema = new Schema<IStockTransaction>(
  {
    item: { type: Schema.Types.ObjectId, ref: 'StockItem', required: true },
    quantityChange: { type: Number, required: true },
    unitPrice: { type: Number, default: 0 },
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, required: true, enum: ['IN', 'OUT'] },
    category: {
      type: String,
      enum: ['STORED', 'NON_STORED'],
      set: (value: string) => value.toUpperCase(),
    },
    meal: { type: String, required: true, enum: ['BREAKFAST', 'LUNCH', 'DINNER', '-'] },
    wing: { type: String, enum: ['MALE', 'FEMALE'], required: true },
    transactionAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

// Compound index covering all queries in stockRecompute.ts (item+wing+date range scans)
stockTransactionSchema.index({ item: 1, wing: 1, date: 1 });

export const StockTransaction = mongoose.model<IStockTransaction>('StockTransaction', stockTransactionSchema);
