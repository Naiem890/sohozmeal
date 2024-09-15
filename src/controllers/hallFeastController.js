const router = require("express").Router();
const Cost = require("../models/cost");
const HallFeast = require("../models/hallFeast");
const Meal = require("../models/meal");
const Student = require("../models/student");

// Check if a meal is on or off for a specific date, meal type, and wing
router.post("/check", async (req, res) => {
  try {
    const { date, meal, wing } = req.body;

    // Validate wing
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Find the hall feast for the specific date, meal type, and wing
    const hallFeast = await HallFeast.findOne({ date, meal, wing: wing.toUpperCase() });

    if (hallFeast) {
      // Meal is on because hall feast exists for this date, meal, and wing
      return res.status(200).json({ status: "on", message: `${meal} is on for ${wing} wing on ${date}` });
    } else {
      // Meal is off because no hall feast is found for this date, meal, and wing
      return res.status(200).json({ status: "off", message: `${meal} is off for ${wing} wing on ${date}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function formatDateToYYYYMMDD(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Utility function to update student count in the bill for a specific wing
async function updateBillStudentsCount(date, meal, wing, includeAllStudents = false) {
  const dateWithoutTime = formatDateToYYYYMMDD(date);
  try {
    // Fetch the bill for the specific date and wing
    let bill = await Cost.findOne({ date: dateWithoutTime, wing });

    if (!bill) {
      bill = new Cost({ date: dateWithoutTime, mealBill: {}, wing });
    }

    if (includeAllStudents) {
      // Set total students to all students of the specific wing if feast is created
      const totalStudents = await Student.countDocuments({ wing: wing.toUpperCase() });
      bill.mealBill[meal].totalStudent = totalStudents;
    } else {
      // const totalStudentsWithMealOn = studentsWithMealOn.length > 0 ? studentsWithMealOn[0].count : 0;
      const studentsWithMealOn = await Meal.aggregate([
        {
          $match: {
            date: dateWithoutTime, // Ensure the date format matches
            [`meal.${meal}`]: true, // Check if the meal is true
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "studentId",
            as: "studentInfo",
          },
        },
        {
          $unwind: "$studentInfo", // Unwind the array to get a single object
        },
        {
          $match: {
            "studentInfo.gender": wing.toUpperCase(), // Filter by gender as wing
          },
        },
        {
          $group: {
            _id: null, // Group by null to get the count of all documents
            count: { $sum: 1 }, // Sum the number of documents (i.e., students)
          },
        },
      ]);
      // Check if the result exists, if not set count to 0
      const totalStudentsWithMeal = studentsWithMealOn.length > 0 ? studentsWithMealOn[0].count : 0;
      // Set the total students for this meal in the bill
      bill.mealBill[meal].totalStudent = totalStudentsWithMeal;
    }

    // Save the updated bill
    await bill.save();
  } catch (error) {
    console.error(`Error updating student count in the bill for ${meal} on ${dateWithoutTime}:`, error);
  }
}

// Create a new HallFeast and update the bill for a specific wing
router.post("/", async (req, res) => {
  const { date, meal, wing } = req.body;

  try {
    // Validate wing
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Create a new HallFeast
    const hallFeast = new HallFeast({ date, meal, wing: wing.toUpperCase() });
    await hallFeast.save();

    // Update the bill by setting the total students for this meal (include all students for a feast)
    await updateBillStudentsCount(date, meal, wing.toUpperCase(), true);

    res.status(201).json(hallFeast);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all HallFeasts
router.get("/", async (req, res) => {
  try {
    const hallFeasts = await HallFeast.find();
    res.status(200).json(hallFeasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single HallFeast by ID
router.get("/:id", async (req, res) => {
  try {
    const hallFeast = await HallFeast.findById(req.params.id);
    if (!hallFeast) {
      return res.status(404).json({ error: "HallFeast not found" });
    }
    res.status(200).json(hallFeast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a HallFeast by ID
router.put("/:id", async (req, res) => {
  try {
    const hallFeast = await HallFeast.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hallFeast) {
      return res.status(404).json({ error: "HallFeast not found" });
    }
    res.status(200).json(hallFeast);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a HallFeast by ID and update the bill for the wing
router.delete("/:id", async (req, res) => {
  try {
    const hallFeast = await HallFeast.findByIdAndDelete(req.params.id);
    if (!hallFeast) {
      return res.status(404).json({ error: "HallFeast not found" });
    }

    // Update the bill by counting the actual students who have their meal turned on
    await updateBillStudentsCount(hallFeast.date, hallFeast.meal, hallFeast.wing, false);

    res.status(200).json({ message: "HallFeast deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get HallFeast by date and wing
router.get("/date/:date/wing/:wing", async (req, res) => {
  try {
    const { date, wing } = req.params;

    // Validate wing
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Find hallFeast by date and wing
    const hallFeast = await HallFeast.find({ date, wing: wing.toUpperCase() });

    if (!hallFeast || hallFeast.length === 0) {
      return res.status(404).json({ error: `No HallFeast found for this date and ${wing} wing` });
    }

    res.status(200).json(hallFeast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a HallFeast by date, meal, and wing, and update the bill
router.delete("/date/:date/meal/:meal/wing/:wing", async (req, res) => {
  const { date, meal, wing } = req.params;

  try {
    // Validate wing
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Find and delete the hall feast by date, meal, and wing
    const deletedHallFeast = await HallFeast.findOneAndDelete({ date: new Date(date), meal, wing: wing.toUpperCase() });

    if (!deletedHallFeast) {
      return res.status(404).json({ error: "No HallFeast found for this date, meal, and wing" });
    }

    // Update the bill by counting the actual students who have their meal turned on
    await updateBillStudentsCount(date, meal, wing.toUpperCase(), false);

    res.status(200).json({ message: "HallFeast deleted successfully", deletedHallFeast });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all HallFeasts for a specific month and wing
router.get("/month/:year/:month/wing/:wing", async (req, res) => {
  try {
    const { year, month, wing } = req.params;

    // Validate wing
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Construct the start and end dates for the month
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // Move to the first day of the next month

    // Query for HallFeasts that fall within the date range and match the wing
    const hallFeasts = await HallFeast.find({
      date: { $gte: startDate, $lt: endDate },
      wing: wing.toUpperCase(),
    });

    if (!hallFeasts || hallFeasts.length === 0) {
      return res.status(404).json({ error: `No HallFeasts found for ${month}/${year} and ${wing} wing` });
    }

    res.status(200).json(hallFeasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
