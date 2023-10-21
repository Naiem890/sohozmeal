import React from "react";
import { Axios } from "../../api/api";
import { toast } from "react-hot-toast";
import Modal from "../Common/Modal";
import {
  DEPARTMENTS,
  fixedButtonClass,
  fixedInputClass,
} from "../../Utils/constant";

export const EditStudentModal = ({
  showModal,
  setShowModal,
  student,
  setStudents,
  setStudent,
}) => {
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      const res = await Axios.put("/student", student);
      const response = res.data;
      const updatedStudent = response.student;
      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s._id === updatedStudent._id ? updatedStudent : s
        )
      );
      toast.success(response.message);
      setShowModal(false);
    } catch (err) {
      console.log(err);
      toast.error(err.response.data.message);
    }
  };
  return (
    <Modal
      setShowModal={setShowModal}
      className={`${showModal ? "" : "hidden"}`}
    >
      <button
        onClick={() => setShowModal(false)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-x bg-success text-black w-8 h-8 rounded-full"
          viewBox="0 0 16 16"
        >
          <path d="M3.293 3.293a1 1 0 011.414 0L8 6.586l3.293-3.293a1 1 0 111.414 1.414L9.414 8l3.293 3.293a1 1 0 01-1.414 1.414L8 9.414l-3.293 3.293a1 1 0 01-1.414-1.414L6.586 8 3.293 4.707a1 1 0 010-1.414z" />
        </svg>
      </button>
      <h3 className="font-bold text-lg inline-block">
        Edit Student Information
      </h3>
      <div className="divide-2" />
      <form
        onSubmit={handleUpdateProfile}
        className="grid lg:grid-cols-2 gap-4 lg:gap-x-8 mt-4"
      >
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Full Name
          </label>
          <input
            type="text"
            value={student?.name}
            onChange={(e) => setStudent({ ...student, name: e.target.value })}
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
            value={student?.phoneNumber}
            onChange={(e) =>
              setStudent({ ...student, phoneNumber: e.target.value })
            }
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
            value={
              student?.newStudentId ? student?.newStudentId : student?.studentId
            }
            onChange={(e) =>
              setStudent({ ...student, newStudentId: e.target.value })
            }
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
            name="studentId"
            value={student?.hallId}
            onChange={(e) => setStudent({ ...student, hallId: e.target.value })}
            placeholder="Type here"
            className={`${fixedInputClass} mt-2`}
          />
        </div>
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Department
          </label>
          <select
            value={student?.department}
            onChange={(e) =>
              setStudent({ ...student, department: e.target.value })
            }
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
            value={student?.batch}
            onChange={(e) => setStudent({ ...student, batch: +e.target.value })}
            placeholder="Type here"
            className={`${fixedInputClass} mt-2`}
          />
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text uppercase text-gray-600">Gender</span>
          </label>
          <select
            value={student?.gender}
            onChange={(e) => {
              setStudent({ ...student, gender: e.target.value });
            }}
            className="select select-bordered w-full"
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
            onClick={() => setShowModal((prev) => !prev)}
            className={`${fixedButtonClass} w-auto bg-gray-200 text-gray-950 hover:bg-gray-300`}
          >
            Close
          </div>
          <button type="submit" className={`${fixedButtonClass} w-auto`}>
            Update Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
