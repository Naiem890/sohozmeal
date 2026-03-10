import { differenceInDays } from "date-fns";
import type { BloodGroup } from "@/types";

export const DONATION_INTERVAL_DAYS = 90;

export const BG_COLORS: Record<BloodGroup, string> = {
  "A+":  "bg-red-100 text-red-700 border-red-200",
  "A-":  "bg-red-50 text-red-600 border-red-200",
  "B+":  "bg-blue-100 text-blue-700 border-blue-200",
  "B-":  "bg-blue-50 text-blue-600 border-blue-200",
  "AB+": "bg-purple-100 text-purple-700 border-purple-200",
  "AB-": "bg-purple-50 text-purple-600 border-purple-200",
  "O+":  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "O-":  "bg-emerald-50 text-emerald-600 border-emerald-200",
};

export function isDonorAvailable(lastDonationDate: string | null | undefined): boolean {
  if (!lastDonationDate) return true;
  return differenceInDays(new Date(), new Date(lastDonationDate)) >= DONATION_INTERVAL_DAYS;
}
