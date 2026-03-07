import { useAuthUser } from "react-auth-kit";
import { Loader2, Search, X } from "lucide-react";
import { RESIDENCES } from "../../../Utils/constant";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CountBadge = ({ label, count }) => (
  <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5 tabular-nums">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className="text-sm font-bold">{count}</span>
  </div>
);

export const MealStats = ({
  gender,
  setGender,
  residence,
  setResidence,
  search,
  setSearch,
  breakfastCount,
  lunchCount,
  dinnerCount,
  studentCount,
  isSearchPending,
}) => {
  const auth = useAuthUser()();

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <CountBadge label="B" count={breakfastCount} />
        <CountBadge label="L" count={lunchCount} />
        <CountBadge label="D" count={dinnerCount} />
        <span className="text-xs text-muted-foreground">{studentCount} students</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {auth.wing === "ALL" && (
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select
          value={residence || "all"}
          onValueChange={(v) => setResidence(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-36 h-8">
            <SelectValue placeholder="All Residence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Residence</SelectItem>
            {RESIDENCES.map((r) => (
              <SelectItem key={r} value={r}>
                {r.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          {isSearchPending ? (
            <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          )}
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="pl-8 pr-7 w-44 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
