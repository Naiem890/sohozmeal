import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { Axios } from "../../api/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface MealConfig {
  cutoffHour?: number;
  cutoffMinute?: number;
}

function deriveCronTime(maleConfig: MealConfig | null, femaleConfig: MealConfig | null) {
  const maleTotal = (maleConfig?.cutoffHour ?? 22) * 60 + (maleConfig?.cutoffMinute ?? 0);
  const femaleTotal = (femaleConfig?.cutoffHour ?? 22) * 60 + (femaleConfig?.cutoffMinute ?? 0);
  const minTotal = Math.min(maleTotal, femaleTotal);
  const cronTotal = minTotal - 5;
  const h = Math.floor(Math.abs(cronTotal) / 60) % 24;
  const m = ((cronTotal % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function WingSettings({ wing, onSaved }: { wing: string; onSaved?: () => void }) {
  const [cutoffHour, setCutoffHour] = useState(22);
  const [cutoffMinute, setCutoffMinute] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Axios.get(`/meal/config?wing=${wing}`)
      .then((res) => {
        setCutoffHour(res.data.cutoffHour ?? 22);
        setCutoffMinute(res.data.cutoffMinute ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wing]);

  const handleSave = async () => {
    try {
      await toast.promise(
        Axios.put("/meal/config", { wing, cutoffHour, cutoffMinute }),
        {
          loading: "Saving…",
          success: ({ data }) => data.message || "Config saved!",
          error: (err) => err?.response?.data?.error || "Failed to save.",
        }
      );
      onSaved?.();
    } catch {
      // toast.promise already handles error display
    }
  };

  const label = `${String(cutoffHour).padStart(2, "0")}:${String(cutoffMinute).padStart(2, "0")}`;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {wing === "MALE" ? "Male" : "Female"} Wing
            </CardTitle>
            <CardDescription className="mt-1">
              Students can toggle meals until this time each day.
            </CardDescription>
          </div>
          <Badge variant={wing === "MALE" ? "outline" : "success"} className="text-sm px-3 py-1">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {loading ? "—" : label}
          </Badge>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`cutoff-${wing}`}>Cutoff Time</Label>
              <input
                id={`cutoff-${wing}`}
                type="time"
                value={`${String(cutoffHour).padStart(2, "0")}:${String(cutoffMinute).padStart(2, "0")}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setCutoffHour(h);
                  setCutoffMinute(m);
                }}
                className="flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button onClick={handleSave}>Save</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CronScheduleCard({ refreshTrigger }: { refreshTrigger: number }) {
  const [cronTime, setCronTime] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      Axios.get("/meal/config?wing=MALE").then((r) => r.data).catch(() => null),
      Axios.get("/meal/config?wing=FEMALE").then((r) => r.data).catch(() => null),
    ]).then(([male, female]) => {
      setCronTime(deriveCronTime(male, female));
    });
  }, [refreshTrigger]);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Meal Generation Schedule</CardTitle>
            <CardDescription className="mt-1">
              The cron job generates next-day meals automatically. It runs 5 minutes before
              the earliest wing cutoff so students can immediately toggle the new day.
            </CardDescription>
          </div>
          {cronTime && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {cronTime} daily
            </Badge>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

export default function Settings() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSaved = () => setRefreshTrigger((n) => n + 1);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure meal toggle cutoff times per wing.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <WingSettings wing="MALE" onSaved={handleSaved} />
        <WingSettings wing="FEMALE" onSaved={handleSaved} />
        <CronScheduleCard refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
