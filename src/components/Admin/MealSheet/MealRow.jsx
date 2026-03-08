import { memo, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Check, Minus, Plus } from "lucide-react";
import { Axios } from "../../../api/api";
import { cn } from "@/lib/utils";

const ITEM_HEIGHT = 44;

// ─── Meal toggle button ───────────────────────────────────────────────────────

const MealBtn = memo(({ active, feast, onClick, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-8 h-8 rounded-full text-xs font-bold transition-all duration-150 shrink-0",
      feast
        ? "bg-amber-400 text-white shadow-sm ring-2 ring-amber-200"
        : active
        ? "bg-emerald-500 text-white shadow-sm"
        : "border-2 border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-500"
    )}
  >
    {label}
  </button>
));
MealBtn.displayName = "MealBtn";

// ─── Guest meal stepper ───────────────────────────────────────────────────────

const GuestStepper = memo(({ label, value, onChange }) => (
  <div className="flex items-center">
    <span className="text-[9px] font-semibold text-muted-foreground/60 w-3 shrink-0 select-none">
      {label}
    </span>
    <button
      type="button"
      onClick={() => onChange(Math.max(0, value - 1))}
      className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      <Minus className="h-2.5 w-2.5" />
    </button>
    <span
      className={cn(
        "w-5 text-center text-xs tabular-nums font-mono select-none",
        value > 0 ? "text-amber-600 font-bold" : "text-muted-foreground/40"
      )}
    >
      {value}
    </span>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      <Plus className="h-2.5 w-2.5" />
    </button>
  </div>
));
GuestStepper.displayName = "GuestStepper";

// ─── Row ──────────────────────────────────────────────────────────────────────

export const MealRow = memo(
  ({
    student,
    breakfastFeast,
    lunchFeast,
    dinnerFeast,
    date,
    updateStudent,
    updateGuestMeal,
  }) => {
    const [draft, setDraft] = useState(() => ({
      breakfast: student.guestMeal?.breakfast ?? 0,
      lunch:     student.guestMeal?.lunch     ?? 0,
      dinner:    student.guestMeal?.dinner    ?? 0,
    }));
    const [saving, setSaving] = useState(false);

    // Sync draft when parent state updates (e.g. after save or page refresh)
    useEffect(() => {
      setDraft({
        breakfast: student.guestMeal?.breakfast ?? 0,
        lunch:     student.guestMeal?.lunch     ?? 0,
        dinner:    student.guestMeal?.dinner    ?? 0,
      });
    }, [
      student.guestMeal?.breakfast,
      student.guestMeal?.lunch,
      student.guestMeal?.dinner,
    ]);

    const saved = student.guestMeal ?? { breakfast: 0, lunch: 0, dinner: 0 };
    const isDirty =
      draft.breakfast !== (saved.breakfast ?? 0) ||
      draft.lunch     !== (saved.lunch     ?? 0) ||
      draft.dinner    !== (saved.dinner    ?? 0);

    const setMeal = useCallback((meal) => (value) => {
      setDraft((d) => ({ ...d, [meal]: value }));
    }, []);

    const handleToggle = useCallback(
      async (meal) => {
        try {
          const res = await Axios.put(
            `/meal/toggle?studentId=${student.studentId}&meal=${meal}&wing=${student.gender}&date=${date}`
          );
          updateStudent(student.studentId, res.data.meal.meal);
          toast.success(`${meal} toggled`, { duration: 1500 });
        } catch (err) {
          const msg = err?.response?.data?.message || `Failed to toggle ${meal}`;
          toast.error(msg);
        }
      },
      [student.studentId, student.gender, date, updateStudent]
    );

    const handleGuestSave = useCallback(async () => {
      if (saving) return;
      setSaving(true);
      try {
        const res = await Axios.put("/meal/guest-meal", {
          studentId: student.studentId,
          guestMeal: draft,
          date,
        });
        updateGuestMeal(student.studentId, res.data.meal.guestMeal);
        toast.success("Guest meal updated", { duration: 1500 });
      } catch {
        toast.error("Failed to update guest meal");
      } finally {
        setSaving(false);
      }
    }, [draft, student.studentId, date, updateGuestMeal, saving]);

    const totalGuest = draft.breakfast + draft.lunch + draft.dinner;

    return (
      <tr
        className={cn(
          "border-b border-border/40 transition-colors duration-75",
          isDirty ? "bg-amber-50/60 hover:bg-amber-50" : "hover:bg-muted/30"
        )}
        style={{ height: ITEM_HEIGHT }}
      >
        <td className="px-3 py-0 font-medium text-sm whitespace-nowrap">
          {student.hallId}
        </td>
        <td className="px-3 py-0 text-muted-foreground text-sm whitespace-nowrap">
          {student.studentId}
        </td>
        <td className="px-3 py-0 text-sm">
          <div className="flex items-center gap-1.5">
            {student.name}
            {totalGuest > 0 && !isDirty && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                +{totalGuest}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-0 text-muted-foreground text-sm tabular-nums">
          {student.roomNo}
        </td>
        <td className="px-3 py-0 text-muted-foreground text-xs whitespace-nowrap">
          {student.residence?.replace(/_/g, " ")}
        </td>

        {/* Meal toggles */}
        <td className="px-3 py-0">
          <div className="flex gap-1.5 justify-center">
            <MealBtn
              active={breakfastFeast || student?.meal?.breakfast}
              feast={breakfastFeast}
              onClick={() => handleToggle("breakfast")}
              label="B"
            />
            <MealBtn
              active={lunchFeast || student?.meal?.lunch}
              feast={lunchFeast}
              onClick={() => handleToggle("lunch")}
              label="L"
            />
            <MealBtn
              active={dinnerFeast || student?.meal?.dinner}
              feast={dinnerFeast}
              onClick={() => handleToggle("dinner")}
              label="D"
            />
          </div>
        </td>

        {/* Guest meal steppers */}
        <td className="px-2 py-0">
          <div className="flex items-center gap-1">
            <GuestStepper label="B" value={draft.breakfast} onChange={setMeal("breakfast")} />
            <GuestStepper label="L" value={draft.lunch}     onChange={setMeal("lunch")} />
            <GuestStepper label="D" value={draft.dinner}    onChange={setMeal("dinner")} />

            <button
              type="button"
              onClick={handleGuestSave}
              disabled={!isDirty || saving}
              className={cn(
                "ml-1 h-6 w-6 flex items-center justify-center rounded-full transition-all duration-150",
                isDirty && !saving
                  ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 scale-110"
                  : "text-muted-foreground/25 cursor-default"
              )}
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
    );
  },
  (prev, next) =>
    prev.student.studentId           === next.student.studentId           &&
    prev.student.meal?.breakfast      === next.student.meal?.breakfast      &&
    prev.student.meal?.lunch          === next.student.meal?.lunch          &&
    prev.student.meal?.dinner         === next.student.meal?.dinner         &&
    prev.student.guestMeal?.breakfast === next.student.guestMeal?.breakfast &&
    prev.student.guestMeal?.lunch     === next.student.guestMeal?.lunch     &&
    prev.student.guestMeal?.dinner    === next.student.guestMeal?.dinner    &&
    prev.breakfastFeast === next.breakfastFeast &&
    prev.lunchFeast     === next.lunchFeast     &&
    prev.dinnerFeast    === next.dinnerFeast     &&
    prev.date           === next.date            &&
    prev.updateStudent  === next.updateStudent   &&
    prev.updateGuestMeal === next.updateGuestMeal
);
MealRow.displayName = "MealRow";
