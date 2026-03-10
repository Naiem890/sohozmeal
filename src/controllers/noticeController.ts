import { Router, Request, Response } from 'express';
import { validateToken } from '../utils/validateToken';
import { checkAdminRole } from '../utils/checkAdminRole';
import Notice from '../models/notice';

const router = Router();

function canAdminWriteNotice(adminWing: string, noticeFor: string): boolean {
  if (adminWing === 'ALL') return true;
  return adminWing === noticeFor;
}

router.get('/', validateToken, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));

    const [notices, total] = await Promise.all([
      Notice.find({}).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Notice.countDocuments({}),
    ]);

    res.status(200).json({
      notices,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: 'An error occurred while fetching notices' });
  }
});

router.get('/:noticeFor', validateToken, async (req: Request, res: Response) => {
  try {
    const { noticeFor } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));

    const filter =
      noticeFor === 'ALL'
        ? { noticeFor: { $in: ['MALE', 'FEMALE', 'ALL'] } }
        : { noticeFor: { $in: [noticeFor, 'ALL'] } };

    const [notices, total] = await Promise.all([
      Notice.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Notice.countDocuments(filter),
    ]);

    res.status(200).json({
      notices,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: 'An error occurred while fetching notices' });
  }
});

router.post('/', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  const { title, description, noticeFor } = req.body;
  const adminWing = req.user.wing as string;

  if (!canAdminWriteNotice(adminWing, noticeFor)) {
    return res.status(403).json({ message: 'You can only post notices for your own wing' });
  }

  try {
    const newNotice = new Notice({ title, description, noticeFor });
    await newNotice.save();
    res.status(201).json({ message: 'Notice created successfully', notice: newNotice });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ message: 'An error occurred while creating the notice' });
  }
});

router.put('/:id', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, noticeFor } = req.body;
  const adminWing = req.user.wing as string;

  try {
    const existing = await Notice.findById(id);
    if (!existing) return res.status(404).json({ message: 'Notice not found' });

    if (!canAdminWriteNotice(adminWing, existing.noticeFor)) {
      return res.status(403).json({ message: 'You do not have permission to edit this notice' });
    }
    if (noticeFor && !canAdminWriteNotice(adminWing, noticeFor)) {
      return res.status(403).json({ message: 'You can only assign notices to your own wing' });
    }

    const updatedNotice = await Notice.findByIdAndUpdate(id, { title, description, noticeFor }, { new: true });
    res.status(200).json({ message: 'Notice updated successfully', notice: updatedNotice });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ message: 'An error occurred while updating the notice' });
  }
});

router.delete('/:id', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminWing = req.user.wing as string;

  try {
    const existing = await Notice.findById(id);
    if (!existing) return res.status(404).json({ message: 'Notice not found' });

    if (!canAdminWriteNotice(adminWing, existing.noticeFor)) {
      return res.status(403).json({ message: 'You do not have permission to delete this notice' });
    }

    await Notice.findByIdAndDelete(id);
    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: 'An error occurred while deleting the notice' });
  }
});

export default router;
