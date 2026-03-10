import mongoose, { Document, Schema } from 'mongoose';

export interface IHallFeast extends Document {
  date: Date;
  meal: 'breakfast' | 'lunch' | 'dinner';
  wing: 'MALE' | 'FEMALE';
}

const hallFeastSchema = new Schema<IHallFeast>({
  date: { type: Date, required: true },
  meal: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
  wing: { type: String, enum: ['MALE', 'FEMALE'], required: true },
});

hallFeastSchema.pre('save', async function (next) {
  const feast = this as IHallFeast;
  try {
    const existingFeast = await mongoose.model('HallFeast').findOne({
      date: feast.date,
      wing: feast.wing,
    });
    if (existingFeast) {
      const error = new Error(
        `A feast already exists for the ${feast.wing} wing on ${feast.date.toDateString()}. Only one meal feast can happen per day.`
      );
      return next(error);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

const HallFeast = mongoose.model<IHallFeast>('HallFeast', hallFeastSchema);

export default HallFeast;
