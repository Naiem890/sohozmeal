import React, { useMemo } from "react";
import { format } from "date-fns";
import { FileSpreadsheet, Coffee, Sun, Moon, Users, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function dayCost(status) {
  const b = (status.guestMeal.breakfast + (status.breakfast ? 1 : 0)) * status.perHeadCost.breakfast;
  const l = (status.guestMeal.lunch    + (status.lunch    ? 1 : 0)) * status.perHeadCost.lunch;
  const d = (status.guestMeal.dinner   + (status.dinner   ? 1 : 0)) * status.perHeadCost.dinner;
  return { b, l, d, total: b + l + d };
}

function friendlyDate(dateStr) {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return {
    day:     String(day).padStart(2, "0"),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

function autoColWidths(data, headers) {
  return headers.map((h) => ({
    wch: Math.max(h.length, ...data.map((r) => String(r[h] ?? "").length)) + 2,
  }));
}

// ─── sub-components ───────────────────────────────────────────────────────────

const MealPill = ({ active, label, icon: Icon, guest }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
      active
        ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
        : "bg-muted/60 text-muted-foreground/40 line-through"
    )}
  >
    <Icon className="h-3 w-3 shrink-0" />
    {label}
    {guest > 0 && (
      <span className="ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 ring-1 ring-orange-200">
        <Users className="h-2.5 w-2.5" />
        +{guest}
      </span>
    )}
  </span>
);

const StatCard = ({ label, icon: Icon, bgClass, textClass, count, cost }) => (
  <div className="flex items-center gap-3 rounded-xl border bg-background px-3.5 py-2.5 shadow-sm">
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", bgClass)}>
      <Icon className={cn("h-4 w-4", textClass)} />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-bold leading-tight">
        {count} day{count !== 1 ? "s" : ""}
        <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">৳{cost.toFixed(0)}</span>
      </p>
    </div>
  </div>
);

// ─── export ───────────────────────────────────────────────────────────────────

function exportToExcel({ data, selectedDate, wing }) {
  const { studentDetails: s, totalMonthlyCost, mealStatusByDay } = data;
  const month = format(selectedDate, "MM");
  const year  = format(selectedDate, "yyyy");
  const monthLabel = format(selectedDate, "MMMM yyyy");

  const rows = Object.entries(mealStatusByDay).map(([date, st]) => {
    const c = dayCost(st);
    return {
      "Date":               date,
      "Breakfast":          st.breakfast ? "✓" : "–",
      "Breakfast Guests":   st.guestMeal.breakfast || 0,
      "Breakfast Cost":     parseFloat(c.b.toFixed(2)),
      "Lunch":              st.lunch ? "✓" : "–",
      "Lunch Guests":       st.guestMeal.lunch || 0,
      "Lunch Cost":         parseFloat(c.l.toFixed(2)),
      "Dinner":             st.dinner ? "✓" : "–",
      "Dinner Guests":      st.guestMeal.dinner || 0,
      "Dinner Cost":        parseFloat(c.d.toFixed(2)),
      "Day Total (৳)":      parseFloat(c.total.toFixed(2)),
    };
  });

  const headers = Object.keys(rows[0] || {});
  const ws = XLSX.utils.json_to_sheet([]);

  // Title block
  XLSX.utils.sheet_add_aoa(ws, [
    [`OSMANY HALL — MONTHLY MEAL BILL`],
    [`${monthLabel}  |  ${wing} Wing`],
    [],
    [`Student:    ${s.name}`],
    [`Student ID: ${s.studentId}`],
    [`Hall ID:    ${s.hallId || "N/A"}`],
    [`Dept:       ${s.department || "N/A"}`],
    [],
  ], { origin: "A1" });

  // Data table
  XLSX.utils.sheet_add_json(ws, rows, { origin: "A9", header: headers });

  // Total row
  const totalRow = mealStatusByDay ? Object.keys(mealStatusByDay).length : 0;
  XLSX.utils.sheet_add_aoa(ws, [
    [],
    [`TOTAL MONTHLY BILL`, "", "", "", "", "", "", "", "", "", parseFloat(totalMonthlyCost.toFixed(2))],
  ], { origin: `A${9 + totalRow + 1}` });

  // Column widths
  ws["!cols"] = autoColWidths(rows, headers);

  // Merges for header block
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Monthly Bill");
  XLSX.writeFile(wb, `${s.name}_Bill_${month}_${year}.xlsx`);
}

// ─── main modal ───────────────────────────────────────────────────────────────

export const StudentBillModal = ({ open, onOpenChange, data, selectedDate, wing }) => {
  const { studentDetails: s, totalMonthlyCost, mealStatusByDay } = data;
  const days = useMemo(() => Object.entries(mealStatusByDay), [mealStatusByDay]);

  const stats = useMemo(() => {
    let bCount = 0, lCount = 0, dCount = 0;
    let bCost  = 0, lCost  = 0, dCost  = 0;
    days.forEach(([, st]) => {
      const c = dayCost(st);
      if (st.breakfast || st.guestMeal.breakfast > 0) { bCount++; bCost += c.b; }
      if (st.lunch     || st.guestMeal.lunch     > 0) { lCount++; lCost += c.l; }
      if (st.dinner    || st.guestMeal.dinner    > 0) { dCount++; dCost += c.d; }
    });
    return { bCount, lCount, dCount, bCost, lCost, dCost };
  }, [days]);

  const monthLabel = format(selectedDate, "MMMM yyyy");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Key layout fix:
        - `flex flex-col` overrides shadcn's default `grid`
        - `max-h-[90vh]` caps total height
        - `overflow-hidden` clips children; the body uses `overflow-y-auto min-h-0`
      */}
      <DialogContent className="flex flex-col gap-0 p-0 max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden rounded-2xl [&>button]:hidden">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-b bg-muted/40 px-5 pt-5 pb-4">

          {/* Top row: avatar + info + close */}
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary ring-1 ring-primary/20">
              {initials(s.name)}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold leading-snug truncate">{s.name}</h2>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>ID: <span className="font-medium text-foreground">{s.studentId}</span></span>
                {s.hallId && <span>Hall: <span className="font-medium text-foreground">{s.hallId}</span></span>}
                {s.department && <span>{s.department}</span>}
              </div>
            </div>

            {/* Month + total */}
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{monthLabel}</p>
              <p className="text-2xl font-bold tabular-nums leading-none">৳{totalMonthlyCost.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total Bill</p>
            </div>

            {/* Close */}
            <DialogClose asChild>
              <button className="ml-1 shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          {/* Stat cards */}
          <div className="mt-3.5 grid grid-cols-3 gap-2">
            <StatCard label="Breakfast" icon={Coffee} bgClass="bg-amber-100" textClass="text-amber-600"
              count={stats.bCount} cost={stats.bCost} />
            <StatCard label="Lunch"     icon={Sun}    bgClass="bg-sky-100"   textClass="text-sky-600"
              count={stats.lCount} cost={stats.lCost} />
            <StatCard label="Dinner"    icon={Moon}   bgClass="bg-indigo-100" textClass="text-indigo-600"
              count={stats.dCount} cost={stats.dCost} />
          </div>
        </div>

        {/* ── Scrollable day table ────────────────────────────────────────────── */}
        {/*
          `min-h-0` is required: flex items default to min-height:auto,
          which prevents them from shrinking. Without it the table pushes
          the dialog past max-h.
        */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left font-semibold w-16">Date</th>
                <th className="px-4 py-2.5 text-left font-semibold">Meals</th>
                <th className="px-4 py-2.5 text-right font-semibold w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {days.map(([dateStr, status]) => {
                const { day, weekday } = friendlyDate(dateStr);
                const c = dayCost(status);
                const hasAny = status.breakfast || status.lunch || status.dinner
                  || status.guestMeal.breakfast > 0
                  || status.guestMeal.lunch > 0
                  || status.guestMeal.dinner > 0;

                return (
                  <tr
                    key={dateStr}
                    className={cn(
                      "border-b border-border/40 transition-colors hover:bg-muted/30",
                      !hasAny && "opacity-40"
                    )}
                  >
                    {/* Date */}
                    <td className="px-4 py-2.5 align-middle">
                      <div className="flex flex-col items-center w-9 text-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
                          {weekday}
                        </span>
                        <span className="text-sm font-bold tabular-nums">{day}</span>
                      </div>
                    </td>

                    {/* Meal pills */}
                    <td className="px-4 py-2.5 align-middle">
                      {hasAny ? (
                        <div className="flex flex-wrap gap-1.5">
                          <MealPill active={status.breakfast} label="Breakfast" icon={Coffee} guest={status.guestMeal.breakfast} />
                          <MealPill active={status.lunch}     label="Lunch"     icon={Sun}    guest={status.guestMeal.lunch} />
                          <MealPill active={status.dinner}    label="Dinner"    icon={Moon}   guest={status.guestMeal.dinner} />
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground/50">No meals</span>
                      )}
                    </td>

                    {/* Day total */}
                    <td className="px-4 py-2.5 align-middle text-right">
                      {c.total > 0
                        ? <span className="font-semibold tabular-nums">৳{c.total.toFixed(2)}</span>
                        : <span className="text-muted-foreground/30 text-xs">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t bg-muted/20 px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-xs text-muted-foreground truncate">{monthLabel} total:</span>
            <span className="text-base font-bold tabular-nums shrink-0">৳{totalMonthlyCost.toFixed(2)}</span>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => exportToExcel({ data, selectedDate, wing })}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
