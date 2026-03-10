import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const WINGS = ['MALE', 'FEMALE'] as const;
const UNITS = ['PCS', 'KG', 'LTR'] as const;
const CATEGORIES = ['STORED', 'NON_STORED'] as const;
const MEALS = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;
const MEAL_WITH_DASH = [...MEALS, '-'] as const;

const positiveNumber = (field: string) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z
      .number({ error: `${field} must be a number` })
      .positive({ message: `${field} must be greater than 0` })
  );

const dateString = z
  .string({ error: 'Date is required' })
  .refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid date format' });

export const createStockItemSchema = z.object({
  item: z.object({
    name: z
      .string({ error: 'Item name is required' })
      .trim()
      .min(1, 'Item name cannot be empty')
      .max(100, 'Item name too long'),
    unit: z.enum(UNITS, { error: `Unit must be one of: ${UNITS.join(', ')}` }),
    category: z.enum(CATEGORIES, { error: `Category must be one of: ${CATEGORIES.join(', ')}` }),
    wing: z
      .string({ error: 'Wing is required' })
      .transform((v) => v.toUpperCase())
      .refine((v) => (WINGS as readonly string[]).includes(v), { message: `Wing must be one of: ${WINGS.join(', ')}` }),
  }),
});

export const updateStockItemSchema = z.object({
  item: z.object({
    name: z.string().trim().min(1, 'Item name cannot be empty').max(100, 'Item name too long').optional(),
    unit: z.enum(UNITS, { error: `Unit must be one of: ${UNITS.join(', ')}` }).optional(),
    category: z.enum(CATEGORIES, { error: `Category must be one of: ${CATEGORIES.join(', ')}` }).optional(),
    wing: z
      .string()
      .transform((v) => v.toUpperCase())
      .refine((v) => (WINGS as readonly string[]).includes(v), { message: `Wing must be one of: ${WINGS.join(', ')}` })
      .optional(),
  }),
});

export const stockInSchema = z.object({
  stock: z.object({
    item: z.string({ error: 'Item ID is required' }).min(1, 'Item ID is required'),
    date: dateString,
    quantity: positiveNumber('Quantity'),
    price: positiveNumber('Price per unit'),
    wing: z
      .string({ error: 'Wing is required' })
      .transform((v) => v.toUpperCase())
      .refine((v) => (WINGS as readonly string[]).includes(v), { message: 'Wing must be MALE or FEMALE' }),
  }),
});

export const stockOutSchema = z.object({
  quantityToReduce: positiveNumber('Quantity'),
  date: dateString,
  meal: z
    .string({ error: 'Meal is required' })
    .transform((v) => v.toUpperCase())
    .refine((v) => (MEALS as readonly string[]).includes(v), { message: `Meal must be one of: ${MEALS.join(', ')}` }),
  category: z.enum(CATEGORIES, { error: `Category must be one of: ${CATEGORIES.join(', ')}` }),
  wing: z
    .string({ error: 'Wing is required' })
    .transform((v) => v.toUpperCase())
    .refine((v) => (WINGS as readonly string[]).includes(v), { message: 'Wing must be MALE or FEMALE' }),
  price: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z.number().positive('Price must be greater than 0').optional()
    )
    .optional(),
});

export const editTransactionSchema = z.object({
  quantityChange: positiveNumber('Quantity'),
  pricePerUnit: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z.number().positive('Price per unit must be greater than 0').optional()
    )
    .optional(),
  date: dateString.optional(),
  meal: z
    .string()
    .transform((v) => v.toUpperCase())
    .refine((v) => (MEAL_WITH_DASH as readonly string[]).includes(v), {
      message: `Meal must be one of: ${MEAL_WITH_DASH.join(', ')}`,
    })
    .optional(),
});

export const batchTransactionItemSchema = z.object({
  type: z.enum(['IN', 'OUT'] as const, { error: 'Type must be IN or OUT' }),
  name: z.string().trim().min(1, 'Item name is required'),
  quantity: positiveNumber('Quantity'),
  price: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z.number().positive('Price must be greater than 0').optional()
    )
    .optional(),
  date: dateString,
  meal: z
    .string()
    .transform((v) => v.toUpperCase())
    .refine((v) => (MEAL_WITH_DASH as readonly string[]).includes(v), { message: 'Meal must be valid' })
    .optional(),
  category: z.enum(CATEGORIES, { error: 'Category must be STORED or NON_STORED' }).optional(),
});

export const batchTransactionSchema = z.object({
  wing: z
    .string({ error: 'Wing is required' })
    .transform((v) => v.toUpperCase())
    .refine((v) => (WINGS as readonly string[]).includes(v), { message: 'Wing must be MALE or FEMALE' }),
  transactions: z.array(batchTransactionItemSchema).min(1, 'At least one transaction is required'),
});

export const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues;
      const details = issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({
        error: details[0]?.message || 'Validation failed',
        details,
      });
      return;
    }
    req.body = result.data;
    next();
  };
