import schedule from 'node-schedule';
import Meal from '../src/models/meal';
import { sendSMS } from '../src/utils/sendSMS';
import Student from '../src/models/student';
import contacts from '../src/config/contactPerson';

const phones = contacts.developer.map((dev) => dev.phone);

let currentJob: schedule.Job | null = null;

async function jobHandler(): Promise<void> {
  console.log('Cron job executed: Generating meals for students.');

  try {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    const studentIds = await Student.distinct('studentId');

    const previousDayMeals = await Meal.find({
      date: currentDate.toISOString().split('T')[0],
    });

    currentDate.setDate(currentDate.getDate() + 1);
    const nextDay = currentDate.toISOString().split('T')[0];

    const previousDayMealsMap: Record<string, any> = {};
    previousDayMeals.forEach((meal) => {
      previousDayMealsMap[meal.studentId] = meal;
    });

    const newMeals = studentIds.map((studentId) => {
      if (previousDayMealsMap[studentId]) {
        const { guestMeal, _id, ...previousMealWithoutGuest } = previousDayMealsMap[studentId].toObject();
        return { ...previousMealWithoutGuest, date: nextDay };
      } else {
        return { studentId, date: nextDay, meal: { breakfast: false, lunch: false, dinner: false } };
      }
    });

    await Meal.insertMany(newMeals);

    if (newMeals.length > 0) {
      const breakfastMeals = newMeals.filter((meal) => meal.meal.breakfast === true);
      const lunchMeals = newMeals.filter((meal) => meal.meal.lunch === true);
      const dinnerMeals = newMeals.filter((meal) => meal.meal.dinner === true);
      const result = await sendSMS(
        `Meals generated for ${nextDay}! \nTotal meals generated: ${newMeals.length} meals. \nBreakfast: ${breakfastMeals.length} \nLunch: ${lunchMeals.length} \nDinner: ${dinnerMeals.length} \n\n- Sohoz Meal App (Osmany Hall)`,
        phones
      );
      console.log('SMS sent successfully!', (result as any).data);
    } else {
      const result = sendSMS(`No meals found. \n\n-Sohoz Meal App`, '01790732717');
      console.log('SMS sent successfully!', (result as any).data);
    }
  } catch (error) {
    console.error('Error generating meal:', error);
  }
}

export function rescheduleJob(hour: number, minute: number): void {
  if (currentJob) {
    currentJob.cancel();
  }
  currentJob = schedule.scheduleJob({ hour, minute, tz: 'Asia/Dhaka' }, jobHandler);
  console.log(
    `Cron job scheduled to run daily at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} Asia/Dhaka`
  );
}

export async function initializeCronFromConfig(): Promise<void> {
  const MealConfig = require('../src/models/mealConfig').default;
  let cronHour = 21;
  let cronMinute = 55;

  try {
    const configs = await MealConfig.find({ wing: { $in: ['MALE', 'FEMALE'] } });
    if (configs.length > 0) {
      let minTotalMinutes = Infinity;
      for (const cfg of configs) {
        const total = cfg.cutoffHour * 60 + cfg.cutoffMinute;
        if (total < minTotalMinutes) minTotalMinutes = total;
      }
      const cronTotal = minTotalMinutes - 5;
      cronHour = Math.floor(Math.abs(cronTotal) / 60) % 24;
      cronMinute = ((cronTotal % 60) + 60) % 60;
    }
  } catch (err) {
    console.error('Error reading MealConfig for cron init, using default 21:55:', err);
  }

  rescheduleJob(cronHour, cronMinute);
}
