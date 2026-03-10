import { Router, Request, Response } from 'express';
import Cost from '../models/cost';
import HallFeast from '../models/hallFeast';
import Meal from '../models/meal';
import Student from '../models/student';

const router = Router();

function formatDateToYYYYMMDD(date: Date | string): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function updateBillStudentsCount(
  date: Date | string,
  meal: string,
  wing: string,
  includeAllStudents = false
): Promise<void> {
  const dateWithoutTime = formatDateToYYYYMMDD(date);
  try {
    let bill = await Cost.findOne({ date: dateWithoutTime, wing });
    if (!bill) {
      bill = new Cost({ date: dateWithoutTime, mealBill: {}, wing } as any);
    }

    if (includeAllStudents) {
      const totalStudents = await Student.countDocuments({ gender: wing.toUpperCase() });
      (bill.mealBill as any)[meal].totalStudent = totalStudents;
    } else {
      const studentsWithMealOn = await Meal.aggregate([
        { $match: { date: dateWithoutTime, [`meal.${meal}`]: true } },
        { $lookup: { from: 'students', localField: 'studentId', foreignField: 'studentId', as: 'studentInfo' } },
        { $unwind: '$studentInfo' },
        { $match: { 'studentInfo.gender': wing.toUpperCase() } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]);
      const totalStudentsWithMeal = studentsWithMealOn.length > 0 ? studentsWithMealOn[0].count : 0;
      (bill.mealBill as any)[meal].totalStudent = totalStudentsWithMeal;
    }

    await bill.save();
  } catch (error) {
    console.error(`Error updating student count in the bill for ${meal} on ${dateWithoutTime}:`, error);
  }
}

router.post('/check', async (req: Request, res: Response) => {
  try {
    const { date, meal, wing } = req.body;
    if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or missing wing parameter' });
    }
    const hallFeast = await HallFeast.findOne({ date, meal, wing: wing.toUpperCase() });
    if (hallFeast) {
      return res.status(200).json({ status: 'on', message: `${meal} is on for ${wing} wing on ${date}` });
    } else {
      return res.status(200).json({ status: 'off', message: `${meal} is off for ${wing} wing on ${date}` });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const { date, meal, wing } = req.body;
  try {
    if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or missing wing parameter' });
    }
    const hallFeast = new HallFeast({ date, meal, wing: wing.toUpperCase() });
    await hallFeast.save();
    await updateBillStudentsCount(date, meal, wing.toUpperCase(), true);
    res.status(201).json(hallFeast);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const hallFeasts = await HallFeast.find();
    res.status(200).json(hallFeasts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const hallFeast = await HallFeast.findById(req.params.id);
    if (!hallFeast) return res.status(404).json({ error: 'HallFeast not found' });
    res.status(200).json(hallFeast);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const hallFeast = await HallFeast.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!hallFeast) return res.status(404).json({ error: 'HallFeast not found' });
    res.status(200).json(hallFeast);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const hallFeast = await HallFeast.findByIdAndDelete(req.params.id);
    if (!hallFeast) return res.status(404).json({ error: 'HallFeast not found' });
    await updateBillStudentsCount(hallFeast.date, hallFeast.meal, hallFeast.wing, false);
    res.status(200).json({ message: 'HallFeast deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/date/:date/wing/:wing', async (req: Request, res: Response) => {
  try {
    const date = req.params.date as string;
    const wing = req.params.wing as string;
    if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or missing wing parameter' });
    }
    const hallFeast = await HallFeast.find({ date, wing: wing.toUpperCase() });
    if (!hallFeast || hallFeast.length === 0) return res.status(200).json([]);
    res.status(200).json(hallFeast);
  } catch (error) {
    console.error('Error fetching HallFeast:', error);
    res.status(500).json({ error: 'An internal server error occurred' });
  }
});

router.delete('/date/:date/meal/:meal/wing/:wing', async (req: Request, res: Response) => {
  const date = req.params.date as string;
  const meal = req.params.meal as string;
  const wing = req.params.wing as string;
  try {
    if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or missing wing parameter' });
    }
    const deletedHallFeast = await HallFeast.findOneAndDelete({
      date: new Date(date),
      meal,
      wing: wing.toUpperCase(),
    });
    if (!deletedHallFeast) {
      return res.status(404).json({ error: 'No HallFeast found for this date, meal, and wing' });
    }
    await updateBillStudentsCount(date, meal, wing.toUpperCase(), false);
    res.status(200).json({ message: 'HallFeast deleted successfully', deletedHallFeast });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/month/:year/:month/wing/:wing', async (req: Request, res: Response) => {
  try {
    const year = req.params.year as string;
    const month = req.params.month as string;
    const wing = req.params.wing as string;
    if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or missing wing parameter' });
    }
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    const hallFeasts = await HallFeast.find({
      date: { $gte: startDate, $lt: endDate },
      wing: wing.toUpperCase(),
    });
    if (!hallFeasts || hallFeasts.length === 0) {
      return res.status(404).json({ error: `No HallFeasts found for ${month}/${year} and ${wing} wing` });
    }
    res.status(200).json(hallFeasts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
