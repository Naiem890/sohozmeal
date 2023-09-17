const cron = require("node-cron");
const generateMeals = require("./generateMeal");

// Schedule the cron job to run daily at 10:00 PM (adjust as needed)
cron.schedule("* 22 * * *", generateMeals);

console.log("Cron job scheduled to run daily at 10:00 PM.");
