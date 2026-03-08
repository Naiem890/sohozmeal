import { useCallback, useEffect, useState } from "react";
import { Axios } from "../../api/api";
import { toast } from "sonner";
import { useAuthUser } from "react-auth-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Month Picker ─────────────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function MonthPicker({ value, onChange }) {
  const [open, setOpen]         = useState(false);
  const today                   = new Date();
  const maxYear                 = today.getFullYear();
  const maxMonth                = today.getMonth(); // 0-indexed
  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? maxYear);

  const selYear  = value?.getFullYear();
  const selMonth = value?.getMonth();

  const isDisabled = (mi) =>
    viewYear > maxYear || (viewYear === maxYear && mi > maxMonth);

  const isSelected = (mi) => viewYear === selYear && mi === selMonth;

  const handleSelect = (mi) => {
    if (isDisabled(mi)) return;
    onChange(new Date(viewYear, mi, 1));
    setOpen(false);
  };

  const label = value
    ? value.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Select month";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-[170px] justify-start font-normal"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[216px] p-3" align="end">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold tabular-nums">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            disabled={viewYear >= maxYear}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTH_LABELS.map((m, i) => {
            const disabled = isDisabled(i);
            const selected = isSelected(i);
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(i)}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : disabled
                    ? "text-muted-foreground/35 cursor-not-allowed"
                    : "hover:bg-muted text-foreground cursor-pointer"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const fmt = (v) => (v ? v.toFixed(2) : "0.00");

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`rounded-xl border bg-card p-4 flex flex-col gap-1 border-l-4 ${color}`}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-xl font-bold">{value} ৳</span>
      {sub && <span className="text-xs text-muted-foreground">{sub} ৳ / head</span>}
    </div>
  );
}

// ─── Expenses page ────────────────────────────────────────────────────────────

export default function Expenses() {
  const auth = useAuthUser()();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [mealBillData, setMealBillData]   = useState([]);
  const [wing, setWing] = useState(auth.wing === "ALL" ? "MALE" : auth.wing);

  useEffect(() => {
    const fetchDistinctMonths = async () => {
      const toastId = toast.loading("Loading available months...");
      try {
        const res = await Axios.get("/meal/months");
        setSelectedMonth(res.data.slice(-1)[0]);
        toast.success("Months loaded", { id: toastId });
      } catch {
        toast.error("Error loading months", { id: toastId });
      }
    };
    fetchDistinctMonths();
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    const [year, month] = selectedMonth.split("-");
    const toastId = toast.loading("Loading bill data...");
    Axios.get(`/cost/student?year=${year}&month=${month}&wing=${wing}`)
      .then((res) => {
        setMealBillData(res.data.mealBillData);
        toast.success("Bill data loaded", { id: toastId });
      })
      .catch(() => toast.error("Error fetching bill data", { id: toastId }));
  }, [selectedMonth, wing]);

  const handleMonthChange = useCallback((date) => {
    const year  = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    setSelectedMonth(`${year}-${month}`);
  }, []);

  const getDaysInMonth = useCallback((year, month) => {
    const date = new Date(year, month, 0);
    return Array.from({ length: date.getDate() }, (_, i) =>
      `${year}-${month.toString().padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
    );
  }, []);

  const handleGenerate = async () => {
    const toastId = toast.loading("Generating bill...");
    const [year, month] = selectedMonth.split("-");
    try {
      await Axios.post(`/cost/monthly?month=${month}&year=${year}&wing=${wing}`);
      toast.success("Bill generation successful", { id: toastId });
    } catch {
      toast.error("Error during bill generation", { id: toastId });
    }
  };

  const [year, month]  = (selectedMonth || "-").split("-");
  const daysOfMonth    = selectedMonth ? getDaysInMonth(year, month) : [];
  const pickerValue    = selectedMonth ? new Date(selectedMonth + "-01") : undefined;

  const totals = mealBillData.reduce(
    (acc, d) => ({
      breakfast:        acc.breakfast        + (d.mealBill.breakfast.totalCost  || 0),
      lunch:            acc.lunch            + (d.mealBill.lunch.totalCost      || 0),
      dinner:           acc.dinner           + (d.mealBill.dinner.totalCost     || 0),
      perHeadBreakfast: acc.perHeadBreakfast + (d.mealBill.breakfast.perHeadCost || 0),
      perHeadLunch:     acc.perHeadLunch     + (d.mealBill.lunch.perHeadCost     || 0),
      perHeadDinner:    acc.perHeadDinner    + (d.mealBill.dinner.perHeadCost    || 0),
    }),
    { breakfast: 0, lunch: 0, dinner: 0, perHeadBreakfast: 0, perHeadLunch: 0, perHeadDinner: 0 }
  );
  const grandTotal   = totals.breakfast + totals.lunch + totals.dinner;
  const grandPerHead = totals.perHeadBreakfast + totals.perHeadLunch + totals.perHeadDinner;

  const subHeaders = ["Cost", "Students", "/Head"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mess Bill</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Daily cost breakdown by meal type</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={handleGenerate}>Generate</Button>

          {auth.wing === "ALL" && (
            <Select value={wing} onValueChange={setWing}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          )}

          <MonthPicker value={pickerValue} onChange={handleMonthChange} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Breakfast" value={fmt(totals.breakfast)} sub={fmt(totals.perHeadBreakfast)} color="border-l-amber-400" />
        <StatCard label="Lunch"     value={fmt(totals.lunch)}     sub={fmt(totals.perHeadLunch)}     color="border-l-sky-400" />
        <StatCard label="Dinner"    value={fmt(totals.dinner)}    sub={fmt(totals.perHeadDinner)}    color="border-l-violet-400" />
        <StatCard label="Grand Total" value={fmt(grandTotal)}     sub={fmt(grandPerHead)}            color="border-l-emerald-500" />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th rowSpan={2} className="sticky left-0 z-20 bg-muted/60 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r border-border w-20">
                  Date
                </th>
                <th colSpan={3} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border-x border-border">
                  Breakfast
                </th>
                <th colSpan={3} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider bg-sky-50 text-sky-700 border-x border-border">
                  Lunch
                </th>
                <th colSpan={3} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider bg-violet-50 text-violet-700 border-x border-border">
                  Dinner
                </th>
                <th colSpan={2} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border-l border-border">
                  Total
                </th>
              </tr>
              <tr className="border-b-2 border-border bg-muted/30">
                {[
                  ...subHeaders.map((h) => ({ label: h, cls: "text-amber-600" })),
                  ...subHeaders.map((h) => ({ label: h, cls: "text-sky-600" })),
                  ...subHeaders.map((h) => ({ label: h, cls: "text-violet-600" })),
                  { label: "Cost",  cls: "text-emerald-600" },
                  { label: "/Head", cls: "text-emerald-600" },
                ].map(({ label, cls }, i) => (
                  <th key={i} className={`px-3 py-2 text-center text-xs font-medium whitespace-nowrap ${cls} border-x border-border/50`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daysOfMonth.map((day, idx) => {
                const d = mealBillData.find((x) => x.date === day);
                const rowTotal =
                  (d?.mealBill?.breakfast?.totalCost || 0) +
                  (d?.mealBill?.lunch?.totalCost     || 0) +
                  (d?.mealBill?.dinner?.totalCost    || 0);
                const rowPerHead =
                  (d?.mealBill?.breakfast?.perHeadCost || 0) +
                  (d?.mealBill?.lunch?.perHeadCost     || 0) +
                  (d?.mealBill?.dinner?.perHeadCost    || 0);
                const hasData = !!d;
                return (
                  <tr
                    key={day}
                    className={`transition-colors hover:bg-muted/40 ${idx % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                  >
                    <td className="sticky left-0 z-10 px-4 py-2 font-semibold text-xs whitespace-nowrap border-r border-border bg-inherit">
                      <div className="text-foreground">{new Date(day + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}</div>
                      <div className="text-muted-foreground font-normal">{new Date(day + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    </td>
                    <td className={`px-3 py-2 text-center text-xs border-l border-border/50 ${hasData ? "text-amber-700 font-medium" : "text-muted-foreground"}`}>
                      {fmt(d?.mealBill?.breakfast?.totalCost)}
                    </td>
                    <td className="px-3 py-2 text-center text-xs border-l border-border/50 text-muted-foreground">
                      {d?.mealBill?.breakfast?.totalStudent || "—"}
                    </td>
                    <td className={`px-3 py-2 text-center text-xs border-l border-border/50 ${hasData ? "text-amber-700" : "text-muted-foreground"}`}>
                      {fmt(d?.mealBill?.breakfast?.perHeadCost)}
                    </td>
                    <td className={`px-3 py-2 text-center text-xs border-l border-border ${hasData ? "text-sky-700 font-medium" : "text-muted-foreground"}`}>
                      {fmt(d?.mealBill?.lunch?.totalCost)}
                    </td>
                    <td className="px-3 py-2 text-center text-xs border-l border-border/50 text-muted-foreground">
                      {d?.mealBill?.lunch?.totalStudent || "—"}
                    </td>
                    <td className={`px-3 py-2 text-center text-xs border-l border-border/50 ${hasData ? "text-sky-700" : "text-muted-foreground"}`}>
                      {fmt(d?.mealBill?.lunch?.perHeadCost)}
                    </td>
                    <td className={`px-3 py-2 text-center text-xs border-l border-border ${hasData ? "text-violet-700 font-medium" : "text-muted-foreground"}`}>
                      {fmt(d?.mealBill?.dinner?.totalCost)}
                    </td>
                    <td className="px-3 py-2 text-center text-xs border-l border-border/50 text-muted-foreground">
                      {d?.mealBill?.dinner?.totalStudent || "—"}
                    </td>
                    <td className={`px-3 py-2 text-center text-xs border-l border-border/50 ${hasData ? "text-violet-700" : "text-muted-foreground"}`}>
                      {fmt(d?.mealBill?.dinner?.perHeadCost)}
                    </td>
                    <td className={`px-3 py-2 text-center text-xs border-l border-border font-semibold ${hasData ? "text-emerald-700" : "text-muted-foreground"}`}>
                      {rowTotal.toFixed(2)}
                    </td>
                    <td className={`px-3 py-2 text-center text-xs border-l border-border/50 font-medium ${hasData ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {rowPerHead.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/50">
                <td className="sticky left-0 z-10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-foreground border-r border-border bg-muted/50">
                  Total
                </td>
                <td className="px-3 py-3 text-center text-xs font-bold text-amber-700 border-l border-border/50">{fmt(totals.breakfast)}</td>
                <td className="px-3 py-3 text-center text-xs text-muted-foreground border-l border-border/50">—</td>
                <td className="px-3 py-3 text-center text-xs font-semibold text-amber-600 border-l border-border/50">{fmt(totals.perHeadBreakfast)}</td>
                <td className="px-3 py-3 text-center text-xs font-bold text-sky-700 border-l border-border">{fmt(totals.lunch)}</td>
                <td className="px-3 py-3 text-center text-xs text-muted-foreground border-l border-border/50">—</td>
                <td className="px-3 py-3 text-center text-xs font-semibold text-sky-600 border-l border-border/50">{fmt(totals.perHeadLunch)}</td>
                <td className="px-3 py-3 text-center text-xs font-bold text-violet-700 border-l border-border">{fmt(totals.dinner)}</td>
                <td className="px-3 py-3 text-center text-xs text-muted-foreground border-l border-border/50">—</td>
                <td className="px-3 py-3 text-center text-xs font-semibold text-violet-600 border-l border-border/50">{fmt(totals.perHeadDinner)}</td>
                <td className="px-3 py-3 text-center text-xs font-bold text-emerald-700 border-l border-border">{fmt(grandTotal)}</td>
                <td className="px-3 py-3 text-center text-xs font-semibold text-emerald-600 border-l border-border/50">{fmt(grandPerHead)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
