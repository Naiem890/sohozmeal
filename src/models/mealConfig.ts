import mongoose, { Document, Schema } from 'mongoose';

export interface IMealConfig extends Document {
  wing: 'MALE' | 'FEMALE';
  cutoffHour: number;
  cutoffMinute: number;
}

const mealConfigSchema = new Schema<IMealConfig>({
  wing: {
    type: String,
    enum: ['MALE', 'FEMALE'],
    required: true,
    unique: true,
    set: (v: string) => v.toUpperCase(),
  },
  cutoffHour: { type: Number, min: 0, max: 23, default: 22 },
  cutoffMinute: { type: Number, min: 0, max: 59, default: 0 },
});

const MealConfig = mongoose.model<IMealConfig>('MealConfig', mealConfigSchema);

export default MealConfig;
