/**
 * Billing Integration Tests
 *
 * Scenario overview:
 *   - 3 students (MALE wing)
 *       S001: breakfast ON, lunch ON, dinner ON  (every day)
 *       S002: breakfast OFF, lunch ON, dinner ON
 *       S003: breakfast OFF, lunch OFF, dinner ON
 *   - 2 stock items
 *       Rice  – STORED, KG
 *       Eggs  – NON_STORED, PCS
 *   - Stock IN:
 *       Jan 01: 100 KG Rice @ ৳50/KG → avg = ৳50.00
 *       Jan 03: 50 KG Rice @ ৳80/KG → avg = ৳60.00  (pool: 9000/150)
 *   - Stock OUT (OUTs carry the running-avg unit price baked into transactionAmount):
 *       Jan 01 B: 3 KG Rice @ 50 = 150  | 1 student B ON  → perHead = 150
 *       Jan 01 L: 6 KG Rice @ 50 = 300  | 2 students L ON → perHead = 150
 *       Jan 01 D: 9 KG Rice @ 50 = 450  | 3 students D ON → perHead = 150
 *       Jan 02 B: 3 KG Rice @ 50 = 150  | 1 → 150
 *       Jan 02 L: 6 KG Rice @ 50 = 300  | 2 → 150
 *       Jan 02 D: 9 KG Rice @ 50 = 450  | 3 → 150
 *       Jan 03 B: 3 KG Rice @ 60 = 180  | 1 → 180
 *       Jan 03 L: 6 KG Rice @ 60 = 360  | 2 → 180
 *       Jan 03 D: 9 KG Rice @ 60 = 540  | 3 → 180
 *       Jan 04 B: 3 KG Rice @ 60 = 180  | 1 → 180
 *       Jan 04 L: 6 KG Rice @ 60 = 360  | 2 → 180
 *       Jan 04 D: 9 KG Rice @ 60 = 540  | 3 → 180
 *       Jan 05 L: 30 PCS Eggs @ 10 = 300  | 2 → 150
 *       Jan 06 D: 45 PCS Eggs @ 10 = 450  | 3 → 150
 *
 * Expected monthly totals:
 *   S001 = 450 + 450 + 540 + 540 + 150 + 150 = 2280
 *   S002 = 300 + 300 + 360 + 360 + 150 + 150 = 1620
 *   S003 = 150 + 150 + 180 + 180 +   0 + 150 =  810
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';

// ── Mock validateToken as admin so we can pass studentId as query param ────────
jest.mock('../utils/validateToken', () => ({
  validateToken: (req: any, _res: any, next: any) => {
    req.user = { _id: '000000000000000000000001', role: 'admin', wing: 'MALE' };
    next();
  },
}));

import { StockTransaction } from '../models/stock';
import { StockItem } from '../models/stock';
import Cost from '../models/cost';
import HallFeast from '../models/hallFeast';
import Student from '../models/student';
import Meal from '../models/meal';

import { createOrUpdateBill } from '../utils/billService';
import { createOrUpdateCostForMonth } from '../utils/createOrUpdateCostForMonth';
import costRouter from '../controllers/costController';

// ── App setup ─────────────────────────────────────────────────────────────────
let app: express.Application;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.use(express.json());
  app.use('/cost', costRouter);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});

// ── Rounding helpers (same as production) ─────────────────────────────────────
const r2 = (v: number) => Math.round(v * 100) / 100;
const r4 = (v: number) => Math.round(v * 10000) / 10000;

const WING = 'MALE';
const YEAR = 2025;
const MONTH = 1; // January

// ── Seed helpers ──────────────────────────────────────────────────────────────

async function seedStudents() {
  const students = [
    { studentId: 'S001', hallId: 'H001', name: 'Student One', gender: WING },
    { studentId: 'S002', hallId: 'H002', name: 'Student Two', gender: WING },
    { studentId: 'S003', hallId: 'H003', name: 'Student Three', gender: WING },
  ];
  return Student.insertMany(students.map((s) => ({
    ...s,
    password: 'hashed',
    firstTimeLogin: false,
    isTutorAvailable: false,
    isDonor: false,
  })));
}

/** Seed 6 days of meal records for all 3 students per the scenario header. */
async function seedMeals(days: string[]) {
  const entries: any[] = [];
  for (const date of days) {
    entries.push(
      { studentId: 'S001', date, meal: { breakfast: true,  lunch: true,  dinner: true  }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S002', date, meal: { breakfast: false, lunch: true,  dinner: true  }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S003', date, meal: { breakfast: false, lunch: false, dinner: true  }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
    );
  }
  return Meal.insertMany(entries);
}

function d(day: number) {
  return `${YEAR}-${String(MONTH).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function seedItems() {
  const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
  const eggs = await StockItem.create({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED', wing: WING });
  return { rice, eggs };
}

function makeTx(itemId: any, qty: number, unitPrice: number, date: string, type: 'IN' | 'OUT', meal: string, category = 'STORED') {
  return {
    item: itemId,
    quantityChange: qty,
    type,
    category,
    meal,
    date: new Date(date),
    unitPrice,
    transactionAmount: r2(qty * unitPrice),
    wing: WING,
  };
}

/** Seeds the full 6-day scenario from the file header. Returns item ids. */
async function seedFullScenario() {
  await seedStudents();
  const { rice, eggs } = await seedItems();
  const days = [d(1), d(2), d(3), d(4), d(5), d(6)];
  await seedMeals(days);

  await StockTransaction.insertMany([
    // INs
    makeTx(rice._id, 100, 50, d(1), 'IN', '-'),
    makeTx(rice._id,  50, 80, d(3), 'IN', '-'),
    // Day 1 OUTs  (avg 50)
    makeTx(rice._id,  3, 50, d(1), 'OUT', 'BREAKFAST'),
    makeTx(rice._id,  6, 50, d(1), 'OUT', 'LUNCH'),
    makeTx(rice._id,  9, 50, d(1), 'OUT', 'DINNER'),
    // Day 2 OUTs  (avg 50)
    makeTx(rice._id,  3, 50, d(2), 'OUT', 'BREAKFAST'),
    makeTx(rice._id,  6, 50, d(2), 'OUT', 'LUNCH'),
    makeTx(rice._id,  9, 50, d(2), 'OUT', 'DINNER'),
    // Day 3 OUTs  (avg 60, after Day 3 IN)
    makeTx(rice._id,  3, 60, d(3), 'OUT', 'BREAKFAST'),
    makeTx(rice._id,  6, 60, d(3), 'OUT', 'LUNCH'),
    makeTx(rice._id,  9, 60, d(3), 'OUT', 'DINNER'),
    // Day 4 OUTs  (avg 60)
    makeTx(rice._id,  3, 60, d(4), 'OUT', 'BREAKFAST'),
    makeTx(rice._id,  6, 60, d(4), 'OUT', 'LUNCH'),
    makeTx(rice._id,  9, 60, d(4), 'OUT', 'DINNER'),
    // Day 5 – Eggs LUNCH only  (NON_STORED)
    makeTx(eggs._id, 30, 10, d(5), 'OUT', 'LUNCH', 'NON_STORED'),
    // Day 6 – Eggs DINNER only  (NON_STORED)
    makeTx(eggs._id, 45, 10, d(6), 'OUT', 'DINNER', 'NON_STORED'),
  ]);

  return { rice, eggs };
}

// =============================================================================
// 1.  createOrUpdateBill  (single-day, real-time path)
// =============================================================================
describe('createOrUpdateBill', () => {
  it('creates correct totalCost and totalStudent for a simple day', async () => {
    await seedStudents();
    // Only S001 and S002 have LUNCH ON
    await Meal.insertMany([
      { studentId: 'S001', date: d(1), meal: { breakfast: true, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S002', date: d(1), meal: { breakfast: false, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S003', date: d(1), meal: { breakfast: false, lunch: false, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
    ]);
    const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
    await StockTransaction.create(makeTx(rice._id, 10, 50, d(1), 'OUT', 'LUNCH'));

    const bill = await createOrUpdateBill(d(1), WING);

    expect(bill.mealBill.lunch.totalCost).toBe(500);
    expect(bill.mealBill.lunch.totalStudent).toBe(2); // S001 + S002
    expect(bill.mealBill.breakfast.totalCost).toBe(0);
    expect(bill.mealBill.breakfast.totalStudent).toBe(1); // only S001
    expect(bill.mealBill.dinner.totalStudent).toBe(0);
  });

  it('counts each meal type with correct student count', async () => {
    await seedStudents();
    const { rice } = await seedItems();
    await seedMeals([d(1)]);

    await StockTransaction.insertMany([
      makeTx(rice._id,  3, 50, d(1), 'OUT', 'BREAKFAST'),
      makeTx(rice._id,  6, 50, d(1), 'OUT', 'LUNCH'),
      makeTx(rice._id,  9, 50, d(1), 'OUT', 'DINNER'),
    ]);

    const bill = await createOrUpdateBill(d(1), WING);

    expect(bill.mealBill.breakfast.totalCost).toBe(150);
    expect(bill.mealBill.breakfast.totalStudent).toBe(1); // only S001

    expect(bill.mealBill.lunch.totalCost).toBe(300);
    expect(bill.mealBill.lunch.totalStudent).toBe(2); // S001, S002

    expect(bill.mealBill.dinner.totalCost).toBe(450);
    expect(bill.mealBill.dinner.totalStudent).toBe(3); // all
  });

  it('adds guest meals to totalStudent count', async () => {
    // S001 has 2 extra guests for LUNCH
    await seedStudents();
    const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
    await Meal.insertMany([
      { studentId: 'S001', date: d(1), meal: { breakfast: false, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 2, dinner: 0 } },
      { studentId: 'S002', date: d(1), meal: { breakfast: false, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S003', date: d(1), meal: { breakfast: false, lunch: false, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
    ]);
    await StockTransaction.create(makeTx(rice._id, 10, 50, d(1), 'OUT', 'LUNCH'));

    const bill = await createOrUpdateBill(d(1), WING);

    // 2 students with lunch ON + 2 guest lunches (from S001) = 4
    expect(bill.mealBill.lunch.totalCost).toBe(500);
    expect(bill.mealBill.lunch.totalStudent).toBe(4);
  });

  it('sets totalStudent = all students on a hall feast day', async () => {
    await seedStudents(); // 3 students
    // S003 has dinner OFF — feast should override the count to all 3
    await Meal.insertMany([
      { studentId: 'S001', date: d(1), meal: { breakfast: false, lunch: false, dinner: true  }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S002', date: d(1), meal: { breakfast: false, lunch: false, dinner: true  }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S003', date: d(1), meal: { breakfast: false, lunch: false, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
    ]);
    await HallFeast.create({ date: new Date(d(1)), meal: 'dinner', wing: WING });
    const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
    await StockTransaction.create(makeTx(rice._id, 9, 50, d(1), 'OUT', 'DINNER'));

    const bill = await createOrUpdateBill(d(1), WING);

    expect(bill.mealBill.dinner.totalCost).toBe(450);
    expect(bill.mealBill.dinner.totalStudent).toBe(3); // all 3 due to feast
  });

  it('is idempotent — calling twice updates the existing record, does not duplicate', async () => {
    await seedStudents();
    const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
    await Meal.create({ studentId: 'S001', date: d(1), meal: { breakfast: false, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } });
    await StockTransaction.create(makeTx(rice._id, 6, 50, d(1), 'OUT', 'LUNCH'));

    await createOrUpdateBill(d(1), WING);
    await createOrUpdateBill(d(1), WING); // second call

    const count = await Cost.countDocuments({ wing: WING });
    expect(count).toBe(1);
  });

  it('creates a Cost doc with 0 costs when there are no transactions', async () => {
    await seedStudents();
    await Meal.create({ studentId: 'S001', date: d(1), meal: { breakfast: true, lunch: true, dinner: true }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } });

    const bill = await createOrUpdateBill(d(1), WING);

    expect(bill.mealBill.breakfast.totalCost).toBe(0);
    expect(bill.mealBill.lunch.totalCost).toBe(0);
    expect(bill.mealBill.dinner.totalCost).toBe(0);
    expect(bill.mealBill.breakfast.totalStudent).toBe(1); // meal is ON even without cost
  });
});

// =============================================================================
// 2.  createOrUpdateCostForMonth  (monthly bulk recalc)
// =============================================================================
describe('createOrUpdateCostForMonth', () => {
  it('includes day 1 of month — regression for off-by-one fix', async () => {
    await seedStudents();
    const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
    await Meal.create({ studentId: 'S001', date: d(1), meal: { breakfast: false, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } });
    await StockTransaction.create(makeTx(rice._id, 6, 50, d(1), 'OUT', 'LUNCH'));

    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    const costDay1 = await Cost.findOne({ date: new Date(d(1)), wing: WING });
    expect(costDay1).not.toBeNull();
    expect(costDay1!.mealBill.lunch.totalCost).toBe(300);
    expect(costDay1!.mealBill.lunch.totalStudent).toBe(1);
  });

  it('generates exactly 31 Cost docs for January and nothing for February', async () => {
    await seedStudents();
    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    const janDocs = await Cost.countDocuments({
      date: { $gte: new Date('2025-01-01'), $lt: new Date('2025-02-01') },
      wing: WING,
    });
    expect(janDocs).toBe(31); // all 31 days of January

    const febDocs = await Cost.countDocuments({
      date: { $gte: new Date('2025-02-01'), $lt: new Date('2025-03-01') },
      wing: WING,
    });
    expect(febDocs).toBe(0); // nothing spilled into February
  });

  it('produces correct Cost documents for the full 6-day scenario', async () => {
    await seedFullScenario();

    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    // ── Day 1 (avg ৳50) ──────────────────────────────────────────────────────
    const c1 = await Cost.findOne({ date: new Date(d(1)), wing: WING });
    expect(c1!.mealBill.breakfast.totalCost).toBe(150);
    expect(c1!.mealBill.breakfast.totalStudent).toBe(1);
    expect(c1!.mealBill.lunch.totalCost).toBe(300);
    expect(c1!.mealBill.lunch.totalStudent).toBe(2);
    expect(c1!.mealBill.dinner.totalCost).toBe(450);
    expect(c1!.mealBill.dinner.totalStudent).toBe(3);

    // ── Day 2 (avg ৳50) ──────────────────────────────────────────────────────
    const c2 = await Cost.findOne({ date: new Date(d(2)), wing: WING });
    expect(c2!.mealBill.breakfast.totalCost).toBe(150);
    expect(c2!.mealBill.lunch.totalCost).toBe(300);
    expect(c2!.mealBill.dinner.totalCost).toBe(450);

    // ── Day 3 (avg ৳60 after IN) ─────────────────────────────────────────────
    const c3 = await Cost.findOne({ date: new Date(d(3)), wing: WING });
    expect(c3!.mealBill.breakfast.totalCost).toBe(180);
    expect(c3!.mealBill.lunch.totalCost).toBe(360);
    expect(c3!.mealBill.dinner.totalCost).toBe(540);

    // ── Day 4 (avg ৳60) ──────────────────────────────────────────────────────
    const c4 = await Cost.findOne({ date: new Date(d(4)), wing: WING });
    expect(c4!.mealBill.breakfast.totalCost).toBe(180);
    expect(c4!.mealBill.lunch.totalCost).toBe(360);
    expect(c4!.mealBill.dinner.totalCost).toBe(540);

    // ── Day 5 (Eggs for LUNCH only) ───────────────────────────────────────────
    const c5 = await Cost.findOne({ date: new Date(d(5)), wing: WING });
    expect(c5!.mealBill.breakfast.totalCost).toBe(0);
    expect(c5!.mealBill.lunch.totalCost).toBe(300);
    expect(c5!.mealBill.lunch.totalStudent).toBe(2);  // S001 + S002
    expect(c5!.mealBill.dinner.totalCost).toBe(0);

    // ── Day 6 (Eggs for DINNER only) ─────────────────────────────────────────
    const c6 = await Cost.findOne({ date: new Date(d(6)), wing: WING });
    expect(c6!.mealBill.dinner.totalCost).toBe(450);
    expect(c6!.mealBill.dinner.totalStudent).toBe(3); // all
    expect(c6!.mealBill.lunch.totalCost).toBe(0);
  });

  it('does not count students from a different wing', async () => {
    // Seed one MALE student and one FEMALE student; only MALE transactions
    await Student.insertMany([
      { studentId: 'M001', hallId: 'H001', name: 'Male',   gender: 'MALE',   password: 'x', firstTimeLogin: false, isTutorAvailable: false, isDonor: false },
      { studentId: 'F001', hallId: 'H002', name: 'Female', gender: 'FEMALE', password: 'x', firstTimeLogin: false, isTutorAvailable: false, isDonor: false },
    ]);
    await Meal.insertMany([
      { studentId: 'M001', date: d(1), meal: { breakfast: false, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'F001', date: d(1), meal: { breakfast: false, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
    ]);
    const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
    await StockTransaction.create(makeTx(rice._id, 6, 50, d(1), 'OUT', 'LUNCH'));

    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    const c = await Cost.findOne({ date: new Date(d(1)), wing: WING });
    // Only M001 (MALE) counted, not F001 (FEMALE)
    expect(c!.mealBill.lunch.totalStudent).toBe(1);
  });
});

// =============================================================================
// 3.  GET /cost/student  (per-day data for one student)
// =============================================================================
describe('GET /cost/student', () => {
  it('returns correct perHeadCost and meal status for each day', async () => {
    await seedFullScenario();
    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    const res = await request(app)
      .get(`/cost/student?year=${YEAR}&month=${MONTH}&wing=${WING}&studentId=S001`);

    expect(res.status).toBe(200);
    const { mealBillData } = res.body;

    const day1 = mealBillData.find((e: any) => e.date === d(1));
    expect(day1).toBeDefined();
    // S001 has all meals ON; perHeadCost for breakfast on day 1 = 150/1 = 150
    expect(day1.mealBill.breakfast.perHeadCost).toBe(150);
    expect(day1.mealBill.breakfast.status).toBe(true);
    expect(day1.mealBill.lunch.perHeadCost).toBe(r4(300 / 2));   // 150
    expect(day1.mealBill.lunch.status).toBe(true);
    expect(day1.mealBill.dinner.perHeadCost).toBe(r4(450 / 3));  // 150
    expect(day1.mealBill.dinner.status).toBe(true);

    // Day 3 higher avg
    const day3 = mealBillData.find((e: any) => e.date === d(3));
    expect(day3.mealBill.breakfast.perHeadCost).toBe(180);
    expect(day3.mealBill.lunch.perHeadCost).toBe(180);
    expect(day3.mealBill.dinner.perHeadCost).toBe(180);
  });

  it('shows breakfast status=false for S002 who has breakfast OFF', async () => {
    await seedFullScenario();
    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    const res = await request(app)
      .get(`/cost/student?year=${YEAR}&month=${MONTH}&wing=${WING}&studentId=S002`);

    expect(res.status).toBe(200);
    const day1 = res.body.mealBillData.find((e: any) => e.date === d(1));
    expect(day1.mealBill.breakfast.status).toBe(false);
    expect(day1.mealBill.lunch.status).toBe(true);
    expect(day1.mealBill.dinner.status).toBe(true);
  });

  it('returns an empty mealBillData when student has no meal records', async () => {
    await seedStudents();
    // No meals seeded; no Cost docs
    const res = await request(app)
      .get(`/cost/student?year=${YEAR}&month=${MONTH}&wing=${WING}&studentId=S001`);

    expect(res.status).toBe(200);
    expect(res.body.mealBillData).toHaveLength(0);
  });
});

// =============================================================================
// 4.  GET /cost/monthly/student  (aggregated monthly total per student)
// =============================================================================
describe('GET /cost/monthly/student', () => {
  /** Helper: seed scenario, run monthly recalc, query monthly/student */
  async function getMonthlyBill(studentId: string) {
    const res = await request(app)
      .get(`/cost/monthly/student?year=${YEAR}&month=${MONTH}&studentId=${studentId}`);
    expect(res.status).toBe(200);
    return res.body.totalMonthlyCost as number;
  }

  it('calculates total correctly for S001 (all meals ON)', async () => {
    await seedFullScenario();
    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    // Days 1-2: 150+150+150 = 450 each → 900
    // Days 3-4: 180+180+180 = 540 each → 1080
    // Day 5: lunch 150 → 150
    // Day 6: dinner 150 → 150
    expect(await getMonthlyBill('S001')).toBe(2280);
  });

  it('calculates total correctly for S002 (no breakfast)', async () => {
    await seedFullScenario();
    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    // Days 1-2: 0+150+150 = 300 each → 600
    // Days 3-4: 0+180+180 = 360 each → 720
    // Day 5: lunch 150 → 150
    // Day 6: dinner 150 → 150
    expect(await getMonthlyBill('S002')).toBe(1620);
  });

  it('calculates total correctly for S003 (dinner only)', async () => {
    await seedFullScenario();
    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    // Days 1-2: dinner 150 each → 300
    // Days 3-4: dinner 180 each → 360
    // Day 5: no dinner stock → 0
    // Day 6: dinner 150 → 150
    expect(await getMonthlyBill('S003')).toBe(810);
  });

  it('charges a student on a hall feast day even if their meal was OFF', async () => {
    // S003 has LUNCH OFF normally. A feast forces all 3 students to count.
    await seedStudents();
    const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
    await Meal.insertMany([
      { studentId: 'S001', date: d(1), meal: { breakfast: false, lunch: true,  dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S002', date: d(1), meal: { breakfast: false, lunch: true,  dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S003', date: d(1), meal: { breakfast: false, lunch: false, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
    ]);
    await HallFeast.create({ date: new Date(d(1)), meal: 'lunch', wing: WING });
    // 9 KG @ 50 = 450, divided by 3 students (feast) → perHead = 150
    await StockTransaction.create(makeTx(rice._id, 9, 50, d(1), 'OUT', 'LUNCH'));

    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    // All 3 students should each pay 150 (feast overrides S003's lunch=false)
    const s1Bill = await getMonthlyBill('S001');
    const s3Bill = await getMonthlyBill('S003');
    expect(s1Bill).toBe(150);
    expect(s3Bill).toBe(150); // charged because feast
  });

  it('charges guest meals on top of student own meal', async () => {
    // S001 has 3 extra guests for DINNER
    await seedStudents();
    const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
    await Meal.insertMany([
      { studentId: 'S001', date: d(1), meal: { breakfast: false, lunch: false, dinner: true },  guestMeal: { breakfast: 0, lunch: 0, dinner: 3 } },
      { studentId: 'S002', date: d(1), meal: { breakfast: false, lunch: false, dinner: true },  guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S003', date: d(1), meal: { breakfast: false, lunch: false, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
    ]);
    // totalStudent for DINNER = 2 (own) + 3 (guests) = 5
    // 25 KG @ 50 = 1250 → perHead = 250
    await StockTransaction.create(makeTx(rice._id, 25, 50, d(1), 'OUT', 'DINNER'));

    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    // S001: own dinner (250) + 3 guests × 250 = 1000
    const s1Bill = await getMonthlyBill('S001');
    // S002: own dinner only = 250
    const s2Bill = await getMonthlyBill('S002');

    expect(s1Bill).toBe(r2(250 + 3 * 250)); // 1000
    expect(s2Bill).toBe(250);
  });

  it('returns 0 for a month with no transactions', async () => {
    await seedStudents();
    // Meals exist but no stock transactions and no Cost docs
    await Meal.create({ studentId: 'S001', date: d(1), meal: { breakfast: true, lunch: true, dinner: true }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } });

    await createOrUpdateCostForMonth(YEAR, MONTH, WING);

    expect(await getMonthlyBill('S001')).toBe(0);
  });
});

// =============================================================================
// 5.  Weighted-average price flows through to bill correctly
// =============================================================================
describe('Weighted average price in bills', () => {
  it('blends two INs at different prices into the correct perHeadCost', async () => {
    // IN1: 100 KG @ 50 → pool cost = 5000
    // IN2: 100 KG @ 90 → pool cost = 9000 → total pool = 14000 / 200 KG → avg = 70
    // OUT: 14 KG for LUNCH → transactionAmount = 14 × 70 = 980
    // 2 students with LUNCH ON → perHead = 490
    await seedStudents();
    const rice = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING });
    await Meal.insertMany([
      { studentId: 'S001', date: d(5), meal: { breakfast: false, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S002', date: d(5), meal: { breakfast: false, lunch: true, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
      { studentId: 'S003', date: d(5), meal: { breakfast: false, lunch: false, dinner: false }, guestMeal: { breakfast: 0, lunch: 0, dinner: 0 } },
    ]);

    await StockTransaction.insertMany([
      makeTx(rice._id, 100, 50, d(1), 'IN', '-'),
      makeTx(rice._id, 100, 90, d(3), 'IN', '-'),
      makeTx(rice._id,  14, 70, d(5), 'OUT', 'LUNCH'), // transactionAmount = 980
    ]);

    const bill = await createOrUpdateBill(d(5), WING);

    expect(bill.mealBill.lunch.totalCost).toBe(980);
    expect(bill.mealBill.lunch.totalStudent).toBe(2);
    // perHeadCost via virtual
    const perHead = r4(980 / 2);
    expect(perHead).toBe(490);
  });
});
