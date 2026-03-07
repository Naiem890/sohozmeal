import { useEffect, useRef, useState } from "react";
import { Axios } from "../../api/api";
import { format, isToday } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { useAuthUser } from "react-auth-kit";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DAY_BN = {
  SUNDAY:    "রবিবার",
  MONDAY:    "সোমবার",
  TUESDAY:   "মঙ্গলবার",
  WEDNESDAY: "বুধবার",
  THURSDAY:  "বৃহস্পতিবার",
  FRIDAY:    "শুক্রবার",
  SATURDAY:  "শনিবার",
};

const currentDay = format(new Date(), "EEEE").toUpperCase();

export default function MealRoutine() {
  const user = useAuthUser();
  const [mealData, setMealData] = useState([]);
  const [wing, setWing] = useState(user().wing || "MALE");
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Meal Routine",
  });

  useEffect(() => {
    Axios.get("/meal/routine", { params: { wing } })
      .then((res) => setMealData(res.data))
      .catch((err) => console.error(err));
  }, [wing]);

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Meal Routine</h1>
        <div className="flex items-center gap-2">
          <Select value={wing} onValueChange={setWing}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div
        ref={printRef}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <table className="w-full text-sm border-collapse font-notoSerifBangla">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="px-3 py-3 text-center font-semibold text-muted-foreground w-24">
                দিন
              </th>
              <th className="px-3 py-3 text-center font-semibold text-muted-foreground">
                সকাল
              </th>
              <th className="px-3 py-3 text-center font-semibold text-muted-foreground">
                দুপুর
              </th>
              <th className="px-3 py-3 text-center font-semibold text-muted-foreground">
                রাত
              </th>
            </tr>
          </thead>
          <tbody>
            {mealData.map((routine) => {
              const active = isToday(new Date()) && routine.day === currentDay;
              return (
                <tr
                  key={routine._id}
                  className={cn(
                    "border-b border-border/50 last:border-0 transition-colors",
                    active
                      ? "bg-accent font-semibold"
                      : "hover:bg-muted/30"
                  )}
                >
                  <td className="px-3 py-3 text-center text-sm font-medium">
                    {DAY_BN[routine.day] || routine.day}
                  </td>
                  <td className="px-3 py-3 text-center">{routine.breakfast || "—"}</td>
                  <td className="px-3 py-3 text-center">{routine.lunch    || "—"}</td>
                  <td className="px-3 py-3 text-center">{routine.dinner   || "—"}</td>
                </tr>
              );
            })}
            {mealData.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-muted-foreground">
                  No routine data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
