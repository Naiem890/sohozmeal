import {
  ArrowPathIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import {
  DEPARTMENTS,
  fixedButtonClass,
  fixedInputClass,
} from "../../Utils/constant";
import { Axios } from "../../api/api";
import { EditStudentModal } from "./EditStudentModal";
import { AddStudentModal } from "./AddStudentModal";
import { set } from "date-fns";
export const StudentList = () => {
  const [sortBy, setSortBy] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [department, setDepartment] = useState("");
  const [gender, setGender] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [search, setSearch] = useState("");
  const [student, setStudent] = useState(null);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    fetchStudents();

    async function fetchStudents() {
      const result = await Axios.get("/student/all");
      console.log("students", result.data);
      setStudents(result.data);
    }
  }, [refetch]);

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  const refetchHandler = () => {
    setRefetch((prev) => !prev);
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

    const filterGender = (student) => {
      if (gender === "") {
        return student;
      } else if (student.gender === gender) {
        return student;
      }
    };

    const filteredResult = students
      .filter(filterSearch)
      .filter(filterDepartment)
      .filter(filterGender);

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
  }, [sortBy, sortAsc, search, department, students, gender]);

  const handleEditAccount = (student) => {
    setShowModal(true);
    setStudent(student);
  };
  const handleAddAccount = () => {
    setShowAddStudentModal(true);
  };

  const handleResetPassword = async (student) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `<div>
        You want to reset password for
        <p style="color:#f27474;">
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
        <p style="color:#f27474;">
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
    <div className="lg:my-10 mb-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">All Students</h2>
      <div className="divider"></div>
      <div className="flex justify-between items-center mb-6 gap-12">
        <div className="">
          <h3 className="text-xl font-semibold mr-4 basis-1/3">
            Total Students: {filteredStudents.length}
          </h3>
        </div>
        <div className="flex gap-2 basis-2/3">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={`${fixedInputClass} h-auto basis-1/4`}
          >
            <option selected value="">
              Gender
            </option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={`${fixedInputClass} h-auto basis-1/4`}
          >
            <option selected value="">
              Departments
            </option>
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
            placeholder="Search Name, Roll, Hall ID"
            className={`${fixedInputClass} h-auto basis-2/4`}
          />
          <button
            onClick={() => {
              handleAddAccount();
            }}
            className={`${fixedButtonClass} btn-sm h-auto basis-40 ml-2`}
          >
            <PlusIcon className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-screen overflow-y-scroll px-1">
        <table className="table table-sm table-hover w-full">
          <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
            <tr className="">
              <th onClick={() => toggleSort("hallId")} className="uppercase">
                Hall Id {sortBy === "hallId" && (sortAsc ? "↑" : "↓")}
              </th>
              <th onClick={() => toggleSort("studentId")} className="uppercase">
                Student Id {sortBy === "studentId" && (sortAsc ? "↑" : "↓")}
              </th>
              <th onClick={() => toggleSort("gender")} className="uppercase">
                Gender {sortBy === "gender" && (sortAsc ? "↑" : "↓")}
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
              <tr
                className=" hover:shadow-sm rounded-lg hover:bg-emerald-50 transition-all border-b-0"
                key={student._id}
              >
                <td>{student.hallId}</td>
                <td>{student.studentId}</td>
                <td>{student.gender}</td>
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

      <AddStudentModal
        showAddStudentModal={showAddStudentModal}
        setShowAddStudentModal={setShowAddStudentModal}
        refetchHandler={refetchHandler}
      />
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
