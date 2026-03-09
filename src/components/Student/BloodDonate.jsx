import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { format, addDays, differenceInDays } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Heart, Droplets, Clock, Pencil, Check, X } from "lucide-react";
import { Axios } from "../../api/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BloodDonorTable from "../Common/BloodBank/BloodDonorTable";
import { BG_COLORS, isDonorAvailable, DONATION_INTERVAL_DAYS } from "../Common/BloodBank/bloodBankUtils";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ALL_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function BloodGroupPill({ group, selected, onClick }) {
  const colors = BG_COLORS[group] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <button
      type="button"
      onClick={() => onClick(group)}
      className={`px-3 py-1.5 rounded-lg border-2 text-sm font-bold transition-all ${
        selected
          ? `${colors} ring-2 ring-offset-1 ring-current scale-105 shadow-sm`
          : "border-border text-muted-foreground hover:border-current bg-background"
      }`}
    >
      {group}
    </button>
  );
}


function BloodGroupMiniCard({ group, total, available }) {
  const colors = BG_COLORS[group] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${colors}`}>
      <span className="font-bold text-sm">{group}</span>
      <div className="text-right">
        <span className="text-sm font-semibold">{total}</span>
        {available > 0 && (
          <span className="text-xs ml-1 opacity-75">({available}✓)</span>
        )}
      </div>
    </div>
  );
}

export default function BloodDonate() {
  const [profile, setProfile] = useState({
    bloodGroup: "",
    isDonor: false,
    lastDonationDate: "",
    gender: "",
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bloodGroup: "", isDonor: false, lastDonationDate: "" });
  const [saving, setSaving] = useState(false);
  const [bloodBankData, setBloodBankData] = useState({});
  const [loadingDonors, setLoadingDonors] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await Axios.get("/student");
      const s = res?.data?.student;
      const formatted = s?.lastDonationDate
        ? new Date(s.lastDonationDate).toISOString().split("T")[0]
        : "";
      const data = {
        bloodGroup: s?.bloodGroup || "",
        isDonor: s?.isDonor || false,
        lastDonationDate: formatted,
        gender: s?.gender || "MALE",
      };
      setProfile(data);
      setForm({ bloodGroup: data.bloodGroup, isDonor: data.isDonor, lastDonationDate: data.lastDonationDate });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!profile.gender) return;
    setLoadingDonors(true);
    Axios.get(`/student/blood-bank/${profile.gender}`)
      .then((res) => setBloodBankData(res.data))
      .catch(() => {})
      .finally(() => setLoadingDonors(false));
  }, [profile.gender]);

  const handleSave = async () => {
    if (form.isDonor && !form.bloodGroup) {
      toast.error("Please select your blood group to register as a donor");
      return;
    }
    setSaving(true);
    try {
      await Axios.put("/student", {
        bloodGroup: form.bloodGroup,
        isDonor: form.isDonor,
        lastDonationDate: form.lastDonationDate,
      });
      toast.success("Blood donation info updated!");
      setEditing(false);
      fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ bloodGroup: profile.bloodGroup, isDonor: profile.isDonor, lastDonationDate: profile.lastDonationDate });
    setEditing(false);
  };

  // Derived values for current profile
  const canDonateNow = isDonorAvailable(profile.lastDonationDate);
  const nextEligible = profile.lastDonationDate
    ? addDays(new Date(profile.lastDonationDate), DONATION_INTERVAL_DAYS)
    : null;
  const daysUntilEligible = nextEligible
    ? Math.max(0, differenceInDays(nextEligible, new Date()))
    : 0;

  // Wing stats summary
  const wingStats = useMemo(() => {
    return ALL_BLOOD_GROUPS.map((group) => {
      const entry = bloodBankData[group];
      if (!entry) return { group, total: 0, available: 0 };
      const available = (entry.donors || []).filter((d) => isDonorAvailable(d.lastDonationDate)).length;
      return { group, total: entry.count, available };
    });
  }, [bloodBankData]);

  const totalDonors = wingStats.reduce((s, g) => s + g.total, 0);
  const totalAvailable = wingStats.reduce((s, g) => s + g.available, 0);

  // Check if form date is too recent (warning)
  const tooSoon = form.lastDonationDate &&
    differenceInDays(new Date(), new Date(form.lastDonationDate)) < DONATION_INTERVAL_DAYS;

  return (
    <div className="space-y-6 pb-10">
      {/* Page header */}
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-500 fill-red-500" />
        <h1 className="text-2xl font-bold tracking-tight">Blood Donation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: My Donor Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">My Donor Profile</CardTitle>
                {!editing && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-7 gap-1 text-xs">
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>
              <CardDescription>Your blood donation information</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              {!editing ? (
                <>
                  {/* Status display */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Donor Status</span>
                    <Badge variant={profile.isDonor ? "success" : "secondary"}>
                      {profile.isDonor ? "Active Donor" : "Not a Donor"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Blood Group</span>
                    {profile.bloodGroup ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border-2 text-sm font-bold ${BG_COLORS[profile.bloodGroup] || "bg-gray-100 text-gray-700"}`}>
                        {profile.bloodGroup}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Not set</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Donated</span>
                    <span className="text-sm font-medium">
                      {profile.lastDonationDate
                        ? format(new Date(profile.lastDonationDate), "dd MMM yyyy")
                        : <span className="text-muted-foreground italic">Never</span>}
                    </span>
                  </div>

                  {profile.isDonor && (
                    <div className="mt-2 p-3 rounded-lg border">
                      {canDonateNow ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Droplets className="h-4 w-4 fill-emerald-600" />
                          <span className="text-sm font-medium">You can donate now!</span>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-amber-600">
                          <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Not yet eligible</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {daysUntilEligible} days remaining · eligible on{" "}
                              {nextEligible && format(nextEligible, "dd MMM yyyy")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Edit Form */
                <div className="space-y-4">
                  {/* Donor toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div>
                      <p className="text-sm font-medium">I want to be a donor</p>
                      <p className="text-xs text-muted-foreground">Toggle your donor status</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isDonor: !form.isDonor })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        form.isDonor ? "bg-emerald-500" : "bg-input"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          form.isDonor ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Blood Group */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Blood Group{form.isDonor && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BLOOD_GROUPS.map((g) => (
                        <BloodGroupPill
                          key={g}
                          group={g}
                          selected={form.bloodGroup === g}
                          onClick={(v) => setForm({ ...form, bloodGroup: v })}
                        />
                      ))}
                    </div>
                    {form.isDonor && !form.bloodGroup && (
                      <p className="text-xs text-red-500 mt-1.5">Blood group required for donors</p>
                    )}
                  </div>

                  {/* Last Donation Date */}
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Last Donation Date
                      <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                    </label>
                    <DatePicker
                      value={form.lastDonationDate}
                      onChange={(d) => setForm({ ...form, lastDonationDate: format(d, "yyyy-MM-dd") })}
                      max={new Date()}
                      placeholder="Select date"
                      className="w-full"
                    />
                    {tooSoon && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-amber-600 text-xs">
                        <Clock className="h-3 w-3" />
                        Wait at least 3 months between donations
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button onClick={handleSave} disabled={saving} size="sm" className="flex-1 gap-1">
                      <Check className="h-3.5 w-3.5" />
                      {saving ? "Saving…" : "Save"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} size="sm" className="gap-1">
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wing summary stats */}
          {!loadingDonors && totalDonors > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-red-500" />
                  {profile.gender === "MALE" ? "Male" : "Female"} Wing
                </CardTitle>
                <CardDescription>
                  {totalDonors} registered donors · {totalAvailable} available now
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-3">
                <div className="grid grid-cols-2 gap-1.5">
                  {wingStats.filter((s) => s.total > 0).map((s) => (
                    <BloodGroupMiniCard key={s.group} {...s} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Donor Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {profile.gender === "MALE" ? "Male" : "Female"} Wing Donors
              </CardTitle>
              <CardDescription>
                All registered blood donors in your wing
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <BloodDonorTable wing={profile.gender || undefined} showWing={false} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
