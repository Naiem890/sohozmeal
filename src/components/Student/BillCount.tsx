import { useEffect, useMemo, useState } from "react";
import { Axios } from "../../api/api";
import { MonthYearPicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface MealBillEntry { status: boolean; perHeadCost: number }
interface BillDataItem {
  date: string;
  guestMeal: { breakfast: number; lunch: number; dinner: number };
  mealBill: { breakfast: MealBillEntry; lunch: MealBillEntry; dinner: MealBillEntry };
}
interface HallFeastItem { date: string; meal: string }

const fmt = (n: number) => Number(n).toFixed(2);

interface MealColProps { on: boolean; cost: number; gCost: number; g: number }
function MealCol({ on, cost, gCost, g }: MealColProps) {
  if (!on && g === 0)
    return <span className="text-muted-foreground/30 text-xs">—</span>;
  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      {on && (
        <span className="text-xs font-medium tabular-nums">
          {fmt(cost)} ৳
        </span>
      )}
      {g > 0 && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          +{g} guest ({fmt(gCost)} ৳)
        </span>
      )}
    </div>
  );
}

export default function BillCount() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [mealBillData, setMealBillData] = useState<BillDataItem[]>([]);
  const [hallFeasts,   setHallFeasts]   = useState<HallFeastItem[]>([]);
  const [wing] = useState("MALE");

  const year  = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth() + 1;

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const [billRes, feastRes] = await Promise.all([
          Axios.get(`/cost/student?year=${year}&month=${month}&wing=${wing}`),
          Axios.get(`/feast/month/${year}/${month}/wing/${wing}`),
        ]);
        setMealBillData(billRes.data.mealBillData);
        setHallFeasts(feastRes.data);
      } catch {
        // silently handled
      }
    };
    fetchBill();
  }, [year, month, wing]);

  const daysOfMonth = useMemo(() => {
    const days = [];
    const last = new Date(year, month, 0).getDate();
    for (let d = 1; d <= last; d++) {
      const dd = String(d).padStart(2, "0");
      const mm = String(month).padStart(2, "0");
      days.push(`${year}-${mm}-${dd}`);
    }
    return days;
  }, [year, month]);

  const { rows, grandTotal } = useMemo(() => {
    let grand = 0;
    const data = daysOfMonth.map((day) => {
      const feasts   = hallFeasts.filter((f) => f.date.split("T")[0] === day);
      const billData = mealBillData.find((b) => b.date === day);
      const gm       = billData?.guestMeal;

      const bOn = billData?.mealBill.breakfast.status || feasts.some((f) => f.meal === "breakfast");
      const lOn = billData?.mealBill.lunch.status     || feasts.some((f) => f.meal === "lunch");
      const dOn = billData?.mealBill.dinner.status    || feasts.some((f) => f.meal === "dinner");

      const bCost = bOn ? (billData?.mealBill.breakfast.perHeadCost || 0) : 0;
      const lCost = lOn ? (billData?.mealBill.lunch.perHeadCost     || 0) : 0;
      const dCost = dOn ? (billData?.mealBill.dinner.perHeadCost    || 0) : 0;

      const gB = gm?.breakfast || 0;
      const gL = gm?.lunch     || 0;
      const gD = gm?.dinner    || 0;

      const gBCost = gB * bCost;
      const gLCost = gL * lCost;
      const gDCost = gD * dCost;

      const daily = bCost + lCost + dCost + gBCost + gLCost + gDCost;
      grand += daily;

      const date    = new Date(day + "T00:00:00");
      const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
      const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        day, billData, weekday, datePart,
        bOn, lOn, dOn,
        bCost, lCost, dCost,
        gB, gL, gD,
        gBCost, gLCost, gDCost,
        daily,
      };
    });
    return { rows: data, grandTotal: grand };
  }, [daysOfMonth, mealBillData, hallFeasts]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Mess Bill</h1>
        <MonthYearPicker
          value={selectedMonth}
          onChange={setSelectedMonth}
          className="w-44"
        />
      </div>

      {/* Grand Total summary card */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Bill
          </p>
          <p className="text-2xl font-bold tabular-nums mt-0.5">
            {fmt(grandTotal)} ৳
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-4 text-center">
          {[
            { label: "Breakfasts", count: rows.filter((r) => r.bOn).length },
            { label: "Lunches",    count: rows.filter((r) => r.lOn).length },
            { label: "Dinners",    count: rows.filter((r) => r.dOn).length },
          ].map(({ label, count }) => (
            <div key={label}>
              <p className="text-lg font-bold">{count}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: card list (< sm) ── */}
      <div className="flex flex-col gap-2 sm:hidden">
        {rows.map(({ day, weekday, datePart, billData, bOn, lOn, dOn, bCost, lCost, dCost, gB, gL, gD, gBCost, gLCost, gDCost, daily }) => (
          <div
            key={day}
            className={cn(
              "rounded-lg border border-border bg-card px-4 py-3",
              !billData && "opacity-40"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-foreground">{weekday}</p>
                <p className="text-xs text-muted-foreground">{datePart}</p>
              </div>
              <p className={cn("text-sm font-bold tabular-nums", daily > 0 ? "text-foreground" : "text-muted-foreground")}>
                {daily > 0 ? `${fmt(daily)} ৳` : "—"}
              </p>
            </div>
            {billData && (
              <div className="flex gap-3 mt-2 text-xs">
                <MealPill label="B" on={bOn} cost={bCost} g={gB} gCost={gBCost} />
                <MealPill label="L" on={lOn} cost={lCost} g={gL} gCost={gLCost} />
                <MealPill label="D" on={dOn} cost={dCost} g={gD} gCost={gDCost} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Desktop: table (sm+) ── */}
      <div className="hidden sm:block rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[100px] pl-4">Date</TableHead>
                <TableHead className="text-center">Breakfast</TableHead>
                <TableHead className="text-center">Lunch</TableHead>
                <TableHead className="text-center">Dinner</TableHead>
                <TableHead className="text-right pr-4 font-semibold">Daily Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ day, weekday, datePart, billData, bOn, lOn, dOn, bCost, lCost, dCost, gB, gL, gD, gBCost, gLCost, gDCost, daily }, idx) => (
                <TableRow
                  key={day}
                  className={cn(
                    "text-sm",
                    idx % 2 !== 0 && "bg-muted/10",
                    !billData && "opacity-50"
                  )}
                >
                  <TableCell className="pl-4 py-2.5">
                    <p className="font-medium text-xs">{weekday}</p>
                    <p className="text-xs text-muted-foreground">{datePart}</p>
                  </TableCell>

                  <TableCell className="text-center py-2.5">
                    <MealCol on={bOn} cost={bCost} gCost={gBCost} g={gB} />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <MealCol on={lOn} cost={lCost} gCost={gLCost} g={gL} />
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <MealCol on={dOn} cost={dCost} gCost={gDCost} g={gD} />
                  </TableCell>

                  <TableCell className="text-right pr-4 py-2.5">
                    {daily > 0 ? (
                      <span className="font-semibold tabular-nums">{fmt(daily)} ৳</span>
                    ) : (
                      <span className="text-muted-foreground/30 text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-border bg-muted/40 px-4 py-3 flex justify-between items-center">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Grand Total
          </span>
          <span className="text-base font-bold tabular-nums text-primary">
            {fmt(grandTotal)} ৳
          </span>
        </div>
      </div>
    </div>
  );
}

interface MealPillProps { label: string; on: boolean; cost: number; g: number; gCost: number }
function MealPill({ label, on, cost, g, gCost }: MealPillProps) {
  if (!on && g === 0)
    return (
      <span className="text-muted-foreground/40">{label}: —</span>
    );
  return (
    <span className="text-foreground">
      <span className="font-medium">{label}:</span>{" "}
      {on && <span className="tabular-nums">{fmt(cost)} ৳</span>}
      {g > 0 && (
        <span className="text-muted-foreground ml-0.5">+{g}g</span>
      )}
    </span>
  );
}
