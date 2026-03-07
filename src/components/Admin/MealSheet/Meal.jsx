import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { MealTable } from "./MealTable";
import { MealStats } from "./MealStats";
import { Axios } from "../../../api/api";
import { MealControls } from "./MealControls";
import { useConfirm } from "../../Common/ConfirmDialog";
import { useAuthUser } from "react-auth-kit";
import { Loader2 } from "lucide-react";

export const formatMealDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const EMPTY_FEASTS = { breakfast: false, lunch: false, dinner: false };

export const Meal = () => {
  const auth = useAuthUser()();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("roomNo");
  const [sortAsc, setSortAsc] = useState(true);
  const [students, setStudents] = useState([]);
  const [gender, setGender] = useState(auth.wing === "ALL" ? "MALE" : auth.wing);
  const [residence, setResidence] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [feasts, setFeasts] = useState(EMPTY_FEASTS);
  const [locks, setLocks] = useState(EMPTY_FEASTS);

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

  // Fetch feasts separately — only needs date + gender
  useEffect(() => {
    let cancelled = false;
    Axios.get(`/feast/date/${formattedDate}/wing/${gender}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data.length > 0) {
          const meals = res.data[0].meal;
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
      })
      .catch(() => {
        if (!cancelled) {
          setFeasts(EMPTY_FEASTS);
          setLocks(EMPTY_FEASTS);
        }
      });
    return () => { cancelled = true; };
  }, [formattedDate, gender]);

  // Fetch students from backend with all active filters
  const isFirstLoad = useRef(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = { date: formattedDate, gender };
    if (debouncedSearch) params.search = debouncedSearch;
    if (residence) params.residence = residence;

    Axios.get("/meal/students", { params })
      .then((res) => {
        if (!cancelled) {
          setStudents(res.data);
          setLoading(false);
          isFirstLoad.current = false;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          toast.error("Failed to load students");
        }
      });

    return () => { cancelled = true; };
  }, [formattedDate, gender, debouncedSearch, residence]);

  // Sort client-side — instant, no API round-trip needed
  const displayStudents = useMemo(() => {
    if (!sortBy) return students;
    return [...students].sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return sortAsc ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [students, sortBy, sortAsc]);

  const counts = useMemo(
    () => ({
      b: students.filter((s) => feasts.breakfast || s?.meal?.breakfast).length,
      l: students.filter((s) => feasts.lunch || s?.meal?.lunch).length,
      d: students.filter((s) => feasts.dinner || s?.meal?.dinner).length,
    }),
    [students, feasts]
  );

  const updateStudent = useCallback((studentId, meal) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, meal } : s))
    );
  }, []);

  const updateGuestMeal = useCallback((studentId, guestMeal) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, guestMeal } : s))
    );
  }, []);

  const exportToExcel = useCallback(() => {
    const data = displayStudents.map((s) => ({
      "Hall ID": s.hallId,
      "Student ID": s.studentId,
      Name: s.name,
      "Room No": s.roomNo,
      Residence: s.residence,
      Breakfast: feasts.breakfast || s?.meal?.breakfast ? "✓" : "",
      Lunch: feasts.lunch || s?.meal?.lunch ? "✓" : "",
      Dinner: feasts.dinner || s?.meal?.dinner ? "✓" : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Meal Data");
    XLSX.writeFile(
      wb,
      `${formattedDate}_${gender}_${residence || "all"}_meal_sheet.xlsx`
    );
  }, [displayStudents, feasts, formattedDate, gender, residence]);

  const handleMealLock = useCallback(
    async (mealType) => {
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
      const params = { date: formattedDate, gender };
      if (debouncedSearch) params.search = debouncedSearch;
      if (residence) params.residence = residence;
      const result = await Axios.get("/meal/students", { params });
      setStudents(result.data);
      setLoading(false);
      toast.success(res.data.message || "Meal generated successfully");
    } catch {
      setLoading(false);
      toast.error("Failed to generate meal");
    }
  }, [formattedDate, gender, debouncedSearch, residence]);

  // True when user is typing but debounce hasn't fired yet
  const isSearchPending = search !== debouncedSearch;

  return (
    <div className="flex flex-col h-screen gap-3">
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
        studentCount={students.length}
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
      )}
    </div>
  );
};
