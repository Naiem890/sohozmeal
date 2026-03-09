import React, { useState, useEffect, useCallback } from "react";
import { useDebounce } from "../../../Utils/useDebounce";
import { Axios } from "../../../api/api";
import { MonthYearPicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { Download, ArrowUpDown } from "lucide-react";
import { StudentBillModal } from "./StudentBillModal";
import * as XLSX from "xlsx"; // still used for the all-students export
import { toast } from "sonner";
import { useAuthUser } from "react-auth-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "../../Common/Pagination";


export const Bills = () => {
  const auth = useAuthUser()();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [sortBy, setSortBy] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [wing, setWing] = useState(auth.wing === "ALL" ? "MALE" : auth.wing);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchStudentData = useCallback(async () => {
    const toastId = toast.loading("Fetching student data...");
    const month = format(selectedDate, "MM");
    const year = format(selectedDate, "yyyy");
    try {
      const params = new URLSearchParams({ month, year, wing });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const result = await Axios.get(`/cost/monthly/all?${params}`);
      // Merge studentMonthlyCosts + studentDetailsById into a flat array
      const merged = Object.keys(result.data.studentMonthlyCosts || {}).map((studentId) => ({
        studentId,
        ...result.data.studentDetailsById[studentId],
        monthlyCost: result.data.studentMonthlyCosts[studentId],
      }));
      setStudents(merged);
      setPage(1);
      toast.success("Data fetched successfully!", { id: toastId });
    } catch (error) {
      toast.error("Error fetching student data", { id: toastId });
    }
  }, [selectedDate, wing, debouncedSearch]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const toggleSort = (column) => {
    if (sortBy === column) setSortAsc(!sortAsc);
    else { setSortBy(column); setSortAsc(true); }
  };

  const fetchStudentDetails = async (studentId) => {
    const toastId = toast.loading("Fetching student details...");
    const month = format(selectedDate, "MM");
    const year = format(selectedDate, "yyyy");
    try {
      const result = await Axios.get(`/cost/monthly/student?month=${month}&year=${year}&studentId=${studentId}`);
      setSelectedStudentDetails(result.data);
      setShowModal(true);
      toast.success("Student details fetched successfully!", { id: toastId });
    } catch (error) {
      toast.error("Error fetching student details", { id: toastId });
    }
  };

  // Client-side sort only (search is now server-side)
  const filteredStudents = sortBy
    ? [...students].sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortAsc ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortAsc ? 1 : -1;
        return 0;
      })
    : students;

  const exportToExcel = () => {
    const month = format(selectedDate, "MM");
    const year = format(selectedDate, "yyyy");
    const data = students.map((s) => ({
      studentId: s.studentId,
      name: s.name,
      department: s.department,
      hallId: s.hallId || "N/A",
      monthlyCost: s.monthlyCost.toFixed(2),
    }));
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, [[`Student Monthly Bill (${month}-${year}) of Wing ${wing}`]], { origin: "A1" });
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 1, c: 4 } }];
    XLSX.utils.sheet_add_aoa(worksheet, [["Student ID", "Name", "Department", "Hall ID", "Monthly Cost"]], { origin: "A3" });
    XLSX.utils.sheet_add_json(worksheet, data, { origin: "A4", skipHeader: true });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Bill");
    XLSX.writeFile(workbook, `Student_Bill_${month}_${year}.xlsx`);
  };

  const SortHead = ({ column, label }) => (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => toggleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortBy === column ? "text-primary" : "text-muted-foreground"}`} />
        {sortBy === column && <span className="text-xs">{sortAsc ? "↑" : "↓"}</span>}
      </div>
    </TableHead>
  );

  const inputClass = "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="space-y-3 flex flex-col h-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Monthly Bill</h2>
          <span className="text-sm text-muted-foreground">({students.length} students)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {auth.wing === "ALL" && (
            <Select value={wing} onValueChange={setWing}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          )}
          <MonthYearPicker
            value={selectedDate}
            onChange={setSelectedDate}
            className="w-44"
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, dept, hall ID..."
            className="w-64"
          />
          <Button size="icon" variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <SortHead column="hallId"      label="Hall ID" />
                  <SortHead column="studentId"   label="Student ID" />
                  <SortHead column="name"        label="Name" />
                  <SortHead column="department"  label="Department" />
                  <SortHead column="monthlyCost" label="Monthly Cost (Tk)" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents
                  .slice((page - 1) * pageSize, page * pageSize)
                  .map((student) => (
                    <TableRow
                      key={student.studentId}
                      className="cursor-pointer"
                      onClick={() => fetchStudentDetails(student.studentId)}
                    >
                      <TableCell>{student.hallId || "N/A"}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell className="font-semibold">{student.monthlyCost.toFixed(2)} ৳</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(filteredStudents.length / pageSize))}
            total={filteredStudents.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </CardContent>
      </Card>

      {selectedStudentDetails && (
        <StudentBillModal
          open={showModal}
          onOpenChange={setShowModal}
          data={selectedStudentDetails}
          selectedDate={selectedDate}
          wing={wing}
        />
      )}
    </div>
  );
};
