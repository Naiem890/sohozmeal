import mongoose, { Document, Schema } from 'mongoose';

export interface IHall extends Document {
  name: string;
  wing: 'MALE' | 'FEMALE';
}

const hallSchema = new Schema<IHall>(
  {
    name: { type: String, required: true, trim: true },
    wing: { type: String, required: true, enum: ['MALE', 'FEMALE'], set: (v: string) => v.toUpperCase() },
  },
  { timestamps: true }
);

// name must be unique per wing, but can repeat across wings
hallSchema.index({ name: 1, wing: 1 }, { unique: true });

export const Hall = mongoose.model<IHall>('Hall', hallSchema);
