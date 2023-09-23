import React, { useEffect, useState } from "react";
import { Axios } from "../../api/api";
import {
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { DEPARTMENTS } from "../../Utils/constant";
import { EditStudentModal } from "./EditStudentModal";

export const StudentList = () => {
  const [sortBy, setSortBy] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [department, setDepartment] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchStudents();

    async function fetchStudents() {
      const result = await Axios.get("/student/all");
      console.log("students", result.data);
      setStudents(result.data);
    }
  }, []);

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  useEffect(() => {
    const filterSearch = (student) => {
      if (search === "") {
        return student;
      } else if (
        student.studentId.toLowerCase().includes(search.toLowerCase()) ||
        student.hallId.toLowerCase().includes(search.toLowerCase()) ||
        student.name.toLowerCase().includes(search.toLowerCase())
      ) {
        return student;
      }
    };

    const filterDepartment = (student) => {
      if (department === "") {
        return student;
      } else if (student.department === department) {
        return student;
      }
    };

    const filteredResult = students
      .filter(filterSearch)
      .filter(filterDepartment);

    if (sortBy) {
      filteredResult.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) {
          return sortAsc ? -1 : 1;
        }
        if (a[sortBy] > b[sortBy]) {
          return sortAsc ? 1 : -1;
        }
        return 0;
      });
    }
    console.log(filteredResult);

    setFilteredStudents(filteredResult);
  }, [sortBy, sortAsc, search, department, students]);

  const handleEditAccount = (student) => {
    setShowModal(true);
    setStudent(student);
  };

  const handleResetPassword = async (student) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `<div>
        You want to reset password for
        <p style="color:skyblue;">
          <br /> 
          Name: ${student.name} 
          <br /> 
          Roll: ${student.studentId}
          <br /> 
          Hall Id: ${student.hallId}
        </p>
      </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Reset!",
    });

    if (result.isConfirmed) {
      try {
        const result = await Axios.post("/auth/password-reset", student);
        toast.success(result.data.message);
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message);
      }
    }
  };

  const handleDeleteAccount = async (student) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `<div>
        You want to delete account for
        <p style="color:skyblue;">
          <br /> 
          Name: ${student.name} 
          <br /> 
          Roll: ${student.studentId}
          <br /> 
          Hall Id: ${student.hallId}
        </p>
      </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Delete!",
    });

    if (result.isConfirmed) {
      try {
        const result = await Axios.delete(`/student/${student.studentId}`);
        toast.success(result.data.message);
        setStudents(students.filter((s) => s._id !== student._id));
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.message);
      }
    }
  };

  return (
    <div className="lg:my-10 lg:mx-12">
      <h2 className="text-3xl font-semibold my-4">All Students</h2>
      <div className="divider"></div>
      <div className="flex justify-between items-center mb-6">
        <div className="">
          <h3 className="text-xl font-semibold mr-4">
            Total Students: {filteredStudents.length}
          </h3>
        </div>
        <div>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input input-sm input-ghost outline-none focus:outline-none border-0 border-b-2 border-emerald-600 mr-10"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Name, Roll or Hall Id"
            className="input input-sm input-ghost outline-none focus:outline-none border-0 border-b-2 border-emerald-600"
          />
          <button className="btn btn-sm ml-8 btn-success">Add Student</button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-screen overflow-y-scroll">
        <table className="table w-full">
          <thead className="bg-white shadow-sm sticky top-0">
            <tr className="">
              <th onClick={() => toggleSort("studentId")} className="uppercase">
                Student Id {sortBy === "studentId" && (sortAsc ? "↑" : "↓")}
              </th>
              <th onClick={() => toggleSort("hallId")} className="uppercase">
                Hall Id {sortBy === "hallId" && (sortAsc ? "↑" : "↓")}
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
              <th onClick={() => toggleSort("batch")} className="uppercase">
                Batch {sortBy === "department" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="uppercase text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr className="text-lg" key={student._id}>
                <td>{student.studentId}</td>
                <td>{student.hallId}</td>
                <td>{student.name}</td>
                <td>{`${student.department}`}</td>
                <td>{`${student.batch || ""}`}</td>
                <td className="flex gap-4 justify-center">
                  <button
                    onClick={() => handleEditAccount(student)}
                    title="Edit Account"
                    className="text-sky-500 bg-sky-100 rounded-full p-3"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    title="Reset Password"
                    onClick={() => handleResetPassword(student)}
                    className="text-indigo-800 bg-violet-200 rounded-full p-3"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>
                  <button
                    title="Delete Account"
                    onClick={() => handleDeleteAccount(student)}
                    className="text-red-700 bg-red-200 rounded-full p-3"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditStudentModal
        showModal={showModal}
        setShowModal={setShowModal}
        student={student}
        setStudents={setStudents}
        setStudent={setStudent}
      />
    </div>
  );
};
