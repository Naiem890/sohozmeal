const cron = require("node-cron");
const Meal = require("../src/models/meal");

// Schedule the cron job to run daily at 10:00 PM (adjust as needed)
cron.schedule(
  "10 22 * * *",
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

        console.log("New meals created successfully!", nextDay);
      } else {
        console.log("No meals found for the previous day.");
      }
    } catch (error) {
      console.error("Error generating meal:");
    }
  },
  { scheduled: true, timezone: "Asia/Dhaka" }
);

console.log("Cron job scheduled to run daily at 10:00 PM.");
