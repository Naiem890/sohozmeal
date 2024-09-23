import React, { useEffect, useState } from "react";
import { Axios } from "../../api/api";
import { toast } from "react-hot-toast";
import Modal from "../Common/Modal";
import {
  DEPARTMENTS,
  fixedButtonClass,
  fixedInputClass,
} from "../../Utils/constant";
import {
  XCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"; // Import icons
import { useAuthUser } from "react-auth-kit";

export const AddStudentModal = ({
  showAddStudentModal,
  setShowAddStudentModal,
  refetchHandler,
  setRefetchHallIdHandler,
  refetchHallIdHandler,
}) => {
  const auth = useAuthUser()();
  const [profileImage, setProfileImage] = useState(null);
  const [image, setImage] = useState("");
  const [hallId, setHallId] = useState("");
  const [suggestedHallId, setSuggestedHallId] = useState("");
  const [roomNo, setRoomNo] = useState(null);
  const [residence, setResidence] = useState("NOT_SELECTED");
  const [gender, setGender] = useState(auth.wing); // Default gender to MALE
  const [isHallIdAvailable, setIsHallIdAvailable] = useState(null); // Now it's null, not true or false
  const [hallIdChecked, setHallIdChecked] = useState(false); // Track if Hall ID is checked

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const getHallId = async (selectedGender) => {
    try {
      const response = await Axios.get("/student/hallId", {
        params: { wing: selectedGender },
      });
      setSuggestedHallId(response.data.hallId); // Suggest the next hallId
    } catch (error) {
      toast.error("Failed to fetch Hall ID.");
      console.error(error);
    }
  };

  const checkHallIdAvailability = async (inputHallId, selectedGender) => {
    try {
      const response = await Axios.get("/student/checkHallId", {
        params: { hallId: inputHallId, wing: selectedGender },
      });
      setIsHallIdAvailable(!response.data.exists); // Set availability status (true/false)
      setHallIdChecked(true); // Mark as checked
    } catch (error) {
      toast.error("Failed to check Hall ID availability.");
      console.error(error);
    }
  };

  useEffect(() => {
    getHallId(gender); // Fetch hallId based on gender when the modal opens or gender changes
  }, [gender, refetchHallIdHandler]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!isHallIdAvailable || !hallIdChecked) {
      toast.error("Please enter a valid and available Hall ID.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("profileImage", profileImage);
      formData.append("name", e.target.name.value);
      formData.append("phoneNumber", e.target.phoneNumber.value);
      formData.append("studentId", e.target.studentId.value);
      formData.append("department", e.target.department.value);
      formData.append("batch", e.target.batch.value);
      formData.append("gender", gender);
      formData.append("hallId", hallId);
      formData.append("roomNo", roomNo);
      formData.append("residence", residence || "NOT_SELECTED");

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

  const handleUseSuggestedHallId = () => {
    setHallId(suggestedHallId); // Automatically set the hallId to the suggested value
    checkHallIdAvailability(suggestedHallId, gender); // Check if suggested Hall ID is available
  };

  const handleHallIdChange = (e) => {
    const inputHallId = e.target.value;
    setHallId(inputHallId); // Set the manually inputted hallId
    setHallIdChecked(false); // Reset hallIdChecked since the input has changed

    // Check the availability of the entered hallId
    if (inputHallId.trim() !== "") {
      checkHallIdAvailability(inputHallId, gender);
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
            <img src={image} className="w-full h-full object-contain" alt="" />
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
          <div className="flex items-center relative">
            <input
              type="text"
              name="hallId"
              value={hallId}
              onChange={handleHallIdChange} // Manually input or change Hall ID
              placeholder="Enter Hall ID"
              className={`${fixedInputClass} mt-2 pr-10`} // Add padding for the icons
            />
            {hallId && hallIdChecked && (
              <span className="absolute right-2 top-5 flex items-center">
                {isHallIdAvailable ? (
                  <CheckCircleIcon className="w-7 h-7 text-green-600 font-bold" />
                ) : (
                  <XMarkIcon className="w-7 h-7 text-red-600 font-bold" />
                )}
              </span>
            )}
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={handleUseSuggestedHallId}
              className="text-sm text-blue-600 underline"
            >
              Use Suggested Hall ID: {suggestedHallId}
            </button>
          </div>
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

        {/* Room No */}
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Room No
          </label>
          <input
            type="text"
            name="roomNo"
            value={roomNo}
            onChange={(e) => setRoomNo(e.target.value)}
            placeholder="Enter Room Number"
            className={`${fixedInputClass} mt-2`}
          />
        </div>

        {/* Residence */}
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Residence
          </label>
          <select
            name="residence"
            value={residence}
            onChange={(e) => setResidence(e.target.value)}
            className={`${fixedInputClass} mt-2`}
          >
            <option disabled selected>
              Select Residence
            </option>
            <option value="OSMANY_HALL">OSMANY HALL</option>
            <option value="EXT_D">EXT D</option>
            <option value="NOT_SELECTED">NOT SELECTED</option>
          </select>
        </div>

        {/* Gender */}
        {auth.wing === "ALL" && (
          <div className="">
            <label className="block text-sm font-medium leading-6 text-gray-600">
              Gender
            </label>
            <select
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={`${fixedInputClass} mt-2`}
            >
              <option disabled selected>
                Select Gender
              </option>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>
          </div>
        )}

        <div className="mt-4 col-span-full flex justify-end gap-6">
          <div
            onClick={() => setShowAddStudentModal((prev) => !prev)}
            className={`${fixedButtonClass} w-auto bg-gray-200 text-gray-950 hover:bg-gray-300`}
          >
            Close
          </div>
          <button
            type="submit"
            className={`${fixedButtonClass} w-auto`}
            disabled={!hallIdChecked || !isHallIdAvailable}
          >
            Add Student
          </button>
        </div>
      </form>
    </Modal>
  );
};
