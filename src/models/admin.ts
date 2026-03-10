import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IAdmin extends Document {
  email: string;
  password: string;
  wing: 'MALE' | 'FEMALE' | 'ALL';
}

const adminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  wing: {
    type: String,
    enum: ['MALE', 'FEMALE', 'ALL'],
    required: true,
  },
});

adminSchema.pre('save', async function (next) {
  const admin = this as IAdmin;
  if (!admin.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin.password, salt);
    admin.password = hashedPassword;
    next();
  } catch (error: any) {
    next(error);
  }
});

adminSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  if (update.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
    } catch (error: any) {
      return next(error);
    }
  }
  next();
});

const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

export default Admin;
