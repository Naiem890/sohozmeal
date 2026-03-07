import React, { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "../../Common/Pagination";

const PAGE_SIZE = 10;

const dummyComplaints = [
  {
    _id: "1",
    title: "Wi-Fi Not Working",
    complainedBy: "64f1a76a9e5e4d9f7a0aefc1",
    currentRoomNo: "101",
    complaintType: "WIFI",
    description: "Wi-Fi is not working in Room 101 skjadfkjshdfk ksdfhkas jdhfkjasdh kjhsadkjhf ksjadhfkh.",
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

const FILTERS = [
  { key: "all", label: "All" },
  { key: "incomplete", label: "Incomplete" },
  { key: "completed", label: "Completed" },
  { key: "awaitingStudentConfirmation", label: "Awaiting Confirmation" },
];

const Complaints = () => {
  const [complaints, setComplaints] = useState(dummyComplaints);
  const [filter,     setFilter]     = useState("all");
  const [page,       setPage]       = useState(1);

  const handleStaffConfirm = (id) => {
    setComplaints((prev) =>
      prev.map((c) => c._id === id ? { ...c, staffConfirmed: true } : c)
    );
  };

  const getFilteredComplaints = () => {
    if (filter === "completed") return complaints.filter((c) => c.staffConfirmed && c.studentConfirmed);
    if (filter === "incomplete") return complaints.filter((c) => !c.staffConfirmed && !c.studentConfirmed);
    if (filter === "awaitingStudentConfirmation") return complaints.filter((c) => c.staffConfirmed && !c.studentConfirmed);
    return complaints;
  };

  const truncateText = (text, maxLength) =>
    text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

  const filteredComplaints = getFilteredComplaints();
  const pagedComplaints   = filteredComplaints.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Complaints Management</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "default" : "outline"}
            onClick={() => { setFilter(key); setPage(1); }}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room No</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedComplaints.length > 0 ? (
                pagedComplaints.map((complaint, index) => (
                  <TableRow key={complaint._id}>
                    <TableCell>{complaint.currentRoomNo}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{complaint.complaintType}</Badge>
                    </TableCell>
                    <TableCell>{truncateText(complaint.title, 30)}</TableCell>
                    <TableCell>{complaint.studentName || `User ${index + 1}`}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          complaint.staffConfirmed && complaint.studentConfirmed
                            ? "success"
                            : complaint.staffConfirmed
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {complaint.staffConfirmed && complaint.studentConfirmed
                          ? "Completed"
                          : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {!complaint.staffConfirmed && (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-green-600 hover:text-green-700 border-green-200"
                            onClick={() => handleStaffConfirm(complaint._id)}
                            title="Confirm"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {!complaint.staffConfirmed && !complaint.studentConfirmed && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        {complaint.staffConfirmed && complaint.studentConfirmed && (
                          <span className="text-xs text-green-600 font-medium">Done</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No complaints found for the selected filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(filteredComplaints.length / PAGE_SIZE))}
            total={filteredComplaints.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Complaints;
