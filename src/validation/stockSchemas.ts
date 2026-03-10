import { z, type ZodTypeAny } from "zod";

export const WINGS = ["MALE", "FEMALE"] as const;
export const UNITS = ["PCS", "KG", "LTR"] as const;
export const CATEGORIES = ["STORED", "NON_STORED"] as const;
export const MEALS = ["BREAKFAST", "LUNCH", "DINNER"] as const;

/** Round to 2 decimal places — prevents inputs like 9.9999999999 */
const r2 = (v: number): number => Math.round(v * 100) / 100;

const positiveNumber = (field: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z
      .number({ error: `${field} must be a number` })
      .positive({ error: `${field} must be greater than 0` })
      .transform((v) => r2(v))
  );

const dateString = z
  .string()
  .min(1, "Date is required")
  .refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" });

// Stock In form
export const stockInSchema = z.object({
  item: z.string().min(1, "Please select an item"),
  date: dateString,
  quantity: positiveNumber("Quantity"),
  price: positiveNumber("Price per unit"),
});

// Stock Out form
export const stockOutSchema = z.object({
  item: z.string().min(1, "Please select an item"),
  date: dateString,
  meal: z.enum(MEALS, { error: "Please select a meal" }),
  quantity: positiveNumber("Quantity"),
});

// Non-stock (NON_STORED Out) form
export const nonStockSchema = z.object({
  item: z.string().min(1, "Please select an item"),
  date: dateString,
  meal: z.enum(MEALS, { error: "Please select a meal" }),
  price: positiveNumber("Price per unit"),
  quantity: positiveNumber("Quantity"),
});

// Stock items list (add/edit)
export const stockItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  unit: z.enum(UNITS, { error: "Please select a unit" }),
  category: z.enum(CATEGORIES, { error: "Please select a category" }),
});

/**
 * Validate data against a Zod schema.
 * Returns { success: true, data } or { success: false, errors: { field: message } }
 */
type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; errors: Record<string, string> };

export function validateSchema<T>(
  schema: ZodTypeAny,
  data: unknown
): ValidationSuccess<T> | ValidationFailure {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data as T };
  const errors: Record<string, string> = {};
  for (const err of result.error.issues) {
    const key = String(err.path[err.path.length - 1] ?? "_");
    if (!errors[key]) errors[key] = err.message;
  }
  return { success: false, errors };
}
