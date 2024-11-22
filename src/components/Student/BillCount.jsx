import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Axios } from "../../api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import convertToDDMMYYYY from "../../Utils/YYYYMMDDtoDDMMYYYY";

export default function BillCount() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealBillData, setMealBillData] = useState([]);
  const [hallFeasts, setHallFeasts] = useState([]);
  const [wing] = useState("MALE"); // Hardcoded wing state

  let totalBill = 0;

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1; // 1-based month for the API

        // Fetch the meal bill data
        const res = await Axios.get(
          `/cost/student?year=${year}&month=${month}&wing=${wing}`
        );
        setMealBillData(res.data.mealBillData);

        // Fetch the hall feast data for the selected month and wing
        const feastRes = await Axios.get(
          `/feast/month/${year}/${month}/wing/${wing}`
        );
        setHallFeasts(feastRes.data);
      } catch (err) {
        console.log("Error fetching bill data:", err);
      }
    };
    fetchBill();
  }, [selectedDate, wing]); // Use wing in the dependency array to refetch when wing changes

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  // Correctly calculate the days of the selected month
  const getDaysArray = useMemo(
    () => (year, month) => {
      const firstDayOfMonth = new Date(year, month - 1, 2);
      const lastDayOfMonth = new Date(year, month, 1);
      const days = [];
      for (
        let day = firstDayOfMonth;
        day <= lastDayOfMonth;
        day.setDate(day.getDate() + 1)
      ) {
        days.push(new Date(day).toISOString().split("T")[0]);
      }
      return days;
    },
    []
  );

  const daysOfMonth = getDaysArray(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1 // Pass the 1-based month value
  );

  return (
    <div className="lg:py-10 xs:text-base pb-10 px-5 text-xs lg:mr-12 max-h-screen flex flex-col">
      <div className="flex justify-between gap-2 h-auto">
        <h2 className="text-lg self-center xs:text-3xl font-semibold">
          Mess Bill
        </h2>
        <div className="">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            maxDate={new Date()}
            className="rounded-md border-2 border-gray-300 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out text-xs p-2 md:p-3 max-w-full"
            wrapperClassName="w-full"
            calendarClassName="mt-2 rounded-md border-2 border-gray-300 shadow-lg bg-white text-gray-800"
          />
        </div>
      </div>
      <div className="divider"></div>
      <div className="md:mt-4 overflow-y-scroll min-w-full">
        <div className="overflow-x-auto w-full">
          <table className=" divide-gray-200 shadow-md w-full">
            <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
              <tr className="text-xs font-thin text-gray-500">
                <th className="text-left">Date</th>
                <th>Guest Breakfast</th>
                <th>Guest Lunch</th>
                <th>Guest Dinner</th>
                <th>Breakfast</th>
                <th>Lunch</th>
                <th>Dinner</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {daysOfMonth.map((day) => {
                // Find if there is any hall feast on this day
                const onDay = hallFeasts.filter(
                  (item) => item.date.split("T")[0] === day
                );

                // Get bill data for the current day
                const billData = mealBillData.find((item) => item.date === day);
                const guestMeal = billData?.guestMeal;

                // Check if there is a hall feast for breakfast, lunch, or dinner
                const breakfastOn =
                  billData?.mealBill.breakfast.status ||
                  onDay.some((feast) => feast.meal === "breakfast");
                const lunchOn =
                  billData?.mealBill.lunch.status ||
                  onDay.some((feast) => feast.meal === "lunch");
                const dinnerOn =
                  billData?.mealBill.dinner.status ||
                  onDay.some((feast) => feast.meal === "dinner");

                // Calculate the costs
                const breakfastCost = breakfastOn
                  ? billData?.mealBill.breakfast.perHeadCost || 0
                  : 0;
                const lunchCost = lunchOn
                  ? billData?.mealBill.lunch.perHeadCost || 0
                  : 0;
                const dinnerCost = dinnerOn
                  ? billData?.mealBill.dinner.perHeadCost || 0
                  : 0;
                let guestBreakfast = 0;
                let guestLunch = 0;
                let guestDinner = 0;
                if (guestMeal) {
                  guestBreakfast +=
                    (guestMeal.breakfast ? guestMeal.breakfast : 0) *
                    breakfastCost;
                  guestLunch +=
                    (guestMeal.lunch ? guestMeal.lunch : 0) * lunchCost;
                  guestDinner +=
                    (guestMeal.dinner ? guestMeal.dinner : 0) * dinnerCost;
                }
                // Total cost for the day
                const dailyTotal =
                  breakfastCost +
                  lunchCost +
                  dinnerCost +
                  guestBreakfast +
                  guestLunch +
                  guestDinner;
                totalBill += dailyTotal;

                return (
                  <tr key={day} className="hover:bg-gray-100">
                    <td className="py-1  text-left">
                      {convertToDDMMYYYY(day)}
                    </td>
                    {billData ? (
                      <>
                        <td
                          className={`${
                            guestMeal?.breakfast > 0
                              ? "text-green-600 font-bold "
                              : "text-red-600 font-bold "
                          }`}
                        >
                          {guestMeal?.breakfast ? guestMeal.breakfast : 0.0}
                        </td>
                        <td
                          className={`${
                            guestMeal?.lunch > 0
                              ? "text-green-600 font-bold "
                              : "text-red-600 font-bold "
                          }`}
                        >
                          {guestMeal?.lunch ? guestMeal.lunch : 0}
                        </td>
                        <td
                          className={`${
                            guestMeal?.dinner > 0
                              ? "text-green-600 font-bold "
                              : "text-red-600 font-bold "
                          }`}
                        >
                          {guestMeal?.dinner ? guestMeal.dinner : 0}
                        </td>
                        <td
                          className={`${
                            breakfastOn
                              ? "text-green-600 font-bold "
                              : "text-red-600 font-bold "
                          }`}
                        >
                          {(
                            billData.mealBill.breakfast.perHeadCost.toFixed(2) *
                            (guestMeal?.breakfast
                              ? guestMeal?.breakfast
                              : 0 + (breakfastOn ? 1 : 0))
                          ).toFixed(2)}{" "}
                          ৳
                        </td>
                        <td
                          className={`${
                            lunchOn
                              ? "text-green-600 font-bold "
                              : "text-red-600 font-bold "
                          }`}
                        >
                          {(
                            billData.mealBill.lunch.perHeadCost.toFixed(2) *
                            (guestMeal?.lunch
                              ? guestMeal?.lunch
                              : 0 + (lunchOn ? 1 : 0))
                          ).toFixed(2)}{" "}
                          ৳
                        </td>
                        <td
                          className={`${
                            dinnerOn
                              ? "text-green-600 font-bold "
                              : "text-red-600 font-bold "
                          }`}
                        >
                          {(
                            billData.mealBill.dinner.perHeadCost.toFixed(2) *
                            (guestMeal?.dinner
                              ? guestMeal?.dinner
                              : 0 + (dinnerOn ? 1 : 0))
                          ).toFixed(2)}{" "}
                          ৳
                        </td>
                        <td className="">{dailyTotal.toFixed(2)} ৳</td>
                      </>
                    ) : (
                      <>
                        <td>0</td>
                        <td>0</td>
                        <td>0</td>
                        <td className="">0.00 ৳</td>
                        <td className="">0.00 ৳</td>
                        <td className="">0.00 ৳</td>
                        <td className="">0.00 ৳</td>
                      </>
                    )}
                  </tr>
                );
              })}
              {/* Grand Total Row */}
              <tr className="">
                <td className="font-bold pt-2 text-left">Grand Total</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                  <span className="font-bold">{totalBill.toFixed(2)} ৳</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
