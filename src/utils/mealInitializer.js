const Meal = require('../models/meal');

// Middleware function to create a meal for the next day asynchronously
const createMealForNextDay = async (req, res, next) => {
    try {
        // Extract studentId from request or wherever it is available
        const { studentId } = req.body;
        // Calculate the date for the next day
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextDay = tomorrow.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

        // Check if a meal already exists for the student and the next day
        const existingMeal = await Meal.findOne({ studentId, date: nextDay });

        // If no meal exists for the next day, create one
        if (!existingMeal) {
            const newMeal = new Meal({
                studentId,
                date: nextDay,
                meal: { breakfast: false, lunch: false, dinner: false } // Assuming default meals are not consumed
            });
            await newMeal.save();
            console.log(`Meal created for student ${studentId} for the next day: ${nextDay}`);
        }
        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.error('Error creating meal for the next day:', error);
        // You can handle the error as needed, such as sending an error response
        res.status(500).json({ error: 'An error occurred while creating meal for the next day' });
    }
};

module.exports = createMealForNextDay;
