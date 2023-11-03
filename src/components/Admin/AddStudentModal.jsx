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

export const AddStudentModal = ({
  showAddStudentModal,
  setShowAddStudentModal,
  refetchHandler,
  setRefetchHallIdHandler,
  refetchHallIdHandler,
}) => {
  const [profileImage, setProfileImage] = useState(null);
  const [image, setImage] = useState("");
  const [hallId, setHallId] = useState("");
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  useEffect(() => {
    const getHallId = async () => {
      const response = await Axios.get("/student/hallId");
      setHallId(response.data.hallId);
    };
    getHallId();
  }, [refetchHallIdHandler]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("profileImage", profileImage);
      formData.append("name", e.target.name.value);
      formData.append("phoneNumber", e.target.phoneNumber.value);
      formData.append("studentId", e.target.studentId.value);
      formData.append("department", e.target.department.value);
      formData.append("batch", e.target.batch.value);
      formData.append("gender", e.target.gender.value);
      formData.append("hallId", e.target.hallId.value);

      const response = await Axios.post("/student/add", formData);

      setShowAddStudentModal(false);
      e.target.reset();
      refetchHandler();
      setRefetchHallIdHandler((prev) => !prev);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  return (
    <Modal
      setShowAddStudentModal={setShowAddStudentModal}
      className={`${showAddStudentModal ? "" : "hidden"}`}
    >
      <button
        type="button"
        onClick={() => {
          setImage("");
          setProfileImage(null);
          setShowAddStudentModal(false);
        }}
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
        <div>
          <div className="w-32 h-32 bg-slate-600 mb-4 rounded-md">
            <img src={image} className="w-full h-full object-contain"></img>
          </div>
          <input
            type="file"
            name="profileImage"
            accept="image/*"
            onChange={(e) => {
              fileToBase64(e.target.files[0]).then((res) => {
                setImage(res);
              });
              return setProfileImage(e.target.files[0]);
            }}
          />
        </div>
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium leading-6 text-gray-600">
              Full Name
            </label>
            <input
              type="text"
              name="name"
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
              placeholder="eg: 01712345678"
              className={`${fixedInputClass} mt-2`}
            />
          </div>
        </div>
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Student Id
          </label>
          <input
            type="text"
            name="studentId"
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
          <select name="department" className={`${fixedInputClass} mt-2`}>
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
            placeholder="Type here"
            className={`${fixedInputClass} mt-2`}
          />
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text uppercase text-gray-600">Gender</span>
          </label>
          <select name="gender" className={`${fixedInputClass} mt-2`}>
            <option disabled selected>
              Select Gender
            </option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
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
