import { Request, Response, NextFunction } from 'express';
import Meal from '../models/meal';

const createMealForNextDay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId } = req.body;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextDay = tomorrow.toISOString().split('T')[0];

    const existingMeal = await Meal.findOne({ studentId, date: nextDay });

    if (!existingMeal) {
      const newMeal = new Meal({
        studentId,
        date: nextDay,
        meal: { breakfast: false, lunch: false, dinner: false },
      });
      await newMeal.save();
      console.log(`Meal created for student ${studentId} for the next day: ${nextDay}`);
    }
    next();
  } catch (error) {
    console.error('Error creating meal for the next day:', error);
    res.status(500).json({ error: 'An error occurred while creating meal for the next day' });
  }
};

export default createMealForNextDay;
