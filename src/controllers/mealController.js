const router = require("express").Router();
const Meal = require("../models/meal");
const { validateToken } = require("../utils/validateToken");

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
router.delete("/plan", async (req, res) => {
  // const date = "2023-09-22";
  const date = req.body.date;

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
