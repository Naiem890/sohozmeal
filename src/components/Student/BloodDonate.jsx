import React, { useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { toast } from "react-hot-toast";
import { Axios } from "../../api/api";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";
import Select from "react-select";

export default function BloodDonate() {
  const auth = useAuthUser();
  const [student, setStudent] = useState({
    bloodGroup: "",
    isDonor: false,
    lastDonationDate: "",
  });

  const fetchStudentProfile = async () => {
    try {
      const res = await Axios.get("/student");
      const studentData = res?.data?.student;
      
      // Format the date to YYYY-MM-DD for input type="date"
      const formattedDate = studentData?.lastDonationDate 
        ? new Date(studentData.lastDonationDate).toISOString().split('T')[0]
        : '';

      setStudent({
        studentId: studentData?.studentId || "",
        bloodGroup: studentData?.bloodGroup || "",
        isDonor: studentData?.isDonor || false,
        lastDonationDate: formattedDate,
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only validate blood group for donors
    if (student.isDonor && !student.bloodGroup) {
      toast.error("Please select your blood group if you want to be a donor");
      return;
    }

    try {
      const res = await Axios.put("/student", {
        studentId: student.studentId,
        bloodGroup: student.bloodGroup,
        isDonor: student.isDonor,
        lastDonationDate: student.lastDonationDate,
      });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  // Add helper function to check if date is within last 3 months
  const isWithinThreeMonths = (date) => {
    if (!date) return true; // If no date provided, don't show warning
    const lastDonation = new Date(date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return lastDonation <= threeMonthsAgo;
  };

  // Add warning message component
  const WarningMessage = ({ message }) => (
    <p className="text-yellow-600 text-sm mt-1">{message}</p>
  );

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  return (
    <div className="mb-10 lg:my-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Blood Donation Information</h2>
      <div className="divider"></div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          {/* Donor Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
            <div>
              <h3 className="font-medium text-gray-900">Donor Status</h3>
              <p className="text-sm text-gray-500">
                Are you willing to donate blood?
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={student.isDonor}
                onChange={() => setStudent({ ...student, isDonor: !student.isDonor })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Blood Group Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group
                {student.isDonor && !student.bloodGroup && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <select
                value={student.bloodGroup}
                onChange={(e) => setStudent({ ...student, bloodGroup: e.target.value })}
                className={`${fixedInputClass} ${
                  student.isDonor && !student.bloodGroup ? 'border-red-300' : ''
                }`}
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              {student.isDonor && !student.bloodGroup && (
                <p className="text-red-500 text-sm mt-1">Blood group is required for donors</p>
              )}
            </div>

            {/* Last Donation Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Donation Date (Optional)
              </label>
              <input
                type="date"
                value={student.lastDonationDate}
                onChange={(e) => setStudent({ ...student, lastDonationDate: e.target.value })}
                className={fixedInputClass}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
              />
              {student.lastDonationDate && !isWithinThreeMonths(student.lastDonationDate) && (
                <WarningMessage message="Note: You should wait at least 3 months between blood donations" />
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className={`${fixedButtonClass} w-full md:w-auto`}
            >
              Update Blood Donation Info
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
