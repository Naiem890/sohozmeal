import { useState, useEffect, useMemo } from "react";
import { format, addDays, parseISO } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Search, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Axios } from "../../../api/api";
import { useDebounce } from "../../../Utils/useDebounce";
import { BG_COLORS, isDonorAvailable, DONATION_INTERVAL_DAYS } from "./bloodBankUtils";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function BloodGroupBadge({ group, className = "" }) {
  const color = BG_COLORS[group] || "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-bold ${color} ${className}`}
    >
      {group}
    </span>
  );
}


const BloodDonorTable = ({ wing, showWing = false }) => {
  const [search, setSearch] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const today = new Date();

  useEffect(() => {
    if (!wing) return;

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (bloodGroupFilter !== "ALL") params.set("bloodGroup", bloodGroupFilter);
    if (availabilityFilter !== "ALL") params.set("availability", availabilityFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    setLoading(true);
    Axios.get(`/student/blood-bank/${wing}?${params.toString()}`)
      .then((res) => {
        const flat = Object.entries(res.data).flatMap(([bg, { donors: list = [] }]) =>
          list.map((d) => ({ ...d, bloodGroup: bg }))
        );
        setDonors(flat);
      })
      .catch(() => setDonors([]))
      .finally(() => setLoading(false));
  }, [wing, debouncedSearch, bloodGroupFilter, availabilityFilter, dateFrom, dateTo]);

  const hasFilters =
    search ||
    bloodGroupFilter !== "ALL" ||
    availabilityFilter !== "ALL" ||
    dateFrom ||
    dateTo;

  const resetFilters = () => {
    setSearch("");
    setBloodGroupFilter("ALL");
    setAvailabilityFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const availableCount = useMemo(
    () => donors.filter((d) => isDonorAvailable(d.lastDonationDate)).length,
    [donors]
  );

  const colSpan = showWing ? 10 : 9;

  return (
    <div className="space-y-3">
      {/* ── Filter row ── all items h-9, flex items-center, no stacked labels ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Name, phone or student ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        {/* Blood Group */}
        <Select value={bloodGroupFilter} onValueChange={setBloodGroupFilter}>
          <SelectTrigger className="w-36 h-9 text-sm shrink-0">
            <SelectValue placeholder="Blood Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Groups</SelectItem>
            {BLOOD_GROUPS.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Availability */}
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-44 h-9 text-sm shrink-0">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Donors</SelectItem>
            <SelectItem value="AVAILABLE">Available Now</SelectItem>
            <SelectItem value="UNAVAILABLE">Not Yet Available</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range */}
        <DatePicker
          value={dateFrom}
          onChange={(d) => setDateFrom(format(d, "yyyy-MM-dd"))}
          placeholder="From date"
          max={dateFrom ? parseISO(dateTo) || today : today}
          className="w-36 shrink-0"
        />
        <DatePicker
          value={dateTo}
          onChange={(d) => setDateTo(format(d, "yyyy-MM-dd"))}
          placeholder="To date"
          min={dateFrom ? parseISO(dateFrom) : undefined}
          max={today}
          className="w-36 shrink-0"
        />

        {/* Clear */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 px-2 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {loading ? (
            <span>Loading…</span>
          ) : (
            <span>
              <span className="font-medium text-foreground">{donors.length}</span> donors
              {availableCount > 0 && (
                <>
                  {" · "}
                  <span className="text-emerald-600 font-medium">{availableCount} available</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Blood Group</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Last Donation</TableHead>
              <TableHead>Next Eligible</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Residence</TableHead>
              <TableHead>Room</TableHead>
              {showWing && <TableHead>Wing</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(colSpan)].map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted/50 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : donors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8 opacity-25" />
                    <p className="text-sm">No donors found</p>
                    {hasFilters && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={resetFilters}
                        className="h-auto p-0 text-xs"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              donors.map((donor, i) => {
                const available = isDonorAvailable(donor.lastDonationDate);
                const nextDate = donor.lastDonationDate
                  ? addDays(new Date(donor.lastDonationDate), DONATION_INTERVAL_DAYS)
                  : null;
                return (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <BloodGroupBadge group={donor.bloodGroup} />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{donor.name}</TableCell>
                    <TableCell className="font-mono text-sm tracking-tight whitespace-nowrap">
                      {donor.phoneNumber}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {donor.lastDonationDate ? (
                        format(new Date(donor.lastDonationDate), "dd MMM yyyy")
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {nextDate ? (
                        <span className={available ? "text-muted-foreground" : "text-amber-600 font-medium"}>
                          {format(nextDate, "dd MMM yyyy")}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-xs">Eligible now</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={available ? "success" : "warning"}>
                        {available ? "Available" : "Not Yet"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize whitespace-nowrap">
                      {donor.residence?.replace(/_/g, " ").toLowerCase() || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{donor.roomNo || "—"}</TableCell>
                    {showWing && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {donor.gender === "MALE" ? "Male" : "Female"}
                        </Badge>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BloodDonorTable;
