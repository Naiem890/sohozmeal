import Cost, { ICost } from '../models/cost';
import { StockTransaction } from '../models/stock';
import HallFeast from '../models/hallFeast';
import Student from '../models/student';
import Meal from '../models/meal';

const r2 = (v: number): number => Math.round(v * 100) / 100;

export async function createOrUpdateBill(date: string | Date, wing: string): Promise<ICost> {
  try {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().split('T')[0];

    const hallFeasts = await HallFeast.find({ date: formattedDate });

    const breakfastFeastExists = hallFeasts.some((feast) => feast.meal === 'breakfast');
    const lunchFeastExists = hallFeasts.some((feast) => feast.meal === 'lunch');
    const dinnerFeastExists = hallFeasts.some((feast) => feast.meal === 'dinner');

    let breakfastCount: number, lunchCount: number, dinnerCount: number;
    const totalStudents = await Student.countDocuments({ wing });

    if (breakfastFeastExists) {
      breakfastCount = totalStudents;
    } else {
      breakfastCount = await Meal.countDocuments({ 'meal.breakfast': true, date: formattedDate, wing });
    }

    if (lunchFeastExists) {
      lunchCount = totalStudents;
    } else {
      lunchCount = await Meal.countDocuments({ 'meal.lunch': true, date: formattedDate, wing });
    }

    if (dinnerFeastExists) {
      dinnerCount = totalStudents;
    } else {
      dinnerCount = await Meal.countDocuments({ 'meal.dinner': true, date: formattedDate, wing });
    }

    const mealCosts = await StockTransaction.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(formattedDate),
            $lt: new Date(new Date(formattedDate).setDate(new Date(formattedDate).getDate() + 1)),
          },
          wing,
        },
      },
      {
        $group: {
          _id: null,
          breakfastCost: { $sum: { $cond: [{ $eq: ['$meal', 'BREAKFAST'] }, '$transactionAmount', 0] } },
          lunchCost: { $sum: { $cond: [{ $eq: ['$meal', 'LUNCH'] }, '$transactionAmount', 0] } },
          dinnerCost: { $sum: { $cond: [{ $eq: ['$meal', 'DINNER'] }, '$transactionAmount', 0] } },
        },
      },
    ]);

    const breakfastCost = r2(mealCosts[0]?.breakfastCost || 0);
    const lunchCost = r2(mealCosts[0]?.lunchCost || 0);
    const dinnerCost = r2(mealCosts[0]?.dinnerCost || 0);

    let bill = await Cost.findOne({ date: formattedDate, wing });

    if (!bill) {
      bill = new Cost({
        date: dateObj,
        wing,
        mealBill: {
          breakfast: { totalCost: breakfastCost, totalStudent: breakfastCount },
          lunch: { totalCost: lunchCost, totalStudent: lunchCount },
          dinner: { totalCost: dinnerCost, totalStudent: dinnerCount },
        },
      });
    } else {
      bill.mealBill = {
        breakfast: { totalCost: breakfastCost, totalStudent: breakfastCount },
        lunch: { totalCost: lunchCost, totalStudent: lunchCount },
        dinner: { totalCost: dinnerCost, totalStudent: dinnerCount },
      };
    }

    await bill.save();
    return bill;
  } catch (error) {
    console.error('Error during bill creation or update:', error);
    throw new Error('Error creating or updating the bill.');
  }
}
