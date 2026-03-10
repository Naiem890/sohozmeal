import mongoose, { Document, Schema } from 'mongoose';

export interface IAlumni extends Document {
  studentId: string;
  phoneNumber?: string | null;
  hallId: string;
  name: string;
  department?: string;
  gender: 'MALE' | 'FEMALE';
  batch: number;
  graduationYear: number;
  email?: string;
  jobTitle?: string | null;
  companyName?: string | null;
  profileImage?: Buffer | null;
  roomNo?: string | null;
  residence?: 'OSMANY_HALL' | 'EXT_D' | 'NOT_SELECTED' | null;
  address?: string | null;
  linkedinProfile?: string | null;
  achievements?: string[];
  notes?: string | null;
}

const alumniSchema = new Schema<IAlumni>({
  studentId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, unique: true, default: null },
  hallId: { type: String, required: true },
  name: { type: String, required: true },
  department: {
    type: String,
    enum: ['CSE', 'EECE', 'CE', 'ME', 'NAME', 'BME', 'PME', 'IPE', 'AE', 'NSE', 'EWCE', 'ARCH'],
    set: (department: string) => department.toUpperCase(),
  },
  gender: {
    type: String,
    required: true,
    enum: ['MALE', 'FEMALE'],
    set: (gender: string) => gender.toUpperCase(),
  },
  batch: { type: Number, required: true },
  graduationYear: { type: Number, required: true },
  email: { type: String },
  jobTitle: { type: String, default: null },
  companyName: { type: String, default: null },
  profileImage: { type: Buffer, default: null },
  roomNo: { type: String, default: null },
  residence: {
    type: String,
    default: null,
    enum: ['OSMANY_HALL', 'EXT_D', 'NOT_SELECTED', null],
  },
  address: { type: String, default: null },
  linkedinProfile: { type: String, default: null },
  achievements: { type: [String], default: [] },
  notes: { type: String, default: null },
});

alumniSchema.index({ studentId: 1 }, { unique: true });

const Alumni = mongoose.model<IAlumni>('Alumni', alumniSchema);

export default Alumni;
