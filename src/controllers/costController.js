const router = require("express").Router();
const Cost = require("../models/cost");
const Meal = require("../models/meal");
const { StockItem, StockTransaction, Stock } = require("../models/stock");
const Student = require("../models/student");
const { createOrUpdateBill } = require("../utils/billService");
const { createOrUpdateCostForMonth } = require("../utils/createOrUpdateCostForMonth");
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

router.post("/sync", validateToken, async (req, res) => {
  try {
    const { month, year, wing } = req.query;
    const stockItems = await StockItem.find({category: "STORED"});

    // Initialize objects to store the leftover items, IN items, OUT items, and average prices
    let leftOverItems = {};
    let inItems = {};
    let outItems = {};
    let avgItemPrice = {};

    // Define the start and end dates for the given month and year
    const startDate = new Date(year, month - 1, 1); // Start of the month
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month

    // Define next month's dates
    const nextMonth = (month % 12) + 1;
    const nextYear = Number(month) === 12 ? Number(year) + 1 : year;
    const nextMonthStartDate = new Date(nextYear, nextMonth - 1, 2);
    const nextMonthEndDate = new Date(nextYear, nextMonth, 0, 23, 59, 59);

    const bulkStockUpdates = [];
    const bulkTransactionUpdates = [];
    const newLeftOverTransactions = [];

    // Use for...of to handle async operations
    for (const item of stockItems) {
      // Fetch all transactions in parallel
      const [leftOverTransactions, inTransactions, outTransactions] = await Promise.all([
        StockTransaction.find({
          item: item._id,
          type: "LEFT_OVER",
          date: { $gte: startDate, $lte: endDate },
          wing: wing,
        }),
        StockTransaction.find({
          item: item._id,
          type: "IN",
          date: { $gte: startDate, $lte: endDate },
          wing: wing,
        }),
        StockTransaction.find({
          item: item._id,
          type: "OUT",
          date: { $gte: startDate, $lte: endDate },
          wing: wing,
        })
      ]);

      // Map item._id to its corresponding transactions
      leftOverItems[item._id] = leftOverTransactions[0] || null; // First LEFT_OVER transaction
      inItems[item._id] = inTransactions;
      outItems[item._id] = outTransactions;

      let previousLeftOver = 0;
      let stockIn = 0;
      let stockOut = 0;
      let totalAmount = 0;
      let averagePrice = 0;

      // Calculate the previous leftover quantity and total amount
      if (leftOverTransactions.length > 0) {
        previousLeftOver = leftOverTransactions[0].quantityChange;
        totalAmount += leftOverTransactions[0].transactionAmount;
      }

      // Calculate stockIn (IN transactions) and total amount
      inTransactions.forEach((transaction) => {
        stockIn += transaction.quantityChange;
        totalAmount += transaction.transactionAmount;
      });

      // Calculate stockOut (OUT transactions)
      outTransactions.forEach((transaction) => {
        stockOut += transaction.quantityChange;
      });
      // Calculate total quantity as previousLeftOver + stockIn - stockOut
      const totalQuantity = previousLeftOver + stockIn - stockOut;

      // Calculate average price if totalQuantity is not zero
      averagePrice = (previousLeftOver + stockIn) > 0 ? totalAmount / (previousLeftOver + stockIn) : 0;
      avgItemPrice[item._id] = averagePrice;

      // Update OUT transaction amounts based on the average price
      if (outTransactions.length > 0) {
        outTransactions.forEach((transaction) => {
          const newTransactionAmount = averagePrice * transaction.quantityChange;
          bulkTransactionUpdates.push({
            updateOne: {
              filter: { _id: transaction._id },
              update: { $set: { transactionAmount: newTransactionAmount } },
            },
          });
        });
      }

      // Check if the stock already exists for the item
      const stock = await Stock.findOne({ item: item._id, wing: wing });
      if (stock) {
        // Update the stock with the calculated total quantity and price
        bulkStockUpdates.push({
          updateOne: {
            filter: { _id: stock._id },
            update: { $set: { quantity: totalQuantity, price: averagePrice } },
          },
        });
      } else if (inTransactions.length > 0 || outTransactions.length > 0 || leftOverTransactions.length > 0) {
        return res.status(500).json({ message: "Stock not found but transaction found!" });
      }

      // Calculate the overall quantity for the next month
      const nextMonthLeftoverQuantity = stockIn + previousLeftOver - stockOut;

      // Check if a leftover transaction exists for the next month
      const nextMonthLeftOver = await StockTransaction.findOne({
        item: item._id,
        type: "LEFT_OVER",
        date: { $gte: nextMonthStartDate, $lte: nextMonthEndDate },
        wing: wing,
      });

      if (nextMonthLeftOver) {
        // If the leftover transaction exists, update it with the new quantity and price
        bulkTransactionUpdates.push({
          updateOne: {
            filter: { _id: nextMonthLeftOver._id },
            update: {
              $set: {
                quantityChange: nextMonthLeftoverQuantity,
                transactionAmount: averagePrice * nextMonthLeftoverQuantity
              }
            }
          }
        });
      } else if (nextMonthLeftoverQuantity > 0) {
        // Create a new LEFT_OVER transaction for the next month if it doesn't exist
        newLeftOverTransactions.push({
          item: item._id,
          type: "LEFT_OVER",
          meal: "-",
          date: nextMonthStartDate,
          wing: wing,
          quantityChange: nextMonthLeftoverQuantity,
          transactionAmount: averagePrice * nextMonthLeftoverQuantity,
        });
      }
    }

    // Perform bulk updates for stocks and transactions
    if (bulkStockUpdates.length > 0) {
      await Stock.bulkWrite(bulkStockUpdates);
    }
    if (bulkTransactionUpdates.length > 0) {
      await StockTransaction.bulkWrite(bulkTransactionUpdates);
    }

    // Insert new leftover transactions if any
    if (newLeftOverTransactions.length > 0) {
      await StockTransaction.insertMany(newLeftOverTransactions);
    }

    res.status(200).json({ message: "done", leftOverItems, inItems, outItems, avgItemPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred", error });
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


module.exports = router;
