import React, { useEffect, useState } from "react";
import { Axios } from "../../api/api";
import { toast } from "react-hot-toast";
import Modal from "../Common/Modal";
import {
  DEPARTMENTS,
  fixedButtonClass,
  fixedInputClass,
} from "../../Utils/constant";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { set } from "date-fns";

export const AddStudentModal = ({
  showAddStudentModal,
  setShowAddStudentModal,
  setStudents,
  hallId,
}) => {
  const [student, setStudent] = useState({
    name: "",
    phoneNumber: "",
    studentId: "",
    department: "CSE",
    batch: "",
    gender: "MALE",
    hallId: hallId,
  });
  useEffect(() => {
    setStudent((prevStudent) => ({
      ...prevStudent,
      hallId: hallId,
    }));
  }, [hallId]);
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      console.log(student);
      const response = await Axios.post("student/addStudent", student);
      setStudents((students) => [...students, response.data.student]);
      setStudent({
        name: "",
        phoneNumber: "",
        studentId: "",
        department: "CSE",
        batch: "",
        gender: "MALE",
      });
      setShowAddStudentModal(false);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "batch") {
      let parsedBatch;
      if (/^\d+$/.test(value)) {
        if (value !== "0") {
          parsedBatch = parseInt(value, 10);
        } else {
          parsedBatch = 0;
        }
      } else {
        parsedBatch = "";
      }
      setStudent((prevStudent) => ({
        ...prevStudent,
        [name]: parsedBatch,
      }));
    } else {
      setStudent((prevStudent) => ({
        ...prevStudent,
        [name]: value,
      }));
    }
  };

  return (
    <Modal
      setShowAddStudentModal={setShowAddStudentModal}
      className={`${showAddStudentModal ? "" : "hidden"}`}
    >
      <button
        type="button"
        onClick={() => setShowAddStudentModal(false)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 cursor-pointer"
      >
        <XCircleIcon className="w-8 h-8 hover:text-red-600" />
      </button>
      <h3 className="font-bold text-lg inline-block">Add Student</h3>
      <div className="divide-2" />
      <form
        onSubmit={handleAddStudent}
        className="grid lg:grid-cols-2 gap-4 lg:gap-x-8 mt-4"
      >
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={student.name}
            onChange={handleInputChange}
            placeholder="Type here"
            className={`${fixedInputClass} mt-2`}
          />
        </div>
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Phone Number
          </label>
          <input
            type="text"
            name="phoneNumber"
            value={student.phoneNumber}
            onChange={handleInputChange}
            placeholder="eg: 01712345678"
            className={`${fixedInputClass} mt-2`}
          />
        </div>
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Student Id
          </label>
          <input
            type="text"
            name="studentId"
            value={student.studentId}
            onChange={handleInputChange}
            placeholder="Type here"
            className={`${fixedInputClass} mt-2`}
          />
        </div>
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Hall Id
          </label>
          <input
            type="text"
            name="hallId"
            value={hallId}
            placeholder="Type here"
            readOnly // Make the input field unchangeable
            className={`${fixedInputClass} mt-2 bg-gray-200 cursor-not-allowed`}
          />
        </div>

        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Department
          </label>
          <select
            name="department"
            value={student.department}
            onChange={handleInputChange}
            className={`${fixedInputClass} mt-2`}
          >
            <option disabled selected>
              Select Department
            </option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Batch
          </label>
          <input
            type="number"
            name="batch"
            value={student.batch}
            onChange={handleInputChange}
            placeholder="Type here"
            className={`${fixedInputClass} mt-2`}
          />
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text uppercase text-gray-600">Gender</span>
          </label>
          <select
            name="gender"
            value={student.gender}
            onChange={handleInputChange}
            className={`${fixedInputClass} mt-2`}
          >
            <option disabled selected>
              Select Gender
            </option>
            <option key="Male" value="MALE">
              MALE
            </option>
            <option key="Female" value="FEMALE">
              FEMALE
            </option>
          </select>
        </div>
        <div className="mt-4 col-span-full flex justify-end gap-6">
          <div
            onClick={() => setShowAddStudentModal((prev) => !prev)}
            className={`${fixedButtonClass} w-auto bg-gray-200 text-gray-950 hover:bg-gray-300`}
          >
            Close
          </div>
          <button type="submit" className={`${fixedButtonClass} w-auto`}>
            Add Student
          </button>
        </div>
      </form>
    </Modal>
  );
};
