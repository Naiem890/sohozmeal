import mongoose, { Document, Schema } from 'mongoose';

export type WeekDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface IRoutine extends Document {
  day: WeekDay;
  wing: 'MALE' | 'FEMALE';
  breakfast: string;
  lunch: string;
  dinner: string;
}

const routineSchema = new Schema<IRoutine>({
  day: {
    type: String,
    required: true,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    set: (day: string) => day.toUpperCase(),
  },
  wing: {
    type: String,
    required: true,
    enum: ['MALE', 'FEMALE'],
    set: (wing: string) => wing.toUpperCase(),
  },
  breakfast: { type: String, default: '' },
  lunch: { type: String, default: '' },
  dinner: { type: String, default: '' },
});

routineSchema.index({ day: 1, wing: 1 }, { unique: true });

const Routine = mongoose.model<IRoutine>('Routine', routineSchema);

export default Routine;
