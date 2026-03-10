import { useEffect, useState, useMemo } from "react";
import { useAuthUser } from "react-auth-kit";
import { Heart, Users, Droplets } from "lucide-react";
import { Axios } from "../../../api/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BloodDonorTable from "../../Common/BloodBank/BloodDonorTable";
import { BG_COLORS, isDonorAvailable } from "../../Common/BloodBank/bloodBankUtils";

const ALL_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

interface BloodGroupEntry {
  count: number;
  donors: { lastDonationDate?: string }[];
}

interface AuthUser {
  wing: string;
  [key: string]: unknown;
}

function BloodStatCard({ group, total, available }: { group: string; total: number; available: number }) {
  const colors = (BG_COLORS as Record<string, string>)[group] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 font-bold text-lg shrink-0 ${colors}`}>
          {group}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {available > 0 ? (
              <span className="text-emerald-600 font-medium">{available} available</span>
            ) : (
              "No available donors"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const WING_TABS = {
  ALL: { label: "Both Wings", value: "ALL" },
  MALE: { label: "Male Wing", value: "MALE" },
  FEMALE: { label: "Female Wing", value: "FEMALE" },
};

const BloodBank = () => {
  const auth = useAuthUser()() as AuthUser;
  const adminWing = auth.wing || "MALE";

  // Determine available tabs
  const tabs = useMemo(() => {
    if (adminWing === "ALL") return ["MALE", "FEMALE", "ALL"];
    return [adminWing];
  }, [adminWing]);

  const [selectedWing, setSelectedWing] = useState(adminWing === "ALL" ? "ALL" : adminWing);
  const [bloodBankData, setBloodBankData] = useState<Record<string, BloodGroupEntry>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setBloodBankData({});
    Axios.get(`/student/blood-bank/${selectedWing}`)
      .then((res) => setBloodBankData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedWing]);

  // Compute stats per blood group
  const stats = useMemo(() => {
    return ALL_BLOOD_GROUPS.map((group) => {
      const entry = bloodBankData[group];
      if (!entry) return { group, total: 0, available: 0 };
      const available = (entry.donors || []).filter((d: { lastDonationDate?: string }) =>
        isDonorAvailable(d.lastDonationDate)
      ).length;
      return { group, total: entry.count, available };
    });
  }, [bloodBankData]);

  const totalDonors = stats.reduce((s, g) => s + g.total, 0);
  const totalAvailable = stats.reduce((s, g) => s + g.available, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            <h1 className="text-2xl font-bold tracking-tight">Blood Bank</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and view blood donors across the hall
          </p>
        </div>

        {/* Summary badges */}
        {!loading && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Users className="h-3.5 w-3.5" />
              {totalDonors} total donors
            </Badge>
            <Badge variant="success" className="gap-1.5 py-1 px-3">
              <Droplets className="h-3.5 w-3.5" />
              {totalAvailable} available
            </Badge>
          </div>
        )}
      </div>

      {/* Wing Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          {tabs.map((wing) => (
            <button
              key={wing}
              onClick={() => setSelectedWing(wing)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                selectedWing === wing
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {WING_TABS[wing as keyof typeof WING_TABS]?.label || wing}
            </button>
          ))}
        </div>
      )}

      <Separator />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ALL_BLOOD_GROUPS.map((g) => (
            <Card key={g} className="animate-pulse">
              <CardContent className="p-4 h-20 bg-muted/30 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Blood Group Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <BloodStatCard
                key={s.group}
                group={s.group}
                total={s.total}
                available={s.available}
              />
            ))}
          </div>

          <Separator />

          {/* Donor Table */}
          <div>
            <h2 className="text-base font-semibold mb-4">Donor List</h2>
            <BloodDonorTable
              wing={selectedWing}
              showWing={selectedWing === "ALL"}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BloodBank;
