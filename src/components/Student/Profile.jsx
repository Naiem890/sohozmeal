import React, { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { toast } from "react-hot-toast";
import { Axios } from "../../api/api";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";

export default function Profile() {
  const auth = useAuthUser();
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [student, setStudent] = useState(null);

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

  const handleImageChange = async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const base64Image = await fileToBase64(file);
      setImageFile(file);
      setImage(base64Image);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const res = await Axios.get("/student");
      console.log(res.data);
      setStudent(res?.data?.student);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  useEffect(() => {
    if (student?.profileImage) {
      const imageUrl = student.profileImage
        ? createObjectURL(student.profileImage.data)
        : null;
      setImage(imageUrl);
    }
  }, [student]);

  const departments = [
    "CSE",
    "EECE",
    "CE",
    "ME",
    "NAME",
    "BME",
    "PME",
    "IPE",
    "AE",
    "NSE",
    "EWCE",
    "ARCH",
  ];

  return (
    <div className="mb-10 lg:my-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Profile Info</h2>
      <div className="divider"></div>
      <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="">
          <div className="w-32 h-32 bg-slate-600 rounded-md justify-center">
            <img src={image} className="w-full h-full object-contain"></img>
          </div>
          {/* <input
            type="file"
            name="profileImage"
            accept="image/*"
            onChange={handleImageChange}
          /> */}
        </div>
        <div className="self-center">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Full Name
          </label>
          <input
            type="text"
            value={student?.name}
            disabled
            placeholder="Type here"
            className={`${fixedInputClass} disabled:bg-gray-200 mt-2`}
          />
        </div>
        <div className="self-center">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Phone Number
          </label>
          <input
            type="text"
            value={student?.phoneNumber}
            onChange={(e) =>
              setStudent({ ...student, phoneNumber: e.target.value })
            }
            disabled
            placeholder="eg: 01712345678"
            className={`${fixedInputClass} disabled:bg-gray-200 mt-2`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Student Id
          </label>
          <input
            type="text"
            name="studentId"
            value={student?.studentId}
            disabled
            placeholder="Type here"
            className={`${fixedInputClass} disabled:bg-gray-200 mt-2`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Hall Id
          </label>
          <input
            type="text"
            name="hallId"
            value={student?.hallId}
            disabled
            placeholder="Type here"
            className={`${fixedInputClass} disabled:bg-gray-200 mt-2`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Department
          </label>
          <select
            value={student?.department}
            onChange={(e) =>
              setStudent({ ...student, department: e.target.value })
            }
            className={`${fixedInputClass} disabled:bg-gray-200 mt-2`}
            disabled
          >
            <option disabled selected>
              Select Department
            </option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Batch
          </label>
          <input
            type="number"
            value={student?.batch}
            onChange={(e) => setStudent({ ...student, batch: +e.target.value })}
            placeholder="Type here"
            className={`${fixedInputClass} disabled:bg-gray-200 mt-2`}
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Room No
          </label>
          <input
            type="text"
            value={student?.roomNo || null}
            disabled
            placeholder="Room Number"
            className={`${fixedInputClass} disabled:bg-gray-200 mt-2`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Residence
          </label>
          <input
            type="text"
            value={student?.residence || "NOT_SELECTED"}
            disabled
            placeholder="Residence"
            className={`${fixedInputClass} disabled:bg-gray-200 mt-2`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Gender
          </label>
          <input
            type="text"
            value={student?.gender}
            disabled
            placeholder="Gender"
            className={`${fixedInputClass} disabled:bg-gray-200 mt-2`}
          />
        </div>
      </form>
      <div className="w-full flex items-center justify-center">
        <div className="mt-8 bg-emerald-600 inline-block text-center text-white rounded-lg px-4 py-2 font-extralight text-sm">
          Contact Office if you want to update
        </div>
      </div>
    </div>
  );
}
