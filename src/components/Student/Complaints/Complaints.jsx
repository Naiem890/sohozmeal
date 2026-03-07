import { CheckIcon } from "@heroicons/react/24/outline";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConfirm } from "../../Common/ConfirmDialog";
import { Axios } from "../../../api/api";
import { toast } from "sonner";
import Pagination from "../../Common/Pagination";

const PAGE_SIZE = 15;

const Complaints = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [complaints,  setComplaints]  = useState([]);
  const [pagination,  setPagination]  = useState({ total: 0, totalPages: 1 });
  const [page,        setPage]        = useState(1);

  useEffect(() => {
    fetchComplaints(page);
  }, [page]);

  const fetchComplaints = async (pg) => {
    const toastId = toast.loading("Loading complaints...");
    try {
      const res = await Axios.get(`/complaint?page=${pg}&limit=${PAGE_SIZE}`);
      setComplaints(res.data.complaints);
      setPagination(res.data.pagination);
      toast.success("Loaded", { id: toastId });
    } catch {
      toast.error("Failed to load complaints", { id: toastId });
    }
  };

  const markAsCompleted = async (id) => {
    const ok = await confirm({
      title: "Mark as completed?",
      description: "Are you sure you want to mark this complaint as completed?",
      confirmText: "Complete",
      cancelText: "Cancel",
    });
    if (ok) {
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, status: "COMPLETED", studentConfirmed: true } : c
        )
      );
      toast.success("The complaint has been marked as completed.");
    }
  };

  const handleRowClick = (complaintId) => {
    navigate(`complaint-details/${complaintId}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Complaints</h1>
          <p className="text-gray-500 mt-1">
            Manage and track your complaints
            {pagination.total > 0 && (
              <span className="ml-2 text-sm">({pagination.total} total)</span>
            )}
          </p>
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
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No complaints found
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr
                    key={complaint._id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer border-b last:border-b-0"
                    onClick={() => handleRowClick(complaint._id)}
                  >
                    <td className="px-6 py-4 text-sm">
                      {new Date(complaint.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{complaint.title}</td>
                    <td className="px-6 py-4 text-sm">{complaint.currentRoomNo}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                        {complaint.complaintType}
                      </span>
                    </td>
                    <td className="px-6 py-4"><Tag status={complaint.status} /></td>
                    <td className="px-6 py-4">
                      {complaint.adminConfirmed
                        ? <CheckIcon className="w-5 h-5 text-green-600" />
                        : <span className="text-red-500">✕</span>}
                    </td>
                    <td className="px-6 py-4">
                      {complaint.studentConfirmed
                        ? <CheckIcon className="w-5 h-5 text-green-600" />
                        : <span className="text-red-500">✕</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {complaint.status === "PENDING" && (
                          <button
                            className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                            onClick={(e) => { e.stopPropagation(); markAsCompleted(complaint._id); }}
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

const Tag = ({ status }) => {
  const styles = {
    COMPLETED: "bg-green-50 text-green-600",
    PENDING:   "bg-yellow-50 text-yellow-600",
  };
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${styles[status] || ""}`}>
      {status}
    </span>
  );
};

export default Complaints;
