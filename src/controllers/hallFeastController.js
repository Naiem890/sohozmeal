const router = require("express").Router();
const Bill = require("../models/bill");
const HallFeast = require("../models/hallFeast");
const Meal = require("../models/meal");
const Student = require("../models/student");

// Check if a meal is on or off for a specific date and meal type
router.post("/check", async (req, res) => {
  try {
    const { date, meal } = req.body;

    // Find the hall feast for the specific date and meal type
    const hallFeast = await HallFeast.findOne({ date, meal });

    if (hallFeast) {
      // Meal is on because hall feast exists for this date and meal
      return res.status(200).json({ status: "on", message: `${meal} is on for ${date}` });
    } else {
      // Meal is off because no hall feast is found for this date and meal
      return res.status(200).json({ status: "off", message: `${meal} is off for ${date}` });
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

// Utility function to update student count in the bill
async function updateBillStudentsCount(date, meal, includeAllStudents = false) {
  const dateWithoutTime = formatDateToYYYYMMDD(date);
  try {
    // Fetch the bill for the specific date
    let bill = await Bill.findOne({ date: dateWithoutTime });
    
    if (!bill) {
      bill = new Bill({ date: dateWithoutTime, mealBill: {} });
    }

    if (includeAllStudents) {
      // Set total students to all students if feast is created
      const totalStudents = await Student.countDocuments();
      bill.mealBill[meal].totalStudent = totalStudents;
    } else {
      // Use aggregation to count students who turned their meal on for that specific date and meal
      const studentsWithMealOn = await Meal.aggregate([
        {
          $match: {
            date: dateWithoutTime, // Ensure the date format matches
            [`meal.${meal}`]: true, // Check if the meal is true
          },
        },
        {
          $group: {
            _id: null, // Group by null to get the count of all documents
            count: { $sum: 1 }, // Sum the number of documents (i.e., students)
          },
        },
      ]);
      
      const totalStudentsWithMealOn = studentsWithMealOn.length > 0 ? studentsWithMealOn[0].count : 0;
      
      // Set the total students for this meal in the bill
      bill.mealBill[meal].totalStudent = totalStudentsWithMealOn;
      console.log(bill, "kkk");
    }

    // Save the updated bill
    await bill.save();
  } catch (error) {
    console.error(`Error updating student count in the bill for ${meal} on ${dateWithoutTime}:`, error);
  }
}

// Create a new HallFeast and update the bill
router.post("/", async (req, res) => {
  const { date, meal, wing } = req.body;

  try {
    // Create a new HallFeast
    const hallFeast = new HallFeast({ date, meal, wing });
    await hallFeast.save();

    // Update the bill by setting the total students for this meal (include all students for a feast)
    await updateBillStudentsCount(date, meal, true);

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

// Delete a HallFeast by ID
router.delete("/:id", async (req, res) => {
  try {
    const hallFeast = await HallFeast.findByIdAndDelete(req.params.id);
    if (!hallFeast) {
      return res.status(404).json({ error: "HallFeast not found" });
    }
    res.status(200).json({ message: "HallFeast deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Get HallFeast by date
router.get("/date/:date", async (req, res) => {
  try {
    const { date } = req.params;

    // Find hallFeast by date
    const hallFeast = await HallFeast.find({ date });

    if (!hallFeast || hallFeast.length === 0) {
      return res.status(404).json({ error: "No HallFeast found for this date" });
    }

    res.status(200).json(hallFeast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Delete a HallFeast and update the bill
router.delete("/date/:date/meal/:meal", async (req, res) => {
  const { date, meal } = req.params;

  try {
    // Find and delete the hall feast by date and meal
    const deletedHallFeast = await HallFeast.findOneAndDelete({ date: new Date(date), meal });

    if (!deletedHallFeast) {
      return res.status(404).json({ error: "No HallFeast found for this date and meal" });
    }

    // Update the bill by counting the actual students who have their meal turned on
    await updateBillStudentsCount(date, meal, false);

    res.status(200).json({ message: "HallFeast deleted successfully", deletedHallFeast });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Get all HallFeasts for a specific month and wing
router.get("/month/:year/:month/wing/:wing", async (req, res) => {
  try {
    const { year, month, wing } = req.params;

    // Construct the start and end dates for the month
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // Move to the first day of the next month

    // Query for HallFeasts that fall within the date range and match the wing
    const hallFeasts = await HallFeast.find({
      date: { $gte: startDate, $lt: endDate },
      wing: wing,
    });

    if (!hallFeasts || hallFeasts.length === 0) {
      return res.status(404).json({ error: "No HallFeasts found for this month and wing" });
    }

    res.status(200).json(hallFeasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
