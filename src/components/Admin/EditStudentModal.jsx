import React, { useEffect, useRef, useState } from "react";
import { Axios } from "../../api/api";
import { toast } from "react-hot-toast";
import Modal from "../Common/Modal";
import {
  DEPARTMENTS,
  fixedButtonClass,
  fixedInputClass,
} from "../../Utils/constant";
import { XCircleIcon } from "@heroicons/react/24/outline";

export const EditStudentModal = ({
  showModal,
  setShowModal,
  student,
  setStudents,
  setStudent,
}) => {
  const [prevImage, setPrevImage] = useState(null);
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const createObjectURL = (buffer) => {
    const bufferArray = new Uint8Array(buffer);
    const blob = new Blob([bufferArray], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    return url;
  };
  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // This resets the input value, clearing the selected file
    }
  };

  useEffect(() => {
    if (student?.profileImage) {
      const imageUrl = student.profileImage
        ? createObjectURL(student.profileImage.data)
        : null;
      setImage(imageUrl);
      setPrevImage(imageUrl);
    }
    else
    {
      setImage(null);
      setPrevImage(null);
    }
    setImageFile(null);
    clearFileInput();
  }, [student]);

  const handleImageChange = async (e) => {
    setPrevImage(image);
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const base64Image = await fileToBase64(file);
      setImageFile(file);
      setImage(base64Image);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", student.name ? student.name : "");
    formData.append(
      "phoneNumber",
      student.phoneNumber ? student.phoneNumber : ""
    );
    formData.append("studentId", student.newStudentId || student.studentId);
    formData.append("hallId", student.hallId ? student.hallId : "");
    formData.append("department", student.department ? student.department : "");
    formData.append("batch", student.batch ? student.batch : "");
    formData.append("gender", student.gender);
    if (imageFile) {
      formData.append("profileImage", imageFile); // Append the updated image file
    }

    try {
      const res = await Axios.put("/student", formData);
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
  const handleModalClose = () => {
    setImage(prevImage);
    setImageFile(null);
    setShowModal(false);
    clearFileInput();
  };

  return (
    <Modal
      setShowModal={setShowModal}
      className={`${showModal ? "" : "hidden"}`}
    >
      <button
        type="button"
        onClick={handleModalClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 cursor-pointer"
      >
        <XCircleIcon className="w-8 h-8 hover:text-red-600" />
      </button>
      <h3 className="font-bold text-lg inline-block">
        Edit Student Information
      </h3>
      <div className="divide-2" />
      <form
        onSubmit={handleUpdateProfile}
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
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>
        <div>
          <div className="mb-4">
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
              value={student?.phoneNumber == null ? "" : student?.phoneNumber}
              onChange={(e) =>
                setStudent({ ...student, phoneNumber: e.target.value })
              }
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
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Gender
          </label>
          <select
            value={student?.gender}
            onChange={(e) => {
              setStudent({ ...student, gender: e.target.value });
            }}
            className={`${fixedInputClass} mt-2`}
          >
            <option disabled selected>
              Select Gender
            </option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
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
