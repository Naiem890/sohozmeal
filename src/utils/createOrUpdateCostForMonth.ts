import Cost from '../models/cost';
import { StockTransaction } from '../models/stock';
import HallFeast from '../models/hallFeast';
import Student from '../models/student';
import Meal from '../models/meal';

const r2 = (v: number): number => Math.round(v * 100) / 100;

function getUtcDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function generateDateRange(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let i = 1; i <= lastDay; i++) {
    dates.push(new Date(Date.UTC(year, month - 1, i)));
  }
  return dates;
}

export async function createOrUpdateCostForMonth(
  year: number | string,
  month: number | string,
  wing: string
): Promise<{ message: string }> {
  try {
    const datesInMonth = generateDateRange(Number(year), Number(month));

    const promises = datesInMonth.map(async (dateObj) => {
      const formattedDate = dateObj.toISOString().split('T')[0];
      const { start, end } = getUtcDayRange(dateObj);

      const students = await Student.find({ gender: wing }).lean();
      const studentIds = students.map((student) => student.studentId);

      const [
        hallFeasts,
        totalStudents,
        breakfastMealCount,
        lunchMealCount,
        dinnerMealCount,
        mealCosts,
        guestMealCounts,
      ] = await Promise.all([
        HallFeast.find({ date: { $gte: start, $lt: end }, wing }).lean(),
        Student.countDocuments({ gender: wing }),
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
          {
            $match: { date: formattedDate, studentId: { $in: studentIds } },
          },
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

      const breakfastCount = breakfastFeastExists ? totalStudents : totalBreakfastCount;
      const lunchCount = lunchFeastExists ? totalStudents : totalLunchCount;
      const dinnerCount = dinnerFeastExists ? totalStudents : totalDinnerCount;

      const breakfastCost = r2(mealCosts[0]?.breakfastCost || 0);
      const lunchCost = r2(mealCosts[0]?.lunchCost || 0);
      const dinnerCost = r2(mealCosts[0]?.dinnerCost || 0);

      await Cost.findOneAndUpdate(
        { date: { $gte: start, $lt: end }, wing },
        {
          $set: {
            date: start,
            mealBill: {
              breakfast: { totalCost: breakfastCost, totalStudent: breakfastCount },
              lunch: { totalCost: lunchCost, totalStudent: lunchCount },
              dinner: { totalCost: dinnerCost, totalStudent: dinnerCount },
            },
          },
        },
        { upsert: true }
      );
    });

    await Promise.all(promises);
    return { message: 'All bills for the month processed successfully' };
  } catch (error) {
    console.error('Error processing bills for the month:', error);
    throw new Error('Error processing bills for the month.');
  }
}
