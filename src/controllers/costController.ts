import { Router, Request, Response } from "express";
import Cost from "../models/cost";
import HallFeast from "../models/hallFeast";
import Meal from "../models/meal";
import { StockItem } from "../models/stock";
import Student from "../models/student";
import { createOrUpdateBill } from "../utils/billService";
import { createOrUpdateCostForMonth } from "../utils/createOrUpdateCostForMonth";
import { recomputeStockHistory } from "../utils/stockRecompute";
import { validateToken } from "../utils/validateToken";

const router = Router();

const r2 = (v: number): number => Math.round(v * 100) / 100;
const r4 = (v: number): number => Math.round(v * 10000) / 10000;

function calculatePerHeadCost(mealBill: {
  totalCost: number;
  totalStudent: number;
}): number {
  return mealBill.totalStudent > 0
    ? r4(mealBill.totalCost / mealBill.totalStudent)
    : 0;
}

router.post(
  "/generate-bills",
  validateToken,
  async (req: Request, res: Response) => {
    const { startDate, endDate, wing } = req.query as any;
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
        return res
          .status(400)
          .json({ error: "Invalid or missing wing parameter" });
      }

      const students = await Student.find(
        { gender: wing.toUpperCase() },
        { profileImage: 0, password: 0, firstTimeLogin: 0, status: 0 },
      ).exec();
      const studentIds = students.map((s) => s.studentId);

      const [bills, meals, hallFeasts] = await Promise.all([
        Cost.find({
          date: { $gte: start, $lte: end },
          wing: wing.toUpperCase(),
        }).exec(),
        Meal.find({
          date: { $gte: startDate, $lte: endDate },
          studentId: { $in: studentIds },
        }).exec(),
        HallFeast.find({
          date: { $gte: start, $lte: end },
          wing: wing.toUpperCase(),
        }).exec(),
      ]);

      const mealAttendanceMap: Record<string, Record<string, any>> = {};
      meals.forEach((meal) => {
        const mealDate = meal.date;
        if (!mealAttendanceMap[mealDate]) mealAttendanceMap[mealDate] = {};
        mealAttendanceMap[mealDate][meal.studentId] = {
          meal: meal.meal,
          guestMeal: meal.guestMeal,
        };
      });

      const hallFeastMap: Record<string, Record<string, boolean>> = {};
      hallFeasts.forEach((feast) => {
        const feastDate = feast.date.toISOString().split("T")[0];
        if (!hallFeastMap[feastDate]) hallFeastMap[feastDate] = {};
        hallFeastMap[feastDate][feast.meal] = true;
      });

      const studentInfo: Record<string, { totalCost: number }> = {};

      bills.forEach((bill) => {
        const billDate = bill.date.toISOString().split("T")[0];
        const perHeadCosts = {
          breakfast: calculatePerHeadCost(bill.mealBill.breakfast),
          lunch: calculatePerHeadCost(bill.mealBill.lunch),
          dinner: calculatePerHeadCost(bill.mealBill.dinner),
        };
        const attendanceOnDate = mealAttendanceMap[billDate] || {};
        const feastsOnDate = hallFeastMap[billDate] || {};

        studentIds.forEach((studentId) => {
          if (!studentInfo[studentId])
            studentInfo[studentId] = { totalCost: 0 };
          const studentData = attendanceOnDate[studentId];
          const studentMeals = studentData?.meal || {
            breakfast: false,
            lunch: false,
            dinner: false,
          };
          const guestMeal = studentData?.guestMeal || {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
          };

          if (feastsOnDate.breakfast || studentMeals.breakfast)
            studentInfo[studentId].totalCost = r2(
              studentInfo[studentId].totalCost + perHeadCosts.breakfast,
            );
          if (feastsOnDate.lunch || studentMeals.lunch)
            studentInfo[studentId].totalCost = r2(
              studentInfo[studentId].totalCost + perHeadCosts.lunch,
            );
          if (feastsOnDate.dinner || studentMeals.dinner)
            studentInfo[studentId].totalCost = r2(
              studentInfo[studentId].totalCost + perHeadCosts.dinner,
            );

          if (guestMeal.breakfast > 0)
            studentInfo[studentId].totalCost = r2(
              studentInfo[studentId].totalCost +
                r2(guestMeal.breakfast * perHeadCosts.breakfast),
            );
          if (guestMeal.lunch > 0)
            studentInfo[studentId].totalCost = r2(
              studentInfo[studentId].totalCost +
                r2(guestMeal.lunch * perHeadCosts.lunch),
            );
          if (guestMeal.dinner > 0)
            studentInfo[studentId].totalCost = r2(
              studentInfo[studentId].totalCost +
                r2(guestMeal.dinner * perHeadCosts.dinner),
            );
        });
      });

      const result = students.map((student) => ({
        ...student.toObject(),
        totalCost: studentInfo[student.studentId]
          ? r2(studentInfo[student.studentId].totalCost)
          : 0,
      }));

      res.status(200).json({
        message: `Student bills calculated successfully for dates between ${startDate} and ${endDate}`,
        result,
      });
    } catch (error) {
      console.error("Error during bill calculation:", error);
      res
        .status(500)
        .json({ message: "An error occurred during bill calculation" });
    }
  },
);

router.post("/sync", validateToken, async (req: Request, res: Response) => {
  try {
    const { month, year, wing } = req.query as any;
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res
        .status(400)
        .json({ error: "Invalid or missing wing parameter" });
    }

    const outWing = wing.toUpperCase();
    const stockItems = await StockItem.find({
      category: "STORED",
      wing: outWing,
    });
    const allAffectedDates = new Set<string>();

    for (const item of stockItems) {
      const affectedDates = await recomputeStockHistory(item._id, outWing);
      affectedDates.forEach((d) => allAffectedDates.add(d));
    }

    await Promise.all(
      Array.from(allAffectedDates).map((dateStr) =>
        createOrUpdateBill(dateStr, outWing),
      ),
    );

    res
      .status(200)
      .json({
        message: "Sync complete",
        affectedDates: Array.from(allAffectedDates).sort(),
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during sync" });
  }
});

router.post("/", validateToken, async (req: Request, res: Response) => {
  const queryDate = req.query.date as string;
  const wing = req.query.wing as string;
  try {
    const dateObj = new Date(queryDate);
    if (isNaN(dateObj.getTime()))
      return res.status(400).json({ error: "Invalid date format" });
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res
        .status(400)
        .json({ error: "Invalid or missing wing parameter" });
    }
    const bill = await createOrUpdateBill(queryDate, wing.toUpperCase());
    res
      .status(200)
      .json({
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

router.get("/student", validateToken, async (req: Request, res: Response) => {
  let studentId = req.user.studentId;
  const { month, year, studentId: queryStudentId, wing } = req.query as any;
  if (req.user.role === "admin" && queryStudentId) studentId = queryStudentId;

  try {
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res
        .status(400)
        .json({ error: "Invalid or missing wing parameter" });
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month));
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    const billsPipeline: any[] = [
      {
        $match: {
          date: { $gte: startDate, $lt: endDate },
          wing: wing.toUpperCase(),
        },
      },
      {
        $addFields: {
          "mealBill.breakfast.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.breakfast.totalStudent", 0] },
              {
                $round: [
                  {
                    $divide: [
                      "$mealBill.breakfast.totalCost",
                      "$mealBill.breakfast.totalStudent",
                    ],
                  },
                  4,
                ],
              },
              0,
            ],
          },
          "mealBill.lunch.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.lunch.totalStudent", 0] },
              {
                $round: [
                  {
                    $divide: [
                      "$mealBill.lunch.totalCost",
                      "$mealBill.lunch.totalStudent",
                    ],
                  },
                  4,
                ],
              },
              0,
            ],
          },
          "mealBill.dinner.perHeadCost": {
            $cond: [
              { $ne: ["$mealBill.dinner.totalStudent", 0] },
              {
                $round: [
                  {
                    $divide: [
                      "$mealBill.dinner.totalCost",
                      "$mealBill.dinner.totalStudent",
                    ],
                  },
                  4,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          mealBill: 1,
          wing: 1,
        },
      },
      { $sort: { date: 1 } },
    ];

    const bills = await Cost.aggregate(billsPipeline).exec();
    let combinedMealBill: any[];

    if (studentId) {
      const mealsPipeline: any[] = [
        { $match: { date: { $gte: start, $lt: end }, studentId } },
        { $project: { date: 1, meal: 1, wing: 1, guestMeal: 1 } },
        { $sort: { date: 1 } },
      ];
      const meals = await Meal.aggregate(mealsPipeline).exec();
      const mealMap: Record<string, any> = {};
      for (const meal of meals) mealMap[meal.date] = meal;

      combinedMealBill = bills.map((bill) => {
        const mealForDay = mealMap[bill.date];
        const mealStatus = mealForDay?.meal || {
          breakfast: false,
          lunch: false,
          dinner: false,
        };
        const guestMeal = mealForDay?.guestMeal || {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
        };

        return {
          date: bill.date,
          wing: bill.wing,
          guestMeal,
          mealBill: {
            breakfast: {
              ...bill.mealBill.breakfast,
              perHeadCost: bill.mealBill.breakfast.perHeadCost,
              status: mealStatus.breakfast,
            },
            lunch: {
              ...bill.mealBill.lunch,
              perHeadCost: bill.mealBill.lunch.perHeadCost,
              status: mealStatus.lunch,
            },
            dinner: {
              ...bill.mealBill.dinner,
              perHeadCost: bill.mealBill.dinner.perHeadCost,
              status: mealStatus.dinner,
            },
          },
        };
      });
    } else {
      combinedMealBill = bills;
    }

    res
      .status(200)
      .json({
        message: "Bills and meals fetched successfully",
        mealBillData: combinedMealBill,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching bills and meals" });
  }
});

router.post("/monthly", validateToken, async (req: Request, res: Response) => {
  const { month, year, wing } = req.query as any;
  try {
    if (!month || !year || isNaN(month) || isNaN(year)) {
      return res.status(400).json({ error: "Invalid month or year" });
    }
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res
        .status(400)
        .json({ error: "Invalid or missing wing parameter" });
    }
    const result = await createOrUpdateCostForMonth(
      year,
      month,
      wing.toUpperCase(),
    );
    res
      .status(200)
      .json({
        message: `Bills generated successfully for the ${wing} wing for the month of ${month}-${year}`,
        result,
      });
  } catch (error) {
    console.error("Error generating monthly bills:", error);
    res
      .status(500)
      .json({ error: "An error occurred while generating monthly bills" });
  }
});

router.get(
  "/monthly/all",
  validateToken,
  async (req: Request, res: Response) => {
    try {
      const { month, year, wing, search } = req.query as any;
      const pageNum = Math.max(1, parseInt(req.query.page as string) || 1);
      const limitNum = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 20),
      );

      if (!month || !year || isNaN(month) || isNaN(year)) {
        return res.status(400).json({ error: "Invalid month or year" });
      }
      if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
        return res
          .status(400)
          .json({ error: "Invalid or missing wing parameter" });
      }

      const studentFilter: any = { gender: wing.toUpperCase() };
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        studentFilter.$or = [
          { name: { $regex: escaped, $options: "i" } },
          { studentId: { $regex: escaped, $options: "i" } },
          { hallId: { $regex: escaped, $options: "i" } },
          { department: { $regex: escaped, $options: "i" } },
        ];
      }

      const totalStudents = await Student.countDocuments(studentFilter);
      const students = await Student.find(studentFilter, {
        studentId: 1,
        name: 1,
        hallId: 1,
        batch: 1,
        department: 1,
        roomNo: 1,
        gender: 1,
        residence: 1,
        _id: 0,
      })
        .sort({ hallId: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .exec();

      const studentIds = students.map((student) => student.studentId);
      const studentDetailsById = students.reduce((acc: any, student) => {
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
        return res
          .status(404)
          .json({ message: "No students found for the specified wing" });
      }

      const startDateString = `${year}-${month.toString().padStart(2, "0")}-01`;
      const endDateString = `${year}-${month.toString().padStart(2, "0")}-${new Date(year, month, 0).getDate().toString().padStart(2, "0")}`;

      const [meals, hallFeasts, costs] = await Promise.all([
        Meal.find(
          {
            studentId: { $in: studentIds },
            date: { $gte: startDateString, $lte: endDateString },
          },
          { studentId: 1, date: 1, meal: 1, guestMeal: 1, _id: 0 },
        ).exec(),
        HallFeast.find({
          date: {
            $gte: new Date(startDateString),
            $lte: new Date(endDateString),
          },
          wing: wing.toUpperCase(),
        }).exec(),
        Cost.find({
          date: {
            $gte: new Date(startDateString),
            $lte: new Date(endDateString),
          },
          wing: wing.toUpperCase(),
        }).exec(),
      ]);

      const mealStatusByStudent: Record<string, Record<string, any>> = {};
      const studentMonthlyCosts: Record<string, number> = {};

      studentIds.forEach((studentId) => {
        mealStatusByStudent[studentId] = {};
        studentMonthlyCosts[studentId] = 0;
        for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
          const formattedDate = `${day.toString().padStart(2, "0")}-${month}-${year}`;
          mealStatusByStudent[studentId][formattedDate] = {
            breakfast: false,
            lunch: false,
            dinner: false,
            perHeadCost: { breakfast: 0, lunch: 0, dinner: 0 },
            guestMeal: { breakfast: 0, lunch: 0, dinner: 0 },
          };
        }
      });

      const calcPerHeadCost = (totalCost: number, totalStudent: number) =>
        totalStudent > 0 ? r4(totalCost / totalStudent) : 0;

      meals.forEach((meal) => {
        const mealDate = new Date(meal.date).getUTCDate();
        const formattedDate = `${mealDate.toString().padStart(2, "0")}-${month}-${year}`;
        if (mealStatusByStudent[meal.studentId]) {
          mealStatusByStudent[meal.studentId][formattedDate] = {
            breakfast: meal.meal.breakfast,
            lunch: meal.meal.lunch,
            dinner: meal.meal.dinner,
            perHeadCost: { breakfast: 0, lunch: 0, dinner: 0 },
            guestMeal: {
              breakfast: meal?.guestMeal?.breakfast || 0,
              lunch: meal?.guestMeal?.lunch || 0,
              dinner: meal?.guestMeal?.dinner || 0,
            },
          };
        }
      });

      hallFeasts.forEach((feast) => {
        const feastDate = new Date(feast.date).getUTCDate();
        const formattedDate = `${feastDate.toString().padStart(2, "0")}-${month}-${year}`;
        studentIds.forEach((studentId) => {
          if (mealStatusByStudent[studentId]?.[formattedDate]) {
            (mealStatusByStudent[studentId][formattedDate] as any)[feast.meal] =
              true;
          }
        });
      });

      costs.forEach((cost) => {
        const costDate = new Date(cost.date).getUTCDate();
        const formattedDate = `${costDate.toString().padStart(2, "0")}-${month}-${year}`;
        const perHeadBreakfastCost = calcPerHeadCost(
          cost.mealBill.breakfast.totalCost,
          cost.mealBill.breakfast.totalStudent,
        );
        const perHeadLunchCost = calcPerHeadCost(
          cost.mealBill.lunch.totalCost,
          cost.mealBill.lunch.totalStudent,
        );
        const perHeadDinnerCost = calcPerHeadCost(
          cost.mealBill.dinner.totalCost,
          cost.mealBill.dinner.totalStudent,
        );

        studentIds.forEach((studentId) => {
          const mealStatus = mealStatusByStudent[studentId][formattedDate];
          const { guestMeal } = mealStatus;
          if (guestMeal.breakfast > 0)
            studentMonthlyCosts[studentId] = r2(
              studentMonthlyCosts[studentId] +
                r2(guestMeal.breakfast * perHeadBreakfastCost),
            );
          if (guestMeal.lunch > 0)
            studentMonthlyCosts[studentId] = r2(
              studentMonthlyCosts[studentId] +
                r2(guestMeal.lunch * perHeadLunchCost),
            );
          if (guestMeal.dinner > 0)
            studentMonthlyCosts[studentId] = r2(
              studentMonthlyCosts[studentId] +
                r2(guestMeal.dinner * perHeadDinnerCost),
            );
          if (mealStatus?.breakfast) {
            studentMonthlyCosts[studentId] = r2(
              studentMonthlyCosts[studentId] + perHeadBreakfastCost,
            );
            mealStatus.perHeadCost.breakfast = perHeadBreakfastCost;
          }
          if (mealStatus?.lunch) {
            studentMonthlyCosts[studentId] = r2(
              studentMonthlyCosts[studentId] + perHeadLunchCost,
            );
            mealStatus.perHeadCost.lunch = perHeadLunchCost;
          }
          if (mealStatus?.dinner) {
            studentMonthlyCosts[studentId] = r2(
              studentMonthlyCosts[studentId] + perHeadDinnerCost,
            );
            mealStatus.perHeadCost.dinner = perHeadDinnerCost;
          }
        });
      });

      Object.keys(studentMonthlyCosts).forEach((id) => {
        studentMonthlyCosts[id] = r2(studentMonthlyCosts[id]);
      });

      res.status(200).json({
        message: `Meal status, hall feast information, monthly costs, and student details for the ${wing} wing for the month of ${month}-${year}`,
        studentMonthlyCosts,
        studentDetailsById,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalStudents,
          totalPages: Math.ceil(totalStudents / limitNum),
        },
      });
    } catch (error) {
      console.error(
        "Error fetching meal status, hall feasts, monthly costs, and student details:",
        error,
      );
      res
        .status(500)
        .json({
          error:
            "An error occurred while fetching meal status, hall feasts, monthly costs, and student details",
        });
    }
  },
);

router.get(
  "/monthly/student",
  validateToken,
  async (req: Request, res: Response) => {
    try {
      const { month, year, studentId } = req.query as any;
      if (!month || !year || isNaN(month) || isNaN(year)) {
        return res.status(400).json({ error: "Invalid month or year" });
      }
      if (!studentId)
        return res
          .status(400)
          .json({ error: "Invalid or missing studentId parameter" });

      const student = await Student.findOne(
        { studentId },
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
        },
      ).exec();
      if (!student)
        return res.status(404).json({ message: "Student not found" });

      const startDateString = `${year}-${month.toString().padStart(2, "0")}-01`;
      const endDateString = `${year}-${month.toString().padStart(2, "0")}-${new Date(year, month, 0).getDate().toString().padStart(2, "0")}`;

      const [meals, hallFeasts, costs] = await Promise.all([
        Meal.find(
          { studentId, date: { $gte: startDateString, $lte: endDateString } },
          { studentId: 1, date: 1, meal: 1, guestMeal: 1, _id: 0 },
        ).exec(),
        HallFeast.find({
          date: {
            $gte: new Date(startDateString),
            $lte: new Date(endDateString),
          },
          wing: student.gender.toUpperCase(),
        }).exec(),
        Cost.find({
          date: {
            $gte: new Date(startDateString),
            $lte: new Date(endDateString),
          },
          wing: student.gender.toUpperCase(),
        }).exec(),
      ]);

      const mealStatusByDay: Record<string, any> = {};
      let totalMonthlyCost = 0;

      for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
        const formattedDate = `${day.toString().padStart(2, "0")}-${month}-${year}`;
        mealStatusByDay[formattedDate] = {
          breakfast: false,
          lunch: false,
          dinner: false,
          perHeadCost: { breakfast: 0, lunch: 0, dinner: 0 },
          guestMeal: { breakfast: 0, lunch: 0, dinner: 0 },
        };
      }

      const calcPerHeadCost = (totalCost: number, totalStudent: number) =>
        totalStudent > 0 ? r4(totalCost / totalStudent) : 0;

      meals.forEach((meal) => {
        const mealDate = new Date(meal.date).getUTCDate();
        const formattedDate = `${mealDate.toString().padStart(2, "0")}-${month}-${year}`;
        if (mealStatusByDay[formattedDate]) {
          mealStatusByDay[formattedDate] = {
            breakfast: meal.meal.breakfast,
            lunch: meal.meal.lunch,
            dinner: meal.meal.dinner,
            perHeadCost: { breakfast: 0, lunch: 0, dinner: 0 },
            guestMeal: {
              breakfast: meal?.guestMeal?.breakfast || 0,
              lunch: meal?.guestMeal?.lunch || 0,
              dinner: meal?.guestMeal?.dinner || 0,
            },
          };
        }
      });

      const hallFeastsMap = hallFeasts.reduce((map: any, feast) => {
        const dateStr = feast.date.toISOString().split("T")[0];
        if (!map[dateStr]) map[dateStr] = {};
        map[dateStr][feast.meal] = true;
        return map;
      }, {});

      const costsMap = costs.reduce((map: any, cost) => {
        const dateStr = cost.date.toISOString().split("T")[0];
        map[dateStr] = cost.mealBill;
        return map;
      }, {});

      Object.keys(mealStatusByDay).forEach((formattedDate) => {
        const [day, m, y] = formattedDate.split("-").map(Number);
        const dateStr = `${y}-${m.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        const mealStatus = mealStatusByDay[formattedDate];
        const hallFeastForDay = hallFeastsMap[dateStr] || {};
        const costForDay = costsMap[dateStr];

        if (costForDay) {
          const perHeadCosts = {
            breakfast: calcPerHeadCost(
              costForDay.breakfast.totalCost,
              costForDay.breakfast.totalStudent,
            ),
            lunch: calcPerHeadCost(
              costForDay.lunch.totalCost,
              costForDay.lunch.totalStudent,
            ),
            dinner: calcPerHeadCost(
              costForDay.dinner.totalCost,
              costForDay.dinner.totalStudent,
            ),
          };
          ["breakfast", "lunch", "dinner"].forEach((mealType) => {
            const isFeast = hallFeastForDay[mealType];
            const guestMealCount = mealStatus.guestMeal[mealType];
            if (isFeast) mealStatus[mealType] = true;
            if (isFeast || mealStatus[mealType]) {
              totalMonthlyCost = r2(
                totalMonthlyCost + (perHeadCosts as any)[mealType],
              );
              mealStatus.perHeadCost[mealType] = (perHeadCosts as any)[
                mealType
              ];
            }
            totalMonthlyCost = r2(
              totalMonthlyCost +
                r2(guestMealCount * (perHeadCosts as any)[mealType]),
            );
          });
        }
      });

      res.status(200).json({
        message: `Meal status and monthly cost for student ${studentId} for the month of ${month}-${year}`,
        studentDetails: student,
        mealStatusByDay,
        totalMonthlyCost: r2(totalMonthlyCost),
      });
    } catch (error) {
      console.error(
        "Error fetching meal status and monthly cost for student:",
        error,
      );
      res
        .status(500)
        .json({
          error:
            "An error occurred while fetching meal status and monthly cost for student",
        });
    }
  },
);

export default router;
