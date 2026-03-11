import { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../Utils/useDebounce";
import { Pencil, RotateCcw, Trash2, Plus, ArrowUpDown, Search } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "../Common/ConfirmDialog";
import { useAuthUser } from "react-auth-kit";
import { Axios } from "../../api/api";
import { EditStudentModal } from "./EditStudentModal";
import { AddStudentModal } from "./AddStudentModal";
import { DEPARTMENTS } from "../../Utils/constant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Pagination from "../Common/Pagination";

interface AuthUser {
  wing: string;
  [key: string]: unknown;
}

interface Student {
  _id: string;
  studentId: string;
  hallId: string;
  name: string;
  department: string;
  batch?: string;
  gender: string;
  [key: string]: unknown;
}

export const StudentList = () => {
  const auth = useAuthUser()() as AuthUser;

  // Filters / sort
  const [search,     setSearch]     = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [department, setDepartment] = useState("all");
  const [gender,     setGender]     = useState(auth.wing === "ALL" ? "all" : auth.wing);
  const [residence,  setResidence]  = useState("all");
  const [halls,      setHalls]      = useState<{ _id: string; name: string }[]>([]);
  const [sortBy,     setSortBy]     = useState("hallId");
  const [sortAsc,    setSortAsc]    = useState(true);

  // Pagination
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(20);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Data
  const [students,   setStudents]   = useState<Student[]>([]);
  const [refetch,    setRefetch]    = useState(false);

  // Modals
  const [showEditModal,           setShowEditModal]           = useState(false);
  const [showAddModal,            setShowAddModal]            = useState(false);
  const [student,                 setStudent]                 = useState<Student | null>(null);
  const [refetchHallIdHandler,    setRefetchHallIdHandler]    = useState(false);

  useEffect(() => {
    const url = gender !== "all" ? `/hall?wing=${gender}` : "/hall";
    Axios.get(url).then((r) => setHalls(r.data)).catch(() => {});
  }, [gender]);

  // Single fetch effect — all deps listed directly, no stale closures
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      page:      String(page),
      limit:     String(pageSize),
      sortBy,
      sortOrder: sortAsc ? "asc" : "desc",
    });
    if (debouncedSearch)      params.set("search",     debouncedSearch);
    if (department !== "all") params.set("department", department);
    if (gender     !== "all") params.set("gender",     gender);
    if (residence  !== "all") params.set("residence",  residence);

    Axios.get(`/student/all?${params}`)
      .then((res) => {
        if (!cancelled) {
          setStudents(res.data.students);
          setPagination(res.data.pagination);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load students");
      });

    return () => { cancelled = true; };
  }, [page, pageSize, debouncedSearch, department, gender, residence, sortBy, sortAsc, refetch]);

  // Reset residence when gender changes (halls are wing-specific)
  const prevGender = useRef(gender);
  useEffect(() => {
    if (prevGender.current !== gender) {
      prevGender.current = gender;
      setResidence("all");
    }
  }, [gender]);

  // Reset to page 1 when filters change (skip on mount)
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    setPage(1);
  }, [debouncedSearch, department, gender, residence, sortBy, sortAsc, pageSize]);

  const handlePageSizeChange = (size: number) => setPageSize(size);
  const handlePageChange     = (p: number)    => setPage(p);

  const toggleSort = (column: string) => {
    if (sortBy === column) setSortAsc((p) => !p);
    else { setSortBy(column); setSortAsc(true); }
  };

  const confirm = useConfirm()!;

  const handleResetPassword = async (s: Student) => {
    const ok = await confirm({
      title: "Reset password?",
      description: `Reset password for ${s.name} (${s.studentId})?`,
      confirmText: "Reset",
      cancelText: "Cancel",
    });
    if (ok) {
      try {
        const res = await Axios.post("/auth/password-reset", s);
        toast.success(res.data.message);
      } catch (err) {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e.response?.data?.message ?? "Failed to reset password");
      }
    }
  };

  const handleDeleteAccount = async (s: Student) => {
    const ok = await confirm({
      title: "Delete account?",
      description: `This will permanently delete ${s.name} (${s.studentId}).`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (ok) {
      try {
        const res = await Axios.delete(`/student/${s.studentId}`);
        toast.success(res.data.message);
        setRefetchHallIdHandler((p) => !p);
        setRefetch((p) => !p);
      } catch (err) {
        const e = err as { response?: { data?: { message?: string } } };
        toast.error(e.response?.data?.message ?? "Failed to delete account");
      }
    }
  };

  const SortableHead = ({ column, label }: { column: string; label: string }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${sortBy === column ? "text-primary" : "text-muted-foreground/40"}`}
        />
      </div>
    </TableHead>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pagination.total} student{pagination.total !== 1 ? "s" : ""} found
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>

        <Card>
          {/* Filters */}
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, roll, hall ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {auth.wing === "ALL" && (
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select value={residence} onValueChange={setResidence}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Residence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Residences</SelectItem>
                  <SelectItem value="NOT_SELECTED">Not Selected</SelectItem>
                  {halls.map((h) => (
                    <SelectItem key={h._id} value={h.name}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <SortableHead column="hallId"    label="Hall ID" />
                  <SortableHead column="studentId" label="Student ID" />
                  <SortableHead column="name"       label="Name" />
                  <SortableHead column="department" label="Department" />
                  <SortableHead column="batch"      label="Batch" />
                  <TableHead>Gender</TableHead>
                  <SortableHead column="residence"  label="Residence" />
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((s) => (
                    <TableRow key={s._id} className="group">
                      <TableCell className="font-medium">{s.hallId}</TableCell>
                      <TableCell className="text-muted-foreground">{s.studentId}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.department}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.batch || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={s.gender === "MALE" ? "outline" : "success"}>
                          {s.gender}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.residence && s.residence !== "NOT_SELECTED"
                          ? s.residence
                          : <span className="italic text-muted-foreground/50">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                                onClick={() => { setStudent(s); setShowEditModal(true); }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                onClick={() => handleResetPassword(s)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reset Password</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteAccount(s)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>
      </div>

      <AddStudentModal
        showAddStudentModal={showAddModal}
        setShowAddStudentModal={setShowAddModal}
        refetchHandler={() => setRefetch((p) => !p)}
        setRefetchHallIdHandler={setRefetchHallIdHandler}
        refetchHallIdHandler={refetchHallIdHandler}
      />
      <EditStudentModal
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        student={student}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStudents={setStudents as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setStudent={setStudent as any}
      />
    </TooltipProvider>
  );
};
