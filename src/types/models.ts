// ─── Shared primitives ────────────────────────────────────────────────────────

export type Wing = "MALE" | "FEMALE" | "ALL";
export type MealType = "breakfast" | "lunch" | "dinner";
export type StockUnit = "PCS" | "KG" | "LTR";
export type StockCategory = "STORED" | "NON_STORED";
export type TransactionType = "IN" | "OUT";
export type Department =
  | "CSE" | "EECE" | "CE" | "ME" | "NAME" | "BME"
  | "PME" | "IPE" | "AE" | "NSE" | "EWCE" | "ARCH";
export type Residence = "OSMANY_HALL" | "EXT_D";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type StaffRole = "MESS" | "WIFI" | "CLEANING" | "REPAIR";
export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

// ─── Meal sub-types ───────────────────────────────────────────────────────────

export interface MealBooleans {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface GuestMealCounts {
  breakfast: number;
  lunch: number;
  dinner: number;
}

// ─── Student ──────────────────────────────────────────────────────────────────

export interface Student {
  _id: string;
  studentId: string;
  hallId: string;
  name: string;
  /** "MALE" | "FEMALE" — note: field is `gender`, not `wing` */
  gender: "MALE" | "FEMALE";
  department: Department;
  batch: string;
  status: "ACTIVE" | "INACTIVE";
  firstTimeLogin: boolean;
  roomNo?: string;
  residence: Residence;
  bloodGroup?: BloodGroup;
  phoneNumber?: string;
  /** Profile image stored as Buffer on backend; sent as base64 string or URL on frontend */
  profileImage?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface Admin {
  _id: string;
  email: string;
  wing: Wing;
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export interface Staff {
  _id: string;
  staffId: string;
  name: string;
  phoneNumber: string;
  role: StaffRole;
}

// ─── Meal ─────────────────────────────────────────────────────────────────────

/** date is stored as "YYYY-MM-DD" string */
export interface Meal {
  _id: string;
  studentId: string;
  /** ISO date string "YYYY-MM-DD" */
  date: string;
  meal: MealBooleans;
  guestMeal: GuestMealCounts;
}

// ─── MealConfig ───────────────────────────────────────────────────────────────

export interface MealConfig {
  _id: string;
  wing: Exclude<Wing, "ALL">;
  cutoffHour: number;
  cutoffMinute: number;
}

// ─── Cost / Bill ──────────────────────────────────────────────────────────────

export interface MealBillEntry {
  totalCost: number;
  totalStudent: number;
}

export interface DailyMealBill {
  breakfast: MealBillEntry;
  lunch: MealBillEntry;
  dinner: MealBillEntry;
}

/** date is stored as a Date object on backend; serialised as ISO string to the frontend */
export interface Cost {
  _id: string;
  date: string;
  wing: Exclude<Wing, "ALL">;
  mealBill: DailyMealBill;
  /** Virtual: totalCost / totalStudent for each meal */
  perHeadCost?: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export interface StockItem {
  _id: string;
  name: string;
  unit: StockUnit;
  category: StockCategory;
  wing: Exclude<Wing, "ALL">;
}

export interface Stock {
  _id: string;
  item: StockItem | string;
  quantity: number;
  /** Perpetual weighted average price for STORED items */
  price: number;
  wing: Exclude<Wing, "ALL">;
}

export interface StockTransaction {
  _id: string;
  item: StockItem | string;
  type: TransactionType;
  quantityChange: number;
  unitPrice: number;
  transactionAmount: number;
  /** ISO date string */
  date: string;
  meal?: MealType;
  category: StockCategory;
  wing: Exclude<Wing, "ALL">;
}

// ─── Hall Feast ───────────────────────────────────────────────────────────────

export interface HallFeast {
  _id: string;
  /** ISO date string */
  date: string;
  meal: MealBooleans;
  wing: Exclude<Wing, "ALL">;
}

// ─── Routine ──────────────────────────────────────────────────────────────────

export interface Routine {
  _id: string;
  day: DayOfWeek;
  wing: Exclude<Wing, "ALL">;
  breakfast: string;
  lunch: string;
  dinner: string;
}

// ─── Notice ───────────────────────────────────────────────────────────────────

export interface Notice {
  _id: string;
  title: string;
  body: string;
  wing: Wing;
  createdAt: string;
  updatedAt: string;
}

// ─── Complaint ────────────────────────────────────────────────────────────────

export type ComplaintStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
export type ComplaintCategory = "MESS" | "WIFI" | "CLEANING" | "REPAIR" | "OTHER";

export interface Complaint {
  _id: string;
  studentId: string;
  student?: Pick<Student, "name" | "hallId" | "roomNo">;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  wing: Exclude<Wing, "ALL">;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth JWT payload (decoded) ───────────────────────────────────────────────

export interface StudentAuthPayload {
  studentId: string;
  role: "student";
  _id: string;
  wing?: Wing;
}

export interface AdminAuthPayload {
  email: string;
  _id: string;
  role: "admin";
  wing: Wing;
}

export interface StaffAuthPayload {
  staffId: string;
  role: StaffRole;
  _id: string;
}

export type AuthPayload = StudentAuthPayload | AdminAuthPayload | StaffAuthPayload;
