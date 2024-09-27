import React, { useState, useEffect } from "react";
import { Axios } from "../../../api/api";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import {
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"; // Using Heroicons v2
import * as XLSX from "xlsx";
import toast, { Toaster } from "react-hot-toast";

export const Bills = () => {
  const [studentData, setStudentData] = useState({});
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [wing, setWing] = useState("MALE");
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null); // State for selected student details
  const [showModal, setShowModal] = useState(false); // Modal visibility state

  // Fetch monthly data for all students
  useEffect(() => {
    const fetchStudentData = async () => {
      const toastId = toast.loading("Fetching student data...");
      const month = format(selectedDate, "MM");
      const year = format(selectedDate, "yyyy");

      try {
        const result = await Axios.get(
          `/cost/monthly/all?month=${month}&year=${year}&wing=${wing}`
        );
        setStudentData(result.data);
        toast.success("Data fetched successfully!", { id: toastId });
      } catch (error) {
        toast.error("Error fetching student data", { id: toastId });
      }
    };
    fetchStudentData();
  }, [selectedDate, wing]);

  // Handle sorting
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  // Handle search input change
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // Fetch detailed student data on row click
  const fetchStudentDetails = async (studentId) => {
    const toastId = toast.loading("Fetching student details...");
    const month = format(selectedDate, "MM");
    const year = format(selectedDate, "yyyy");

    try {
      const result = await Axios.get(
        `/cost/monthly/student?month=${month}&year=${year}&studentId=${studentId}`
      );
      setSelectedStudentDetails(result.data); // Store the fetched data
      setShowModal(true); // Show modal
      toast.success("Student details fetched successfully!", { id: toastId });
    } catch (error) {
      toast.error("Error fetching student details", { id: toastId });
    }
  };

  // Close modal when clicked outside of it
  const handleOutsideClick = (e) => {
    if (e.target.id === "modal-backdrop") {
      setShowModal(false);
    }
  };

  // Process student data and filter results
  useEffect(() => {
    const mergedStudents = Object.keys(
      studentData.studentMonthlyCosts || {}
    ).map((studentId) => ({
      studentId,
      ...studentData.studentDetailsById[studentId],
      monthlyCost: studentData.studentMonthlyCosts[studentId],
    }));

    let filteredResult = mergedStudents;

    if (sortBy) {
      filteredResult = filteredResult.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortAsc ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    if (search) {
      filteredResult = filteredResult.filter(
        (student) =>
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.department.toLowerCase().includes(search.toLowerCase()) ||
          student.hallId.includes(search) ||
          student.studentId.includes(search)
      );
    }

    setFilteredStudents(filteredResult);
  }, [sortBy, sortAsc, search, studentData]);

  // Export the entire list of students to Excel
  const exportToExcel = () => {
    const month = format(selectedDate, "MM");
    const year = format(selectedDate, "yyyy");

    const data = filteredStudents.map((student) => ({
      studentId: student.studentId,
      name: student.name,
      department: student.department,
      hallId: student.hallId || "N/A",
      monthlyCost: student.monthlyCost.toFixed(2),
    }));

    // Create a new worksheet
    const worksheet = XLSX.utils.json_to_sheet([]);

    // Add heading text and merge the first two rows
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [`Student Monthly Bill (${month}-${year}) of Wing ${wing}`], // Heading text
      ],
      { origin: "A1" }
    );

    // Merge the first two rows across columns A to E (adjust columns as per your data)
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 4 } }, // Merging from A1 to E2
    ];

    // Add custom headers
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [["Student ID", "Name", "Department", "Hall ID", "Monthly Cost"]],
      { origin: "A3" }
    );

    // Add the student data starting from row 4 (after the merged heading and custom headers)
    XLSX.utils.sheet_add_json(worksheet, data, {
      origin: "A4",
      skipHeader: true, // Skip default headers, as we've added custom ones
    });

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Bill");

    // Create and download Excel file
    XLSX.writeFile(workbook, `Student_Bill_${month}_${year}.xlsx`);
  };

  // Export a single student's data to Excel
  const exportStudentToExcel = () => {
    const month = format(selectedDate, "MM");
    const year = format(selectedDate, "yyyy");

    const student = selectedStudentDetails.studentDetails;
    const data = [
      {
        "Student ID": student.studentId, // Changed to "Student ID"
        Name: student.name,
        Department: student.department,
        "Hall ID": student.hallId || "N/A", // Changed to "Hall ID"
        "Total Monthly Cost (Tk)":
          selectedStudentDetails.totalMonthlyCost.toFixed(2), // Changed to "Total Monthly Cost (Tk)"
      },
    ];

    const mealData = Object.entries(selectedStudentDetails.mealStatusByDay).map(
      ([date, status]) => ({
        Date: date,
        "Breakfast Status": status.breakfast ? "Yes" : "No", // Changed to "Breakfast Status"
        "Lunch Status": status.lunch ? "Yes" : "No", // Changed to "Lunch Status"
        "Dinner Status": status.dinner ? "Yes" : "No", // Changed to "Dinner Status"
        "Breakfast Cost (Tk)": status.perHeadCost.breakfast.toFixed(2), // Changed to "Breakfast Cost (Tk)"
        "Lunch Cost (Tk)": status.perHeadCost.lunch.toFixed(2), // Changed to "Lunch Cost (Tk)"
        "Dinner Cost (Tk)": status.perHeadCost.dinner.toFixed(2), // Changed to "Dinner Cost (Tk)"
      })
    );

    // Create a new worksheet for the student's data
    const worksheet = XLSX.utils.json_to_sheet([]);

    // Add heading text and student's details
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [`Student Monthly Bill (${month}-${year}) of Wing ${wing}`], // Main heading
        [], // Empty row for spacing
        [`Name: ${student.name}`], // Student Name
        [`Student ID: ${student.studentId}`], // Student ID
        [`Hall ID: ${student.hallId || "N/A"}`], // Hall ID
        [], // Empty row for spacing before meal data
      ],
      { origin: "A1" }
    );

    // Merge the first row for the main heading
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Merging from A1 to F1 for heading
    ];

    // Add meal data starting from row 7 (after student details)
    XLSX.utils.sheet_add_json(worksheet, mealData, { origin: "A7" });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${student.name}_Bill`);

    // Create and download the Excel file
    XLSX.writeFile(workbook, `${student.name}_Bill_${month}_${year}.xlsx`);
  };

  return (
    <div className="pt-2 flex flex-col h-screen">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold">Monthly Bill</h2>
        <button
          className="bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 px-2 py-2 font-thin flex items-center gap-2 hover:ring-1 ring-offset-2 ring-emerald-500 transition-all duration-300"
          onClick={exportToExcel}
          style={{
            fontSize: "0.7rem",
          }}
        >
          <ArrowDownTrayIcon style={{ height: "22px", width: "22px" }} />
        </button>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-xl font-semibold">
            Total Students: {filteredStudents.length}
          </h3>
        </div>

        <div className="flex">
          <select
            value={wing}
            onChange={(e) => setWing(e.target.value)}
            className={`h-auto mr-2 rounded-lg border-0 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:leading-6`}
          >
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>

          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="mr-2 h-auto rounded-lg border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
          />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search Name, Department, Hall ID, Student ID"
            className={`h-auto w-96 rounded-lg border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6`}
          />
        </div>
      </div>

      <div className="flex-grow overflow-auto px-1 pb-4 mb-2">
        <table className="table table-sm table-hover w-full">
          <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
            <tr>
              <th onClick={() => toggleSort("hallId")} className="uppercase">
                Hall Id {sortBy === "hallId" && (sortAsc ? "↑" : "↓")}
              </th>
              <th onClick={() => toggleSort("studentId")} className="uppercase">
                Student Id {sortBy === "studentId" && (sortAsc ? "↑" : "↓")}
              </th>
              <th onClick={() => toggleSort("name")} className="uppercase">
                Name {sortBy === "name" && (sortAsc ? "↑" : "↓")}
              </th>
              <th
                onClick={() => toggleSort("department")}
                className="uppercase"
              >
                Department {sortBy === "department" && (sortAsc ? "↑" : "↓")}
              </th>
              <th
                onClick={() => toggleSort("monthlyCost")}
                className="uppercase"
              >
                Monthly Cost (Tk){" "}
                {sortBy === "monthlyCost" && (sortAsc ? "↑" : "↓")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.studentId}
                className="hover:bg-emerald-50 transition-all border-b-0 cursor-pointer"
                onClick={() => fetchStudentDetails(student.studentId)} // Handle row click
              >
                <td>{student.hallId || "N/A"}</td>
                <td>{student.studentId}</td>
                <td>{student.name}</td>
                <td>{student.department}</td>
                <td>{student.monthlyCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DaisyUI Modal */}
      {showModal && selectedStudentDetails && (
        <div
          id="modal-backdrop"
          className="modal modal-open"
          onClick={handleOutsideClick}
        >
          <div
            className="modal-box max-w-4xl rounded-lg"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
          >
            <h3 className="text-xl font-bold mb-4">
              Meal Status and Costs for{" "}
              {selectedStudentDetails.studentDetails.name}
            </h3>
            <table className="table table-compact w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Breakfast</th>
                  <th>Lunch</th>
                  <th>Dinner</th>
                  <th>Breakfast Cost</th>
                  <th>Lunch Cost</th>
                  <th>Dinner Cost</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(selectedStudentDetails.mealStatusByDay).map(
                  ([date, status]) => (
                    <tr key={date}>
                      <td>{date}</td>
                      <td>
                        {status.breakfast ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td>
                        {status.lunch ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td>
                        {status.dinner ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td>{status.perHeadCost.breakfast.toFixed(2)} Tk</td>
                      <td>{status.perHeadCost.lunch.toFixed(2)} Tk</td>
                      <td>{status.perHeadCost.dinner.toFixed(2)} Tk</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            <hr className="my-4" />
            <div className="text-right font-semibold">
              Total Monthly Cost:{" "}
              {selectedStudentDetails.totalMonthlyCost.toFixed(2)} Taka
            </div>

            <div className="modal-action">
              <button
                className={`btn bg-emerald-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 hover:bg-emerald-600 w-32`}
                onClick={exportStudentToExcel} // Download button for student bill
              >
                Download Bill
              </button>
              <button
                className={`btn ${fixedButtonClass} w-20`}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
