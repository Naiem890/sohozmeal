import React, { useCallback, useEffect, useState } from "react";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";

export default function BillCount() {
  const [distinctMonths, setDistinctMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [mealBillData, setMealBillData] = useState([]);
  let totalBill = 0;

  useEffect(() => {
    const fetchDistinctMonths = async () => {
      const res = await Axios.get("/meal/months");
      setDistinctMonths(res.data);
      setSelectedMonth(res.data.slice(-1)[0]);
    };

    fetchDistinctMonths();
  }, []);

  useEffect(() => {
    const fetchBill = async () => {
      if (selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        try {
          const res = await Axios.get(
            `/bill/student?year=${year}&month=${month}`
          );
          setMealBillData(res.data.mealBillData);
        } catch (err) {
          console.log("Error fetching bill data:", err);
        }
      }
    };
    fetchBill();
  }, [selectedMonth]);

  const handleMonthChange = useCallback((newMonth) => {
    setSelectedMonth(newMonth);
  }, []);

  // Generate an array of dates for the selected month
  const getDaysArray = (year, month) => {
    const numDays = new Date(year, month, 0).getDate();
    return Array.from(
      { length: numDays },
      (_, i) => new Date(year, month - 1, i + 2).toISOString().split("T")[0]
    );
  };

  // Get the array of days for the selected month
  const daysOfMonth = getDaysArray(
    parseInt(selectedMonth.split("-")[0]),
    parseInt(selectedMonth.split("-")[1])
  );

  return (
    <div className="lg:py-10 xs:text-base pb-10 px-5 text-xs lg:mr-12 max-h-screen flex flex-col">
      <div className="flex justify-between h-auto">
        <h2 className="text-lg self-center sm:text-2xl md:text-3xl font-semibold">
          Mess bill:
        </h2>
        <div className="">
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="rounded-md border-2 border-gray-300 p-1 sm:p-2 md:p-2 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out w-40 sm:w-60 md:w-60"
          >
            {distinctMonths.map((month) => (
              <option key={month} value={month} className="">
                {formatDate(month)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="divider"></div>
      <div className="md:mt-4 overflow-y-scroll min-w-full">
        <div className="overflow-x-hidden w-full">
          <table className=" divide-gray-200 shadow-md w-full">
            <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
              <tr className="text-xs text-center font-thin text-gray-500">
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
                  billData.mealBill.breakfast.status
                    ? (totalBill += billData.mealBill.breakfast.perHeadCost)
                    : 0;
                  billData.mealBill.lunch.status
                    ? (totalBill += billData.mealBill.lunch.perHeadCost)
                    : 0;
                  billData.mealBill.dinner.status
                    ? (totalBill += billData.mealBill.dinner.perHeadCost)
                    : 0;
                }
                return (
                  <tr key={day} className="hover:bg-gray-100">
                    <td className="py-1 whitespace-nowrap text-left">
                      {new Date(day).toLocaleDateString("en-UK")}
                    </td>
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
                          {(billData.mealBill.breakfast.status
                            ? billData.mealBill.breakfast.perHeadCost
                            : 0 + billData.mealBill.lunch.status
                            ? billData.mealBill.lunch.perHeadCost
                            : 0 + billData.mealBill.dinner.status
                            ? billData.mealBill.dinner.perHeadCost
                            : 0
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
