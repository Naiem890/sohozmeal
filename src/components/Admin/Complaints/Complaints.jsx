import React, { useState } from "react";
import { CheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline"; // Heroicons for tick icon

const dummyComplaints = [
  {
    _id: "1",
    title: "Wi-Fi Not Working",
    complainedBy: "64f1a76a9e5e4d9f7a0aefc1",
    currentRoomNo: "101",
    complaintType: "WIFI",
    description:
      "Wi-Fi is not working in Room 101 skjadfkjshdfk ksdfhkas jdhfkjasdh kjhsadkjhf ksjadhfkh.",
    status: "PENDING",
    adminConfirmed: false,
    studentConfirmed: false,
    adminMessage: "",
    residence: "OSMANY_HALL",
    images: [],
  },
  {
    _id: "2",
    title: "Room Needs Cleaning",
    complainedBy: "64f1a76a9e5e4d9f7a0aefc2",
    currentRoomNo: "102",
    complaintType: "CLEANING",
    description: "Room 102 needs cleaning.",
    status: "PENDING",
    adminConfirmed: true,
    studentConfirmed: false,
    adminMessage: "",
    residence: "EXT_D",
    images: [],
  },
  {
    _id: "3",
    title: "Light Bulb Replacement",
    complainedBy: "64f1a76a9e5e4d9f7a0aefc3",
    currentRoomNo: "103",
    complaintType: "REPAIR",
    description: "Light bulb needs replacement in Room 103.",
    status: "PENDING",
    adminConfirmed: false,
    studentConfirmed: true,
    adminMessage: "",
    residence: "FEMALE_WING",
    images: [],
  },
];

const Complaints = () => {
  const [complaints, setComplaints] = useState(dummyComplaints);
  const [filter, setFilter] = useState("all");

  // Function to handle staff confirmation
  const handleStaffConfirm = (id) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint._id === id
          ? { ...complaint, staffConfirmed: true }
          : complaint
      )
    );
  };

  // Function to filter the complaints based on the selected filter
  const getFilteredComplaints = () => {
    if (filter === "completed") {
      return complaints.filter(
        (complaint) => complaint.staffConfirmed && complaint.studentConfirmed
      );
    } else if (filter === "incomplete") {
      return complaints.filter(
        (complaint) => !complaint.staffConfirmed && !complaint.studentConfirmed
      );
    } else if (filter === "awaitingStudentConfirmation") {
      return complaints.filter(
        (complaint) => complaint.staffConfirmed && !complaint.studentConfirmed
      );
    }
    return complaints; // Return all if no specific filter is applied
  };
  const truncateText = (text, maxLength) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };
  const filteredComplaints = getFilteredComplaints();

  return (
    <div className="container px-4 py-8 mx-auto font-sans max-w-7xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Complaints Management</h2>

      {/* Filter Buttons */}
      <div className="flex flex-wrap justify-start gap-3 mb-8">
        {[
          { key: "all", label: "All Complaints" },
          { key: "incomplete", label: "Incomplete" },
          { key: "completed", label: "Completed" },
          { key: "awaitingStudentConfirmation", label: "Awaiting Confirmation" },
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              filter === filterOption.key
                ? "bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transform hover:-translate-y-0.5"
                : "bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <table className="w-full">
          <thead className="bg-emerald-500 text-white">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Room No</th>
              <th className="px-6 py-4 text-left font-semibold">Type</th>
              <th className="px-6 py-4 text-left font-semibold">Title</th>
              <th className="px-6 py-4 text-left font-semibold">Name</th>
              <th className="px-6 py-4 text-left font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint, index) => (
                <tr 
                  key={complaint._id} 
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">{complaint.currentRoomNo}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
                      {complaint.complaintType}
                    </span>
                  </td>
                  <td className="px-6 py-4">{truncateText(complaint.title, 30)}</td>
                  <td className="px-6 py-4">{complaint.studentName || `User ${index + 1}`}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-medium ${
                      complaint.staffConfirmed && complaint.studentConfirmed
                        ? "bg-emerald-100 text-emerald-800"
                        : complaint.staffConfirmed
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {complaint.staffConfirmed && complaint.studentConfirmed
                        ? "Completed"
                        : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      {!complaint.staffConfirmed && (
                        <button
                          onClick={() => handleStaffConfirm(complaint._id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                          title="Confirm"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                      )}
                      {complaint.studentConfirmed && (
                        <span className="flex items-center justify-center">
                          <CheckIcon className="h-5 w-5 text-blue-500" />
                        </span>
                      )}
                      {complaint.staffConfirmed && complaint.studentConfirmed && (
                        <span className="text-emerald-500 font-bold">
                          Completed
                        </span>
                      )}
                      {!complaint.staffConfirmed &&
                        !complaint.studentConfirmed && (
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No complaints found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Complaints;
