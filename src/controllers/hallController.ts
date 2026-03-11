import { Router, Request, Response } from 'express';
import { Hall } from '../models/hall';
import { validateToken } from '../utils/validateToken';
import { checkAdminRole } from '../utils/checkAdminRole';

const router = Router();

// GET /api/hall?wing=MALE|FEMALE  — returns all or wing-filtered halls
router.get('/', validateToken, async (req: Request, res: Response) => {
  try {
    const { wing } = req.query as { wing?: string };
    const filter: any = {};
    if (wing && ['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
      filter.wing = wing.toUpperCase();
    }
    const halls = await Hall.find(filter).sort({ name: 1 }).lean();
    res.json(halls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch halls' });
  }
});

// POST /api/hall — admin only, requires name + wing
router.post('/', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  try {
    const { name, wing } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Hall name is required' });
    }
    if (!wing || !['MALE', 'FEMALE'].includes(String(wing).toUpperCase())) {
      return res.status(400).json({ error: 'Wing must be MALE or FEMALE' });
    }
    const hall = await Hall.create({ name: String(name).trim(), wing: String(wing).toUpperCase() });
    res.status(201).json(hall);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A hall with this name already exists for this wing' });
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
