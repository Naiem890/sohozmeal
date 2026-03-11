import { Router, Request, Response } from 'express';
import { Hall } from '../models/hall';
import { validateToken } from '../utils/validateToken';
import { checkAdminRole } from '../utils/checkAdminRole';

const router = Router();

// GET /api/hall — public (students and admins both need the list)
router.get('/', validateToken, async (_req: Request, res: Response) => {
  try {
    const halls = await Hall.find().sort({ name: 1 }).lean();
    res.json(halls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch halls' });
  }
});

// POST /api/hall — admin only
router.post('/', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Hall name is required' });
    }
    const hall = await Hall.create({ name: String(name).trim() });
    res.status(201).json(hall);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A hall with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create hall' });
  }
});

// DELETE /api/hall/:id — admin only
router.delete('/:id', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const hall = await Hall.findByIdAndDelete(req.params.id as string);
    if (!hall) return res.status(404).json({ error: 'Hall not found' });
    res.json({ message: `Hall "${hall.name}" deleted` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hall' });
  }
});

export default router;
