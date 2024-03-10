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
    <div className="lg:py-10 pb-10 px-5 lg:mr-12 max-h-screen flex flex-col">
      <div className="flex justify-between h-auto">
        <h2 className="text-3xl font-semibold">Mess Bill:</h2>
        <div className="md:mx-0 w-44">
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="rounded-lg p-2 outline-none pr-4 w-full"
          >
            {distinctMonths.map((month) => (
              <option key={month} value={month}>
                {formatDate(month)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="divider"></div>
      <div className="md:mt-4 overflow-y-scroll">
        <div className="overflow-x-hidden px-1">
          <table className="table-auto min-w-full divide-y divide-gray-200 shadow-md">
            <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
              <tr className="text-sm text-left font-thin text-gray-500">
                <th className="pl-2">Date</th>
                <th>Breakfast</th>
                <th>Lunch</th>
                <th>Dinner</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody className="max-h-2">
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
                    <td className="pl-2 py-1">
                      {new Date(day).toLocaleDateString("en-UK")}
                    </td>
                    {billData ? (
                      <>
                        <td
                          className={`${
                            billData.mealBill.breakfast.status
                              ? "text-green-600 font-bold"
                              : "text-red-600 font-bold"
                          }`}
                        >
                          {billData.mealBill.breakfast.perHeadCost.toFixed(2)} ৳
                        </td>
                        <td
                          className={`${
                            billData.mealBill.lunch.status
                              ? "text-green-600 font-bold"
                              : "text-red-600 font-bold"
                          }`}
                        >
                          {billData.mealBill.lunch.perHeadCost.toFixed(2)} ৳
                        </td>
                        <td
                          className={`${
                            billData.mealBill.dinner.status
                              ? "text-green-600 font-bold"
                              : "text-red-600 font-bold"
                          }`}
                        >
                          {billData.mealBill.dinner.perHeadCost.toFixed(2)} ৳
                        </td>
                        <td>
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
                        <td>0.00 ৳</td>
                        <td>0.00 ৳</td>
                        <td>0.00 ৳</td>
                        <td>0.00 ৳</td>
                      </>
                    )}
                  </tr>
                );
              })}
              {/* Grand Total Row */}
              <tr className="">
                <td className="font-bold text-xl pl-2 pt-2">Grand Total</td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                  <span className="font-bold text-xl">
                    {totalBill.toFixed(2)} ৳
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
