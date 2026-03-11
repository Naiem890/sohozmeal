import { useEffect, useRef, useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
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

const inputClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface Hall { _id: string; name: string }

function HallsSettings() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchHalls = () =>
    Axios.get("/hall").then((r) => setHalls(r.data)).catch(() => {});

  useEffect(() => { fetchHalls(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const { data } = await Axios.post("/hall", { name });
      setHalls((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      toast.success(`Hall "${data.name}" added`);
      inputRef.current?.focus();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to add hall");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (hall: Hall) => {
    try {
      await Axios.delete(`/hall/${hall._id}`);
      setHalls((prev) => prev.filter((h) => h._id !== hall._id));
      toast.success(`Hall "${hall.name}" deleted`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to delete hall");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Halls / Residences</CardTitle>
        <CardDescription>
          Manage the residence options available when registering or editing a student.
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5 space-y-4">
        {halls.length > 0 ? (
          <ul className="space-y-1.5">
            {halls.map((hall) => (
              <li key={hall._id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="font-medium">{hall.name}</span>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50"
                  onClick={() => handleDelete(hall)}
                  title="Delete hall"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No halls added yet.</p>
        )}
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="new-hall" className="sr-only">Hall name</Label>
            <input
              id="new-hall"
              ref={inputRef}
              type="text"
              placeholder="Hall name, e.g. Osmany Hall"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={inputClass + " w-full"}
            />
          </div>
          <Button type="submit" size="sm" className="gap-1.5 shrink-0" disabled={adding || !newName.trim()}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </form>
      </CardContent>
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
        <HallsSettings />
      </div>
    </div>
  );
}
