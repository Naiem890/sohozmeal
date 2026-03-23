import Cost, { ICost } from '../models/cost';
import { StockTransaction } from '../models/stock';
import HallFeast from '../models/hallFeast';
import Student from '../models/student';
import Meal from '../models/meal';

const r2 = (v: number): number => Math.round(v * 100) / 100;

function getUtcDayRange(date: string | Date): { start: Date; end: Date } {
  const d = new Date(date);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function createOrUpdateBill(date: string | Date, wing: string): Promise<ICost> {
  try {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().split('T')[0];
    const { start, end } = getUtcDayRange(dateObj);

    const students = await Student.find({ gender: wing }, { studentId: 1 }).lean();
    const studentIds = students.map((s) => s.studentId);
    const totalStudents = studentIds.length;

    const [
      hallFeasts,
      breakfastMealCount,
      lunchMealCount,
      dinnerMealCount,
      mealCosts,
      guestMealCounts,
    ] = await Promise.all([
      HallFeast.find({ date: { $gte: start, $lt: end }, wing }),
      Meal.countDocuments({ 'meal.breakfast': true, date: formattedDate, studentId: { $in: studentIds } }),
      Meal.countDocuments({ 'meal.lunch': true, date: formattedDate, studentId: { $in: studentIds } }),
      Meal.countDocuments({ 'meal.dinner': true, date: formattedDate, studentId: { $in: studentIds } }),
      StockTransaction.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(formattedDate),
              $lt: new Date(new Date(formattedDate).setDate(new Date(formattedDate).getDate() + 1)),
            },
            wing,
            type: 'OUT',
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
      ]),
      Meal.aggregate([
        { $match: { date: formattedDate, studentId: { $in: studentIds } } },
        {
          $group: {
            _id: null,
            breakfast: { $sum: '$guestMeal.breakfast' },
            lunch: { $sum: '$guestMeal.lunch' },
            dinner: { $sum: '$guestMeal.dinner' },
          },
        },
      ]),
    ]);

    const guestBreakfast = guestMealCounts[0]?.breakfast || 0;
    const guestLunch = guestMealCounts[0]?.lunch || 0;
    const guestDinner = guestMealCounts[0]?.dinner || 0;

    const totalBreakfastCount = breakfastMealCount + guestBreakfast;
    const totalLunchCount = lunchMealCount + guestLunch;
    const totalDinnerCount = dinnerMealCount + guestDinner;

    const breakfastFeastExists = hallFeasts.some((feast) => feast.meal === 'breakfast');
    const lunchFeastExists = hallFeasts.some((feast) => feast.meal === 'lunch');
    const dinnerFeastExists = hallFeasts.some((feast) => feast.meal === 'dinner');

    const breakfastCount = breakfastFeastExists ? totalStudents + guestBreakfast : totalBreakfastCount;
    const lunchCount = lunchFeastExists ? totalStudents + guestLunch : totalLunchCount;
    const dinnerCount = dinnerFeastExists ? totalStudents + guestDinner : totalDinnerCount;

    const breakfastCost = r2(mealCosts[0]?.breakfastCost || 0);
    const lunchCost = r2(mealCosts[0]?.lunchCost || 0);
    const dinnerCost = r2(mealCosts[0]?.dinnerCost || 0);

    const mealBill = {
      breakfast: { totalCost: breakfastCost, totalStudent: breakfastCount },
      lunch: { totalCost: lunchCost, totalStudent: lunchCount },
      dinner: { totalCost: dinnerCost, totalStudent: dinnerCount },
    };

    const normalizedDate = start;
    const bill = await Cost.findOneAndUpdate(
      { date: { $gte: start, $lt: end }, wing },
      { $set: { mealBill }, $setOnInsert: { date: normalizedDate, wing } },
      { upsert: true, new: true }
    );

    return bill;
  } catch (error) {
    console.error('Error during bill creation or update:', error);
    throw new Error('Error creating or updating the bill.');
  }
}
