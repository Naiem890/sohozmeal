import { Router, Request, Response } from 'express';
import Meal from '../models/meal';
import Student from '../models/student';
import Routine from '../models/routine';
import MealConfig from '../models/mealConfig';
import { validateToken } from '../utils/validateToken';
import HallFeast from '../models/hallFeast';
import { checkAdminRole } from '../utils/checkAdminRole';

const router = Router();

const weekDays = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

function dhakaDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTomorrowDhaka(): string {
  const now = new Date();
  const dhakaToday = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  const dhakaTomorrow = new Date(dhakaToday);
  dhakaTomorrow.setDate(dhakaToday.getDate() + 1);
  return dhakaDateStr(dhakaTomorrow);
}

router.get('/routine', validateToken, async (req: Request, res: Response) => {
  const { wing } = req.query as { wing?: string };
  if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid or missing wing parameter' });
  }
  try {
    const routines = await Routine.find({ wing: wing.toUpperCase() });
    const sortedRoutines = weekDays.map(
      (day) => routines.find((routine) => routine.day === day) || { day, breakfast: '', lunch: '', dinner: '' }
    );
    res.json(sortedRoutines);
  } catch (err) {
    console.error('Error retrieving routines: ', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/routine/initialize', async (req: Request, res: Response) => {
  const { wing } = req.body;
  if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid or missing wing parameter' });
  }
  try {
    for (const day of weekDays) {
      const routine = new Routine({ day, breakfast: '-', lunch: '-', dinner: '-', wing: wing.toUpperCase() });
      await routine.save();
    }
    res.status(200).json({ message: `Routine initialized for ${wing} wing successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/routine', async (req: Request, res: Response) => {
  const { wing } = req.query as { wing?: string };
  if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid or missing wing parameter' });
  }
  try {
    const dataToUpdate = req.body;
    const queries = dataToUpdate.map(async (routineData: any) => {
      const { day, breakfast, lunch, dinner } = routineData;
      console.log(routineData, 'jjs');
      let routine = await Routine.findOne({ day: day.toUpperCase(), wing: wing.toUpperCase() });
      if (routine) {
        routine.breakfast = breakfast;
        routine.lunch = lunch;
        routine.dinner = dinner;
      } else {
        routine = new Routine({ day: day.toUpperCase(), breakfast, lunch, dinner, wing: wing.toUpperCase() });
      }
      return routine.save();
    });
    const results = await Promise.all(queries);
    res.status(200).json({ message: `Routine updated for ${wing} wing successfully`, routines: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/config', validateToken, async (req: Request, res: Response) => {
  const { wing } = req.query as { wing?: string };
  if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid or missing wing parameter' });
  }
  try {
    const config = await MealConfig.findOne({ wing: wing.toUpperCase() });
    if (!config) {
      return res.status(200).json({ wing: wing.toUpperCase(), cutoffHour: 22, cutoffMinute: 0 });
    }
    res.status(200).json(config);
  } catch (err) {
    console.error('Error fetching meal config:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/config', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  const { wing, cutoffHour, cutoffMinute } = req.body;
  if (!wing || !['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid or missing wing' });
  }
  if (cutoffHour === undefined || cutoffMinute === undefined) {
    return res.status(400).json({ error: 'cutoffHour and cutoffMinute are required' });
  }
  try {
    const config = await MealConfig.findOneAndUpdate(
      { wing: wing.toUpperCase() },
      { wing: wing.toUpperCase(), cutoffHour: Number(cutoffHour), cutoffMinute: Number(cutoffMinute) },
      { upsert: true, new: true }
    );

    try {
      const { rescheduleJob } = require('../../cron/mealGenerate');
      const allConfigs = await MealConfig.find({ wing: { $in: ['MALE', 'FEMALE'] } });
      let cronHour = 21,
        cronMinute = 55;
      if (allConfigs.length > 0) {
        let minTotal = Infinity;
        for (const cfg of allConfigs) {
          const total = cfg.cutoffHour * 60 + cfg.cutoffMinute;
          if (total < minTotal) minTotal = total;
        }
        const cronTotal = minTotal - 5;
        cronHour = Math.floor(Math.abs(cronTotal) / 60) % 24;
        cronMinute = ((cronTotal % 60) + 60) % 60;
      }
      rescheduleJob(cronHour, cronMinute);
    } catch (cronErr) {
      console.error('Error rescheduling cron after config update:', cronErr);
    }

    res.status(200).json({ message: 'Meal config updated', config });
  } catch (err) {
    console.error('Error updating meal config:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/plan', validateToken, async (req: Request, res: Response) => {
  const { studentId } = req.user;
  const { year, month } = req.query as { year?: string; month?: string };
  console.log(studentId, year, month, 'jjs');

  try {
    const filter: any = { studentId };
    if (year && month) {
      filter.date = { $regex: new RegExp(`^${year}-${month.padStart(2, '0')}-\\d{1,2}`) };
    }

    const meals = await Meal.aggregate([
      { $match: filter },
      { $addFields: { dateAsInt: { $dateFromString: { dateString: '$date', format: '%Y-%m-%d' } } } },
      { $sort: { dateAsInt: 1 } },
      { $project: { dateAsInt: 0 } },
    ]);

    res.status(200).json({ message: 'Meals retrieved successfully', meals });
  } catch (error) {
    console.error('Error getting meals:', error);
    res.status(500).json({ message: 'An error occurred while getting meals' });
  }
});

router.get('/months', validateToken, async (req: Request, res: Response) => {
  try {
    const { studentId } = req.user;
    const distinctMonthsResult = await Meal.aggregate([
      { $match: { studentId } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: { $dateFromString: { dateString: '$date' } } } } } },
      { $project: { _id: 0, month: '$_id' } },
      { $group: { _id: null, distinctMonths: { $addToSet: '$month' } } },
      { $project: { _id: 0, distinctMonths: 1 } },
      { $unwind: '$distinctMonths' },
      { $sort: { distinctMonths: 1 } },
      { $group: { _id: null, distinctMonths: { $push: '$distinctMonths' } } },
      { $project: { _id: 0, distinctMonths: 1 } },
    ]);

    if (distinctMonthsResult.length > 0) {
      res.json(distinctMonthsResult[0].distinctMonths);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching distinct months.' });
  }
});

router.put('/plan/:mealId', validateToken, async (req: Request, res: Response) => {
  const { studentId } = req.user;
  const { meal: newMeal } = req.body;
  const { mealId } = req.params;

  try {
    const mealToUpdate = await Meal.findOne({ _id: mealId, studentId });
    if (!mealToUpdate) return res.status(404).json({ message: 'Meal not found' });

    const mealDate = mealToUpdate.date;
    const mealType = Object.keys(newMeal)[0];

    const student = await Student.findOne({ studentId }, { gender: 1 });
    const wing = student?.gender || 'MALE';
    const config = await MealConfig.findOne({ wing });
    const cutoffHour = config?.cutoffHour ?? 22;
    const cutoffMinute = config?.cutoffMinute ?? 0;

    const now = new Date();
    const dhakaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    const currentHour = dhakaTime.getHours();
    const currentMinute = dhakaTime.getMinutes();
    const afterCutoff =
      currentHour > cutoffHour || (currentHour === cutoffHour && currentMinute >= cutoffMinute);
    const editableDate = new Date(dhakaTime);
    editableDate.setDate(dhakaTime.getDate() + (afterCutoff ? 2 : 1));
    const editableDateStr = `${editableDate.getFullYear()}-${String(editableDate.getMonth() + 1).padStart(2, '0')}-${String(editableDate.getDate()).padStart(2, '0')}`;

    if (mealDate !== editableDateStr) {
      const hh = String(cutoffHour).padStart(2, '0');
      const mm = String(cutoffMinute).padStart(2, '0');
      if (afterCutoff) {
        return res.status(403).json({ message: `Cutoff passed for ${wing} wing. Locked at ${hh}:${mm}.` });
      }
      return res.status(403).json({ message: "Can only edit tomorrow's meal" });
    }

    const hallFeastExists = await HallFeast.findOne({ date: mealDate, meal: mealType });
    if (hallFeastExists) {
      return res.status(403).json({
        message: `You cannot change the ${mealType} status because a hall feast is scheduled for ${mealDate}`,
      });
    }

    const updatedMeal = await Meal.findOneAndUpdate(
      { _id: mealId, studentId },
      { $set: { [`meal.${mealType}`]: newMeal[mealType] } },
      { new: true }
    );

    if (!updatedMeal) return res.status(404).json({ message: 'Meal not found' });

    res.status(200).json({
      message: `${mealType.toUpperCase()} is ${newMeal[mealType] ? 'on' : 'off'} for ${updatedMeal.date}!`,
      meal: updatedMeal,
    });
  } catch (error) {
    console.error('Error updating meal:', error);
    res.status(500).json({ message: 'An error occurred while updating meal' });
  }
});

router.post('/generate-meal', async (req: Request, res: Response) => {
  const { date } = req.body;
  const { studentId } = req.query as { studentId?: string };

  try {
    const currentDate = new Date(date);
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    const previousDateString = previousDate.toISOString().split('T')[0];

    const copyMealStatus = (previousMeal: any) => ({
      breakfast: previousMeal?.breakfast || false,
      lunch: previousMeal?.lunch || false,
      dinner: previousMeal?.dinner || false,
    });

    if (studentId) {
      const existingMeal = await Meal.findOne({ studentId, date });
      if (existingMeal) {
        return res.status(400).json({ error: 'Meal already generated for this student on the specified date' });
      }
      const previousMeal = await Meal.findOne({ studentId, date: previousDateString });
      const newMealStatus = copyMealStatus(previousMeal?.meal);
      const meal = new Meal({ studentId, date, meal: newMealStatus });
      const savedMeal = await meal.save();
      return res.status(201).json({ message: 'Meal generated successfully', meal: savedMeal });
    }

    const students = await Student.find({}, { studentId: 1 });
    if (students.length === 0) return res.status(404).json({ error: 'No students found' });

    const studentsIds = students.map((student) => student.studentId);

    const mealPromises = studentsIds.map(async (sId) => {
      const existingMeal = await Meal.findOne({ studentId: sId, date });
      if (existingMeal) return null;
      const previousMeal = await Meal.findOne({ studentId: sId, date: previousDateString });
      const newMealStatus = copyMealStatus(previousMeal?.meal);
      const meal = new Meal({ studentId: sId, date, meal: newMealStatus });
      return await meal.save();
    });

    const savedMeals = await Promise.all(mealPromises.filter((meal) => meal !== null));
    return res.status(201).json({ message: 'Meals generated successfully', meals: savedMeals });
  } catch (error) {
    console.error('Error generating meal:', error);
    return res.status(500).json({ error: 'An error occurred while generating meal' });
  }
});

router.delete('/plan', async (req: Request, res: Response) => {
  const date = req.body.date;
  try {
    const deletedMeal = await Meal.deleteMany({ date });
    if (!deletedMeal) return res.status(404).json({ message: 'Meal not found' });
    res.status(200).json({ message: 'Meal deleted successfully', meal: deletedMeal });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ message: 'An error occurred while deleting meal' });
  }
});

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

router.get('/students', async (req: Request, res: Response) => {
  const { date, wing, search, residence, page = 1, limit = 20 } = req.query as any;
  if (!date) return res.status(400).json({ error: 'Date parameter is required' });
  if (!wing) return res.status(400).json({ error: 'Wing parameter is required' });

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 20));

  try {
    const studentFilter: any = { gender: wing };
    if (residence) studentFilter.residence = residence;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      studentFilter.$or = [{ studentId: regex }, { hallId: regex }, { name: regex }];
    }

    const [total, paginatedStudents, allIds] = await Promise.all([
      Student.countDocuments(studentFilter),
      Student.find(studentFilter, { studentId: 1, hallId: 1, name: 1, gender: 1, residence: 1, roomNo: 1, batch: 1 })
        .sort({ roomNo: 1, studentId: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Student.find(studentFilter, { studentId: 1 })
        .lean()
        .then((docs) => docs.map((s) => s.studentId)),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    const countsAgg = await Meal.aggregate([
      { $match: { date, studentId: { $in: allIds } } },
      {
        $group: {
          _id: null,
          breakfast: { $sum: { $cond: ['$meal.breakfast', 1, 0] } },
          lunch: { $sum: { $cond: ['$meal.lunch', 1, 0] } },
          dinner: { $sum: { $cond: ['$meal.dinner', 1, 0] } },
        },
      },
    ]);
    const mealCounts = countsAgg[0]
      ? { breakfast: countsAgg[0].breakfast, lunch: countsAgg[0].lunch, dinner: countsAgg[0].dinner }
      : { breakfast: 0, lunch: 0, dinner: 0 };

    if (total === 0) {
      return res.status(200).json({
        students: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        mealCounts,
      });
    }

    const paginatedIds = paginatedStudents.map((s) => s.studentId);
    const meals = await Meal.find({ date, studentId: { $in: paginatedIds } }).lean();

    const mealMap = meals.reduce((acc: any, meal) => {
      acc[meal.studentId] = { ...meal.meal, guestMeal: meal.guestMeal };
      return acc;
    }, {});

    const studentMealData = paginatedStudents.map((student) => ({
      studentId: student.studentId,
      batch: student.batch,
      hallId: student.hallId,
      name: student.name,
      gender: student.gender,
      residence: student.residence,
      roomNo: student.roomNo,
      meal: mealMap[student.studentId]
        ? { breakfast: mealMap[student.studentId].breakfast, lunch: mealMap[student.studentId].lunch, dinner: mealMap[student.studentId].dinner }
        : { breakfast: false, lunch: false, dinner: false },
      guestMeal: mealMap[student.studentId]?.guestMeal || { breakfast: 0, lunch: 0, dinner: 0 },
    }));

    res.status(200).json({
      students: studentMealData,
      pagination: { page: pageNum, limit: limitNum, total, totalPages },
      mealCounts,
    });
  } catch (error) {
    console.error('Error retrieving students and meals: ', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/toggle', validateToken, checkAdminRole, async (req: Request, res: Response) => {
  const { studentId, date: queryDate, meal, wing } = req.query as any;
  if (!studentId || !queryDate || !meal || !wing) {
    return res.status(400).json({ error: 'Missing required parameters: studentId, date, meal, or wing' });
  }
  if (!['breakfast', 'lunch', 'dinner'].includes(meal)) {
    return res.status(400).json({ error: 'Invalid meal type. Must be one of: breakfast, lunch, dinner' });
  }
  if (!['MALE', 'FEMALE'].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid wing. Must be MALE or FEMALE' });
  }

  try {
    const startDate = new Date(queryDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(queryDate);
    endDate.setHours(23, 59, 59, 999);

    const mealToUpdate = await Meal.findOne({ studentId, date: formatDate(queryDate) });
    if (!mealToUpdate) {
      return res.status(404).json({ message: 'Meal not found for this student on the specified date' });
    }

    const hallFeastExists = await HallFeast.findOne({ date: { $gte: startDate, $lte: endDate }, meal });
    if (hallFeastExists) {
      return res.status(403).json({
        message: `You cannot change the ${meal} status because a hall feast is scheduled for ${queryDate}.`,
      });
    }

    const currentMealStatus = (mealToUpdate.meal as any)[meal];
    const newMealStatus = !currentMealStatus;
    (mealToUpdate.meal as any)[meal] = newMealStatus;
    await mealToUpdate.save();

    res.status(200).json({
      message: `The ${meal.toUpperCase()} for ${queryDate} has been successfully ${newMealStatus ? 'enabled' : 'disabled'} for the student.`,
      meal: mealToUpdate,
    });
  } catch (error) {
    console.error('Error toggling meal status:', error);
    res.status(500).json({ message: 'An error occurred while toggling the meal status' });
  }
});

router.put('/guest-meal', validateToken, async (req: Request, res: Response) => {
  try {
    let { date, guestMeal, studentId } = req.body;
    if (req.user.role === 'student') {
      studentId = req.user.studentId;
    }
    if (!date || !guestMeal || !studentId) {
      return res.status(400).json({ error: 'Missing required parameters: date or guestMeal or studentId' });
    }
    const { breakfast = 0, lunch = 0, dinner = 0 } = guestMeal;
    if (breakfast < 0 || lunch < 0 || dinner < 0) {
      return res.status(400).json({ message: 'Guest meal count cannot be negative' });
    }
    const mealToUpdate = await Meal.findOne({ date, studentId });
    if (!mealToUpdate) {
      return res.status(404).json({ message: 'Meal not found for this student on the specified date' });
    }
    mealToUpdate.guestMeal = {
      breakfast: breakfast > 0 ? breakfast : mealToUpdate.guestMeal.breakfast,
      lunch: lunch > 0 ? lunch : mealToUpdate.guestMeal.lunch,
      dinner: dinner > 0 ? dinner : mealToUpdate.guestMeal.dinner,
    };
    await mealToUpdate.save();
    return res.status(200).json({
      message: `Guest meal for ${date} has been successfully updated for ${studentId}.`,
      meal: mealToUpdate,
    });
  } catch (error) {
    console.error('Error updating guest meal:', error);
    return res.status(500).json({ message: 'An error occurred while updating guest meal' });
  }
});

export default router;
