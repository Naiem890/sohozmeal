import mongoose, { Document, Schema } from 'mongoose';

export interface IMealSlot {
  totalCost: number;
  totalStudent: number;
  perHeadCost?: number;
}

export interface ICost extends Document {
  date: Date;
  wing: 'MALE' | 'FEMALE';
  mealBill: {
    breakfast: IMealSlot;
    lunch: IMealSlot;
    dinner: IMealSlot;
  };
}

const costSchema = new Schema<ICost>(
  {
    date: { type: Date, required: true },
    wing: { type: String, enum: ['MALE', 'FEMALE'], required: true },
    mealBill: {
      breakfast: {
        totalCost: { type: Number, required: true, default: 0 },
        totalStudent: { type: Number, required: true, default: 0 },
      },
      lunch: {
        totalCost: { type: Number, required: true, default: 0 },
        totalStudent: { type: Number, required: true, default: 0 },
      },
      dinner: {
        totalCost: { type: Number, required: true, default: 0 },
        totalStudent: { type: Number, required: true, default: 0 },
      },
    },
  },
  {
    toJSON: { virtuals: true },
  }
);

/** Round to 4 decimal places — preserves precision for per-head costs used in further multiplication */
const r4 = (v: number): number => Math.round(v * 10000) / 10000;

costSchema.virtual('mealBill.breakfast.perHeadCost').get(function (this: ICost) {
  return this.mealBill.breakfast.totalStudent !== 0
    ? r4(this.mealBill.breakfast.totalCost / this.mealBill.breakfast.totalStudent)
    : 0;
});

costSchema.virtual('mealBill.lunch.perHeadCost').get(function (this: ICost) {
  return this.mealBill.lunch.totalStudent !== 0
    ? r4(this.mealBill.lunch.totalCost / this.mealBill.lunch.totalStudent)
    : 0;
});

costSchema.virtual('mealBill.dinner.perHeadCost').get(function (this: ICost) {
  return this.mealBill.dinner.totalStudent !== 0
    ? r4(this.mealBill.dinner.totalCost / this.mealBill.dinner.totalStudent)
    : 0;
});

costSchema.index({ date: 1, wing: 1 }, { unique: true });

const Cost = mongoose.model<ICost>('Cost', costSchema);

export default Cost;
