const router = require("express").Router();
const Meal = require("../models/meal");
const Student = require("../models/student");
const Routine = require("../models/routine");
const { validateToken } = require("../utils/validateToken");

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
  const { meal: newMeal } = req.body;
  const { mealId } = req.params;
  console.log("mealId:", mealId);
  console.log("studentId:", studentId);
  console.log("meal:", newMeal);

  try {
    const updatedMeal = await Meal.findOneAndUpdate(
      { _id: mealId, studentId },
      {
        $set: {
          [`meal.${Object.keys(newMeal)[0]}`]: newMeal[Object.keys(newMeal)[0]],
        },
      },
      { new: true }
    );

    if (!updatedMeal) {
      return res.status(404).json({ message: "Meal not found" });
    }

    // send more infomation about which meal was updated

    res.status(200).json({
      message: `${Object.keys(newMeal)[0].toUpperCase()} is ${
        newMeal[Object.keys(newMeal)[0]] ? "on" : "off"
      } for ${updatedMeal.date}!
        `,
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
    // If studentId is provided in the query, generate meal for that student only
    if (studentId) {
      const existingMeal = await Meal.findOne({ studentId, date });
      if (existingMeal) {
        return res.status(400).json({ error: "Meal already generated for this student on the specified date" });
      }

      const meal = new Meal({
        studentId,
        date,
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

      const meal = new Meal({
        studentId,
        date,
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

module.exports = router;
