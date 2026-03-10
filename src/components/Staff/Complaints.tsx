import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";

interface DummyComplaint {
  _id: string;
  studentId: string;
  roomNo: string;
  complaintType: string;
  description: string;
  status: string;
  staffConfirmed: boolean;
  studentConfirmed: boolean;
  completedAt: null;
  images: string[];
}

const dummyComplaints: DummyComplaint[] = [
  {
    _id: "1",
    studentId: "John Doe",
    roomNo: "101",
    complaintType: "WIFI",
    description: "WiFi is not working in Room 101.",
    status: "PENDING",
    staffConfirmed: false,
    studentConfirmed: false,
    completedAt: null,
    images: [],
  },
  {
    _id: "2",
    studentId: "Jane Smith",
    roomNo: "102",
    complaintType: "CLEANING",
    description: "Room 102 needs cleaning.",
    status: "PENDING",
    staffConfirmed: true,
    studentConfirmed: false,
    completedAt: null,
    images: [],
  },
  {
    _id: "3",
    studentId: "Bob Johnson",
    roomNo: "103",
    complaintType: "REPAIR",
    description: "Light bulb needs replacement in Room 103.",
    status: "PENDING",
    staffConfirmed: false,
    studentConfirmed: true,
    completedAt: null,
    images: [],
  },
];

const Complaints = () => {
  const [complaints, setComplaints] = useState<DummyComplaint[]>(dummyComplaints);
  const [filter, setFilter] = useState("all");

  const handleStaffConfirm = (id: string) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint._id === id ? { ...complaint, staffConfirmed: true } : complaint
      )
    );
  };

  const getFilteredComplaints = () => {
    if (filter === "completed") {
      return complaints.filter((c) => c.staffConfirmed && c.studentConfirmed);
    } else if (filter === "incomplete") {
      return complaints.filter((c) => !c.staffConfirmed && !c.studentConfirmed);
    } else if (filter === "awaitingStudentConfirmation") {
      return complaints.filter((c) => c.staffConfirmed && !c.studentConfirmed);
    }
    return complaints;
  };

  const filteredComplaints = getFilteredComplaints();

  return (
    <div className="container md:mt-6 mx-auto">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-500 mb-4 sm:mb-6">
        Complaints List
      </h1>

      <div className="flex justify-center space-x-2 sm:space-x-4 mb-4">
        {[
          { id: "all", label: "All" },
          { id: "incomplete", label: "Incomplete" },
          { id: "completed", label: "Completed" },
          { id: "awaitingStudentConfirmation", label: "Awaiting Student Confirmation" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`py-1 sm:py-2 px-2 sm:px-4 rounded-lg font-bold text-xs sm:text-base ${
              filter === id ? "bg-emerald-500 text-white" : "bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full bg-white rounded-lg shadow-md">
          <thead className="bg-emerald-500 text-white">
            <tr>
              {["Room No", "Complaint Type", "Description", "Actions"].map((h) => (
                <th
                  key={h}
                  className="py-2 px-2 text-xs sm:text-sm md:text-base text-center w-1/4"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint) => (
                <tr key={complaint._id} className="border-b">
                  <td className="py-3 px-2 text-xs sm:text-sm md:text-base text-center">
                    {complaint.roomNo}
                  </td>
                  <td className="py-3 px-2 text-xs sm:text-sm md:text-base text-center">
                    {complaint.complaintType}
                  </td>
                  <td className="py-3 px-2 text-xs sm:text-sm md:text-base text-center">
                    {complaint.description}
                  </td>
                  <td className="py-3 px-2 flex justify-center space-x-2 sm:space-x-4">
                    {!complaint.staffConfirmed && (
                      <button
                        onClick={() => handleStaffConfirm(complaint._id)}
                        className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center"
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
                      <span className="text-emerald-500 font-bold text-xs sm:text-sm md:text-base">
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500 text-xs sm:text-sm">
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
