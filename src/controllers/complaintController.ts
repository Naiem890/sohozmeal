import express, { Request, Response } from 'express';
import Complaint from '../models/complaint';
import { validateToken } from '../utils/validateToken';
import { checkAdminRole } from '../utils/checkAdminRole';

const router = express.Router();

// POST /api/complaints
router.post('/', validateToken, async (req: Request, res: Response) => {
  try {
    const { title, currentRoomNo, complaintType, description, residence, images } = req.body;
    const newComplaint = await Complaint.create({
      title,
      complainedBy: req.user.id,
      currentRoomNo,
      complaintType,
      description,
      residence,
      images,
    });
    res.status(201).json(newComplaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/complaints (paginated)
router.get('/', validateToken, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));

    const filter = { complainedBy: req.user.id };
    const [complaints, total] = await Promise.all([
      Complaint.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Complaint.countDocuments(filter),
    ]);

    res.status(200).json({
      complaints,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/complaints/:id
router.get('/:id', validateToken, async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, complainedBy: req.user.id });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/complaints/:id
router.patch('/:id', validateToken, async (req: Request, res: Response) => {
  try {
    const { title, currentRoomNo, complaintType, description, residence, images } = req.body;
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, complainedBy: req.user.id, status: 'PENDING' },
      { title, currentRoomNo, complaintType, description, residence, images },
      { new: true, runValidators: true }
    );
    if (!complaint) return res.status(404).json({ error: 'Complaint not found or cannot be edited' });
    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/complaints/:id
router.delete('/:id', validateToken, async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findOneAndDelete({
      _id: req.params.id,
      complainedBy: req.user.id,
      status: 'PENDING',
    });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found or cannot be deleted' });
    res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/complaints/:id/confirm
router.patch('/:id/confirm', validateToken, async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, complainedBy: req.user.id, status: 'COMPLETED' },
      { studentConfirmed: true },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ error: 'Complaint not found or cannot be confirmed' });
    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/admin/complaints
router.get('/', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 }).populate('complainedBy', 'name email');
    res.status(200).json(complaints);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/admin/complaints/:id
router.get('/:id', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('complainedBy', 'name email');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/admin/complaints/:id
router.patch('/:id', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const { adminMessage, status, adminConfirmed } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { adminMessage, status, adminConfirmed },
      { new: true, runValidators: true }
    );
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/admin/complaints/:id/complete
router.patch('/:id/complete', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: 'COMPLETED', completedAt: new Date() },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ error: 'Complaint not found or cannot be completed' });
    res.status(200).json(complaint);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/admin/complaints/:id
router.delete('/:id', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
