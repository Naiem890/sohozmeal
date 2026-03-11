import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';

jest.mock('../utils/validateToken', () => ({
  validateToken: (req: any, _res: any, next: any) => {
    req.user = { _id: '000000000000000000000001', role: 'admin', wing: 'MALE' };
    next();
  },
}));

import { Stock, StockItem, StockTransaction } from '../models/stock';
import Cost from '../models/cost';
import '../models/hallFeast';
import '../models/student';
import '../models/meal';

import { computeRunningAvgAtDate, recomputeStockHistory } from '../utils/stockRecompute';
import stockRouter from '../controllers/stockController';

let app: express.Application;
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.use(express.json());
  app.use('/stock', stockRouter);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) await cols[key].deleteMany({});
});

const WING = 'MALE';
const r2 = (v: number): number => Math.round(v * 100) / 100;

async function seedItem(overrides: Record<string, any> = {}) {
  return StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: WING, ...overrides });
}

async function seedStock(itemOverrides: Record<string, any> = {}, qty = 100, price = 50) {
  const item = await seedItem(itemOverrides);
  const stock = await Stock.create({ item: item._id, quantity: qty, price, wing: WING });
  return { item, stock };
}

async function seedIN(itemId: any, qty: number, unitPrice: number, date: string) {
  return StockTransaction.create({
    item: itemId,
    quantityChange: qty,
    type: 'IN',
    meal: '-',
    date: new Date(date),
    unitPrice,
    transactionAmount: r2(qty * unitPrice),
    wing: WING,
  });
}

async function seedOUT(itemId: any, qty: number, unitPrice: number, date: string, meal = 'LUNCH') {
  return StockTransaction.create({
    item: itemId,
    quantityChange: qty,
    type: 'OUT',
    category: 'STORED',
    meal,
    date: new Date(date),
    unitPrice,
    transactionAmount: r2(qty * unitPrice),
    wing: WING,
  });
}

// =============================================================================
// BUG 1: Rounding divergence between computeRunningAvgAtDate and recomputeStockHistory
//
// computeRunningAvgAtDate does NOT round intermediate avgPrice during pool drain.
// recomputeStockHistory DOES round with r2(). After multiple OUTs, the two functions
// produce different pool states, leading to different prices for the same OUT.
// =============================================================================
describe('BUG: rounding divergence between computeRunningAvgAtDate and recomputeStockHistory', () => {
  it('OUT prices should not change when recomputeStockHistory runs after creation', async () => {
    // Carefully chosen prices that produce a non-round average: (3*10.01 + 7*9.99)/10 = 99.96/10 = 9.996
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 0, price: 0, wing: WING });

    // IN 3 @ 10.01 on Mar 1
    await seedIN(item._id, 3, 10.01, '2024-03-01');
    // IN 7 @ 9.99 on Mar 2
    await seedIN(item._id, 7, 9.99, '2024-03-02');

    // Manually update stock to reflect the INs
    await Stock.findOneAndUpdate({ item: item._id, wing: WING }, { quantity: 10, price: r2(99.96 / 10) });

    // OUT 3 on Mar 3 via API (uses computeRunningAvgAtDate internally)
    const stock = await Stock.findOne({ item: item._id, wing: WING });
    const res1 = await request(app).post(`/stock/out/${stock!._id}`).send({
      quantityToReduce: 3, date: '2024-03-03', meal: 'LUNCH', category: 'STORED', wing: WING,
    });
    expect(res1.status).toBe(200);
    const out1Price = res1.body.outTransaction.unitPrice;
    const out1Amount = res1.body.outTransaction.transactionAmount;

    // OUT 7 on Mar 4 via API
    const res2 = await request(app).post(`/stock/out/${stock!._id}`).send({
      quantityToReduce: 7, date: '2024-03-04', meal: 'DINNER', category: 'STORED', wing: WING,
    });
    expect(res2.status).toBe(200);
    const out2Price = res2.body.outTransaction.unitPrice;
    const out2Amount = res2.body.outTransaction.transactionAmount;

    // Now run recomputeStockHistory — prices should NOT change
    const affectedDates = await recomputeStockHistory(item._id, WING);

    // Re-read the OUT transactions from DB
    const out1 = await StockTransaction.findById(res1.body.outTransaction._id);
    const out2 = await StockTransaction.findById(res2.body.outTransaction._id);

    // If recomputeStockHistory changed the prices, this means the functions diverge
    expect(out1!.unitPrice).toBe(out1Price);
    expect(out1!.transactionAmount).toBe(out1Amount);
    expect(out2!.unitPrice).toBe(out2Price);
    expect(out2!.transactionAmount).toBe(out2Amount);

    // affectedDates should be empty if no prices changed
    expect(affectedDates).toEqual([]);
  });
});

// =============================================================================
// BUG 2: StockItem name has `unique: true` on the field level, preventing the
// same item name in different wings despite the compound index (name, wing).
// =============================================================================
describe('BUG: StockItem name uniqueness should be per-wing', () => {
  it('should allow creating the same item name in different wings', async () => {
    await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: 'MALE' });

    // This should succeed — same name, different wing
    let error: any = null;
    try {
      await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: 'FEMALE' });
    } catch (e) {
      error = e;
    }

    expect(error).toBeNull();
  });

  it('should still prevent duplicate name within the same wing', async () => {
    await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: 'MALE' });

    let error: any = null;
    try {
      await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: 'MALE' });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeNull();
    expect(error.code).toBe(11000);
  });
});

// =============================================================================
// BUG 3: Batch endpoint partial failure — if INs succeed but OUTs validation
// fails, the INs are already saved to DB with no rollback.
// =============================================================================
describe('BUG: batch endpoint should be atomic', () => {
  it('should NOT save IN transactions when OUT validation fails in the same batch', async () => {
    // Create an existing item with 0 stock
    const item = await seedItem({ name: 'Oil' });
    await Stock.create({ item: item._id, quantity: 0, price: 0, wing: WING });

    const res = await request(app).post('/stock/transaction/batch').send({
      wing: WING,
      transactions: [
        // Valid IN: 5 KG @ 100
        { type: 'IN', name: 'Oil', quantity: 5, price: 100, date: '2024-03-10', meal: '-' },
        // Invalid OUT: tries to take 20 KG but only 5 available after the IN
        { type: 'OUT', name: 'Oil', quantity: 20, date: '2024-03-10', meal: 'LUNCH', category: 'STORED' },
      ],
    });

    expect(res.status).toBe(400);

    // Check: IN transaction should NOT exist in DB (atomic rollback)
    const txCount = await StockTransaction.countDocuments({ item: item._id });
    expect(txCount).toBe(0);
  });
});

// =============================================================================
// BUG 4: Stock.price becomes stale after OUT (not updated by the OUT endpoint)
// =============================================================================
describe('BUG: Stock.price should stay accurate after OUT', () => {
  it('Stock.price should reflect the correct weighted average after a partial OUT', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 0, price: 0, wing: WING });

    // Two INs at different prices: 10 @ 60 and 10 @ 80 → avg = 70
    await request(app).post('/stock').send({
      stock: { item: item._id.toString(), date: '2024-03-01', quantity: 10, price: 60, wing: WING },
    });
    await request(app).post('/stock').send({
      stock: { item: item._id.toString(), date: '2024-03-02', quantity: 10, price: 80, wing: WING },
    });

    let stock = await Stock.findOne({ item: item._id, wing: WING });
    expect(stock!.quantity).toBe(20);
    // After recomputeStockHistory from IN, price should be 70
    expect(stock!.price).toBe(70);

    // OUT 10 @ avg → pool should remain at avg 70 (draining at current avg doesn't change it)
    await request(app).post(`/stock/out/${stock!._id}`).send({
      quantityToReduce: 10, date: '2024-03-03', meal: 'LUNCH', category: 'STORED', wing: WING,
    });

    stock = await Stock.findOne({ item: item._id, wing: WING });
    expect(stock!.quantity).toBe(10);
    // Price should still be 70 (draining at avg doesn't change the avg)
    expect(stock!.price).toBe(70);
  });
});

// =============================================================================
// BUG 5: billService aggregation should only count OUT transactions for meal costs,
// not IN transactions (which have meal='-' and happen to not match by coincidence)
// =============================================================================
describe('BUG: bill cost aggregation should exclude IN transactions', () => {
  it('an IN transaction with a non-dash meal should not inflate meal costs', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 0, price: 0, wing: WING });

    // Create a normal OUT for lunch
    await seedOUT(item._id, 5, 10, '2024-03-10', 'LUNCH');

    // Manually create a rogue IN transaction with meal = 'LUNCH' (shouldn't happen but testing defensively)
    await StockTransaction.create({
      item: item._id,
      quantityChange: 100,
      type: 'IN',
      meal: 'LUNCH',
      date: new Date('2024-03-10'),
      unitPrice: 50,
      transactionAmount: 5000,
      wing: WING,
    });

    // Import billService and generate bill
    const { createOrUpdateBill } = require('../utils/billService');
    const bill = await createOrUpdateBill('2024-03-10', WING);

    // Lunch cost should be 50 (only the OUT), NOT 5050 (OUT + rogue IN)
    expect(bill.mealBill.lunch.totalCost).toBe(50);
  });
});

// =============================================================================
// Additional: lastAvgPrice fix validation — pool-drain then more OUTs
// =============================================================================
describe('lastAvgPrice: OUTs after pool drain should use last known average', () => {
  it('recomputeStockHistory prices OUTs correctly when pool is fully drained between them', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 0, price: 0, wing: WING });

    // IN 10 @ 68 on Mar 1
    await seedIN(item._id, 10, 68, '2024-03-01');
    // OUT 10 on Mar 1 (drains pool entirely)
    await seedOUT(item._id, 10, 68, '2024-03-01');
    // OUT 8 on Mar 2 (stock is 0 — should use last avg of 68)
    await seedOUT(item._id, 8, 0, '2024-03-02'); // seeded with 0 to see if recompute fixes it
    // IN 10 @ 70 on Mar 3
    await seedIN(item._id, 10, 70, '2024-03-03');

    const affectedDates = await recomputeStockHistory(item._id, WING);

    const out2 = await StockTransaction.findOne({ item: item._id, type: 'OUT', date: new Date('2024-03-02') });
    // Should be priced at 68 (last known avg), not 0
    expect(out2!.unitPrice).toBe(68);
    expect(out2!.transactionAmount).toBe(r2(8 * 68));
    expect(affectedDates).toContain('2024-03-02');
  });

  it('computeRunningAvgAtDate returns last avg when pool is drained', async () => {
    const item = await seedItem();
    await seedIN(item._id, 10, 68, '2024-03-01');
    await seedOUT(item._id, 10, 68, '2024-03-01');

    // Pool is drained. Avg at Mar 2 should be 68 (last known), not 0
    const avg = await computeRunningAvgAtDate(item._id, WING, new Date('2024-03-02'));
    expect(avg).toBe(68);
  });

  it('lastAvgPrice updates when new INs arrive after drain', async () => {
    const item = await seedItem();
    await seedIN(item._id, 10, 60, '2024-03-01');
    await seedOUT(item._id, 10, 60, '2024-03-01'); // drain
    await seedIN(item._id, 5, 80, '2024-03-02'); // new IN at 80

    const avg = await computeRunningAvgAtDate(item._id, WING, new Date('2024-03-03'));
    expect(avg).toBe(80); // only the new IN matters now, pool has 5 @ 80
  });
});

// =============================================================================
// Additional: edit transaction — validate STORED OUT date change correctly
// =============================================================================
describe('Edit transaction: STORED OUT date change validation', () => {
  it('rejects moving an OUT to a date with insufficient stock', async () => {
    const { item, stock } = await seedStock({}, 10, 50);
    await seedIN(item._id, 10, 50, '2024-03-10');

    // OUT 8 on Mar 10
    const out = await seedOUT(item._id, 8, 50, '2024-03-10');

    // Try to move the OUT to Mar 5 (before the IN) — no stock available
    const res = await request(app).put(`/stock/transaction/${out._id}`).send({
      quantityChange: 8,
      date: '2024-03-05',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Insufficient stock/i);
  });
});

// =============================================================================
// Additional: delete STORED IN should fail if it would make stock negative
// =============================================================================
describe('Delete STORED IN: stock validation', () => {
  it('rejects deleting an IN if removal would leave negative stock', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 2, price: 50, wing: WING });

    const inTx = await seedIN(item._id, 10, 50, '2024-03-10');
    await seedOUT(item._id, 8, 50, '2024-03-10');

    // Stock is 2. Deleting the IN of 10 would require removing 10 from stock, but only 2 available
    const res = await request(app).delete(`/stock/transaction/${inTx._id}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Cannot delete/);
  });
});
