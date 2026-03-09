const schedule = require("node-schedule");
const Meal = require("../src/models/meal");
const { sendSMS } = require("../src/utils/sendSMS");
const Student = require("../src/models/student");
const contacts = require("../src/config/contactPerson");
const phones = contacts.developer.map((dev) => dev.phone);

let currentJob = null;

async function jobHandler() {
  console.log("Cron job executed: Generating meals for students.");

  try {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    const studentIds = await Student.distinct("studentId");

    // Retrieve meals for the previous day
    const previousDayMeals = await Meal.find({
      date: currentDate.toISOString().split("T")[0],
    });

    // Calculate the next day
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDay = currentDate.toISOString().split("T")[0];

    // Create a map to check if a meal already exists for a student on the previous day
    const previousDayMealsMap = {};
    previousDayMeals.forEach((meal) => {
      previousDayMealsMap[meal.studentId] = meal;
    });

    // Create new meals for the next day
    const newMeals = studentIds.map((studentId) => {
      if (previousDayMealsMap[studentId]) {
        const { guestMeal, _id, ...previousMealWithoutGuest } = previousDayMealsMap[studentId].toObject();
        return { ...previousMealWithoutGuest, date: nextDay };
      } else {
        return {
          studentId,
          date: nextDay,
          meal: { breakfast: false, lunch: false, dinner: false },
        };
      }
    });

    // Insert the new meals into the database
    await Meal.insertMany(newMeals);
    if (newMeals.length > 0) {
      const breakfastMeals = newMeals.filter((meal) => meal.meal.breakfast === true);
      const lunchMeals = newMeals.filter((meal) => meal.meal.lunch === true);
      const dinnerMeals = newMeals.filter((meal) => meal.meal.dinner === true);
      const result = await sendSMS(
        `Meals generated for ${nextDay}! \nTotal meals generated: ${newMeals.length} meals. \nBreakfast: ${breakfastMeals.length} \nLunch: ${lunchMeals.length} \nDinner: ${dinnerMeals.length} \n\n- Sohoz Meal App (Osmany Hall)`,
        phones
      );
      console.log("SMS sent successfully!", result.data);
    } else {
      const result = sendSMS(`No meals found. \n\n-Sohoz Meal App`, "01790732717");
      console.log("SMS sent successfully!", result.data);
    }
  } catch (error) {
    console.error("Error generating meal:", error);
  }
}

/**
 * Cancel the existing cron job and schedule a new one at the given time (Asia/Dhaka).
 */
function rescheduleJob(hour, minute) {
  if (currentJob) {
    currentJob.cancel();
  }
  currentJob = schedule.scheduleJob({ hour, minute, tz: "Asia/Dhaka" }, jobHandler);
  console.log(
    `Cron job scheduled to run daily at ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} Asia/Dhaka`
  );
}

/**
 * Read MealConfig from DB and schedule the cron 5 minutes before the earliest cutoff.
 * Falls back to 21:55 if no config exists.
 */
async function initializeCronFromConfig() {
  const MealConfig = require("../src/models/mealConfig");
  let cronHour = 21;
  let cronMinute = 55;

  try {
    const configs = await MealConfig.find({ wing: { $in: ["MALE", "FEMALE"] } });
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
    console.error("Error reading MealConfig for cron init, using default 21:55:", err);
  }

  rescheduleJob(cronHour, cronMinute);
}

module.exports = { rescheduleJob, initializeCronFromConfig };
