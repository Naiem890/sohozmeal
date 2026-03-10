import mongoose, { Document, Schema } from 'mongoose';

export interface INotice extends Document {
  title: string;
  description: string;
  noticeFor: 'MALE' | 'FEMALE' | 'ALL';
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    noticeFor: { type: String, required: true, enum: ['MALE', 'FEMALE', 'ALL'] },
  },
  { timestamps: true }
);

const Notice = mongoose.model<INotice>('Notice', noticeSchema);

export default Notice;
