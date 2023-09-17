const router = require("express").Router();
const Meal = require("../models/meal");
const Student = require("../models/student");
const { validateToken } = require("../utils/validateToken");

router.post("/generate-meal", async (req, res) => {
  try {
    // Fetch all students' studentId
    const students = await Student.find({}, { studentId: 1 });

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    const studentsIds = students.map((student) => student.studentId);

    // Get the current date
    const currentDate = new Date();

    // Calculate the next day
    currentDate.setDate(currentDate.getDate() + 1);

    // Format the next day as a string (e.g., "yyyy-mm-dd")
    const nextDay = currentDate.toISOString().split("T")[0];

    // Create a meal for each student
    const mealPromises = studentsIds.map(async (studentId) => {
      const meal = new Meal({
        studentId,
        date: nextDay,
      });
      return await meal.save();
    });

    // Wait for all meal creation promises to resolve
    const savedMeals = await Promise.all(mealPromises);

    res.json({ message: "Meal generated successfully", savedMeals });
  } catch (error) {
    console.error("Error generating meal:", error);
    res
      .status(500)
      .json({ message: "An error occurred while generating meal" });
  }
});

router.get("/plan", validateToken, async (req, res) => {
  const { studentId } = req.user;
  console.log("studentId", studentId);
  try {
    const meals = await Meal.find({ studentId });

    res.status(200).json({ message: "Meals retrieved successfully", meals });
  } catch (error) {
    console.error("Error getting meal:", error);
    res.status(500).json({ message: "An error occurred while getting meal" });
  }
});

router.put("/plan/:mealId", validateToken, async (req, res) => {
  const { studentId } = req.user;
  const { meal } = req.body;
  const { mealId } = req.params;
  console.log("mealId:", mealId);
  console.log("studentId:", studentId);
  console.log("meal:", meal);

  try {
    const updatedMeal = await Meal.findOneAndUpdate(
      { _id: mealId, studentId },
      { meal },
      { new: true }
    );
    if (!updatedMeal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    res
      .status(200)
      .json({ message: "Meal updated successfully", meal: updatedMeal });
  } catch (error) {
    console.error("Error updating meal:", error);
    res.status(500).json({ message: "An error occurred while updating meal" });
  }
});

// add route to delete all meal by date
router.delete("/plan/", async (req, res) => {
  const date = "2023-09-19";

  try {
    const deletedMeal = await Meal.deleteMany({ date });
    if (!deletedMeal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    res
      .status(200)
      .json({ message: "Meal deleted successfully", meal: deletedMeal });
  } catch (error) {
    console.error("Error deleting meal:", error);
    res.status(500).json({ message: "An error occurred while deleting meal" });
  }
});

module.exports = router;
