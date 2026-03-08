import { memo, useState, useEffect, useCallback } from "react";

const ITEM_HEIGHT = 44;
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Axios } from "../../../api/api";
import { cn } from "@/lib/utils";
import { useConfirm } from "../../Common/ConfirmDialog";

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
    const confirm = useConfirm();
    const [draft, setDraft] = useState(() => student.guestMeal ?? {});

    useEffect(() => {
      setDraft(student.guestMeal ?? {});
    }, [
      student.guestMeal?.breakfast,
      student.guestMeal?.lunch,
      student.guestMeal?.dinner,
    ]);

    const handleToggle = useCallback(
      async (meal) => {
        try {
          const res = await Axios.put(
            `/meal/toggle?studentId=${student.studentId}&meal=${meal}&wing=${student.gender}&date=${date}`
          );
          updateStudent(student.studentId, res.data.meal.meal);
          toast.success(`${meal} toggled`, { duration: 1500 });
        } catch (err) {
          console.error("Toggle error:", err?.response?.data || err);
          const msg = err?.response?.data?.message || `Failed to toggle ${meal}`;
          toast.error(msg);
        }
      },
      [student.studentId, student.gender, date, updateStudent]
    );

    const handleGuestChange = useCallback((e) => {
      const { name, value } = e.target;
      setDraft((d) => ({
        ...d,
        [name]: value === "" ? null : Number(value),
      }));
    }, []);

    const handleGuestSubmit = useCallback(async () => {
      const ok = await confirm({
        title: "Update Guest Meal?",
        description: <>B: <strong>{draft.breakfast ?? 0}</strong> &nbsp; L: <strong>{draft.lunch ?? 0}</strong> &nbsp; D: <strong>{draft.dinner ?? 0}</strong></>,
        confirmText: "Update",
        cancelText: "Cancel",
      });
      if (!ok) return;
      try {
        const res = await Axios.put("/meal/guest-meal", {
          studentId: student.studentId,
          guestMeal: draft,
          date,
        });
        updateGuestMeal(student.studentId, res.data.meal.guestMeal);
        toast.success("Guest meal updated");
      } catch {
        toast.error("Failed to update guest meal");
      }
    }, [draft, student.studentId, date, updateGuestMeal]);

    return (
      <tr
        className="border-b border-border/40 hover:bg-muted/30 transition-colors duration-75"
        style={{ height: ITEM_HEIGHT }}
      >
        <td className="px-3 py-0 font-medium text-sm whitespace-nowrap">
          {student.hallId}
        </td>
        <td className="px-3 py-0 text-muted-foreground text-sm whitespace-nowrap">
          {student.studentId}
        </td>
        <td className="px-3 py-0 text-sm">{student.name}</td>
        <td className="px-3 py-0 text-muted-foreground text-sm tabular-nums">
          {student.roomNo}
        </td>
        <td className="px-3 py-0 text-muted-foreground text-xs whitespace-nowrap">
          {student.residence?.replace(/_/g, " ")}
        </td>
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
        <td className="px-3 py-0">
          <div className="flex items-center gap-1">
            {["breakfast", "lunch", "dinner"].map((meal) => (
              <input
                key={meal}
                name={meal}
                type="number"
                min={0}
                value={draft?.[meal] ?? ""}
                onChange={handleGuestChange}
                placeholder={meal[0].toUpperCase()}
                className="w-12 h-7 rounded border border-input bg-background px-1.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring"
              />
            ))}
            <button
              onClick={handleGuestSubmit}
              className="ml-0.5 p-0.5 rounded hover:bg-muted transition-colors"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500 hover:text-emerald-700 transition-colors" />
            </button>
          </div>
        </td>
      </tr>
    );
  },
  (prev, next) =>
    prev.student.studentId === next.student.studentId &&
    prev.student.meal?.breakfast === next.student.meal?.breakfast &&
    prev.student.meal?.lunch === next.student.meal?.lunch &&
    prev.student.meal?.dinner === next.student.meal?.dinner &&
    prev.student.guestMeal?.breakfast === next.student.guestMeal?.breakfast &&
    prev.student.guestMeal?.lunch === next.student.guestMeal?.lunch &&
    prev.student.guestMeal?.dinner === next.student.guestMeal?.dinner &&
    prev.breakfastFeast === next.breakfastFeast &&
    prev.lunchFeast === next.lunchFeast &&
    prev.dinnerFeast === next.dinnerFeast &&
    prev.date === next.date &&
    prev.updateStudent === next.updateStudent &&
    prev.updateGuestMeal === next.updateGuestMeal
);
MealRow.displayName = "MealRow";
