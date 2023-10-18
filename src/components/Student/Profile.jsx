import React, { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { toast } from "react-hot-toast";
import { Axios } from "../../api/api";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";

export default function Profile() {
  const auth = useAuthUser();
  const [student, setStudent] = useState(null);

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
      const res = await Axios.put("/student", student);
      console.log(res.data);
      // fetchStudentProfile();
      setStudent(res?.data?.student);
      toast.success(res.data.message);
    } catch (err) {
      console.log(err);
      toast.error(err.response.data.message);
    }
  };

  return (
    <div className="mb-10 lg:my-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Update Profile Info</h2>
      <div className="divider"></div>
      <form
        onSubmit={handleUpdateProfile}
        className="grid lg:grid-cols-2 lg:w-2/3 gap-3 lg:gap-6"
      >
        <div>
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
        <div>
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
            name="studentId"
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
          />
        </div>
        <div className="mt-4 col-span-full flex justify-end">
          <button type="submit" className={`${fixedButtonClass} sm:w-44`}>
            Update Changes
          </button>
        </div>
      </form>
    </div>
  );
}
