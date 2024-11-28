import { CheckIcon } from "@heroicons/react/24/outline";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

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
    Swal.fire({
      title: 'Confirm Completion',
      text: 'Are you sure you want to mark this complaint as completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, complete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setComplaints((prev) =>
          prev.map((complaint) =>
            complaint.id === id
              ? { ...complaint, status: "COMPLETED", studentConfirmed: true }
              : complaint
          )
        );
        
        Swal.fire(
          'Completed!',
          'The complaint has been marked as completed.',
          'success'
        );
      }
    });
  };

  const handleRowClick = (complaintId) => {
    navigate(`complaint-details/${complaintId}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with improved styling */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Complaints</h1>
          <p className="text-gray-500 mt-1">Manage and track your complaints</p>
        </div>
        <Link 
          to="/dashboard/add-complaint" 
          className="px-4 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors text-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Complaint
        </Link>
      </div>

      {/* Complaints Table with modern styling */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Title</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Room No</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Type</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Admin</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Self</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedComplaints.map((complaint) => (
                <tr
                  key={complaint.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer border-b last:border-b-0"
                  onClick={() => handleRowClick(complaint.id)}
                >
                  <td className="px-6 py-4 text-sm">{complaint.date}</td>
                  <td className="px-6 py-4 text-sm font-medium">{complaint.title}</td>
                  <td className="px-6 py-4 text-sm">{complaint.roomNo}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                      {complaint.complaintType}
                    </span>
                  </td>
                  <td className="px-6 py-4"><Tag status={complaint.status} /></td>
                  <td className="px-6 py-4">
                    {complaint.adminConfirmed ? (
                      <CheckIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <span className="text-red-500">✕</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {complaint.studentConfirmed ? (
                      <CheckIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <span className="text-red-500">✕</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {complaint.status === "PENDING" && (
                        <button
                          className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsCompleted(complaint.id);
                          }}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination with modern styling */}
      <div className="flex justify-center mt-8">
        <div className="join rounded-lg shadow-sm">
          <button
            className={`join-item btn ${currentPage === 1 ? 'btn-disabled' : ''}`}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            «
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`join-item btn ${currentPage === i + 1 ? 'btn-active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className={`join-item btn ${currentPage === totalPages ? 'btn-disabled' : ''}`}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};

// Updated Tag component with modern styling
const Tag = ({ status }) => {
  const styles = {
    COMPLETED: 'bg-green-50 text-green-600',
    PENDING: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
};

export default Complaints;
