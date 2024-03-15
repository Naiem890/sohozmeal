import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Axios } from "../../api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function BillCount() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mealBillData, setMealBillData] = useState([]);
  let totalBill = 0;

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const res = await Axios.get(
          `/bill/student?year=${year}&month=${month}`
        );
        setMealBillData(res.data.mealBillData);
      } catch (err) {
        console.log("Error fetching bill data:", err);
      }
    };
    fetchBill();
  }, [selectedDate]);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  const getDaysArray = useMemo(
    () => (year, month) => {
      const numDays = new Date(year, month, 0).getDate();
      return Array.from(
        { length: numDays },
        (_, i) => new Date(year, month - 1, i + 2).toISOString().split("T")[0]
      );
    },
    []
  );

  const daysOfMonth = getDaysArray(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1
  );

  return (
    <div className="lg:py-10 xs:text-base pb-10 px-5 text-xs lg:mr-12 max-h-screen flex flex-col">
      <div className="flex justify-between gap-2 h-auto">
        <h2 className="text-lg self-center xs:text-3xl font-semibold">
          Mess Bill:
        </h2>
        <div className="">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="rounded-md border-2 border-gray-300 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out text-xs p-2 md:p-3 max-w-full"
            wrapperClassName="w-full"
            calendarClassName="mt-2 rounded-md border-2 border-gray-300 shadow-lg bg-white text-gray-800"
          />
        </div>
      </div>
      <div className="divider"></div>
      <div className="md:mt-4 overflow-y-scroll min-w-full">
        <div className="overflow-x-hidden w-full">
          <table className=" divide-gray-200 shadow-md w-full">
            <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
              <tr className="text-xs font-thin text-gray-500">
                <th className="text-left">Date</th>
                <th>Breakfast</th>
                <th>Lunch</th>
                <th>Dinner</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {daysOfMonth.map((day) => {
                const billData = mealBillData.find((item) => item.date === day);
                if (billData) {
                  totalBill +=
                    (billData.mealBill.breakfast.status
                      ? billData.mealBill.breakfast.perHeadCost
                      : 0) +
                    (billData.mealBill.lunch.status
                      ? billData.mealBill.lunch.perHeadCost
                      : 0) +
                    (billData.mealBill.dinner.status
                      ? billData.mealBill.dinner.perHeadCost
                      : 0);
                }
                return (
                  <tr key={day} className="hover:bg-gray-100">
                    <td className="py-1 whitespace-nowrap text-left">{day}</td>
                    {billData ? (
                      <>
                        <td
                          className={`${
                            billData.mealBill.breakfast.status
                              ? "text-green-600 font-bold whitespace-nowrap"
                              : "text-red-600 font-bold whitespace-nowrap"
                          }`}
                        >
                          {billData.mealBill.breakfast.perHeadCost.toFixed(2)} ৳
                        </td>
                        <td
                          className={`${
                            billData.mealBill.lunch.status
                              ? "text-green-600 font-bold whitespace-nowrap"
                              : "text-red-600 font-bold whitespace-nowrap"
                          }`}
                        >
                          {billData.mealBill.lunch.perHeadCost.toFixed(2)} ৳
                        </td>
                        <td
                          className={`${
                            billData.mealBill.dinner.status
                              ? "text-green-600 font-bold whitespace-nowrap"
                              : "text-red-600 font-bold whitespace-nowrap"
                          }`}
                        >
                          {billData.mealBill.dinner.perHeadCost.toFixed(2)} ৳
                        </td>
                        <td className="whitespace-nowrap">
                          {(
                            (billData.mealBill.breakfast.status
                              ? billData.mealBill.breakfast.perHeadCost
                              : 0) +
                            (billData.mealBill.lunch.status
                              ? billData.mealBill.lunch.perHeadCost
                              : 0) +
                            (billData.mealBill.dinner.status
                              ? billData.mealBill.dinner.perHeadCost
                              : 0)
                          ).toFixed(2)}{" "}
                          ৳
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="whitespace-nowrap">0.00 ৳</td>
                        <td className="whitespace-nowrap">0.00 ৳</td>
                        <td className="whitespace-nowrap">0.00 ৳</td>
                        <td className="whitespace-nowrap">0.00 ৳</td>
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
