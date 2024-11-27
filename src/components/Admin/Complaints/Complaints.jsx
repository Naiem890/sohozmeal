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
    <div className="container pt-2 mx-auto font-sans">
      <h2 className="text-2xl font-semibold">Complaints</h2>

      {/* Filter Buttons */}
      <div className="flex justify-center gap-2 sm:gap-4 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 text-sm sm:text-base rounded-full font-medium transition-all duration-200 ${
            filter === "all"
              ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600"
              : "border border-emerald-500 text-emerald-500 hover:bg-emerald-100"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("incomplete")}
          className={`px-3 py-1 text-sm sm:text-base rounded-full font-medium transition-all duration-200 ${
            filter === "incomplete"
              ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600"
              : "border border-emerald-500 text-emerald-500 hover:bg-emerald-100"
          }`}
        >
          Incomplete
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-3 py-1 text-sm sm:text-base rounded-full font-medium transition-all duration-200 ${
            filter === "completed"
              ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600"
              : "border border-emerald-500 text-emerald-500 hover:bg-emerald-100"
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setFilter("awaitingStudentConfirmation")}
          className={`px-3 py-1 text-sm sm:text-base rounded-full font-medium transition-all duration-200 ${
            filter === "awaitingStudentConfirmation"
              ? "bg-emerald-500 text-white shadow-md hover:bg-emerald-600"
              : "border border-emerald-500 text-emerald-500 hover:bg-emerald-100"
          }`}
        >
          Pending Student Confirmation
        </button>
      </div>

      {/* Complaints Table */}
      <div className="overflow-x-auto">
        <table className="table w-full border rounded-lg shadow-md font-sans">
          <thead className="bg-emerald-500 text-white font-display">
            <tr>
              <th className="text-center w-[100px] px-2 py-1">Room No</th>
              <th className="text-center w-[150px] px-2 py-1">
                Complaint Type
              </th>
              <th className="text-center w-[250px] px-2 py-1">Title</th>
              <th className="text-center w-[200px] px-2 py-1">Name</th>
              <th className="text-center w-[150px] px-2 py-1">Status</th>
              <th className="text-center w-[150px] px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody className="font-sans">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint, index) => (
                <tr key={complaint._id} className="hover">
                  <td className="text-center px-2 py-1">
                    {complaint.currentRoomNo}
                  </td>
                  <td className="text-center px-2 py-1">
                    {complaint.complaintType}
                  </td>
                  <td className="text-center px-2 py-1">
                    {complaint.title || `Issue with ${complaint.complaintType}`}
                  </td>
                  <td className="text-center px-2 py-1">
                    {complaint.studentName || `Dummy User ${index + 1}`}
                  </td>
                  <td className="text-center px-2 py-1">
                    {complaint.staffConfirmed && complaint.studentConfirmed ? (
                      <span className="badge h-full rounded-full bg-emerald-500 text-white px-4 py-1 text-sm shadow-md">
                        Completed
                      </span>
                    ) : complaint.staffConfirmed ? (
                      <span className="badge h-full rounded-full bg-yellow-500 text-white px-4 py-1 text-sm shadow-md">
                        Pending
                      </span>
                    ) : (
                      <span className="badge h-full rounded-full bg-red-500 text-white px-4 py-1 text-sm shadow-md">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="flex items-center justify-center gap-2 py-2 h-full">
                    {!complaint.staffConfirmed && (
                      <button
                        onClick={() => handleStaffConfirm(complaint._id)}
                        className="bg-green-500 hover:bg-green-600 text-white shadow-md p-1 rounded-full transition-all duration-200"
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
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No complaints found.
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
