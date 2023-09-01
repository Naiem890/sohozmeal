import React, { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { Axios } from "../api/api";
import { toast } from "react-toastify";

export default function Profile() {
  const auth = useAuthUser();
  const [student, setStudent] = useState(null);

  const fetchStudentProfile = async () => {
    try {
      const res = await Axios.get("/student", {
        withCredentials: true,
      });
      console.log(res.data);
      setStudent(res?.data?.student);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    fetchStudentProfile();
  }, []);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    console.log("student", student);
    try {
      const res = await Axios.put("/student", student, {
        withCredentials: true,
      });
      console.log(res.data);
      fetchStudentProfile();
      toast.success("Profile Updated Successfully");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="lg:m-10 m-4">
      <h2 className="lg:text-3xl text-xl mb-4 font-semibold">
        Update Profile Info
      </h2>
      <form
        onSubmit={handleUpdateProfile}
        className="grid lg:grid-cols-2 lg:w-2/3 gap-2 lg:gap-x-8"
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
            disabled
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
            value={student?.studentId}
            disabled
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
            disabled
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
            {departments.map((dept) => (
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
        <div className="mt-4 col-span-full flex justify-end">
          <button type="submit" className="btn btn-success text-white">
            Update Changes
          </button>
        </div>
      </form>
    </div>
  );
}
