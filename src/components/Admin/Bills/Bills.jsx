import React, { useState, useEffect, useCallback } from "react";
import { useDebounce } from "../../../Utils/useDebounce";
import { Axios } from "../../../api/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { Download, Check, X, ArrowUpDown } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useAuthUser } from "react-auth-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

  const exportStudentToExcel = () => {
    const month = format(selectedDate, "MM");
    const year = format(selectedDate, "yyyy");
    const student = selectedStudentDetails.studentDetails;
    const totalBill = selectedStudentDetails.totalMonthlyCost.toFixed(2);
    const mealData = Object.entries(selectedStudentDetails.mealStatusByDay).map(([date, status]) => ({
      Date: date,
      "Breakfast Status": status.breakfast ? "Yes" : "No",
      "Lunch Status": status.lunch ? "Yes" : "No",
      "Dinner Status": status.dinner ? "Yes" : "No",
      "Breakfast Cost (Tk)": status.guestMeal.breakfast > 0
        ? `${((status.guestMeal.breakfast + (status.breakfast ? 1 : 0)) * status.perHeadCost.breakfast).toFixed(2)}`
        : status.perHeadCost.breakfast.toFixed(2),
      "Lunch Cost (Tk)": status.guestMeal.lunch > 0
        ? `${((status.guestMeal.lunch + (status.lunch ? 1 : 0)) * status.perHeadCost.lunch).toFixed(2)}`
        : status.perHeadCost.lunch.toFixed(2),
      "Dinner Cost (Tk)": status.guestMeal.dinner > 0
        ? `${((status.guestMeal.dinner + (status.dinner ? 1 : 0)) * status.perHeadCost.dinner).toFixed(2)}`
        : status.perHeadCost.dinner.toFixed(2),
    }));
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Student Monthly Bill (${month}-${year}) of Wing ${wing}`],
      [],
      [`Name: ${student.name}`],
      [`Student ID: ${student.studentId}`],
      [`Hall ID: ${student.hallId || "N/A"}`],
      [],
    ], { origin: "A1" });
    worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    XLSX.utils.sheet_add_json(worksheet, mealData, { origin: "A7" });
    const lastRowIndex = mealData.length + 7;
    XLSX.utils.sheet_add_aoa(worksheet, [[`Total Monthly Bill: ${totalBill} Tk`]], { origin: `A${lastRowIndex + 1}` });
    worksheet["!merges"].push({ s: { r: lastRowIndex, c: 0 }, e: { r: lastRowIndex, c: 5 } });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${student.name}_Bill`);
    XLSX.writeFile(workbook, `${student.name}_Bill_${month}_${year}.xlsx`);
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
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className={inputClass}
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Meal Status — {selectedStudentDetails?.studentDetails?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Breakfast</TableHead>
                  <TableHead>Lunch</TableHead>
                  <TableHead>Dinner</TableHead>
                  <TableHead>Breakfast Cost</TableHead>
                  <TableHead>Lunch Cost</TableHead>
                  <TableHead>Dinner Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedStudentDetails && Object.entries(selectedStudentDetails.mealStatusByDay).map(([date, status]) => (
                  <TableRow key={date}>
                    <TableCell className="text-xs">{date}</TableCell>
                    <TableCell>
                      {status.breakfast
                        ? <Check className="h-4 w-4 text-green-500" />
                        : <X className="h-4 w-4 text-red-500" />}
                    </TableCell>
                    <TableCell>
                      {status.lunch
                        ? <Check className="h-4 w-4 text-green-500" />
                        : <X className="h-4 w-4 text-red-500" />}
                    </TableCell>
                    <TableCell>
                      {status.dinner
                        ? <Check className="h-4 w-4 text-green-500" />
                        : <X className="h-4 w-4 text-red-500" />}
                    </TableCell>
                    <TableCell className="text-xs">
                      {status.guestMeal.breakfast > 0
                        ? `${((status.guestMeal.breakfast + (status.breakfast ? 1 : 0)) * status.perHeadCost.breakfast).toFixed(2)}`
                        : status.perHeadCost.breakfast.toFixed(2)} Tk
                    </TableCell>
                    <TableCell className="text-xs">
                      {status.guestMeal.lunch > 0
                        ? `${((status.guestMeal.lunch + (status.lunch ? 1 : 0)) * status.perHeadCost.lunch).toFixed(2)}`
                        : status.perHeadCost.lunch.toFixed(2)} Tk
                    </TableCell>
                    <TableCell className="text-xs">
                      {status.guestMeal.dinner > 0
                        ? `${((status.guestMeal.dinner + (status.dinner ? 1 : 0)) * status.perHeadCost.dinner).toFixed(2)}`
                        : status.perHeadCost.dinner.toFixed(2)} Tk
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-semibold">
              Total: {selectedStudentDetails?.totalMonthlyCost?.toFixed(2)} Tk
            </span>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportStudentToExcel}>
                <Download className="h-4 w-4 mr-1" /> Download Bill
              </Button>
              <Button size="sm" onClick={() => setShowModal(false)}>Close</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
