const schedule = require("node-schedule");
const Meal = require("../src/models/meal");
const { sendSMS } = require("../src/utils/sendSMS");
const Student = require("../src/models/student");
import contactPersonData from "../src/config/contactPerson.json";

// Schedule the cron job to run daily at 09:55 PM
// const generateMealsForStudents = async () => { //for Testing
schedule.scheduleJob({ hour: 21, minute: 55, tz: "Asia/Dhaka" }, async () => {
  //comment for testing
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
        // If a meal already exists for the student on the previous day, create a new meal based on it
        const previousMeal = previousDayMealsMap[studentId];
        return {
          ...previousMeal.toObject(),
          _id: undefined,
          date: nextDay,
        };
      } else {
        // If no meal exists for the student on the previous day, create an empty meal
        return {
          studentId: studentId,
          date: nextDay,
          meal: {
            breakfast: false,
            lunch: false,
            dinner: false,
          },
        };
      }
    });
    // Insert the new meals into the database
    await Meal.insertMany(newMeals);
    if (newMeals.length > 0) {
      // I want to extract how many meals are on for breakfast, lunch and dinner
      const breakfastMeals = newMeals.filter(
        (meal) => meal.meal.breakfast === true
      );
      const lunchMeals = newMeals.filter((meal) => meal.meal.lunch === true);
      const dinnerMeals = newMeals.filter((meal) => meal.meal.dinner === true);
      const result = await sendSMS(
        `Meals generated for ${nextDay}! \nTotal meals generated: ${newMeals.length} meals. \nBreakfast: ${breakfastMeals.length} \nLunch: ${lunchMeals.length} \nDinner: ${dinnerMeals.length} \n\n- Sohoz Meal App (Osmany Hall)`,
        [...contactPersonData.developer]
      );
      console.log("SMS sent successfully!", result.data);
    } else {
      const result = sendSMS(
        `No meals found. \n\n-Sohoz Meal App`,
        "01790732717"
      );
      console.log("SMS sent successfully!", result.data);
    }
  } catch (error) {
    console.error("Error generating meal:", error);
  }
}); //comment this while testing
// }; //for Testing
// generateMealsForStudents(); //for Testing

console.log("Cron job scheduled to run daily at 09:55 PM!");
