import React from "react";

interface ComplaintImage { url: string }
interface ComplaintDetailData {
  id?: string;
  title: string;
  complainedBy?: { name: string; id: string };
  currentRoomNo: string;
  complaintType: string;
  description: string;
  status: string;
  adminConfirmed: boolean;
  studentConfirmed: boolean;
  residence: string;
  images: ComplaintImage[];
  createdAt: string;
  adminMessage?: string;
}

const ComplaintDetails = ({ complaint }: { complaint?: ComplaintDetailData }) => {
  // Example complaint data for testing
  complaint = complaint || {
    id: "1",
    title: "Broken Chair in Room",
    complainedBy: { name: "John Doe", id: "ST12345" },
    currentRoomNo: "B205",
    complaintType: "REPAIR",
    description: "The chair in my room is broken and needs to be replaced.",
    status: "PENDING",
    adminConfirmed: false,
    // adminMessage: "We will review this shortly.",
    studentConfirmed: false,
    residence: "OSMANY_HALL",
    images: [
      {
        url: "https://images.squarespace-cdn.com/content/v1/55803cbbe4b0206c1dc1d585/1447412964043-BXC3RQCLUVWAGZRW9SKZ/IMG_1796.JPG?format=1500w",
      },
      {
        url: "https://images.squarespace-cdn.com/content/v1/55803cbbe4b0206c1dc1d585/1447412964043-BXC3RQCLUVWAGZRW9SKZ/IMG_1796.JPG?format=1500w",
      },
    ],
    createdAt: "2024-11-25T10:00:00Z",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4">{complaint.title}</h1>
      <div className="grid gap-4">
        {/* Complaint Basic Info */}
        <div className="p-4 bg-base-200 rounded-lg">
          <p>
            <strong>Date Submitted:</strong>{" "}
            {new Date(complaint.createdAt).toLocaleDateString()}
          </p>
          <p>
            <strong>Complained By:</strong> {complaint.complainedBy?.name} (ID:{" "}
            {complaint.complainedBy?.id})
          </p>
          <p>
            <strong>Room No:</strong> {complaint.currentRoomNo}
          </p>
          <p>
            <strong>Residence:</strong>{" "}
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border">{complaint.residence}</span>
          </p>
          <p>
            <strong>Type:</strong>{" "}
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border">
              {complaint.complaintType}
            </span>
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                complaint.status === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {complaint.status}
            </span>
          </p>
          <p>
            <strong>Admin Confirmed:</strong>{" "}
            {complaint.adminConfirmed ? (
              <span className="text-green-500">Yes</span>
            ) : (
              <span className="text-red-500">No</span>
            )}
          </p>
          <p>
            <strong>Student Confirmed:</strong>{" "}
            {complaint.studentConfirmed ? (
              <span className="text-green-500">Yes</span>
            ) : (
              <span className="text-red-500">No</span>
            )}
          </p>
        </div>

        {/* Admin Message */}
        {complaint.adminMessage && (
          <div className="p-4 bg-base-200 rounded-lg">
            <p className="text-lg font-semibold mb-2">Admin Message:</p>
            <p>{complaint.adminMessage}</p>
          </div>
        )}

        {/* Complaint Description */}
        <div className="p-4 bg-base-200 rounded-lg">
          <p className="text-lg font-semibold mb-2">Description:</p>
          <p>{complaint.description}</p>
        </div>

        {/* Complaint Images */}
        {complaint.images && complaint.images.length > 0 && (
          <div className="p-4 bg-base-200 rounded-lg">
            <p className="text-lg font-semibold mb-2">Images:</p>
            <div className="flex flex-wrap gap-4">
              {complaint.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={`Complaint Image ${index + 1}`}
                  className="w-32 h-32 rounded-lg border"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetails;
