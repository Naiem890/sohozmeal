const router = require("express").Router();
const Meal = require("../models/meal");
const Student = require("../models/student");
const Routine = require("../models/routine");
const { validateToken } = require("../utils/validateToken");
const HallFeast = require("../models/hallFeast");
const { checkAdminRole } = require("../utils/checkAdminRole");

const weekDays = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

// Get routine by wing
router.get("/routine", validateToken, async (req, res) => {
  const { wing } = req.query;
  if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: "Invalid or missing wing parameter" });
  }

  try {
    const routines = await Routine.find({ wing: wing.toUpperCase() });

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

// Initialize routine for a specific wing
router.post("/routine/initialize", async (req, res) => {
  const { wing } = req.body;
  if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: "Invalid or missing wing parameter" });
  }

  try {
    for (const day of weekDays) {
      const routineData = {
        day: day,
        breakfast: "-",
        lunch: "-",
        dinner: "-",
        wing: wing.toUpperCase(),
      };

      const routine = new Routine(routineData);
      await routine.save();
    }

    res.status(200).json({ message: `Routine initialized for ${wing} wing successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update routine by wing
router.put("/routine", async (req, res) => {
  const { wing } = req.query;

  // Validate the wing parameter
  if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: "Invalid or missing wing parameter" });
  }

  try {
    const dataToUpdate = req.body;

    // Map through each routine data and update or create it
    const queries = dataToUpdate.map(async (routineData) => {
      const { day, breakfast, lunch, dinner } = routineData;
      console.log(routineData, "jjs");
      // Find the existing routine by day and wing
      let routine = await Routine.findOne({ day: day.toUpperCase(), wing: wing.toUpperCase() });

      if (routine) {
        // If the routine exists, update it
        routine.breakfast = breakfast;
        routine.lunch = lunch;
        routine.dinner = dinner;
      } else {
        // If the routine doesn't exist, create a new one
        // console.log(breakfast,lunch,dinner,day,wing, "jjs");
        routine = new Routine({
          day: day.toUpperCase(),
          breakfast,
          lunch,
          dinner,
          wing: wing.toUpperCase(),
        });
      }

      // Save the updated or newly created routine
      return routine.save();
    });

    // Await all queries to finish
    const results = await Promise.all(queries);

    res.status(200).json({ message: `Routine updated for ${wing} wing successfully`, routines: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Plan meals for students based on wing
router.get("/plan", validateToken, async (req, res) => {
  const { studentId } = req.user;
  const { year, month } = req.query;
  console.log(studentId, year, month, "jjs");

  // if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
  //   return res.status(400).json({ error: "Invalid or missing wing parameter" });
  // }

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
        $sort: { dateAsInt: 1 },
      },
      {
        $project: {
          dateAsInt: 0,
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

// Helper function to format the date to YYYY-MM-DD with leading zeros
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ensure 2 digits for month
  const day = date.getDate().toString().padStart(2, '0'); // Ensure 2 digits for day
  return `${year}-${month}-${day}`;
};


router.get("/students", async (req, res) => {
  const { date, gender } = req.query;
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
      acc[meal.studentId].guestMeal = meal.guestMeal;
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
        guestMeal: mealMap[student.studentId].guestMeal || { breakfast: 0, lunch: 0, dinner: 0 }
      };
    });

    res.status(200).json(studentMealData);
  } catch (error) {
    console.error("Error retrieving students and meals: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Toggle meal status for a student
router.put('/toggle', validateToken, checkAdminRole, async (req, res) => {
  const { studentId, date: queryDate, meal, wing } = req.query;

  // Validate required parameters
  if (!studentId || !queryDate || !meal || !wing) {
    return res.status(400).json({ error: "Missing required parameters: studentId, date, meal, or wing" });
  }

  if (!["breakfast", "lunch", "dinner"].includes(meal)) {
    return res.status(400).json({ error: "Invalid meal type. Must be one of: breakfast, lunch, dinner" });
  }

  if (!["MALE", "FEMALE"].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: "Invalid wing. Must be MALE or FEMALE" });
  }

  try {
    // Convert the queryDate to a JavaScript Date object
    const startDate = new Date(queryDate);
    startDate.setHours(0, 0, 0, 0); // Set time to the start of the day

    const endDate = new Date(queryDate);
    endDate.setHours(23, 59, 59, 999); // Set time to the end of the day

    // Retrieve the meal to be updated for the student on the specified date
    const mealToUpdate = await Meal.findOne({
      studentId,
      date: formatDate(queryDate),  // Match exactly with the provided query date
    });

    if (!mealToUpdate) {
      return res.status(404).json({ message: "Meal not found for this student on the specified date" });
    }

    // Check if a hall feast exists for the same date and meal type
    const hallFeastExists = await HallFeast.findOne({
      date: { $gte: startDate, $lte: endDate }, // Match the date within the range
      meal
    });
    if (hallFeastExists) {
      return res.status(403).json({
        message: `You cannot change the ${meal} status because a hall feast is scheduled for ${queryDate}.`,
      });
    }

    // Toggle the meal status (true -> false, false -> true)
    const currentMealStatus = mealToUpdate.meal[meal];
    const newMealStatus = !currentMealStatus;

    // Update the meal status
    mealToUpdate.meal[meal] = newMealStatus;
    await mealToUpdate.save();

    // Send response back with the updated status
    res.status(200).json({
      message: `The ${meal.toUpperCase()} for ${queryDate} has been successfully ${newMealStatus ? "enabled" : "disabled"} for the student.`,
      meal: mealToUpdate,
    });
  } catch (error) {
    console.error("Error toggling meal status:", error);
    res.status(500).json({ message: "An error occurred while toggling the meal status" });
  }
});

// Update guest meal for a student on any meal by both admin and student
// Student only can update his guest meal, admin can do for any student
router.put("/guest-meal", validateToken, async (req, res) => {
  try {
    let { date, guestMeal, studentId } = req.body;

    // Assign studentId from the token for students
    if (req.user.role === "student") {
      studentId = req.user.studentId;
    }

    // Validate required fields
    if (!date || !guestMeal || !studentId) {
      return res.status(400).json({
        error: "Missing required parameters: date or guestMeal or studentId",
      });
    }

    // Validate guestMeal values
    const { breakfast = 0, lunch = 0, dinner = 0 } = guestMeal;
    if (breakfast < 0 || lunch < 0 || dinner < 0) {
      return res.status(400).json({ message: "Guest meal count cannot be negative" });
    }

    // Find the meal document
    const mealToUpdate = await Meal.findOne({ date, studentId });
    if (!mealToUpdate) {
      return res.status(404).json({
        message: "Meal not found for this student on the specified date",
      });
    }

    // Update guestMeal fields only if they are greater than 0
    mealToUpdate.guestMeal = {
      breakfast: breakfast > 0 ? breakfast : mealToUpdate.guestMeal.breakfast,
      lunch: lunch > 0 ? lunch : mealToUpdate.guestMeal.lunch,
      dinner: dinner > 0 ? dinner : mealToUpdate.guestMeal.dinner,
    };

    // Save the updated document
    await mealToUpdate.save();

    // Respond with success
    return res.status(200).json({
      message: `Guest meal for ${date} has been successfully updated for ${studentId}.`,
      meal: mealToUpdate,
    });
  } catch (error) {
    console.error("Error updating guest meal:", error);
    return res.status(500).json({ message: "An error occurred while updating guest meal" });
  }
});


module.exports = router;
