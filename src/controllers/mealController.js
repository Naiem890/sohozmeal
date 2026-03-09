const router = require("express").Router();
const Meal = require("../models/meal");
const Student = require("../models/student");
const Routine = require("../models/routine");
const MealConfig = require("../models/mealConfig");
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

// Helper: return tomorrow's date string in Asia/Dhaka timezone
function getTomorrowDhaka() {
  const now = new Date();
  const dhakaToday = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  const dhakaTomorrow = new Date(dhakaToday);
  dhakaTomorrow.setDate(dhakaToday.getDate() + 1);
  return dhakaDateStr(dhakaTomorrow);
}

// Get routine by wing
router.get("/routine", validateToken, async (req, res) => {
  const { wing } = req.query;
  if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: "Invalid or missing wing parameter" });
  }

  try {
    const routines = await Routine.find({ wing: wing.toUpperCase() });

    // Sort the routines in the desired order, filling missing days with empty defaults
    const sortedRoutines = weekDays.map((day) =>
      routines.find((routine) => routine.day === day) ||
      { day, breakfast: "", lunch: "", dinner: "" }
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

// GET /config — return cutoff config for a wing (any authenticated user)
router.get("/config", validateToken, async (req, res) => {
  const { wing } = req.query;
  if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: "Invalid or missing wing parameter" });
  }
  try {
    const config = await MealConfig.findOne({ wing: wing.toUpperCase() });
    if (!config) {
      return res.status(200).json({ wing: wing.toUpperCase(), cutoffHour: 22, cutoffMinute: 0 });
    }
    res.status(200).json(config);
  } catch (err) {
    console.error("Error fetching meal config:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /config — upsert cutoff config for a wing (admin only)
router.put("/config", validateToken, checkAdminRole, async (req, res) => {
  const { wing, cutoffHour, cutoffMinute } = req.body;
  if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
    return res.status(400).json({ error: "Invalid or missing wing" });
  }
  if (cutoffHour === undefined || cutoffMinute === undefined) {
    return res.status(400).json({ error: "cutoffHour and cutoffMinute are required" });
  }
  try {
    const config = await MealConfig.findOneAndUpdate(
      { wing: wing.toUpperCase() },
      { wing: wing.toUpperCase(), cutoffHour: Number(cutoffHour), cutoffMinute: Number(cutoffMinute) },
      { upsert: true, new: true }
    );

    // Reschedule cron: run 5 minutes before the earliest cutoff across both wings
    try {
      const { rescheduleJob } = require("../../cron/mealGenerate");
      const allConfigs = await MealConfig.find({ wing: { $in: ["MALE", "FEMALE"] } });
      let cronHour = 21, cronMinute = 55;
      if (allConfigs.length > 0) {
        let minTotal = Infinity;
        for (const cfg of allConfigs) {
          const total = cfg.cutoffHour * 60 + cfg.cutoffMinute;
          if (total < minTotal) minTotal = total;
        }
        const cronTotal = minTotal - 5;
        cronHour = Math.floor(Math.abs(cronTotal) / 60) % 24;
        cronMinute = ((cronTotal % 60) + 60) % 60;
      }
      rescheduleJob(cronHour, cronMinute);
    } catch (cronErr) {
      console.error("Error rescheduling cron after config update:", cronErr);
    }

    res.status(200).json({ message: "Meal config updated", config });
  } catch (err) {
    console.error("Error updating meal config:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Plan meals for students based on wing
router.get("/plan", validateToken, async (req, res) => {
  const { studentId } = req.user;
  const { year, month } = req.query;
  console.log(studentId, year, month, "jjs");

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

    // Get student's wing for cutoff config
    const student = await Student.findOne({ studentId }, { gender: 1 });
    const wing = student?.gender || "MALE";
    const config = await MealConfig.findOne({ wing });
    const cutoffHour = config?.cutoffHour ?? 22;
    const cutoffMinute = config?.cutoffMinute ?? 0;

    // Compute the currently editable date (mirrors frontend validDate logic):
    // before cutoff → day+1 (tomorrow), after cutoff → day+2 (cron has already run)
    const now = new Date();
    const dhakaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const currentHour = dhakaTime.getHours();
    const currentMinute = dhakaTime.getMinutes();
    const afterCutoff =
      currentHour > cutoffHour ||
      (currentHour === cutoffHour && currentMinute >= cutoffMinute);
    const editableDate = new Date(dhakaTime);
    editableDate.setDate(dhakaTime.getDate() + (afterCutoff ? 2 : 1));
    const editableDateStr = `${editableDate.getFullYear()}-${String(editableDate.getMonth() + 1).padStart(2, "0")}-${String(editableDate.getDate()).padStart(2, "0")}`;

    if (mealDate !== editableDateStr) {
      const hh = String(cutoffHour).padStart(2, "0");
      const mm = String(cutoffMinute).padStart(2, "0");
      if (afterCutoff) {
        return res.status(403).json({
          message: `Cutoff passed for ${wing} wing. Locked at ${hh}:${mm}.`,
        });
      }
      return res.status(403).json({ message: "Can only edit tomorrow's meal" });
    }

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
  const { date, wing, search, residence, page = 1, limit = 20 } = req.query;
  if (!date) {
    return res.status(400).json({ error: "Date parameter is required" });
  }
  if (!wing) {
    return res.status(400).json({ error: "Wing parameter is required" });
  }

  const pageNum  = Math.max(1, parseInt(page)  || 1);
  const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 20));

  try {
    const studentFilter = { gender: wing };

    if (residence) {
      studentFilter.residence = residence;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      studentFilter.$or = [
        { studentId: regex },
        { hallId: regex },
        { name: regex },
      ];
    }

    // Run total count + paginated fetch + all IDs (for meal counts) in parallel
    const [total, paginatedStudents, allIds] = await Promise.all([
      Student.countDocuments(studentFilter),
      Student.find(studentFilter, {
        studentId: 1, hallId: 1, name: 1, gender: 1, residence: 1, roomNo: 1, batch: 1,
      }).sort({ roomNo: 1, studentId: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Student.find(studentFilter, { studentId: 1 }).lean().then((docs) => docs.map((s) => s.studentId)),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Meal counts across ALL matching students (for stats bar)
    const countsAgg = await Meal.aggregate([
      { $match: { date, studentId: { $in: allIds } } },
      {
        $group: {
          _id: null,
          breakfast: { $sum: { $cond: ["$meal.breakfast", 1, 0] } },
          lunch:     { $sum: { $cond: ["$meal.lunch",     1, 0] } },
          dinner:    { $sum: { $cond: ["$meal.dinner",    1, 0] } },
        },
      },
    ]);
    const mealCounts = countsAgg[0]
      ? { breakfast: countsAgg[0].breakfast, lunch: countsAgg[0].lunch, dinner: countsAgg[0].dinner }
      : { breakfast: 0, lunch: 0, dinner: 0 };

    if (total === 0) {
      return res.status(200).json({
        students: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        mealCounts,
      });
    }

    const paginatedIds = paginatedStudents.map((s) => s.studentId);
    const meals = await Meal.find({ date, studentId: { $in: paginatedIds } }).lean();

    const mealMap = meals.reduce((acc, meal) => {
      acc[meal.studentId] = { ...meal.meal, guestMeal: meal.guestMeal };
      return acc;
    }, {});

    const studentMealData = paginatedStudents.map((student) => ({
      studentId: student.studentId,
      batch:     student.batch,
      hallId:    student.hallId,
      name:      student.name,
      gender:    student.gender,
      residence: student.residence,
      roomNo:    student.roomNo,
      meal:      mealMap[student.studentId]
        ? { breakfast: mealMap[student.studentId].breakfast, lunch: mealMap[student.studentId].lunch, dinner: mealMap[student.studentId].dinner }
        : { breakfast: false, lunch: false, dinner: false },
      guestMeal: mealMap[student.studentId]?.guestMeal || { breakfast: 0, lunch: 0, dinner: 0 },
    }));

    res.status(200).json({
      students: studentMealData,
      pagination: { page: pageNum, limit: limitNum, total, totalPages },
      mealCounts,
    });
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
