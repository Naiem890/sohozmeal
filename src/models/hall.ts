import mongoose, { Document, Schema } from 'mongoose';

export interface IHall extends Document {
  name: string;
}

const hallSchema = new Schema<IHall>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export const Hall = mongoose.model<IHall>('Hall', hallSchema);
