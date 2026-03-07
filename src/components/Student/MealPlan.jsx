import { ChevronLeft, ChevronRight, UtensilsCrossed, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { dateToDayConverter } from "../../Utils/dateToDayConverter";
import { dateToYYYYMMDD } from "../../Utils/dateToYYYYMMDD";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MEALS = ["breakfast", "lunch", "dinner"];

const MEAL_META = {
  breakfast: { label: "Breakfast", short: "B", color: "amber"   },
  lunch:     { label: "Lunch",     short: "L", color: "emerald" },
  dinner:    { label: "Dinner",    short: "D", color: "indigo"  },
};

const ACTIVE_CLASSES = {
  amber:   "bg-amber-500   text-white border-amber-500   shadow-sm shadow-amber-200",
  emerald: "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200",
  indigo:  "bg-indigo-500  text-white border-indigo-500  shadow-sm shadow-indigo-200",
};

const INACTIVE_CLASSES = {
  amber:   "bg-background text-amber-600   border-amber-300   hover:bg-amber-50",
  emerald: "bg-background text-emerald-600 border-emerald-300 hover:bg-emerald-50",
  indigo:  "bg-background text-indigo-500  border-indigo-300  hover:bg-indigo-50",
};

const STAT_BG = {
  amber:   "bg-amber-500",
  emerald: "bg-emerald-500",
  indigo:  "bg-indigo-500",
};

const STAT_SOFT = {
  amber:   "bg-amber-100   text-amber-700   border border-amber-200",
  emerald: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  indigo:  "bg-indigo-100  text-indigo-700  border border-indigo-200",
};

const MealToggle = ({ mealType, checked, onChange, disabled, size = "md" }) => {
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
  const [meals, setMeals] = useState([]);
  const [distinctMonths, setDistinctMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [guestMeal, setGuestMeal] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  const [originalGuestMeal, setOriginalGuestMeal] = useState(null);
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

  const handleMealUpdate = async (mealId, meal) => {
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

  const handleMonthChange = useCallback(
    (increment) => {
      setSelectedMonth((prev) => {
        const index = distinctMonths.indexOf(prev);
        const next = index + increment;
        return next >= 0 && next < distinctMonths.length ? distinctMonths[next] : prev;
      });
    },
    [distinctMonths]
  );

  const handleModalOpen = () => {
    setOriginalGuestMeal({ ...guestMeal });
    setShowGuestModal(true);
  };

  const handleGuestCountChange = (e) => {
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
      const result = await toast.promise(
        Axios.put("/meal/guest-meal", { date: validDate(), guestMeal }),
        {
          loading: "Submitting…",
          success: ({ data }) => data.message || "Guest meal submitted!",
          error: (error) => error?.response?.data?.message || "Failed to submit.",
        }
      );
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
    const fetchDistinctMonths = async () => {
      const res = await Axios.get("/meal/months");
      const months = res.data;
      setDistinctMonths(months);
      setSelectedMonth(months.slice(-1)[0]);
    };
    fetchCutoffConfig();
    fetchDistinctMonths();
  }, []);

  useEffect(() => {
    const fetchMeals = async () => {
      if (!selectedMonth) return;
      const [year, month] = selectedMonth.split("-");
      const res = await Axios.get(`/meal/plan?year=${year}&month=${month}`);
      if (res.status === 200) {
        const guestData = res.data.meals.find((m) => m.date === validDate())?.guestMeal;
        setGuestMeal(guestData || { breakfast: 0, lunch: 0, dinner: 0 });
      }
      const { meals } = res.data;
      const dayOffset = new Date(meals[0].date).getDay();
      meals.unshift(...Array(dayOffset).fill(null));
      setMeals(meals);
    };
    fetchMeals();
  }, [selectedMonth]);

  const isMealEditable = (mealDate) => mealDate === validDate();

  const mealCounts = MEALS.map((type) => ({
    type,
    count: meals.filter((m) => m?.meal?.[type]).length,
  }));

  const editableDay = meals.find((m) => m && isMealEditable(m.date));

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

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

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={selectedMonth === distinctMonths[0]}
            onClick={() => handleMonthChange(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[110px] text-center">
            {formatDate(selectedMonth)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={selectedMonth === distinctMonths.slice(-1)[0]}
            onClick={() => handleMonthChange(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
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
          .filter(Boolean)
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
      <Dialog
        open={showGuestModal}
        onOpenChange={(open) => { if (!open) handleModalClose(); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Guest Meal — {validDate()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {MEALS.map((meal) => (
              <div key={meal} className="space-y-1.5">
                <Label className="capitalize">{meal}</Label>
                <Input
                  name={meal}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Number of guests"
                  value={guestMeal[meal]}
                  onChange={handleGuestCountChange}
                  onKeyDown={(e) => {
                    if (["-", ".", "e", "E"].includes(e.key)) e.preventDefault();
                  }}
                />
              </div>
            ))}
            <Button className="w-full" onClick={handleSubmitGuestMeal}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Desktop day cell ── */
function DayCell({ meal, editable, onToggle }) {
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

/* ── Mobile row ── */
function MobileRow({ meal, editable, onToggle }) {
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
