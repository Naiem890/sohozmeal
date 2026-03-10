import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComplaint extends Document {
  title: string;
  complainedBy: Types.ObjectId;
  currentRoomNo: string;
  complaintType: 'MESS' | 'WIFI' | 'CLEANING' | 'REPAIR' | 'OTHER';
  description: string;
  status: 'PENDING' | 'COMPLETED';
  adminConfirmed: boolean;
  adminMessage?: string;
  studentConfirmed: boolean;
  residence: 'OSMANY_HALL' | 'EXT_D' | 'FEMALE_WING';
  images?: { url: string }[];
  createdAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    complainedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'ComplainedBy field is required'],
    },
    currentRoomNo: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
      maxlength: [10, 'Room number cannot exceed 10 characters'],
    },
    complaintType: {
      type: String,
      required: [true, 'Complaint type is required'],
      enum: {
        values: ['MESS', 'WIFI', 'CLEANING', 'REPAIR', 'OTHER'],
        message: 'Complaint type must be MESS, WIFI, CLEANING, REPAIR, or OTHER',
      },
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'COMPLETED'],
        message: 'Status must be PENDING or COMPLETED',
      },
      default: 'PENDING',
    },
    adminConfirmed: { type: Boolean, default: false },
    adminMessage: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin message cannot exceed 500 characters'],
    },
    studentConfirmed: { type: Boolean, default: false },
    residence: {
      type: String,
      required: [true, 'Residence is required'],
      enum: {
        values: ['OSMANY_HALL', 'EXT_D', 'FEMALE_WING'],
        message: 'Residence must be OSMANY_HALL, EXT_D, or FEMALE_WING',
      },
    },
    images: {
      type: [
        {
          url: {
            type: String,
            required: [true, 'Image URL is required'],
            match: [
              /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/,
              'Image URL must be a valid URL ending with .jpg, .jpeg, .png, .webp, or .gif',
            ],
          },
        },
      ],
      validate: [
        {
          validator: function (value: any[]) {
            return value.length <= 4;
          },
          message: 'A maximum of 4 images is allowed',
        },
      ],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);

export default Complaint;
