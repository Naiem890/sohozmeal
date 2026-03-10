import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';

export type StaffRole = 'MESS' | 'WIFI' | 'CLEANING' | 'REPAIR';

export interface IStaff extends Document {
  staffId: string;
  name: string;
  phoneNumber: string;
  role: StaffRole;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const staffSchema = new Schema<IStaff>({
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  role: {
    type: String,
    required: true,
    enum: ['MESS', 'WIFI', 'CLEANING', 'REPAIR'],
  },
  password: { type: String, required: true },
});

staffSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

staffSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Staff = mongoose.model<IStaff>('Staff', staffSchema);

export default Staff;
