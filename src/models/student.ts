import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IStudent extends Document {
  studentId: string;
  phoneNumber?: string | null;
  hallId: string;
  name: string;
  password: string;
  department?: string;
  gender: 'MALE' | 'FEMALE';
  batch?: number;
  status: 'active' | 'inactive';
  firstTimeLogin: boolean;
  profileImage?: Buffer;
  roomNo?: string | null;
  residence?: 'OSMANY_HALL' | 'EXT_D' | 'NOT_SELECTED' | null;
  isTutorAvailable: boolean;
  preferredBackground?: string[];
  preferredArea?: string[];
  preferredSubject?: string[];
  bloodGroup?: string | null;
  isDonor: boolean;
  lastDonationDate?: Date | null;
}

const studentSchema = new Schema<IStudent>({
  studentId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, default: null },
  hallId: { type: String, required: true },
  name: { type: String, required: true },
  password: {
    type: String,
    select: false,
  },
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
  batch: { type: Number },
  status: { default: 'active', type: String, enum: ['active', 'inactive'] },
  firstTimeLogin: { type: Boolean, required: true, default: true },
  profileImage: { type: Buffer },
  roomNo: { type: String, default: null },
  residence: {
    type: String,
    default: null,
    enum: ['OSMANY_HALL', 'EXT_D', 'NOT_SELECTED', null],
  },
  isTutorAvailable: { type: Boolean, default: false },
  preferredBackground: {
    type: [String],
    default: [],
    enum: ['English Medium', 'English Version', 'Bengali Medium', 'Admission', 'Cadet', null],
  },
  preferredArea: {
    type: [String],
    default: [],
    enum: [
      'Adabor', 'Agargaon', 'Armanitola', 'Ashkona', 'Azimpur', 'Badda', 'Baily Road',
      'Bakshi Bazar', 'Banani', 'Banasree', 'Bangabhaban', 'Bangla Motor', 'Bangshal',
      'Baridhara', 'Bashabo', 'Bashundhara R/A', 'Begun Bari', 'Bijoynagar', 'Bimanbondor',
      'Cantonment', 'Chackbazar', 'College Gate', 'Darussalam', 'Daskhinkhan', 'Demra',
      'Dhaka University Area', 'Dhamrai', 'Dhanmondi', 'Dohar', 'English Road', 'Farmgate',
      'Fokirapul', 'Gabtoli', 'Gandaria', 'Gopibagh', 'Goran', 'Green Road', 'Gulistan',
      'Gulshan', 'Hatirjheel', 'Hazaribag', 'Ibrahimpur', 'Jatrabari', 'Jurain', 'Kadamtoli',
      'Kafrul', 'Kakrail', 'Kalabagan', 'kamalapur', 'Kamrangirchar', 'Kathal Bagan', 'Kawla',
      'Kawran Bazar', 'Kazipara', 'Keraniganj', 'Khilgaon', 'Khilkhet', 'Kollanpur', 'Kotwali',
      'Kuril', 'Lalbag', 'Malibagh', 'Manda', 'Maniknagar', 'Matikata', 'Mirpur', 'Mirpur 1',
      'Mirpur 10', 'Mirpur 11', 'Mirpur 12', 'Mirpur 13', 'Mirpur 14', 'Mirpur 2', 'Mirpur 3',
      'Mirpur DOHS', 'Mitford Road', 'Mogbazar', 'Mohakhali', 'Mohammadpur', 'Mollartek',
      'Motijheel', 'Mouchak', 'Mugda', 'Nawabganj', 'Naya Bazar', 'Naya Paltan',
      'New Eskaton Road', 'New Market', 'Niketon', 'Nikunja 1', 'Nikunja 2', 'Nobabgonj',
      'Norda', 'Notun Bazar', 'Pallabi', 'Paltan', 'Paribagh', 'Pilkhana', 'Pirerbag',
      'Postoghola', 'Puran Dhaka', 'Puran Paltan', 'Rajarbagh', 'Ramna', 'Rampura',
      'Rayer Bazar', 'Razarbagh', 'Sabujbagh', 'Sadarghat', 'Saidabad', 'Sankar', 'Savar',
      'Segunbagicha', 'Shahbag', 'Shahinbag', 'Shahjadpur', 'Shajahanpur', 'Shamoli',
      'Shantibag', 'Shantinagar', 'Sher-e-bangla Nagar', 'Shewrapara', 'Shyampur',
      'Sobahanbag', 'Sonirakra', 'Sukrabad', 'Sutrapur', 'Swamibagh', 'Tejgaon', 'Tikatuli',
      'Tongi', 'Turag', 'Uttara', 'Uttarkhan', 'Vasantek', 'Wari', 'West Rampura', 'Zigatola',
    ],
  },
  preferredSubject: {
    type: [String],
    default: [],
    enum: ['Math', 'Physics', 'Chemistry', 'Biology', 'ICT', 'Bangla', 'English', null],
  },
  bloodGroup: {
    type: String,
    default: null,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
  },
  isDonor: { type: Boolean, default: false },
  lastDonationDate: { type: Date, default: null },
});

studentSchema.pre('save', async function (next) {
  // For new documents without a password set, default to studentId
  if (this.isNew && !this.password) {
    this.password = await bcrypt.hash(this.studentId + '', 10);
    return next();
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

studentSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { phoneNumber: { $type: 'string' } },
  }
);

studentSchema.index({ hallId: 1, gender: 1 }, { unique: true });

const Student = mongoose.model<IStudent>('Student', studentSchema);

export default Student;
