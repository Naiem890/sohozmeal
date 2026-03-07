import { useCallback, useEffect, useMemo, useState } from "react";
import { Axios } from "../../api/api";
import convertToDDMMYYYY from "../../Utils/YYYYMMDDtoDDMMYYYY";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fmt = (n) => Number(n).toFixed(2);

export default function BillCount() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [mealBillData, setMealBillData] = useState([]);
  const [hallFeasts,   setHallFeasts]   = useState([]);
  const [wing] = useState("MALE");

  const years = useMemo(() => {
    const y = [];
    for (let i = now.getFullYear(); i >= now.getFullYear() - 3; i--) y.push(i);
    return y;
  }, []);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const [billRes, feastRes] = await Promise.all([
          Axios.get(`/cost/student?year=${year}&month=${month}&wing=${wing}`),
          Axios.get(`/feast/month/${year}/${month}/wing/${wing}`),
        ]);
        setMealBillData(billRes.data.mealBillData);
        setHallFeasts(feastRes.data);
      } catch (err) {
        console.error("Error fetching bill data:", err);
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

  let grandTotal = 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Mess Bill</h1>
        <div className="flex gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="text-center whitespace-nowrap">G.Breakfast</TableHead>
                <TableHead className="text-center whitespace-nowrap">G.Lunch</TableHead>
                <TableHead className="text-center whitespace-nowrap">G.Dinner</TableHead>
                <TableHead className="text-center">Breakfast</TableHead>
                <TableHead className="text-center">Lunch</TableHead>
                <TableHead className="text-center">Dinner</TableHead>
                <TableHead className="text-center font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daysOfMonth.map((day) => {
                const feasts   = hallFeasts.filter((f) => f.date.split("T")[0] === day);
                const billData = mealBillData.find((b) => b.date === day);
                const gm       = billData?.guestMeal;

                const bOn = billData?.mealBill.breakfast.status || feasts.some((f) => f.meal === "breakfast");
                const lOn = billData?.mealBill.lunch.status     || feasts.some((f) => f.meal === "lunch");
                const dOn = billData?.mealBill.dinner.status    || feasts.some((f) => f.meal === "dinner");

                const bCost = bOn ? (billData?.mealBill.breakfast.perHeadCost || 0) : 0;
                const lCost = lOn ? (billData?.mealBill.lunch.perHeadCost     || 0) : 0;
                const dCost = dOn ? (billData?.mealBill.dinner.perHeadCost    || 0) : 0;

                const gBCost = (gm?.breakfast || 0) * bCost;
                const gLCost = (gm?.lunch     || 0) * lCost;
                const gDCost = (gm?.dinner    || 0) * dCost;

                const daily = bCost + lCost + dCost + gBCost + gLCost + gDCost;
                grandTotal += daily;

                const on  = "text-primary font-medium";
                const off = "text-muted-foreground";

                return (
                  <TableRow key={day} className="text-sm">
                    <TableCell className="whitespace-nowrap font-medium">
                      {convertToDDMMYYYY(day)}
                    </TableCell>
                    {billData ? (
                      <>
                        <TableCell className={`text-center ${(gm?.breakfast || 0) > 0 ? on : off}`}>
                          {gm?.breakfast || 0}
                        </TableCell>
                        <TableCell className={`text-center ${(gm?.lunch || 0) > 0 ? on : off}`}>
                          {gm?.lunch || 0}
                        </TableCell>
                        <TableCell className={`text-center ${(gm?.dinner || 0) > 0 ? on : off}`}>
                          {gm?.dinner || 0}
                        </TableCell>
                        <TableCell className={`text-center ${bOn ? on : off}`}>
                          {fmt(bCost + gBCost)} ৳
                        </TableCell>
                        <TableCell className={`text-center ${lOn ? on : off}`}>
                          {fmt(lCost + gLCost)} ৳
                        </TableCell>
                        <TableCell className={`text-center ${dOn ? on : off}`}>
                          {fmt(dCost + gDCost)} ৳
                        </TableCell>
                        <TableCell className="text-center font-semibold tabular-nums">
                          {fmt(daily)} ৳
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-center text-muted-foreground">0</TableCell>
                        <TableCell className="text-center text-muted-foreground">0</TableCell>
                        <TableCell className="text-center text-muted-foreground">0</TableCell>
                        <TableCell className="text-center text-muted-foreground">0.00 ৳</TableCell>
                        <TableCell className="text-center text-muted-foreground">0.00 ৳</TableCell>
                        <TableCell className="text-center text-muted-foreground">0.00 ৳</TableCell>
                        <TableCell className="text-center text-muted-foreground">0.00 ৳</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}

              {/* Grand Total */}
              <TableRow className="bg-muted/40 border-t-2 border-border font-bold">
                <TableCell colSpan={7} className="text-right pr-4">
                  Grand Total
                </TableCell>
                <TableCell className="text-center text-primary tabular-nums">
                  {fmt(grandTotal)} ৳
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
