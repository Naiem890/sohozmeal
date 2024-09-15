const router = require("express").Router();
const Cost = require("../models/cost");
const Meal = require("../models/meal");
const Student = require("../models/student");
const { createOrUpdateBill } = require("../utils/billService");
const { validateToken } = require("../utils/validateToken");

// Generate bills for all students from date x to date y
router.post("/generate-bills", validateToken, async (req, res) => {
  const { startDate, endDate, wing } = req.query;

  try {
    // Parse the date strings into Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Validate wing
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Fetch bills in the date range and filter by wing
    const bills = await Cost.find({
      date: { $gte: start, $lte: end },
      wing: wing.toUpperCase(),
    }).exec();

    // Fetch meal attendance in the date range and filter by wing
    const meals = await Meal.find({
      date: { $gte: startDate, $lte: endDate },
      wing: wing.toUpperCase(),
    }).exec();

    // Initialize a map to store meal attendance records by date and studentId
    const mealAttendanceMap = {};

    meals.forEach(meal => {
      const mealDate = meal.date;
      
      if (!mealAttendanceMap[mealDate]) {
        mealAttendanceMap[mealDate] = {};
      }
      
      // Create a record for each student's meal participation
      mealAttendanceMap[mealDate][meal.studentId] = meal.meal;
    });

    // Fetch student details and exclude fields like profileImage, password, and firstTimeLogin
    const students = await Student.find(
      { gender: wing.toUpperCase() },
      { profileImage: 0, password: 0, firstTimeLogin: 0, status: 0 }
    ).exec();

    // Initialize total costs and details for all students
    const studentInfo = {};

    // Step 1: Calculate the per-head cost for each meal and accumulate the total cost for each student
    bills.forEach(bill => {
      const billDate = bill.date.toISOString().split("T")[0];

      // Compute perHeadCosts for each meal
      const perHeadCosts = {
        breakfast: calculatePerHeadCost(bill.mealBill.breakfast),
        lunch: calculatePerHeadCost(bill.mealBill.lunch),
        dinner: calculatePerHeadCost(bill.mealBill.dinner),
      };

      // Check if there is meal attendance data for the current date
      const attendanceOnDate = mealAttendanceMap[billDate];

      if (attendanceOnDate) {
        // Iterate over each student's meal attendance for that date
        Object.keys(attendanceOnDate).forEach(studentId => {
          const studentMeals = attendanceOnDate[studentId];

          // Initialize student record if not already
          if (!studentInfo[studentId]) {
            studentInfo[studentId] = {
              totalCost: 0,
            };
          }

          // Add the per-head cost for each meal the student participated in
          if (studentMeals.breakfast) studentInfo[studentId].totalCost += perHeadCosts.breakfast;
          if (studentMeals.lunch) studentInfo[studentId].totalCost += perHeadCosts.lunch;
          if (studentMeals.dinner) studentInfo[studentId].totalCost += perHeadCosts.dinner;
        });
      }
    });

    // Step 2: Combine student details with their total costs
    const result = students.map(student => {
      const { studentId } = student;
      return {
        ...student.toObject(),
        totalCost: studentInfo[studentId] ? studentInfo[studentId].totalCost : 0
      };
    });

    // Step 3: Send the response with the combined student details and total cost
    res.status(200).json({
      message: `Student bills calculated successfully for dates between ${startDate} and ${endDate}`,
      result,
    });
  } catch (error) {
    console.error("Error during bill calculation:", error);
    res.status(500).json({ message: "An error occurred during bill calculation" });
  }
});

// Helper function to calculate per head cost
function calculatePerHeadCost(mealBill) {
  return mealBill.totalStudent > 0 ? mealBill.totalCost / mealBill.totalStudent : 0;
}

// Create all bills for a specific date and wing
router.post("/", validateToken, async (req, res) => {
  const queryDate = req.query.date;
  const wing = req.query.wing; // Wing must be passed as a query parameter

  try {
    // Convert the query string into Date objects
    const dateObj = new Date(queryDate);

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Check if the wing is provided
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Call the service function to create or update the bill for the wing
    const bill = await createOrUpdateBill(queryDate, wing.toUpperCase());

    // Send the response with the generated or updated bill
    res.status(200).json({
      message: "Bill generated successfully",
      date: dateObj,
      wing: wing.toUpperCase(),
      mealBill: bill.mealBill,
    });
  } catch (error) {
    console.error("Error during bill generation:", error);
    res
      .status(500)
      .json({ message: "An error occurred while generating the bill" });
  }
});

// Fetch {bills for a specific student (as an admin)} || {monthly bill} || {by student's bearer token get his meal and bill details}
router.get("/student", validateToken, async (req, res) => {
  let studentId = req.user.studentId; // Default to the logged-in user's studentId
  const { month, year, studentId: queryStudentId, wing } = req.query; // Destructure query parameters
  console.log(  month, year, studentId, queryStudentId, wing) ;
  // If the user is an admin and a studentId is provided in the query, use it
  if (req.user.role === "admin" && queryStudentId) {
    studentId = queryStudentId;
  }
  console.log(studentId);
  try {
    // Validate month and year
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    // Validate wing
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Calculate start and end dates of the month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month)); // Last day of the month
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    // Aggregate pipeline to fetch bills, filtered by wing
    const billsPipeline = [
      {
        $match: {
          date: { $gte: startDate, $lt: endDate },
          wing: wing.toUpperCase(), // Filter bills by wing
        },
      },
      {
        $addFields: {
          "mealBill.breakfast.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.breakfast.totalStudent", 0] },
              {
                $divide: [
                  "$mealBill.breakfast.totalCost",
                  "$mealBill.breakfast.totalStudent",
                ],
              },
              0,
            ],
          },
          "mealBill.lunch.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.lunch.totalStudent", 0] },
              {
                $divide: [
                  "$mealBill.lunch.totalCost",
                  "$mealBill.lunch.totalStudent",
                ],
              },
              0,
            ],
          },
          "mealBill.dinner.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.dinner.totalStudent", 0] },
              {
                $divide: [
                  "$mealBill.dinner.totalCost",
                  "$mealBill.dinner.totalStudent",
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          mealBill: 1,
          wing: 1,
        },
      },
      {
        $sort: { date: 1 }, // Sort by date in ascending order
      },
    ];

    // Fetch bills
    const bills = await Cost.aggregate(billsPipeline).exec();
    // console.log(bills);

    // Fetch meals, filtered by wing
    let combinedMealBill = [];
    if (studentId) {
      const mealsPipeline = [
        {
          $match: {
            date: { $gte: start, $lt: end },
            studentId: studentId,
          },
        },
        {
          $project: {
            date: 1,
            meal: 1,
            wing: 1,
          },
        },
        {
          $sort: { date: 1 }, // Sort by date in ascending order
        },
      ];

      const meals = await Meal.aggregate(mealsPipeline).exec();
      console.log(meals,start, end,"hhi");
      // Index meals by date for faster lookup
      const mealMap = {};
      for (const meal of meals) {
        mealMap[meal.date] = meal;
      }

      // Combine bills and meals data
      combinedMealBill = bills
        .filter((bill) => {
          const meal = mealMap[bill.date];
          return meal;
        })
        .map((bill) => {
          return {
            date: bill.date,
            wing: bill.wing, // Include wing in the response
            mealBill: {
              breakfast: {
                ...bill.mealBill.breakfast,
                perHeadCost: bill.mealBill.breakfast.perHeadCost,
                status: mealMap[bill.date].meal.breakfast,
              },
              lunch: {
                ...bill.mealBill.lunch,
                perHeadCost: bill.mealBill.lunch.perHeadCost,
                status: mealMap[bill.date].meal.lunch,
              },
              dinner: {
                ...bill.mealBill.dinner,
                perHeadCost: bill.mealBill.dinner.perHeadCost,
                status: mealMap[bill.date].meal.dinner,
              },
            },
          };
        });
    } else {
      // If no studentId is provided, simply return bills without combining with meals
      combinedMealBill = bills;
    }

    res.status(200).json({
      message: `Bills and meals fetched successfully`,
      mealBillData: combinedMealBill,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching bills and meals" });
  }
});

module.exports = router;
