import { CalendarDays, ChevronLeft, ChevronRight, UtensilsCrossed, Users } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { dateToDayConverter } from "../../Utils/dateToDayConverter";
import { dateToYYYYMMDD } from "../../Utils/dateToYYYYMMDD";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Minus, Plus } from "lucide-react";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MIN_YEAR = 2023;

function MonthYearPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const now = new Date();
  const [pickerYear, setPickerYear] = useState(() =>
    value ? parseInt(value.split("-")[0]) : now.getFullYear()
  );
  const [open, setOpen] = useState(false);

  const selYear = value ? parseInt(value.split("-")[0]) : null;
  const selMonthIdx = value ? parseInt(value.split("-")[1]) - 1 : null;

  const handleSelect = (idx: number) => {
    onChange(`${pickerYear}-${String(idx + 1).padStart(2, "0")}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-semibold min-w-[148px] justify-between">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-left">{value ? formatDate(value) : "Select month"}</span>
          <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-90")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setPickerYear((y) => Math.max(MIN_YEAR, y - 1))}
            disabled={pickerYear <= MIN_YEAR}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold tracking-wide">{pickerYear}</span>
          <button
            type="button"
            onClick={() => setPickerYear((y) => Math.min(now.getFullYear(), y + 1))}
            disabled={pickerYear >= now.getFullYear()}
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTH_NAMES.map((name, idx) => {
            const isFuture =
              pickerYear > now.getFullYear() ||
              (pickerYear === now.getFullYear() && idx > now.getMonth());
            const isSelected = selYear === pickerYear && selMonthIdx === idx;
            const isCurrent =
              pickerYear === now.getFullYear() && idx === now.getMonth();

            return (
              <button
                key={name}
                type="button"
                disabled={isFuture}
                onClick={() => handleSelect(idx)}
                className={cn(
                  "rounded-lg py-2 text-sm font-medium transition-colors relative",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isFuture
                    ? "text-muted-foreground/30 pointer-events-none"
                    : "hover:bg-muted text-foreground",
                  !isSelected && isCurrent && "ring-1 ring-primary/40 text-primary font-semibold"
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const MEALS: MealType[] = ["breakfast", "lunch", "dinner"];

const MEAL_META: Record<MealType, { label: string; short: string; color: MealColor }> = {
  breakfast: { label: "Breakfast", short: "B", color: "amber"   },
  lunch:     { label: "Lunch",     short: "L", color: "emerald" },
  dinner:    { label: "Dinner",    short: "D", color: "indigo"  },
};

const ACTIVE_CLASSES: Record<MealColor, string> = {
  amber:   "bg-amber-500   text-white border-amber-500   shadow-sm shadow-amber-200",
  emerald: "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200",
  indigo:  "bg-indigo-500  text-white border-indigo-500  shadow-sm shadow-indigo-200",
};

const INACTIVE_CLASSES: Record<MealColor, string> = {
  amber:   "bg-background text-amber-600   border-amber-300   hover:bg-amber-50",
  emerald: "bg-background text-emerald-600 border-emerald-300 hover:bg-emerald-50",
  indigo:  "bg-background text-indigo-500  border-indigo-300  hover:bg-indigo-50",
};

const STAT_BG: Record<MealColor, string> = {
  amber:   "bg-amber-500",
  emerald: "bg-emerald-500",
  indigo:  "bg-indigo-500",
};

const STAT_SOFT: Record<MealColor, string> = {
  amber:   "bg-amber-100   text-amber-700   border border-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  indigo:  "bg-indigo-100  text-indigo-700  border border-indigo-200",
};

type MealColor = "amber" | "emerald" | "indigo";
type MealType = "breakfast" | "lunch" | "dinner";

interface MealData {
  _id: string;
  date: string;
  meal: Record<MealType, boolean>;
  guestMeal: Record<MealType, number>;
}

interface GuestMealCounts {
  breakfast: number | "";
  lunch: number | "";
  dinner: number | "";
}

interface MealToggleProps {
  mealType: MealType;
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
  size?: "sm" | "md";
}

const MealToggle = ({ mealType, checked, onChange, disabled, size = "md" }: MealToggleProps) => {
  const { short, color } = MEAL_META[mealType];
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "border rounded-full font-bold transition-all duration-150 shrink-0 select-none",
        size === "sm"
          ? "w-7 h-7 text-[10px]"
          : "w-8 h-8 text-xs",
        checked ? ACTIVE_CLASSES[color] : INACTIVE_CLASSES[color],
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {short}
    </button>
  );
};

export default function MealPlan() {
  const auth = useAuthUser()();
  const [meals, setMeals] = useState<(MealData | null)[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [guestMeal, setGuestMeal] = useState<GuestMealCounts>({ breakfast: 0, lunch: 0, dinner: 0 });
  const [originalGuestMeal, setOriginalGuestMeal] = useState<GuestMealCounts | null>(null);
  const [cutoffHour, setCutoffHour] = useState(22);
  const [cutoffMinute, setCutoffMinute] = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const validDate = () => {
    const now = new Date();
    const afterCutoff =
      now.getHours() > cutoffHour ||
      (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMinute);
    const d = new Date();
    d.setDate(d.getDate() + (afterCutoff ? 2 : 1));
    return dateToYYYYMMDD(d);
  };

  const cutoffLabel = `${String(cutoffHour).padStart(2, "0")}:${String(cutoffMinute).padStart(2, "0")}`;

  const handleMealUpdate = async (mealId: string, meal: Partial<Record<MealType, boolean>>) => {
    const oldMeal = meals.find((m) => m?._id === mealId)?.meal;
    setMeals((prev) =>
      prev.map((m) =>
        m?._id !== mealId ? m : { ...m, meal: { ...m.meal, ...meal } }
      )
    );
    try {
      await toast.promise(
        Axios.put(`/meal/plan/${mealId}`, { meal }),
        {
          loading: "Updating…",
          success: ({ data }) => data.message || "Meal updated!",
          error: (error) => error?.response?.data?.message || "Failed to update meal.",
        }
      );
    } catch (error) {
      if (oldMeal) {
        setMeals((prev) =>
          prev.map((m) =>
            m?._id !== mealId ? m : { ...m, meal: oldMeal }
          )
        );
      }
      console.error("Meal update error:", error);
    }
  };

  const handleModalOpen = () => {
    setOriginalGuestMeal({ ...guestMeal });
    setShowGuestModal(true);
  };

  const handleGuestCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuestMeal((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Math.max(0, Math.floor(Number(value))),
    }));
  };

  const handleModalClose = useCallback(() => {
    if (originalGuestMeal) setGuestMeal({ ...originalGuestMeal });
    setShowGuestModal(false);
  }, [originalGuestMeal]);

  const handleSubmitGuestMeal = async () => {
    try {
      const apiPromise = Axios.put("/meal/guest-meal", { date: validDate(), guestMeal });
      toast.promise(apiPromise, {
        loading: "Submitting…",
        success: ({ data }) => data.message || "Guest meal submitted!",
        error: (error) => error?.response?.data?.message || "Failed to submit.",
      });
      const result = await apiPromise;
      if (result.status === 200) {
        setMeals((prev) =>
          prev.map((m) => (m?.date === validDate() ? result?.data?.meal : m))
        );
        setGuestMeal(result?.data?.meal?.guestMeal);
        setShowGuestModal(false);
      }
    } catch (error) {
      console.error("Guest meal submit error:", error);
    }
  };

  useEffect(() => {
    const fetchCutoffConfig = async () => {
      try {
        const res = await Axios.get(`/meal/config?wing=${auth?.wing || "MALE"}`);
        setCutoffHour(res.data.cutoffHour ?? 22);
        setCutoffMinute(res.data.cutoffMinute ?? 0);
      } catch (e) {
        console.error("Failed to fetch meal config:", e);
      }
    };
    fetchCutoffConfig();
  }, []);

  useEffect(() => {
    const fetchMeals = async () => {
      if (!selectedMonth) return;
      const [year, month] = selectedMonth.split("-");
      const res = await Axios.get(`/meal/plan?year=${year}&month=${month}`);
      const { meals } = res.data;
      if (!meals || meals.length === 0) {
        setMeals([]);
        return;
      }
      if (res.status === 200) {
        const guestData = meals.find((m: MealData) => m.date === validDate())?.guestMeal;
        setGuestMeal(guestData || { breakfast: 0, lunch: 0, dinner: 0 });
      }
      const dayOffset = new Date(meals[0].date).getDay();
      meals.unshift(...Array(dayOffset).fill(null));
      setMeals(meals);
    };
    fetchMeals();
  }, [selectedMonth]);

  const isMealEditable = (mealDate: string) => mealDate === validDate();

  const mealCounts = MEALS.map((type) => ({
    type,
    count: meals.filter((m) => m?.meal?.[type]).length,
  }));

  const editableDay = meals.find((m) => m && isMealEditable(m.date));

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            Meal Plan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toggle closes daily at{" "}
            <span className="font-semibold text-foreground">{cutoffLabel}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleModalOpen} className="gap-2 shrink-0">
          <Users className="h-4 w-4" />
          Guest Meal
        </Button>
      </div>

      {/* ── Today's editable card (prominent) ── */}
      {editableDay && (
        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/60 via-background to-indigo-50/40 p-4 flex items-center justify-between gap-4 relative overflow-hidden">
          {/* left accent bar */}
          <span className="absolute left-0 inset-y-0 w-1 rounded-l-2xl bg-gradient-to-b from-amber-400 via-emerald-400 to-indigo-400" />
          <div className="pl-3">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">
              Editable Today
            </p>
            <p className="text-base font-bold text-foreground">
              {dateToDayConverter(editableDay.date)}
            </p>
            <p className="text-xs text-muted-foreground">{editableDay.date}</p>
          </div>
          <div className="flex gap-3 items-center">
            {MEALS.map((mealType) => (
              <div key={mealType} className="flex flex-col items-center gap-1.5">
                <MealToggle
                  mealType={mealType}
                  checked={editableDay.meal[mealType]}
                  onChange={() =>
                    handleMealUpdate(editableDay._id, {
                      [mealType]: !editableDay.meal[mealType],
                    })
                  }
                  disabled={false}
                  size="md"
                />
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {MEAL_META[mealType].label.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats + Month nav ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Meal counts */}
        <div className="flex gap-2">
          {mealCounts.map(({ type, count }) => {
            const { color, label } = MEAL_META[type];
            return (
              <div
                key={type}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                  STAT_SOFT[color]
                )}
              >
                <span
                  className={cn("w-2 h-2 rounded-full shrink-0", STAT_BG[color])}
                />
                <span className="hidden sm:inline">{label}</span>
                <span className="font-bold">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Month / year picker */}
        <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* ── Desktop calendar ── */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2.5"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {meals.map((meal, i) =>
            meal?._id ? (
              <DayCell
                key={meal._id}
                meal={meal}
                editable={isMealEditable(meal.date)}
                onToggle={(mealType) =>
                  handleMealUpdate(meal._id, { [mealType]: !meal.meal[mealType] })
                }
              />
            ) : (
              <div key={i} className="border-b border-r border-border/40 min-h-[88px]" />
            )
          )}
        </div>
      </div>

      {/* ── Mobile list ── */}
      <div className="md:hidden rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {meals
          .filter((m): m is MealData => m !== null)
          .map((meal) => (
            <MobileRow
              key={meal._id}
              meal={meal}
              editable={isMealEditable(meal.date)}
              onToggle={(mealType) =>
                handleMealUpdate(meal._id, { [mealType]: !meal.meal[mealType] })
              }
            />
          ))}
      </div>

      {/* ── Guest Meal Dialog ── */}
      <Dialog open={showGuestModal} onOpenChange={(open) => { if (!open) handleModalClose(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              Guest Meal
            </DialogTitle>
            <DialogDescription>
              Add extra guests for <span className="font-semibold text-foreground">{validDate()}</span>.
              Guests are charged the same per-head rate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {MEALS.map((mealType) => {
              const { label, color } = MEAL_META[mealType];
              const count = guestMeal[mealType] || 0;

              const cardBg    = { amber: "bg-amber-50   border-amber-200",   emerald: "bg-emerald-50 border-emerald-200", indigo: "bg-indigo-50  border-indigo-200"  }[color];
              const labelCls  = { amber: "text-amber-700",  emerald: "text-emerald-700", indigo: "text-indigo-700"  }[color];
              const dotCls    = { amber: "bg-amber-400",    emerald: "bg-emerald-400",   indigo: "bg-indigo-400"    }[color];
              const btnCls    = { amber: "hover:bg-amber-100 text-amber-700 border-amber-300",   emerald: "hover:bg-emerald-100 text-emerald-700 border-emerald-300", indigo: "hover:bg-indigo-100 text-indigo-700 border-indigo-300"  }[color];
              const countCls  = { amber: "text-amber-800",  emerald: "text-emerald-800", indigo: "text-indigo-800"  }[color];

              const decrement = () => setGuestMeal((p) => ({ ...p, [mealType]: Math.max(0, (p[mealType] || 0) - 1) }));
              const increment = () => setGuestMeal((p) => ({ ...p, [mealType]: (p[mealType] || 0) + 1 }));

              return (
                <div key={mealType} className={`flex items-center justify-between rounded-xl border p-3.5 ${cardBg}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />
                    <span className={`text-sm font-semibold ${labelCls}`}>{label}</span>
                    {count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white/70 font-medium ${countCls}`}>
                        {count} {count === 1 ? "guest" : "guests"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={decrement}
                      disabled={count === 0}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors bg-white/80 disabled:opacity-30 disabled:cursor-not-allowed ${btnCls}`}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={count}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGuestMeal((p) => ({ ...p, [mealType]: v === "" ? 0 : Math.max(0, Math.floor(Number(v))) }));
                      }}
                      onKeyDown={(e) => { if (["-", ".", "e", "E"].includes(e.key)) e.preventDefault(); }}
                      className={`w-10 text-center text-sm font-bold rounded-lg border bg-white/80 py-1 focus:outline-none focus:ring-1 focus:ring-ring ${countCls} border-current/20`}
                    />
                    <button
                      type="button"
                      onClick={increment}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors bg-white/80 ${btnCls}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Total summary */}
            {(Number(guestMeal.breakfast) + Number(guestMeal.lunch) + Number(guestMeal.dinner)) > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">Total guests</span>
                <span className="text-base font-bold text-foreground">
                  {Number(guestMeal.breakfast) + Number(guestMeal.lunch) + Number(guestMeal.dinner)}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={handleModalClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmitGuestMeal} className="flex-1">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DayCellProps {
  meal: MealData;
  editable: boolean;
  onToggle: (mealType: MealType) => void;
}

/* ── Desktop day cell ── */
function DayCell({ meal, editable, onToggle }: DayCellProps) {
  const dayNum = meal.date.split("-")[2];
  return (
    <div
      className={cn(
        "min-h-[92px] p-2.5 border-b border-r border-border/40 flex flex-col gap-2 transition-colors",
        editable
          ? "bg-amber-50/40 ring-1 ring-inset ring-amber-200/60"
          : "opacity-40 pointer-events-none"
      )}
    >
      <span
        className={cn(
          "text-lg font-bold leading-none",
          editable ? "text-amber-600" : "text-muted-foreground"
        )}
      >
        {dayNum}
      </span>
      <div className="flex gap-1 flex-wrap">
        {MEALS.map((mealType) => (
          <MealToggle
            key={mealType}
            mealType={mealType}
            checked={meal.meal[mealType]}
            onChange={() => onToggle(mealType)}
            disabled={!editable}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}

interface MobileRowProps {
  meal: MealData;
  editable: boolean;
  onToggle: (mealType: MealType) => void;
}

/* ── Mobile row ── */
function MobileRow({ meal, editable, onToggle }: MobileRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 transition-colors",
        editable ? "bg-amber-50/30" : "opacity-40 pointer-events-none"
      )}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">
          <span className="text-muted-foreground font-normal mr-1.5 text-xs">
            {dateToDayConverter(meal.date)}
          </span>
          {meal.date}
        </p>
        {editable && (
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">
            Editable
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {MEALS.map((mealType) => (
          <MealToggle
            key={mealType}
            mealType={mealType}
            checked={meal.meal[mealType]}
            onChange={() => onToggle(mealType)}
            disabled={!editable}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}
