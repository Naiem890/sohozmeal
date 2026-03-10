import mongoose, { Document, Schema } from 'mongoose';

export interface IMeal extends Document {
  studentId: string;
  date: string;
  meal: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  guestMeal: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const mealSchema = new Schema<IMeal>(
  {
    studentId: { type: String, required: true },
    date: { type: String, required: true },
    meal: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
    },
    guestMeal: {
      breakfast: { type: Number, default: 0 },
      lunch: { type: Number, default: 0 },
      dinner: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

mealSchema.index({ studentId: 1, date: 1 }, { unique: true });

const Meal = mongoose.model<IMeal>('Meal', mealSchema);

export default Meal;
