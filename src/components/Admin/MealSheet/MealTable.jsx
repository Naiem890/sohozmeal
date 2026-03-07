import { useEffect, useRef, useState } from "react";
import { MealRow } from "./MealRow";
import { MealLocks } from "./MealLocks";
import { ArrowUpDown } from "lucide-react";

const ITEM_HEIGHT = 44;
const BUFFER = 8;

export const MealTable = ({
  students,
  sortBy,
  setSortBy,
  sortAsc,
  setSortAsc,
  feasts,
  locks,
  handleMealLock,
  date,
  updateStudent,
  updateGuestMeal,
}) => {
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setContainerHeight(el.clientHeight);
    const onScroll = () => setScrollTop(el.scrollTop);
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight));
    el.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  // Reset scroll on list change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setScrollTop(0);
  }, [students]);

  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const endIdx = Math.min(
    students.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER
  );
  const paddingTop = startIdx * ITEM_HEIGHT;
  const paddingBottom = Math.max(0, (students.length - endIdx) * ITEM_HEIGHT);

  const toggleSort = (col) => {
    if (sortBy === col) setSortAsc((p) => !p);
    else {
      setSortBy(col);
      setSortAsc(true);
    }
  };

  const SortTh = ({ col, label, className = "" }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 shrink-0 transition-opacity ${
            sortBy === col ? "opacity-100 text-primary" : "opacity-25"
          }`}
        />
      </div>
    </th>
  );

  return (
    <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden min-h-0">
      <div ref={scrollRef} className="overflow-auto h-full">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60 sticky top-0 z-10 border-b border-border/60 backdrop-blur-sm">
              <SortTh col="hallId" label="Hall ID" />
              <SortTh col="studentId" label="Student ID" />
              <SortTh col="name" label="Name" />
              <SortTh col="roomNo" label="Room" />
              <SortTh col="residence" label="Residence" />
              <th className="px-3 py-2 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Meal
                  </span>
                  <MealLocks
                    feasts={feasts}
                    locks={locks}
                    handleMealLock={handleMealLock}
                  />
                </div>
              </th>
              <th className="px-3 py-2 text-left">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Guest Meal
                  </span>
                  <div className="flex gap-1 text-[10px] text-muted-foreground/50">
                    <span className="w-12 text-center">B</span>
                    <span className="w-12 text-center">L</span>
                    <span className="w-12 text-center">D</span>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr style={{ height: paddingTop }} aria-hidden="true">
                <td />
              </tr>
            )}
            {students.slice(startIdx, endIdx).map((student) => (
              <MealRow
                key={student.studentId}
                student={student}
                breakfastFeast={feasts.breakfast}
                lunchFeast={feasts.lunch}
                dinnerFeast={feasts.dinner}
                date={date}
                updateStudent={updateStudent}
                updateGuestMeal={updateGuestMeal}
              />
            ))}
            {paddingBottom > 0 && (
              <tr style={{ height: paddingBottom }} aria-hidden="true">
                <td />
              </tr>
            )}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            No students found
          </div>
        )}
      </div>
    </div>
  );
};
