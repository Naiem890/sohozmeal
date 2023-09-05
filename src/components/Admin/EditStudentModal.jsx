import React from "react";
import { Axios } from "../../api/api";
import { toast } from "react-toastify";
import Modal from "../Common/Modal";
import { DEPARTMENTS } from "../../Utils/constant";

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
      const res = await Axios.put("/student", student, {
        withCredentials: true,
      });
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
      <h3 className="font-bold text-lg">Edit Student Information</h3>
      <div className="divide-2" />
      <form
        onSubmit={handleUpdateProfile}
        className="grid lg:grid-cols-2 gap-2 lg:gap-x-8"
      >
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text uppercase text-gray-600">
              Full Name
            </span>
          </label>
          <input
            type="text"
            value={student?.name}
            onChange={(e) => setStudent({ ...student, name: e.target.value })}
            placeholder="Type here"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text uppercase text-gray-600">
              Phone Number
            </span>
          </label>
          <input
            type="text"
            value={student?.phoneNumber}
            onChange={(e) =>
              setStudent({ ...student, phoneNumber: e.target.value })
            }
            placeholder="eg: 01712345678"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text uppercase text-gray-600">
              Student Id
            </span>
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
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text uppercase text-gray-600">Hall Id</span>
          </label>
          <input
            type="text"
            name="studentId"
            value={student?.hallId}
            onChange={(e) => setStudent({ ...student, hallId: e.target.value })}
            placeholder="Type here"
            className="input input-bordered w-full"
          />
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text uppercase text-gray-600">
              Department
            </span>
          </label>
          <select
            value={student?.department}
            onChange={(e) =>
              setStudent({ ...student, department: e.target.value })
            }
            className="select select-bordered w-full"
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
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text uppercase text-gray-600">Batch</span>
          </label>
          <input
            type="number"
            value={student?.batch}
            onChange={(e) => setStudent({ ...student, batch: +e.target.value })}
            placeholder="Type here"
            className="input input-bordered w-full"
          />
        </div>
        <div className="mt-4 col-span-full flex justify-end gap-6">
          <div
            onClick={() => setShowModal((prev) => !prev)}
            className="btn bg-gray-200"
          >
            Close
          </div>
          <button type="submit" className="btn btn-success text-white">
            Update Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
