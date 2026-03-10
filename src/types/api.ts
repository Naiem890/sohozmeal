import type {
  Student,
  Admin,
  Meal,
  MealConfig,
  Cost,
  StockItem,
  Stock,
  StockTransaction,
  HallFeast,
  Routine,
  Notice,
  Complaint,
  Wing,
  MealBooleans,
  GuestMealCounts,
} from "./models";

// ─── Generic wrapper ──────────────────────────────────────────────────────────

export interface MessageResponse {
  message: string;
}

export interface PaginationMeta {
  total: number;
  totalPages: number;
  page?: number;
  pageSize?: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    role: string;
    wing?: Wing;
    studentId?: string;
    email?: string;
    staffId?: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface CheckTokenResponse {
  valid: boolean;
  user?: {
    _id: string;
    role: string;
  };
}

// ─── Meal ─────────────────────────────────────────────────────────────────────

/** GET /api/meal/plan */
export interface MealPlanResponse {
  meals: Meal[];
}

/** GET /api/meal/months */
export type MealMonthsResponse = string[];

/** GET /api/meal/config */
export type MealConfigResponse = MealConfig;

/** PUT /api/meal/plan/:mealId */
export interface UpdateMealResponse extends MessageResponse {
  meal: Meal;
}

/** PUT /api/meal/guest-meal */
export interface GuestMealResponse extends MessageResponse {
  meal: Meal;
}

/** PUT /api/meal/toggle */
export interface ToggleMealResponse extends MessageResponse {
  meal: Meal;
}

/** GET /api/meal/students (admin) */
export interface AdminMealStudentsResponse {
  meals: Array<
    Meal & {
      student: Pick<Student, "_id" | "studentId" | "hallId" | "name" | "roomNo" | "gender">;
    }
  >;
  feast?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
}

/** GET /api/meal/routine */
export type MealRoutineResponse = Routine[];

/** PUT /api/meal/config */
export interface UpdateMealConfigResponse extends MessageResponse {
  config: MealConfig;
}

// ─── Stock ────────────────────────────────────────────────────────────────────

/** GET /api/stock/item */
export type StockItemsResponse = StockItem[];

/** POST /api/stock/item */
export interface CreateStockItemResponse extends MessageResponse {
  item: StockItem;
}

/** GET /api/stock */
export type StockListResponse = Array<Stock & { item: StockItem }>;

/** POST /api/stock (record transaction) */
export interface StockTransactionResponse extends MessageResponse {
  transaction: StockTransaction;
}

/** POST /api/stock/sync */
export interface StockSyncResponse extends MessageResponse {
  updatedDates?: string[];
}

/** Transaction history (GET /api/stock with history params) */
export interface StockTransactionHistoryResponse {
  transactions: Array<StockTransaction & { item: StockItem }>;
  pagination?: PaginationMeta;
}

// ─── Cost / Bills ─────────────────────────────────────────────────────────────

/** POST /api/cost */
export interface CreateCostResponse extends MessageResponse {
  cost: Cost;
}

/** GET /api/cost/monthly/all (admin) */
export interface MonthlyBillsResponse {
  costs: Cost[];
  month: string;
  wing: Wing;
}

/** GET /api/cost/monthly/student */
export interface StudentMonthlyBillResponse {
  month: string;
  totalBill: number;
  dailyBreakdown: Array<{
    date: string;
    breakfast: number;
    lunch: number;
    dinner: number;
    total: number;
    guestMeal: GuestMealCounts;
    mealStatus: MealBooleans;
  }>;
}

/** GET /api/cost/student */
export interface StudentBillResponse {
  bills: Array<{
    month: string;
    totalBill: number;
    paid: boolean;
  }>;
}

/** POST /api/cost/generate-bills */
export interface GenerateBillsResponse extends MessageResponse {
  updatedDays: number;
}

// ─── Students ─────────────────────────────────────────────────────────────────

/** GET /api/student */
export interface StudentsListResponse {
  students: Student[];
  pagination: PaginationMeta;
}

/** GET /api/student/:id */
export interface StudentDetailResponse {
  student: Student;
}

/** POST /api/student */
export interface CreateStudentResponse extends MessageResponse {
  student: Student;
}

/** PUT /api/student/:id */
export interface UpdateStudentResponse extends MessageResponse {
  student: Student;
}

/** DELETE /api/student/:id */
export type DeleteStudentResponse = MessageResponse;

// ─── Hall Feast ───────────────────────────────────────────────────────────────

/** GET /api/feast */
export type HallFeastListResponse = HallFeast[];

/** POST /api/feast */
export interface CreateFeastResponse extends MessageResponse {
  feast: HallFeast;
}

/** DELETE /api/feast/:id */
export type DeleteFeastResponse = MessageResponse;

// ─── Complaints ───────────────────────────────────────────────────────────────

/** GET /api/complaint */
export interface ComplaintsListResponse {
  complaints: Complaint[];
  pagination?: PaginationMeta;
}

/** POST /api/complaint */
export interface CreateComplaintResponse extends MessageResponse {
  complaint: Complaint;
}

/** PUT /api/complaint/:id */
export interface UpdateComplaintResponse extends MessageResponse {
  complaint: Complaint;
}

/** GET /api/complaint/:id */
export interface ComplaintDetailResponse {
  complaint: Complaint;
}

// ─── Notices ──────────────────────────────────────────────────────────────────

/** GET /api/notice */
export interface NoticesListResponse {
  notices: Notice[];
}

/** POST /api/notice */
export interface CreateNoticeResponse extends MessageResponse {
  notice: Notice;
}

/** PUT /api/notice/:id */
export interface UpdateNoticeResponse extends MessageResponse {
  notice: Notice;
}

/** DELETE /api/notice/:id */
export type DeleteNoticeResponse = MessageResponse;

// ─── Staff ────────────────────────────────────────────────────────────────────

export interface StaffLoginResponse extends MessageResponse {
  accessToken: string;
  refreshToken: string;
  staff: {
    _id: string;
    staffId: string;
    role: string;
  };
}
