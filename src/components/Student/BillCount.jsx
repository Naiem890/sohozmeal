import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { dateToYYYYMMDD } from "../../Utils/dateToYYYYMMDD";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";

export default function BilCount() {
  const [student, setStudent] = useState(null);
  const [name, setName] = useState("");
  const [distinctMonths, setDistinctMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  const fetchStudentProfile = async () => {
    try {
      const res = await Axios.get("/student");
      if (res?.data?.student) {
        setStudent(res.data.student);
        setName(res.data.student.name);
        console.log(selectedMonth);
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
    const fetchBill = async () => {
      if (selectedMonth) {
        const year = selectedMonth.split("-")[0];
        const month = selectedMonth.split("-")[1];
        const res = await Axios.get(`/bill/student?year=${year}&month=${month}`);
        const { meals } = res.data;

    
      console.log(res.data);
      }
    };
    fetchBill();
  }, [selectedMonth]);

  useEffect(() => {
    const fetchDistinctMonths = async () => {
      const res = await Axios.get("/meal/months");
      const months = res.data;
      //console.log("months", months);
      setDistinctMonths(months);
      setSelectedMonth(months.slice(-1)[0]);
    };

    fetchDistinctMonths();
  }, []);

  const validDate = () => {
    const today = new Date();
    const time = today.getHours();
    let dayCount = time >= 22 ? 2 : 1;
    const availableDate = new Date();
    availableDate.setDate(today.getDate() + dayCount);
    return dateToYYYYMMDD(availableDate);
  };

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
        Hello, {name.split(" ")[0]} Your Meal Bill Count:
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
                ? "opacity-25 pointer-events-none cursor-not-allowed disabled" +
                  distinctMonths.slice(-1)
                : "" + distinctMonths.slice(-1)
            }`}
            onClick={() => handleMonthChange(1)}
          >
            <ArrowRightIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="md:mt-16"></div>
    </div>
  );
}
