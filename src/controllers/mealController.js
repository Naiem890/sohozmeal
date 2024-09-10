const router = require("express").Router();
const Meal = require("../models/meal");
const Student = require("../models/student");
const Routine = require("../models/routine");
const { validateToken } = require("../utils/validateToken");
const HallFeast = require("../models/hallFeast");

const weekDays = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

router.get("/routine", validateToken, async (req, res) => {
  try {
    const routines = await Routine.find();

    // Sort the routines in the desired order
    const sortedRoutines = weekDays.map((day) =>
      routines.find((routine) => routine.day === day)
    );

    res.json(sortedRoutines);
  } catch (err) {
    console.error("Error retrieving routines: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/routine/initialize", async (req, res) => {
  try {
    for (const day of weekDays) {
      const routineData = {
        day: day,
        breakfast: "-",
        lunch: "-",
        dinner: "-",
        HallWing: "MALE",
      };

      const routine = new Routine(routineData);
      await routine.save();
    }

    res.status(200).json({ message: "Routine initialized successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/routine", async (req, res) => {
  try {
    const dataToUpdate = req.body;
    const queries = dataToUpdate.map((routineData) => {
      const { _id, breakfast, lunch, dinner } = routineData;
      return Routine.findOneAndUpdate({ _id }, { breakfast, lunch, dinner });
    });

    const results = await Promise.all(queries);

    console.log("results:", results);
    res
      .status(200)
      .json({ message: "Routine updated successfully", routines: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/plan", validateToken, async (req, res) => {
  const { studentId } = req.user;
  const { year, month } = req.query;

  try {
    let filter = { studentId: studentId };

    if (year && month) {
      filter.date = {
        $regex: new RegExp(`^${year}-${month.padStart(2, "0")}-\\d{1,2}`),
      };
    }

    const meals = await Meal.aggregate([
      {
        $match: filter,
      },
      {
        $addFields: {
          dateAsInt: {
            $dateFromString: {
              dateString: "$date",
              format: "%Y-%m-%d",
            },
          },
        },
      },
      {
        $sort: { dateAsInt: 1 }, // Sort by date in ascending order
      },
      {
        $project: {
          dateAsInt: 0, // Exclude the temporary field from the result
        },
      },
    ]);

    res.status(200).json({ message: "Meals retrieved successfully", meals });
  } catch (error) {
    console.error("Error getting meals:", error);
    res.status(500).json({ message: "An error occurred while getting meals" });
  }
});

router.get("/months", validateToken, async (req, res) => {
  try {
    const distinctMonthsResult = await Meal.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: { $dateFromString: { dateString: "$date" } },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
        },
      },
      {
        $group: {
          _id: null,
          distinctMonths: { $addToSet: "$month" },
        },
      },
      {
        $project: {
          _id: 0,
          distinctMonths: 1,
        },
      },
      {
        $unwind: "$distinctMonths",
      },
      {
        $sort: {
          distinctMonths: 1, // Sort in ascending order
        },
      },
      {
        $group: {
          _id: null,
          distinctMonths: { $push: "$distinctMonths" },
        },
      },
      {
        $project: {
          _id: 0,
          distinctMonths: 1,
        },
      },
    ]);

    if (distinctMonthsResult.length > 0) {
      res.json(distinctMonthsResult[0].distinctMonths);
    } else {
      res.json([]);
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching distinct months." });
  }
});

router.put("/plan/:mealId", validateToken, async (req, res) => {
  const { studentId } = req.user;
  const { meal: newMeal } = req.body; // e.g., { breakfast: true } or { lunch: false }
  const { mealId } = req.params;

  try {
    // Retrieve the meal to get its date
    const mealToUpdate = await Meal.findOne({ _id: mealId, studentId });
    if (!mealToUpdate) {
      return res.status(404).json({ message: "Meal not found" });
    }

    const mealDate = mealToUpdate.date;
    const mealType = Object.keys(newMeal)[0]; // Extract meal type (e.g., "breakfast", "lunch", or "dinner")

    // Check if a hall feast exists for the same date and meal type
    const hallFeastExists = await HallFeast.findOne({
      date: mealDate,
      meal: mealType, // Check if the feast is for the same meal type
    });

    if (hallFeastExists) {
      return res.status(403).json({
        message: `You cannot change the ${mealType} status because a hall feast is scheduled for ${mealDate}`,
      });
    }

    // If no hall feast exists for the specific meal type, proceed with updating the meal
    const updatedMeal = await Meal.findOneAndUpdate(
      { _id: mealId, studentId },
      {
        $set: {
          [`meal.${mealType}`]: newMeal[mealType], // Update the specific meal (breakfast/lunch/dinner)
        },
      },
      { new: true }
    );

    if (!updatedMeal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    // Send more information about which meal was updated
    res.status(200).json({
      message: `${mealType.toUpperCase()} is ${
        newMeal[mealType] ? "on" : "off"
      } for ${updatedMeal.date}!`,
      meal: updatedMeal,
    });
  } catch (error) {
    console.error("Error updating meal:", error);
    res.status(500).json({ message: "An error occurred while updating meal" });
  }
});
//generate meal for all or specific student
router.post("/generate-meal", async (req, res) => {
  const { date } = req.body;
  const { studentId } = req.query;

  try {
    // Get the previous date from the provided date
    const currentDate = new Date(date);
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1); // Subtract 1 day for the previous date
    const previousDateString = previousDate.toISOString().split("T")[0]; // Format date as YYYY-MM-DD

    // Helper function to copy meal status
    const copyMealStatus = (previousMeal) => ({
      breakfast: previousMeal?.breakfast || false,
      lunch: previousMeal?.lunch || false,
      dinner: previousMeal?.dinner || false,
    });

    // If studentId is provided in the query, generate meal for that student only
    if (studentId) {
      const existingMeal = await Meal.findOne({ studentId, date });
      if (existingMeal) {
        return res
          .status(400)
          .json({
            error: "Meal already generated for this student on the specified date",
          });
      }

      // Get the meal for the previous date
      const previousMeal = await Meal.findOne({ studentId, date: previousDateString });
      const newMealStatus = copyMealStatus(previousMeal?.meal);

      const meal = new Meal({
        studentId,
        date,
        meal: newMealStatus, // Set the new meal status based on previous day
      });
      const savedMeal = await meal.save();
      return res.status(201).json({ message: "Meal generated successfully", meal: savedMeal });
    }

    // If no studentId is provided, generate meals for all students
    const students = await Student.find({}, { studentId: 1 });
    if (students.length === 0) {
      return res.status(404).json({ error: "No students found" });
    }

    const studentsIds = students.map((student) => student.studentId);

    const mealPromises = studentsIds.map(async (studentId) => {
      const existingMeal = await Meal.findOne({ studentId, date });
      if (existingMeal) {
        return null; // Skip if meal already exists for this student on the specified date
      }

      // Get the meal for the previous date
      const previousMeal = await Meal.findOne({ studentId, date: previousDateString });
      const newMealStatus = copyMealStatus(previousMeal?.meal);

      const meal = new Meal({
        studentId,
        date,
        meal: newMealStatus, // Set the new meal status based on previous day
      });
      return await meal.save();
    });

    // Wait for all meal creation promises to resolve
    const savedMeals = await Promise.all(mealPromises.filter(meal => meal !== null));

    return res.status(201).json({ message: "Meals generated successfully", meals: savedMeals });
  } catch (error) {
    console.error("Error generating meal:", error);
    return res.status(500).json({ error: "An error occurred while generating meal" });
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

router.get("/students", async (req, res) => {
  const { date, gender } = req.query;
  console.log("sss:", date, gender);
  if (!date) {
    return res.status(400).json({ error: "Date parameter is required" });
  }

  if (!gender) {
    return res.status(400).json({ error: "Gender parameter is required" });
  }

  try {
    // Find students filtered by gender
    const students = await Student.find({ gender }, { studentId: 1, hallId: 1, name: 1, gender: 1, residence: 1, roomNo: 1 });

    if (students.length === 0) {
      return res.status(404).json({ error: "No students found" });
    }

    // Find the meals for the provided date
    const meals = await Meal.find({ date });

    // Create a map of meal status by studentId
    const mealMap = meals.reduce((acc, meal) => {
      acc[meal.studentId] = meal.meal;
      return acc;
    }, {});

    // Map through students and include their meal status
    const studentMealData = students.map(student => {
      return {
        studentId: student.studentId,
        batch: student.batch,
        hallId: student.hallId,
        name: student.name,
        gender: student.gender,
        residence: student.residence,
        roomNo: student.roomNo,
        meal: mealMap[student.studentId] || { breakfast: false, lunch: false, dinner: false }, // Default to false if no meal found
      };
    });

    res.status(200).json(studentMealData);
  } catch (error) {
    console.error("Error retrieving students and meals: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
