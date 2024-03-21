import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useState } from "react";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";

export default function Expenses() {
  const [student, setStudent] = useState(null);
  const [name, setName] = useState("");
  const [distinctMonths, setDistinctMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [mealBillData, setMealBillData] = useState([]);

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
          console.log("Response data:", res.data);
          setMealBillData(res.data.mealBillData);
        } catch (err) {
          console.log("Error fetching bill data:", err);
        }
      }
    };
    fetchBill();
  }, [selectedMonth]);

  const handleMonthChange = useCallback(
    (increment) => {
      setSelectedMonth((prevMonth) => {
        const index = distinctMonths.indexOf(prevMonth);
        const newIndex = index + increment;
        return distinctMonths[
          newIndex >= 0 && newIndex < distinctMonths.length ? newIndex : index
        ];
      });
    },
    [distinctMonths]
  );

  return (
    <div className="lg:my-10 mb-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Mess Bill:</h2>
      <div className="divider"></div>
      <div className="flex justify-between items-center mb-6 gap-10 flex-wrap">
        <div className="flex justify-center items-center gap-10 md:mx-0 mx-auto">
          <button
            className={`${
              selectedMonth === distinctMonths[0]
                ? "opacity-25 pointer-events-none cursor-not-allowed disabled"
                : ""
            }`}
            onClick={() => handleMonthChange(-1)}
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-xl font-semibold">
              {formatDate(selectedMonth)}
            </h2>
          </div>
          <button
            className={`${
              selectedMonth === distinctMonths.slice(-1)[0]
                ? "opacity-25 pointer-events-none cursor-not-allowed disabled"
                : ""
            }`}
            onClick={() => handleMonthChange(1)}
          >
            <ArrowRightIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="md:mt-16">
        <div className="overflow-x-auto max-h-screen overflow-y-scroll px-1">
          <table className="table table-sm border-collapse border border-slate-500 table-hover w-full text-center">
            <thead className="bg-gray-200 shadow-sm sticky top-0 border-b-[1px] border-slate-500">
              <tr className="">
                <th className="p-0 border border-slate-500">Date</th>
                <th className="p-0 border border-slate-500">Breakfast</th>
                <th className="p-0 border border-slate-500">Lunch</th>
                <th className="p-0 border border-slate-500">Dinner</th>
                <th className="p-0 border border-slate-500">Total Cost</th>
              </tr>
            </thead>
            <tbody className="">
              <tr className=" text-center">
                <td className="p-0 m-0 border border-slate-500">Date</td>
                <td className=" p-0 m-0 border border-slate-500">
                  <div className="border-b-[1px] border-slate-500 text-center">
                    Total Cost
                  </div>
                  <div className="flex">
                    <div className="flex-1 border-r-[1px] border-slate-500">
                      Total Student
                    </div>
                    <div className="flex-1">Per Head</div>
                  </div>
                </td>
                <td className="p-0 m-0 border border-slate-500">
                  <div className="border-b-[1px] border-slate-500 text-center">
                    Total Cost
                  </div>
                  <div className="flex">
                    <div className="flex-1 border-r-[1px] border-slate-500">
                      Total Student
                    </div>
                    <div className="flex-1">Per Head</div>
                  </div>
                </td>
                <td className="p-0 m-0 border border-slate-500">
                  <div className="border-b-[1px] border-slate-500 text-center">
                    Total Cost
                  </div>
                  <div className="flex">
                    <div className="flex-1 border-r-[1px] border-slate-500">
                      Total Student
                    </div>
                    <div className="flex-1">Per Head</div>
                  </div>
                </td>
                <td className="p-0 m-0 border border-slate-500">
                  <div className="border-b-[1px] border-slate-500">
                    Total Cost
                  </div>
                  <div>Per Head</div>
                </td>
              </tr>
              {mealBillData.map((item, index) => (
                <React.Fragment key={item.date}>
                  <tr className="hover:bg-gray-100 border border-slate-500 text-center">
                    <td className="p-0 font-bold text-lg border border-slate-500">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-0 border border-slate-500">
                      <div className="font-semibold border-b-[1px] border-slate-500 text-center">
                        <span className="font-bold ">
                          {item?.mealBill?.breakfast?.totalcost
                            ? item.mealBill.breakfast.totalcost("৳")
                            : "Unavailable"}
                        </span>{" "}
                      </div>
                      <div className="flex">
                        <div className="font-semibold flex-1 border-r-[1px] border-slate-500">
                          <span className="font-bold ">
                            {item.mealBill.breakfast.totalStudent}
                          </span>
                        </div>
                        <div className="font-semibold flex-1">
                          <span className="font-bold ">
                            {item.mealBill.breakfast.perHeadCost.toFixed(2)}
                          </span>{" "}
                          ৳
                        </div>
                      </div>
                    </td>
                    <td className="p-0 border border-slate-500">
                      <div className="font-semibold border-b-[1px] border-slate-500 text-center">
                        <span className="font-bold ">
                          {item.mealBill.lunch.totalCost}
                        </span>{" "}
                        ৳
                      </div>
                      <div className="flex">
                        <div className="font-semibold flex-1 border-r-[1px] border-slate-500">
                          <span className="font-bold ">
                            {item.mealBill.lunch.totalStudent}
                          </span>
                        </div>
                        <div className="font-semibold flex-1">
                          <span className="font-bold ">
                            {item.mealBill.lunch.perHeadCost.toFixed(2)}
                          </span>{" "}
                          ৳
                        </div>
                      </div>
                    </td>
                    <td className="p-0 m-0 border border-slate-500">
                      <div className="font-semibold border-b-[1px] border-slate-500 text-center">
                        <span className="font-bold ">
                          {item.mealBill.dinner.totalCost}
                        </span>{" "}
                        ৳
                      </div>
                      <div className="flex">
                        <div className="font-semibold flex-1 border-r-[1px] border-slate-500">
                          <span className="font-bold ">
                            {item.mealBill.dinner.totalStudent}
                          </span>
                        </div>
                        <div className="font-semibold flex-1">
                          <span className="font-bold ">
                            {item.mealBill.dinner.perHeadCost.toFixed(2)}
                          </span>{" "}
                          ৳
                        </div>
                      </div>
                    </td>
                    <td className="p-0 m-0 border border-slate-500">
                      <div className="font-semibold border-b-[1px] border-slate-500">
                        <span className="font-bold ">
                          {(
                            item.mealBill.breakfast.totalCost +
                            item.mealBill.lunch.totalCost +
                            item.mealBill.dinner.totalCost
                          ).toFixed(2)}{" "}
                          ৳
                        </span>
                      </div>
                      <div className="font-semibold">
                        <span className="font-bold ">
                          {(
                            item.mealBill.breakfast.perHeadCost +
                            item.mealBill.lunch.perHeadCost +
                            item.mealBill.dinner.perHeadCost
                          ).toFixed(2)}{" "}
                          ৳
                        </span>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {mealBillData.length > 0 && (
                <tr className="border-t">
                  <td colSpan="4" className="text-right font-bold text-xl p-0">
                    Grand Total
                  </td>
                  <td className="p-0 font-bold text-xl">
                    {mealBillData
                      .reduce(
                        (total, item) =>
                          total +
                          item.mealBill.breakfast.perHeadCost +
                          item.mealBill.lunch.perHeadCost +
                          item.mealBill.dinner.perHeadCost,
                        0
                      )
                      .toFixed(2)}{" "}
                    ৳
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
