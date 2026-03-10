import express, { Request, Response } from 'express';
import Staff from '../models/staff';
import Complaint from '../models/complaint';
import { validateToken } from '../utils/validateToken';
import { checkAdminRole } from '../utils/checkAdminRole';

const router = express.Router();

router.get('/staff', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const staffMembers = await Staff.find();
    res.status(200).json(staffMembers);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching staff members' });
  }
});

router.get('/staff/:id', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const staffMember = await Staff.findById(req.params.id);
    if (!staffMember) return res.status(404).json({ error: 'Staff member not found' });
    res.status(200).json(staffMember);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching staff member' });
  }
});

router.put('/staff/:id', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const { name, phoneNumber, role } = req.body;
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name, phoneNumber, role },
      { new: true }
    );
    if (!updatedStaff) return res.status(404).json({ error: 'Staff member not found' });
    res.status(200).json(updatedStaff);
  } catch (error: any) {
    res.status(400).json({ error: 'Error updating staff member' });
  }
});

router.delete('/staff/:id', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
    if (!deletedStaff) return res.status(404).json({ error: 'Staff member not found' });
    res.status(200).json({ message: 'Staff member deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error deleting staff member' });
  }
});

router.get('/staff/:id/complaints', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const staffMember = await Staff.findById(req.params.id);
    if (!staffMember) return res.status(404).json({ error: 'Staff member not found' });
    const complaints = await Complaint.find({ assignedTo: req.params.id } as any);
    res.status(200).json(complaints);
  } catch (error: any) {
    res.status(500).json({ error: 'Error fetching assigned complaints' });
  }
});

export default router;
