const cron = require("node-cron");
const Meal = require("../src/models/meal");
const { sendSMS } = require("../src/utils/sendSMS");

// Schedule the cron job to run daily at 10:00 PM (adjust as needed)
cron.schedule(
  "58 23 * * *",
  async () => {
    // Your cron job logic goes here
    console.log("Cron job executed: Generating meals for students.");

    try {
      // Get the current date
      const currentDate = new Date(); // 17

      currentDate.setDate(currentDate.getDate() + 1); // 18

      // Retrieve meals for the previous day
      const previousDayMeals = await Meal.find({
        date: currentDate.toISOString().split("T")[0],
      });

      // Calculate the next day
      currentDate.setDate(currentDate.getDate() + 1); //19

      // Format the next day as a string (e.g., "yyyy-mm-dd")
      const nextDay = currentDate.toISOString().split("T")[0];

      if (previousDayMeals.length > 0) {
        // Create new meals for the current day by copying data from previous day meals
        const newMeals = previousDayMeals.map((meal) => ({
          ...meal.toObject(),
          _id: undefined, // Exclude the _id field to create a new document
          date: nextDay, // Set the current date
        }));

        // Insert the new meals into the database
        await Meal.insertMany(newMeals);

        // I want to extract how many meals are on for breakfast, lunch and dinner
        const breakfastMeals = newMeals.filter(
          (meal) => meal.meal.breakfast === true
        );
        const lunchMeals = newMeals.filter((meal) => meal.meal.lunch === true);
        const dinnerMeals = newMeals.filter(
          (meal) => meal.meal.dinner === true
        );

        console.log("New meals created successfully!", nextDay);
        const result = await sendSMS(
          `Meals generated for ${nextDay}! \nTotal meals generated: ${newMeals.length} meals. \nBreakfast: ${breakfastMeals.length} \nLunch: ${lunchMeals.length} \nDinner: ${dinnerMeals.length} \n\n-Sohoz Meal App`,
          "01790732717"
        );
        console.log("SMS sent successfully!", result);
      } else {
        console.log("No meals found for the previous day.");
      }
    } catch (error) {
      console.error("Error generating meal:", error);
    }
  },
  { scheduled: true, timezone: "Asia/Dhaka" }
);

console.log("Cron job scheduled to run daily at 09:55 PM!");
