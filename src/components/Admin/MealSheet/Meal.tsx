import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { MealTable } from "./MealTable";
import { MealStats } from "./MealStats";
import { Axios } from "../../../api/api";
import { MealControls } from "./MealControls";
import { useConfirm } from "../../Common/ConfirmDialog";
import { useAuthUser } from "react-auth-kit";
import { Loader2 } from "lucide-react";
import Pagination from "../../Common/Pagination";

export const formatMealDate = (date: Date | string) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const EMPTY_FEASTS = { breakfast: false, lunch: false, dinner: false };

interface AuthUser {
  wing: string;
  [key: string]: unknown;
}

interface StudentMeal {
  studentId: string;
  name: string;
  hallId: string;
  gender: string;
  roomNo?: string;
  residence?: string;
  meal: Record<string, boolean>;
  guestMeal?: { breakfast: number; lunch: number; dinner: number };
  [key: string]: unknown;
}

type MealParams = {
  date: string;
  wing: string;
  page: number;
  limit: number;
  search?: string;
  residence?: string;
};

export const Meal = () => {
  const auth = useAuthUser()() as AuthUser;
  const confirm = useConfirm()!;
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("roomNo");
  const [sortAsc, setSortAsc] = useState(true);
  const [students, setStudents] = useState<StudentMeal[]>([]);
  const [gender, setGender] = useState(auth.wing === "ALL" ? "MALE" : auth.wing);
  const [residence, setResidence] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [feasts, setFeasts] = useState(EMPTY_FEASTS);
  const [locks, setLocks] = useState(EMPTY_FEASTS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [mealCounts, setMealCounts] = useState({ breakfast: 0, lunch: 0, dinner: 0 });

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });

  const formattedDate = useMemo(() => formatMealDate(fromDate), [fromDate]);

  // Debounce search input — only fire API after 400ms idle
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch feasts + students together in one effect
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);

    const params: MealParams = { date: formattedDate, wing: gender, page: 1, limit: pageSize };
    if (debouncedSearch) params.search = debouncedSearch;
    if (residence) params.residence = residence;

    Promise.all([
      Axios.get(`/feast/date/${formattedDate}/wing/${gender}`),
      Axios.get("/meal/students", { params }),
    ])
      .then(([feastRes, studentsRes]) => {
        if (cancelled) return;
        if (feastRes.data.length > 0) {
          const meals = feastRes.data[0].meal;
          const f = {
            breakfast: meals.includes("breakfast"),
            lunch: meals.includes("lunch"),
            dinner: meals.includes("dinner"),
          };
          setFeasts(f);
          setLocks(f);
        } else {
          setFeasts(EMPTY_FEASTS);
          setLocks(EMPTY_FEASTS);
        }
        setStudents(studentsRes.data.students ?? []);
        setPagination(studentsRes.data.pagination ?? { total: 0, totalPages: 1 });
        setMealCounts(studentsRes.data.mealCounts ?? { breakfast: 0, lunch: 0, dinner: 0 });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFeasts(EMPTY_FEASTS);
          setLocks(EMPTY_FEASTS);
          setLoading(false);
          toast.error("Failed to load students");
        }
      });

    return () => { cancelled = true; };
  }, [formattedDate, gender, debouncedSearch, residence, pageSize]);

  const handlePageChange = useCallback((pg: number) => {
    setLoading(true);

    const params: MealParams = { date: formattedDate, wing: gender, page: pg, limit: pageSize };
    if (debouncedSearch) params.search = debouncedSearch;
    if (residence) params.residence = residence;

    Axios.get("/meal/students", { params })
      .then((res) => {
        setStudents(res.data.students ?? []);
        setPagination(res.data.pagination ?? { total: 0, totalPages: 1 });
        setMealCounts(res.data.mealCounts ?? { breakfast: 0, lunch: 0, dinner: 0 });
        setPage(pg);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error("Failed to load students");
      });
  }, [formattedDate, gender, debouncedSearch, residence, pageSize]);

  // Sort client-side — instant, no API round-trip needed
  const displayStudents = useMemo(() => {
    if (!sortBy) return students;
    return [...students].sort((a, b) => {
      const av = a[sortBy] as string | number | undefined;
      const bv = b[sortBy] as string | number | undefined;
      if ((av ?? "") < (bv ?? "")) return sortAsc ? -1 : 1;
      if ((av ?? "") > (bv ?? "")) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [students, sortBy, sortAsc]);

  // Use backend meal counts; feast days override to total student count
  const counts = useMemo(
    () => ({
      b: feasts.breakfast ? pagination.total : mealCounts.breakfast,
      l: feasts.lunch     ? pagination.total : mealCounts.lunch,
      d: feasts.dinner    ? pagination.total : mealCounts.dinner,
    }),
    [mealCounts, feasts, pagination.total]
  );

  const updateStudent = useCallback((studentId: string, meal: Record<string, boolean>) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, meal } : s))
    );
  }, []);

  const updateGuestMeal = useCallback((studentId: string, guestMeal: { breakfast: number; lunch: number; dinner: number }) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, guestMeal } : s))
    );
  }, []);

  const exportToExcel = useCallback(async () => {
    try {
      const params: MealParams = { date: formattedDate, wing: gender, page: 1, limit: 9999 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (residence) params.residence = residence;
      const res = await Axios.get("/meal/students", { params });
      const allStudents = [...res.data.students].sort((a, b) => {
        if (!sortBy) return 0;
        if (a[sortBy] < b[sortBy]) return sortAsc ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortAsc ? 1 : -1;
        return 0;
      });
      const data = allStudents.map((s) => ({
        "Hall ID": s.hallId,
        "Student ID": s.studentId,
        Name: s.name,
        "Room No": s.roomNo,
        Residence: s.residence,
        Breakfast: feasts.breakfast || s?.meal?.breakfast ? "✓" : "",
        "Guest Breakfast": s?.guestMeal?.breakfast || 0,
        Lunch: feasts.lunch || s?.meal?.lunch ? "✓" : "",
        "Guest Lunch": s?.guestMeal?.lunch || 0,
        Dinner: feasts.dinner || s?.meal?.dinner ? "✓" : "",
        "Guest Dinner": s?.guestMeal?.dinner || 0,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Meal Data");
      XLSX.writeFile(wb, `${formattedDate}_${gender}_${residence || "all"}_meal_sheet.xlsx`);
    } catch {
      toast.error("Failed to export");
    }
  }, [feasts, formattedDate, gender, residence, debouncedSearch, sortBy, sortAsc]);

  const handleMealLock = useCallback(
    async (mealType: string) => {
      try {
        const res = await Axios.post("/feast/check", {
          date: formattedDate,
          meal: mealType,
          wing: gender,
        });
        const isFeastOn = res.data.status === "on";
        if (isFeastOn) {
          await Axios.delete(
            `/feast/date/${formattedDate}/meal/${mealType}/wing/${gender}`
          );
          setFeasts((f) => ({ ...f, [mealType]: false }));
          setLocks((l) => ({ ...l, [mealType]: false }));
          toast.success(`Hall feast for ${mealType} turned off`);
        } else {
          await Axios.post("/feast", {
            date: formattedDate,
            meal: mealType,
            wing: gender,
          });
          setFeasts((f) => ({ ...f, [mealType]: true }));
          setLocks((l) => ({ ...l, [mealType]: true }));
          toast.success(`Hall feast for ${mealType} turned on`);
        }
      } catch {
        toast.error(`Failed to update ${mealType} feast`);
      }
    },
    [formattedDate, gender]
  );

  const generateMeal = useCallback(async () => {
    const ok = await confirm({
      title: "Generate Meal?",
      description: `Generate meals for ${formattedDate}?`,
      confirmText: "Generate",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      setLoading(true);
      const res = await Axios.post("/meal/generate-meal", {
        date: formattedDate,
        wing: gender,
      });
      const params: MealParams = { date: formattedDate, wing: gender, page, limit: pageSize };
      if (debouncedSearch) params.search = debouncedSearch;
      if (residence) params.residence = residence;
      const result = await Axios.get("/meal/students", { params });
      setStudents(result.data.students ?? []);
      setPagination(result.data.pagination ?? { total: 0, totalPages: 1 });
      setMealCounts(result.data.mealCounts ?? { breakfast: 0, lunch: 0, dinner: 0 });
      setLoading(false);
      toast.success(res.data.message || "Meal generated successfully");
    } catch {
      setLoading(false);
      toast.error("Failed to generate meal");
    }
  }, [formattedDate, gender, debouncedSearch, residence, page, pageSize]);

  // True when user is typing but debounce hasn't fired yet
  const isSearchPending = search !== debouncedSearch;

  return (
    <div className="flex flex-col h-full gap-3">
      <MealControls
        fromDate={fromDate}
        setFromDate={setFromDate}
        generateMeal={generateMeal}
        exportToExcel={exportToExcel}
        formattedDate={formattedDate}
      />
      <MealStats
        gender={gender}
        setGender={setGender}
        residence={residence}
        setResidence={setResidence}
        search={search}
        setSearch={setSearch}
        breakfastCount={counts.b}
        lunchCount={counts.l}
        dinnerCount={counts.d}
        studentCount={pagination.total}
        isSearchPending={isSearchPending}
      />
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm">Loading meal data…</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <MealTable
            students={displayStudents}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortAsc={sortAsc}
            setSortAsc={setSortAsc}
            feasts={feasts}
            locks={locks}
            handleMealLock={handleMealLock}
            date={formattedDate}
            updateStudent={updateStudent}
            updateGuestMeal={updateGuestMeal}
          />
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={(size) => setPageSize(size)}
          />
        </div>
      )}
    </div>
  );
};
