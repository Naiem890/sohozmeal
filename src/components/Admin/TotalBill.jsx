import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useState } from "react";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";

export default function TotalBill() {
  const [student, setStudent] = useState(null);
  const [name, setName] = useState("");
  const [distinctMonths, setDistinctMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [mealBillData, setMealBillData] = useState([]);

  const fetchStudentProfile = async () => {
    try {
      const res = await Axios.get("/student");
      if (res?.data?.student) {
        setStudent(res.data.student);
        setName(res.data.student.name);
      } else {
        console.log("Student data not found");
      }
    } catch (err) {
      console.log("Error fetching student data:", err);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

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
      <h2 className="text-3xl font-semibold">
        Hello, <span className="font-green">{name.split(" ")[0]}</span>, Your
        Meal Bill Count:
      </h2>
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
          <table className="table table-sm table-hover w-full">
            <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
              <tr className="">
                <th>Date</th>
                <th>Breakfast</th>
                <th>Lunch</th>
                <th>Dinner</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {mealBillData.map((item, index) => (
                <React.Fragment key={item.date}>
                  <tr className="hover:shadow-sm rounded-lg hover:bg-emerald-50 transition-all border-b-0">
                    <td className="font-bold text-xl">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td
                      style={{
                        color: item.mealBill.breakfast.status ? "red" : "green",
                      }}
                    >
                      <span className="font-bold text-xl">
                        {item.mealBill.breakfast.perHeadCost} ৳
                      </span>
                    </td>
                    <td
                      style={{
                        color: item.mealBill.lunch.status ? "red" : "green",
                      }}
                    >
                      <span className="font-bold text-xl">
                        {item.mealBill.lunch.perHeadCost} ৳
                      </span>
                    </td>
                    <td
                      style={{
                        color: item.mealBill.dinner.status ? "red" : "green",
                      }}
                    >
                      <span className="font-bold text-xl">
                        {item.mealBill.dinner.perHeadCost} ৳
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-xl">
                        {(
                          item.mealBill.breakfast.perHeadCost +
                          item.mealBill.lunch.perHeadCost +
                          item.mealBill.dinner.perHeadCost
                        ).toFixed(2)}{" "}
                        ৳
                      </span>
                    </td>
                  </tr>
                  {index !== mealBillData.length - 1 && (
                    <tr className="border-b">
                      <td colSpan="5"></td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {mealBillData.length > 0 && (
                <tr className="border-t">
                  <td className="font-bold text-xl">Grand Total</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>
                    <span className="font-bold text-xl">
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
                    </span>
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
