const router = require("express").Router();
const r2 = (v) => Math.round(v * 100) / 100;
const r4 = (v) => Math.round(v * 10000) / 10000;
const Cost = require("../models/cost");
const HallFeast = require("../models/hallFeast");
const Meal = require("../models/meal");
const { StockItem } = require("../models/stock");
const Student = require("../models/student");
const { createOrUpdateBill } = require("../utils/billService");
const { createOrUpdateCostForMonth } = require("../utils/createOrUpdateCostForMonth");
const { recomputeStockHistory } = require("../utils/stockRecompute");
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
        totalCost: studentInfo[studentId] ? r2(studentInfo[studentId].totalCost) : 0
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
  return mealBill.totalStudent > 0 ? r4(mealBill.totalCost / mealBill.totalStudent) : 0;
}

router.post("/sync", validateToken, async (req, res) => {
  try {
    const { month, year, wing } = req.query;

    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    const outWing = wing.toUpperCase();

    const stockItems = await StockItem.find({ category: "STORED", wing: outWing });
    const allAffectedDates = new Set();

    for (const item of stockItems) {
      // Replay all IN/OUT transactions from the beginning, correcting every STORED
      // OUT amount and syncing Stock.quantity/price.
      const affectedDates = await recomputeStockHistory(item._id, outWing);
      affectedDates.forEach((d) => allAffectedDates.add(d));
    }

    // Regenerate Cost documents for every date where OUT amounts changed
    await Promise.all(
      Array.from(allAffectedDates).map((dateStr) => createOrUpdateBill(dateStr, outWing))
    );

    res.status(200).json({
      message: "Sync complete",
      affectedDates: Array.from(allAffectedDates).sort(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during sync", error });
  }
});

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
  // If the user is an admin and a studentId is provided in the query, use it
  if (req.user.role === "admin" && queryStudentId) {
    studentId = queryStudentId;
  }
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
                $round: [{ $divide: ["$mealBill.breakfast.totalCost", "$mealBill.breakfast.totalStudent"] }, 4],
              },
              0,
            ],
          },
          "mealBill.lunch.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.lunch.totalStudent", 0] },
              {
                $round: [{ $divide: ["$mealBill.lunch.totalCost", "$mealBill.lunch.totalStudent"] }, 4],
              },
              0,
            ],
          },
          "mealBill.dinner.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.dinner.totalStudent", 0] },
              {
                $round: [{ $divide: ["$mealBill.dinner.totalCost", "$mealBill.dinner.totalStudent"] }, 4],
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
            guestMeal: 1
          },
        },
        {
          $sort: { date: 1 }, // Sort by date in ascending order
        },
      ];

      const meals = await Meal.aggregate(mealsPipeline).exec();
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
            wing: bill.wing,
            guestMeal: mealMap[bill.date].guestMeal,
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

// Route to create or update bills for all days in a given month
router.post("/monthly", validateToken, async (req, res) => {
  const { month, year, wing } = req.query;

  try {
    // Validate the input parameters
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Call the service function to process all bills for the given month and wing
    const result = await createOrUpdateCostForMonth(year, month, wing.toUpperCase());

    // Send a success response
    res.status(200).json({
      message: `Bills generated successfully for the ${wing} wing for the month of ${month}-${year}`,
      result,
    });
  } catch (error) {
    console.error("Error generating monthly bills:", error);
    res.status(500).json({ error: "An error occurred while generating monthly bills" });
  }
});

router.get("/monthly/all", validateToken, async (req, res) => {
  try {
    const { month, year, wing, search } = req.query;
    const pageNum  = Math.max(1, parseInt(req.query.page)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    // Validate month and year
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    // Validate wing
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    // Build student filter
    const studentFilter = { gender: wing.toUpperCase() };
    if (search) {
      studentFilter.$or = [
        { name:      { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { hallId:    { $regex: search, $options: "i" } },
        { department:{ $regex: search, $options: "i" } },
      ];
    }

    // Count total matching students for pagination metadata
    const totalStudents = await Student.countDocuments(studentFilter);

    // Fetch only the current page of students
    const students = await Student.find(
      studentFilter,
      {
        studentId: 1,
        name: 1,
        hallId: 1,
        batch: 1,
        department: 1,
        roomNo: 1,
        gender: 1,
        residence: 1,
        _id: 0,
      }
    )
      .sort({ hallId: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .exec();

    // Extract only the studentId field into an array and map details into a new object
    const studentIds = students.map(student => student.studentId);
    const studentDetailsById = students.reduce((acc, student) => {
      acc[student.studentId] = {
        name: student.name,
        hallId: student.hallId,
        batch: student.batch,
        department: student.department,
        roomNo: student.roomNo,
        gender: student.gender,
        residence: student.residence,
      };
      return acc;
    }, {});

    if (!students || studentIds.length === 0) {
      return res.status(404).json({ message: "No students found for the specified wing" });
    }

    // Calculate start and end dates of the month and convert them to string format (YYYY-MM-DD)
    const startDateString = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDateString = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate().toString().padStart(2, '0')}`;

    // Fetch all meals within the specified date range and for the studentIds
    const meals = await Meal.find(
      {
        studentId: { $in: studentIds },
        date: { $gte: startDateString, $lte: endDateString },
      },
      { studentId: 1, date: 1, meal: 1, guestMeal: 1, _id: 0 }
    ).exec();

    // Fetch all hall feasts for the specified month and wing
    const hallFeasts = await HallFeast.find({
      date: { $gte: new Date(startDateString), $lte: new Date(endDateString) },
      wing: wing.toUpperCase(),
    }).exec();

    // Fetch all costs for the given month and wing
    const costs = await Cost.find({
      date: { $gte: new Date(startDateString), $lte: new Date(endDateString) },
      wing: wing.toUpperCase(),
    }).exec();

    // Initialize the result object to store meal status for each studentId and their total cost
    const mealStatusByStudent = {};
    const studentMonthlyCosts = {};

    // Initialize meal status and total cost for each student for each day of the month
    studentIds.forEach(studentId => {
      mealStatusByStudent[studentId] = {};
      studentMonthlyCosts[studentId] = 0;

      for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
        const formattedDate = `${day.toString().padStart(2, "0")}-${month}-${year}`;
        mealStatusByStudent[studentId][formattedDate] = {
          breakfast: false,
          lunch: false,
          dinner: false,
          perHeadCost: {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
          },
          guestMeal: { breakfast: 0, lunch: 0, dinner: 0 },
        };
      }
    });

    // Helper function to calculate per-head cost
    const calculatePerHeadCost = (totalCost, totalStudent) => {
      return totalStudent > 0 ? r4(totalCost / totalStudent) : 0;
    };

    // Populate meal status based on the fetched meals and calculate monthly cost
    meals.forEach(meal => {
      const mealDate = new Date(meal.date).getUTCDate();
      const formattedDate = `${mealDate.toString().padStart(2, "0")}-${month}-${year}`;
      if (mealStatusByStudent[meal.studentId]) {
        mealStatusByStudent[meal.studentId][formattedDate] = {
          breakfast: meal.meal.breakfast,
          lunch: meal.meal.lunch,
          dinner: meal.meal.dinner,
          perHeadCost: {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
          },
          guestMeal: {
            breakfast: meal?.guestMeal?.breakfast || 0,
            lunch: meal?.guestMeal?.lunch || 0,
            dinner: meal?.guestMeal?.dinner || 0,
          }
        };
      }
    });

    // Override meal status with hall feast participation (true for all students)
    hallFeasts.forEach(feast => {
      const feastDate = new Date(feast.date).getUTCDate();
      const formattedDate = `${feastDate.toString().padStart(2, "0")}-${month}-${year}`;

      // For all students, mark the feast meal as true
      studentIds.forEach(studentId => {
        if (mealStatusByStudent[studentId] && mealStatusByStudent[studentId][formattedDate]) {
          mealStatusByStudent[studentId][formattedDate][feast.meal] = true;
        }
      });
    });

    // Calculate total monthly cost for each student based on per-head cost and participation
    costs.forEach(cost => {
      const costDate = new Date(cost.date).getUTCDate();
      const formattedDate = `${costDate.toString().padStart(2, "0")}-${month}-${year}`;

      const perHeadBreakfastCost = calculatePerHeadCost(cost.mealBill.breakfast.totalCost, cost.mealBill.breakfast.totalStudent);
      const perHeadLunchCost = calculatePerHeadCost(cost.mealBill.lunch.totalCost, cost.mealBill.lunch.totalStudent);
      const perHeadDinnerCost = calculatePerHeadCost(cost.mealBill.dinner.totalCost, cost.mealBill.dinner.totalStudent);

      studentIds.forEach(studentId => {
        const mealStatus = mealStatusByStudent[studentId][formattedDate];
        const guestBreakfast = mealStatus.guestMeal.breakfast;
        const guestLunch = mealStatus.guestMeal.lunch;
        const guestDinner = mealStatus.guestMeal.dinner;

        if(guestBreakfast > 0){
          studentMonthlyCosts[studentId] += guestBreakfast * perHeadBreakfastCost;
        }
        if(guestLunch > 0){
          studentMonthlyCosts[studentId] += guestLunch * perHeadLunchCost;
        }
        if(guestDinner > 0){
          studentMonthlyCosts[studentId] += guestDinner * perHeadDinnerCost;
        }

        if (mealStatus) {
          if (mealStatus.breakfast) {
            studentMonthlyCosts[studentId] += perHeadBreakfastCost;
            mealStatusByStudent[studentId][formattedDate].perHeadCost.breakfast = perHeadBreakfastCost;
          }
          if (mealStatus.lunch) {
            studentMonthlyCosts[studentId] += perHeadLunchCost;
            mealStatusByStudent[studentId][formattedDate].perHeadCost.lunch = perHeadLunchCost;
          }
          if (mealStatus.dinner) {
            studentMonthlyCosts[studentId] += perHeadDinnerCost;
            mealStatusByStudent[studentId][formattedDate].perHeadCost.dinner = perHeadDinnerCost;
          }
        }
      });
    });

    // Round final monthly totals per student
    Object.keys(studentMonthlyCosts).forEach((id) => {
      studentMonthlyCosts[id] = r2(studentMonthlyCosts[id]);
    });

    // Return the meal status, total monthly cost, and student details for each student
    res.status(200).json({
      message: `Meal status, hall feast information, monthly costs, and student details for the ${wing} wing for the month of ${month}-${year}`,
      studentMonthlyCosts,
      studentDetailsById,
      pagination: {
        page:       pageNum,
        limit:      limitNum,
        total:      totalStudents,
        totalPages: Math.ceil(totalStudents / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching meal status, hall feasts, monthly costs, and student details:", error);
    res.status(500).json({ error: "An error occurred while fetching meal status, hall feasts, monthly costs, and student details" });
  }
});

router.get("/monthly/student", validateToken, async (req, res) => {
  try {
    const { month, year, studentId } = req.query;

    // Validate month, year, and studentId
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }

    if (!studentId) {
      return res.status(400).json({ error: "Invalid or missing studentId parameter" });
    }

    // Fetch the student to verify if the student exists
    const student = await Student.findOne({ studentId }, {
      studentId: 1,
      name: 1,
      hallId: 1,
      batch: 1,
      department: 1,
      roomNo: 1,
      gender: 1,
      residence: 1,
      _id: 0,
    }).exec();

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Calculate start and end dates of the month and convert them to string format (YYYY-MM-DD)
    const startDateString = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDateString = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate().toString().padStart(2, '0')}`;

    // Fetch all meals for the student within the specified date range
    const meals = await Meal.find(
      {
        studentId,
        date: { $gte: startDateString, $lte: endDateString },
      },
      { studentId: 1, date: 1, meal: 1, guestMeal: 1, _id: 0 }
    ).exec();

    // Fetch all hall feasts for the specified month and the student's gender
    const hallFeasts = await HallFeast.find({
      date: { $gte: new Date(startDateString), $lte: new Date(endDateString) },
      wing: student.gender.toUpperCase(),
    }).exec();

    // Fetch all costs for the given month and the student's gender
    const costs = await Cost.find({
      date: { $gte: new Date(startDateString), $lte: new Date(endDateString) },
      wing: student.gender.toUpperCase(),
    }).exec();

    // Initialize the meal status object and total cost
    const mealStatusByDay = {};
    let totalMonthlyCost = 0;

    // Initialize meal status and total cost for each day of the month
    for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
      const formattedDate = `${day.toString().padStart(2, "0")}-${month}-${year}`;
      mealStatusByDay[formattedDate] = {
        breakfast: false,
        lunch: false,
        dinner: false,
        perHeadCost: {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
        },
        guestMeal: { breakfast: 0, lunch: 0, dinner: 0 },
      };
    }

    // Helper function to calculate per-head cost
    const calculatePerHeadCost = (totalCost, totalStudent) => {
      return totalStudent > 0 ? r4(totalCost / totalStudent) : 0;
    };

    // Populate meal status based on the fetched meals
    meals.forEach((meal) => {
      const mealDate = new Date(meal.date).getUTCDate();
      const formattedDate = `${mealDate.toString().padStart(2, "0")}-${month}-${year}`;

      if (mealStatusByDay[formattedDate]) {
        mealStatusByDay[formattedDate] = {
          breakfast: meal.meal.breakfast,
          lunch: meal.meal.lunch,
          dinner: meal.meal.dinner,
          perHeadCost: {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
          },
          guestMeal: {
            breakfast: meal?.guestMeal?.breakfast || 0,
            lunch: meal?.guestMeal?.lunch || 0,
            dinner: meal?.guestMeal?.dinner || 0,
          }
        };
      }
    });

    // Pre-process hallFeasts into a map for quick lookup by date
    const hallFeastsMap = hallFeasts.reduce((map, feast) => {
      const dateStr = feast.date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
      if (!map[dateStr]) {
        map[dateStr] = {};
      }
      map[dateStr][feast.meal] = true; // Mark the meal as a feast
      return map;
    }, {});

    // Pre-process costs into a map for quick lookup by date
    const costsMap = costs.reduce((map, cost) => {
      const dateStr = cost.date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
      map[dateStr] = cost.mealBill; // Store mealBill for the date
      return map;
    }, {});

    // Process meals and calculate costs
    Object.keys(mealStatusByDay).forEach((formattedDate) => {
      const [day, month, year] = formattedDate.split("-").map(Number);
      const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      
      const mealStatus = mealStatusByDay[formattedDate];
      const hallFeastForDay = hallFeastsMap[dateStr] || {};
      const costForDay = costsMap[dateStr];

      if (costForDay) {
        // Calculate per-head costs
        const perHeadCosts = {
          breakfast: calculatePerHeadCost(costForDay.breakfast.totalCost, costForDay.breakfast.totalStudent),
          lunch: calculatePerHeadCost(costForDay.lunch.totalCost, costForDay.lunch.totalStudent),
          dinner: calculatePerHeadCost(costForDay.dinner.totalCost, costForDay.dinner.totalStudent),
        };

        // Calculate meal costs if no feast overrides
        ["breakfast", "lunch", "dinner"].forEach((mealType) => {
          const isFeast = hallFeastForDay[mealType];
          const guestMealCount = mealStatus.guestMeal[mealType];

          if (!isFeast && mealStatus[mealType]) {
            totalMonthlyCost += perHeadCosts[mealType];
            mealStatus.perHeadCost[mealType] = perHeadCosts[mealType];
          }

          // Add guest meal costs
          totalMonthlyCost += guestMealCount * perHeadCosts[mealType];
        });
      }
    });

    // Return the meal status and total monthly cost for the student
    res.status(200).json({
      message: `Meal status and monthly cost for student ${studentId} for the month of ${month}-${year}`,
      studentDetails: student,
      mealStatusByDay,
      totalMonthlyCost: r2(totalMonthlyCost),
    });
  } catch (error) {
    console.error("Error fetching meal status and monthly cost for student:", error);
    res.status(500).json({
      error: "An error occurred while fetching meal status and monthly cost for student",
    });
  }
});

module.exports = router;
