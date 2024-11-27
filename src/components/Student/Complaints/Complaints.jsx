import { CheckIcon } from "@heroicons/react/24/outline";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Complaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([
    {
      id: 1,
      date: "2024-11-25",
      title: "Broken chair in room",
      roomNo: "B205",
      complaintType: "REPAIR",
      status: "PENDING",
      adminConfirmed: false,
      studentConfirmed: false,
    },
    {
      id: 2,
      date: "2024-11-24",
      title: "WiFi not working",
      roomNo: "B101",
      complaintType: "WIFI",
      status: "PENDING",
      adminConfirmed: true,
      studentConfirmed: false,
    },
    // Add more complaints to simulate pagination
    ...Array.from({ length: 30 }, (_, i) => ({
      id: i + 3,
      date: `2024-11-${23 - (i % 30)}`,
      title: `Complaint ${i + 3}`,
      roomNo: `A${i + 3}`,
      complaintType: "MESS",
      status: i % 2 === 0 ? "PENDING" : "COMPLETED",
      adminConfirmed: i % 3 === 0,
      studentConfirmed: i % 5 === 0,
    })),
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const complaintsPerPage = 15;

  const totalPages = Math.ceil(complaints.length / complaintsPerPage);

  // Handle pagination
  const paginatedComplaints = complaints.slice(
    (currentPage - 1) * complaintsPerPage,
    currentPage * complaintsPerPage
  );

  // Handle complaint status update
  const markAsCompleted = (id) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint.id === id
          ? { ...complaint, status: "COMPLETED", studentConfirmed: true }
          : complaint
      )
    );
  };

  const handleRowClick = (complaintId) => {
    navigate(`complaint-details/${complaintId}`);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Complaints</h1>
        <Link to="/dashboard/add-complaint" className="text-white">
          <button className="btn btn-primary">Add Complaint</button>{" "}
        </Link>
      </div>

      {/* Complaints Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="">
              <th>Date</th>
              <th>Title</th>
              <th>Room No</th>
              <th>Type</th>
              <th>Status</th>
              <th>Admin Confirmed</th>
              <th>Self Confirmed</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedComplaints.map((complaint) => (
              <tr
                key={complaint.id}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleRowClick(complaint.id)}
              >
                <td>{complaint.date}</td>
                <td>{complaint.title}</td>
                <td>{complaint.roomNo}</td>
                <td>
                  <span className="badge badge-outline">
                    {complaint.complaintType}
                  </span>
                </td>
                <td>
                  <Tag status={complaint.status} />
                </td>
                <td>
                  {complaint.adminConfirmed ? (
                    <span className="text-green-500">Yes</span>
                  ) : (
                    <span className="text-red-500">No</span>
                  )}
                </td>
                <td>
                  {complaint.studentConfirmed ? (
                    <span className="text-green-500">Yes</span>
                  ) : (
                    <span className="text-red-500">No</span>
                  )}
                </td>
                <td
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 flex justify-center items-center"
                >
                  {complaint.status === "PENDING" && (
                    <button
                      className="btn btn-sm btn-success flex items-center gap-1 rounded-full"
                      onClick={() => markAsCompleted(complaint.id)}
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <div className="btn-group">
          <button
            className={`btn ${currentPage === 1 ? "btn-disabled" : ""}`}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            «
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`btn ${currentPage === i + 1 ? "btn-active" : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className={`btn ${
              currentPage === totalPages ? "btn-disabled" : ""
            }`}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper to display status tag
const Tag = ({ status }) => {
  const color = status === "COMPLETED" ? "badge-success" : "badge-warning";
  return <span className={`badge ${color}`}>{status}</span>;
};

export default Complaints;
