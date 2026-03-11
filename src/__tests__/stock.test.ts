import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';

// ── Mock validateToken before requiring any routes ────────────────────────────
jest.mock('../utils/validateToken', () => ({
  validateToken: (req: any, _res: any, next: any) => {
    req.user = { _id: '000000000000000000000001', role: 'admin', wing: 'MALE' };
    next();
  },
}));

// ── Register all models that billService touches ──────────────────────────────
import { Stock, StockItem, StockTransaction } from '../models/stock';
import Cost from '../models/cost';
import '../models/hallFeast';
import '../models/student';
import '../models/meal';

import { computeRunningAvgAtDate, recomputeStockHistory } from '../utils/stockRecompute';
import stockRouter from '../controllers/stockController';

// ── Express app ───────────────────────────────────────────────────────────────
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

// ── Shared helpers ────────────────────────────────────────────────────────────
const WING = 'MALE';
const DATE = '2024-03-10';

function makeItem(overrides: Record<string, any> = {}) {
  return { name: 'Rice', unit: 'KG', category: 'STORED', wing: WING, ...overrides };
}

async function seedItem(overrides: Record<string, any> = {}) {
  return StockItem.create(makeItem(overrides));
}

async function seedStock(itemOverrides: Record<string, any> = {}, qty = 100, price = 50) {
  const item = await seedItem(itemOverrides);
  const stock = await Stock.create({ item: item._id, quantity: qty, price, wing: WING });
  return { item, stock };
}

async function seedIN(itemId: any, qty: number, unitPrice: number, date = DATE) {
  const tx = await StockTransaction.create({
    item: itemId,
    quantityChange: qty,
    type: 'IN',
    meal: '-',
    date: new Date(date),
    unitPrice,
    transactionAmount: Math.round(qty * unitPrice * 100) / 100,
    wing: WING,
  });
  return tx;
}

async function seedOUT(itemId: any, qty: number, unitPrice: number, date = DATE, meal = 'LUNCH') {
  const tx = await StockTransaction.create({
    item: itemId,
    quantityChange: qty,
    type: 'OUT',
    category: 'STORED',
    meal,
    date: new Date(date),
    unitPrice,
    transactionAmount: Math.round(qty * unitPrice * 100) / 100,
    wing: WING,
  });
  return tx;
}

// =============================================================================
// 1. STOCK ITEM CRUD
// =============================================================================
describe('StockItem CRUD', () => {
  // ── POST /stock/item ────────────────────────────────────────────────────────
  describe('POST /stock/item', () => {
    it('creates a stock item successfully', async () => {
      const res = await request(app)
        .post('/stock/item')
        .send({ item: makeItem() });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Rice');
      expect(res.body.unit).toBe('KG');
      expect(res.body.category).toBe('STORED');
      expect(res.body.wing).toBe('MALE');
    });

    it('normalises name to Title Case', async () => {
      const res = await request(app)
        .post('/stock/item')
        .send({ item: makeItem({ name: 'basmati rice' }) });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Basmati rice');
    });

    it('returns 400 when item body key is missing', async () => {
      const res = await request(app).post('/stock/item').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 on duplicate name within the same wing', async () => {
      await request(app).post('/stock/item').send({ item: makeItem() });
      const res = await request(app).post('/stock/item').send({ item: makeItem() });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/duplicate/i);
    });

    it('allows the same item name in a different wing', async () => {
      await request(app).post('/stock/item').send({ item: makeItem({ wing: 'MALE' }) });
      const res = await request(app)
        .post('/stock/item')
        .send({ item: makeItem({ wing: 'FEMALE' }) });
      expect(res.status).toBe(201);
    });

    it('creates a NON_STORED item', async () => {
      const res = await request(app)
        .post('/stock/item')
        .send({ item: makeItem({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED' }) });
      expect(res.status).toBe(201);
      expect(res.body.category).toBe('NON_STORED');
    });

    it('returns 400 for invalid unit enum value', async () => {
      const res = await request(app)
        .post('/stock/item')
        .send({ item: makeItem({ unit: 'GALLON' }) });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /stock/item ─────────────────────────────────────────────────────────
  describe('GET /stock/item', () => {
    beforeEach(async () => {
      await StockItem.create([
        { name: 'Rice', unit: 'KG', category: 'STORED', wing: 'MALE' },
        { name: 'Eggs', unit: 'PCS', category: 'NON_STORED', wing: 'MALE' },
        { name: 'Oil', unit: 'LTR', category: 'STORED', wing: 'FEMALE' },
      ]);
    });

    it('returns all items with enum metadata', async () => {
      const res = await request(app).get('/stock/item');
      expect(res.status).toBe(200);
      expect(res.body.stockItems).toHaveLength(3);
      expect(res.body.units).toEqual(expect.arrayContaining(['PCS', 'KG', 'LTR']));
      expect(res.body.categories).toEqual(expect.arrayContaining(['STORED', 'NON_STORED']));
    });

    it('filters items by wing=MALE', async () => {
      const res = await request(app).get('/stock/item?wing=MALE');
      expect(res.status).toBe(200);
      expect(res.body.stockItems).toHaveLength(2);
      expect(res.body.stockItems.every((i: any) => i.wing === 'MALE')).toBe(true);
    });

    it('filters items by wing=FEMALE', async () => {
      const res = await request(app).get('/stock/item?wing=FEMALE');
      expect(res.status).toBe(200);
      expect(res.body.stockItems).toHaveLength(1);
      expect(res.body.stockItems[0].name).toBe('Oil');
    });

    it('returns empty array when no items match wing', async () => {
      await mongoose.connection.collections['stockitems'].deleteMany({ wing: 'FEMALE' });
      const res = await request(app).get('/stock/item?wing=FEMALE');
      expect(res.status).toBe(200);
      expect(res.body.stockItems).toHaveLength(0);
    });

    it('sorts by category descending (STORED before NON_STORED)', async () => {
      const res = await request(app).get('/stock/item?wing=MALE');
      const cats = res.body.stockItems.map((i: any) => i.category);
      expect(cats[0]).toBe('STORED');
    });
  });

  // ── PUT /stock/item/:id ──────────────────────────────────────────────────────
  describe('PUT /stock/item/:id', () => {
    it("updates a stock item's unit", async () => {
      const item = await seedItem();
      const res = await request(app)
        .put(`/stock/item/${item._id}`)
        .send({ item: { unit: 'LTR' } });
      expect(res.status).toBe(200);
      expect(res.body.unit).toBe('LTR');
    });

    it('returns 404 for non-existent item id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/stock/item/${fakeId}`)
        .send({ item: { unit: 'LTR' } });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /stock/item/:id ───────────────────────────────────────────────────
  describe('DELETE /stock/item/:id', () => {
    it('deletes an item that has no associations', async () => {
      const item = await seedItem();
      const res = await request(app).delete(`/stock/item/${item._id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);
      expect(await StockItem.findById(item._id)).toBeNull();
    });

    it('returns 400 when item has an associated Stock record', async () => {
      const { item } = await seedStock();
      const res = await request(app).delete(`/stock/item/${item._id}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/associated/i);
    });

    it('returns 400 when item has associated StockTransactions', async () => {
      const item = await seedItem();
      await seedIN(item._id, 10, 50);
      const res = await request(app).delete(`/stock/item/${item._id}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/associated/i);
    });

    it('returns 404 for non-existent item', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/stock/item/${fakeId}`);
      expect(res.status).toBe(404);
    });
  });
});

// =============================================================================
// 2. STOCK GET + STOCK IN (POST /)
// =============================================================================
describe('Stock GET and Stock IN', () => {
  // ── GET /stock ───────────────────────────────────────────────────────────────
  describe('GET /stock', () => {
    it('returns empty array when no stocks exist', async () => {
      const res = await request(app).get('/stock');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all stocks with populated item', async () => {
      await seedStock();
      await seedStock({ name: 'Oil', unit: 'LTR', wing: 'FEMALE' });
      const res = await request(app).get('/stock');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].item).toHaveProperty('name');
    });

    it('filters stocks by wing', async () => {
      // Create MALE stock
      const maleItem = await StockItem.create({ name: 'Rice', unit: 'KG', category: 'STORED', wing: 'MALE' });
      await Stock.create({ item: maleItem._id, quantity: 50, price: 100, wing: 'MALE' });
      // Create FEMALE stock with a different name (bare unique index on name)
      const femaleItem = await StockItem.create({ name: 'Oil', unit: 'LTR', category: 'STORED', wing: 'FEMALE' });
      await Stock.create({ item: femaleItem._id, quantity: 20, price: 200, wing: 'FEMALE' });

      const res = await request(app).get('/stock?wing=MALE');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].wing).toBe('MALE');
    });
  });

  // ── POST /stock (Stock IN) ───────────────────────────────────────────────────
  describe('POST /stock (Stock IN)', () => {
    it('creates a new stock record and IN transaction on first purchase', async () => {
      const item = await seedItem();
      const res = await request(app).post('/stock').send({
        stock: { item: item._id, date: DATE, quantity: 50, price: 100, wing: WING },
      });
      expect(res.status).toBe(200);
      expect(res.body.updatedStock.quantity).toBe(50);
      expect(res.body.updatedStock.price).toBeCloseTo(100);
      expect(res.body.newStockTransaction.type).toBe('IN');
      expect(res.body.newStockTransaction.quantityChange).toBe(50);
      expect(res.body.newStockTransaction.transactionAmount).toBeCloseTo(5000);
    });

    it('updates existing stock and creates second IN transaction', async () => {
      const item = await seedItem();
      // First IN: 50 KG @ 100
      await request(app).post('/stock').send({
        stock: { item: item._id, date: '2024-03-01', quantity: 50, price: 100, wing: WING },
      });
      // Second IN: 50 KG @ 200
      const res = await request(app).post('/stock').send({
        stock: { item: item._id, date: '2024-03-05', quantity: 50, price: 200, wing: WING },
      });
      expect(res.status).toBe(200);
      expect(res.body.updatedStock.quantity).toBe(100);
      // Running avg after recompute: (50*100 + 50*200) / 100 = 150
      expect(res.body.updatedStock.price).toBeCloseTo(150);
      const txCount = await StockTransaction.countDocuments({ item: item._id, type: 'IN' });
      expect(txCount).toBe(2);
    });

    it('returns 400 when stock body key is missing', async () => {
      const res = await request(app).post('/stock').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('recomputes downstream OUT prices after a new IN', async () => {
      const item = await seedItem();
      // Seed: 10 KG @ 100 IN
      await Stock.create({ item: item._id, quantity: 10, price: 100, wing: WING });
      await seedIN(item._id, 10, 100, '2024-03-01');
      // OUT: 5 KG @ avg 100 on 2024-03-05
      const outTx = await seedOUT(item._id, 5, 100, '2024-03-05');

      // New IN backfilled to 2024-03-03: 10 KG @ 200 → new avg = (1000+2000)/20 = 150
      await request(app).post('/stock').send({
        stock: { item: item._id, date: '2024-03-03', quantity: 10, price: 200, wing: WING },
      });

      const correctedOut = await StockTransaction.findById(outTx._id);
      expect(correctedOut!.unitPrice).toBeCloseTo(150);
      expect(correctedOut!.transactionAmount).toBeCloseTo(5 * 150);
    });

    it('returns affectedDates array', async () => {
      const item = await seedItem();
      await Stock.create({ item: item._id, quantity: 10, price: 100, wing: WING });
      await seedIN(item._id, 10, 100, '2024-03-01');
      await seedOUT(item._id, 5, 100, '2024-03-05');

      const res = await request(app).post('/stock').send({
        stock: { item: item._id, date: '2024-03-03', quantity: 10, price: 200, wing: WING },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.affectedDates)).toBe(true);
      expect(res.body.affectedDates).toContain('2024-03-05');
    });
  });
});

// =============================================================================
// 3. STOCK OUT  (POST /out/:stockId)
// =============================================================================
describe('Stock OUT', () => {
  const validOutBody = (stockId: any) => ({
    quantityToReduce: 5,
    date: DATE,
    meal: 'LUNCH',
    category: 'STORED',
    wing: WING,
    stockId,
  });

  // ── STORED ───────────────────────────────────────────────────────────────────
  describe('STORED OUT', () => {
    it('records a STORED OUT and reduces stock quantity', async () => {
      const { item, stock } = await seedStock({}, 50, 100);
      await seedIN(item._id, 50, 100);

      const res = await request(app)
        .post(`/stock/out/${stock._id}`)
        .send({ quantityToReduce: 10, date: DATE, meal: 'LUNCH', category: 'STORED', wing: WING });

      expect(res.status).toBe(200);
      expect(res.body.outTransaction.type).toBe('OUT');
      expect(res.body.outTransaction.quantityChange).toBe(10);
      expect(res.body.outTransaction.unitPrice).toBeCloseTo(100);
      expect(res.body.outTransaction.transactionAmount).toBeCloseTo(1000);

      const updated = await Stock.findById(stock._id);
      expect(updated!.quantity).toBe(40);
    });

    it('uses weighted average price for OUT, not just latest IN price', async () => {
      const item = await seedItem();
      const stock = await Stock.create({ item: item._id, quantity: 20, price: 125, wing: WING });
      // 10 KG @ 100 then 10 KG @ 150 → avg = (1000+1500)/20 = 125
      await seedIN(item._id, 10, 100, '2024-03-01');
      await seedIN(item._id, 10, 150, '2024-03-02');

      const res = await request(app)
        .post(`/stock/out/${stock._id}`)
        .send({ quantityToReduce: 5, date: DATE, meal: 'DINNER', category: 'STORED', wing: WING });

      expect(res.status).toBe(200);
      expect(res.body.outTransaction.unitPrice).toBeCloseTo(125);
    });

    it('returns 400 for insufficient stock', async () => {
      const { item, stock } = await seedStock({}, 3, 100);
      await seedIN(item._id, 3, 100);

      const res = await request(app)
        .post(`/stock/out/${stock._id}`)
        .send({ quantityToReduce: 10, date: DATE, meal: 'LUNCH', category: 'STORED', wing: WING });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/insufficient/i);
    });

    it('returns 400 for quantity of zero', async () => {
      const { stock } = await seedStock();
      const res = await request(app)
        .post(`/stock/out/${stock._id}`)
        .send({ quantityToReduce: 0, date: DATE, meal: 'LUNCH', category: 'STORED', wing: WING });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/quantity/i);
    });

    it('returns 400 for negative quantity', async () => {
      const { stock } = await seedStock();
      const res = await request(app)
        .post(`/stock/out/${stock._id}`)
        .send({ quantityToReduce: -5, date: DATE, meal: 'LUNCH', category: 'STORED', wing: WING });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid category', async () => {
      const { stock } = await seedStock();
      const res = await request(app)
        .post(`/stock/out/${stock._id}`)
        .send({ quantityToReduce: 5, date: DATE, meal: 'LUNCH', category: 'BULK', wing: WING });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/category/i);
    });

    it('returns 400 for invalid wing', async () => {
      const { stock } = await seedStock();
      const res = await request(app)
        .post(`/stock/out/${stock._id}`)
        .send({ quantityToReduce: 5, date: DATE, meal: 'LUNCH', category: 'STORED', wing: 'UNKNOWN' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/wing/i);
    });

    it('returns 400 for invalid meal', async () => {
      const { stock } = await seedStock();
      const res = await request(app)
        .post(`/stock/out/${stock._id}`)
        .send({ quantityToReduce: 5, date: DATE, meal: 'BRUNCH', category: 'STORED', wing: WING });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/meal/i);
    });

    it('returns 404 when stock record not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/stock/out/${fakeId}`)
        .send({ quantityToReduce: 5, date: DATE, meal: 'LUNCH', category: 'STORED', wing: WING });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/stock not found/i);
    });

    it('creates a bill Cost document after successful OUT', async () => {
      const { item, stock } = await seedStock({}, 50, 100);
      await seedIN(item._id, 50, 100);

      await request(app)
        .post(`/stock/out/${stock._id}`)
        .send({ quantityToReduce: 10, date: DATE, meal: 'LUNCH', category: 'STORED', wing: WING });

      const bill = await Cost.findOne({ wing: WING });
      expect(bill).not.toBeNull();
      expect(bill!.mealBill.lunch.totalCost).toBeGreaterThan(0);
    });
  });

  // ── NON_STORED ───────────────────────────────────────────────────────────────
  describe('NON_STORED OUT', () => {
    it('records a NON_STORED OUT with admin-provided price', async () => {
      const item = await seedItem({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED' });
      const res = await request(app)
        .post(`/stock/out/${item._id}`)
        .send({
          quantityToReduce: 30,
          date: DATE,
          meal: 'BREAKFAST',
          category: 'NON_STORED',
          wing: WING,
          price: 12,
        });

      expect(res.status).toBe(200);
      expect(res.body.outTransaction.category).toBe('NON_STORED');
      expect(res.body.outTransaction.unitPrice).toBe(12);
      expect(res.body.outTransaction.transactionAmount).toBeCloseTo(360);
    });

    it('returns 400 when price is missing for NON_STORED', async () => {
      const item = await seedItem({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED' });
      const res = await request(app)
        .post(`/stock/out/${item._id}`)
        .send({ quantityToReduce: 30, date: DATE, meal: 'BREAKFAST', category: 'NON_STORED', wing: WING });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/price is required/i);
    });

    it('returns 400 when price is zero for NON_STORED', async () => {
      const item = await seedItem({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED' });
      const res = await request(app)
        .post(`/stock/out/${item._id}`)
        .send({ quantityToReduce: 30, date: DATE, meal: 'BREAKFAST', category: 'NON_STORED', wing: WING, price: 0 });
      expect(res.status).toBe(400);
    });

    it('returns 404 when NON_STORED item not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/stock/out/${fakeId}`)
        .send({ quantityToReduce: 10, date: DATE, meal: 'LUNCH', category: 'NON_STORED', wing: WING, price: 10 });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/stock item not found/i);
    });

    it('does NOT change any Stock.quantity for NON_STORED OUT', async () => {
      const item = await seedItem({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED' });
      await request(app)
        .post(`/stock/out/${item._id}`)
        .send({ quantityToReduce: 30, date: DATE, meal: 'BREAKFAST', category: 'NON_STORED', wing: WING, price: 12 });

      const stocks = await Stock.find({});
      expect(stocks).toHaveLength(0);
    });
  });
});

// =============================================================================
// 4. TRANSACTION GET
// =============================================================================
describe('Transaction GET', () => {
  let item: any;
  beforeEach(async () => {
    item = await seedItem();
    await seedIN(item._id, 10, 100, '2024-03-01');
    await seedIN(item._id, 20, 150, '2024-03-05');
    await seedOUT(item._id, 5, 100, '2024-03-06', 'BREAKFAST');
  });

  // ── GET /stock/transactions/all ──────────────────────────────────────────────
  describe('GET /stock/transactions/all', () => {
    it('returns all transactions', async () => {
      const res = await request(app).get('/stock/transactions/all');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
    });

    it('filters by wing', async () => {
      const femaleItem = await StockItem.create({ name: 'Oil', unit: 'LTR', category: 'STORED', wing: 'FEMALE' });
      await StockTransaction.create({
        item: femaleItem._id, quantityChange: 5, type: 'IN', meal: '-',
        date: new Date(DATE), unitPrice: 200, transactionAmount: 1000, wing: 'FEMALE',
      });
      const res = await request(app).get('/stock/transactions/all?wing=MALE');
      expect(res.status).toBe(200);
      expect(res.body.every((t: any) => t.wing === 'MALE')).toBe(true);
      expect(res.body).toHaveLength(3);
    });

    it('filters by item id', async () => {
      const otherItem = await seedItem({ name: 'Oil', unit: 'LTR' });
      await seedIN(otherItem._id, 5, 200);
      const res = await request(app).get(`/stock/transactions/all?item=${item._id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
    });

    it('returns transactions sorted by date ascending', async () => {
      const res = await request(app).get('/stock/transactions/all');
      const dates = res.body.map((t: any) => new Date(t.date).getTime());
      expect(dates).toEqual([...dates].sort((a: number, b: number) => a - b));
    });
  });

  // ── GET /stock/transactions (paginated) ──────────────────────────────────────
  describe('GET /stock/transactions', () => {
    it('returns transactions in date range with pagination meta', async () => {
      const res = await request(app).get(
        '/stock/transactions?fromDate=2024-03-01&toDate=2024-03-06&wing=MALE'
      );
      expect(res.status).toBe(200);
      expect(res.body.transactions).toHaveLength(3);
      expect(res.body.pagination).toMatchObject({ page: 1, total: 3, totalPages: 1 });
    });

    it('returns 400 when fromDate is missing', async () => {
      const res = await request(app).get('/stock/transactions?toDate=2024-03-06');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/fromDate.*toDate/i);
    });

    it('returns 400 when toDate is missing', async () => {
      const res = await request(app).get('/stock/transactions?fromDate=2024-03-01');
      expect(res.status).toBe(400);
    });

    it('paginates correctly', async () => {
      const res = await request(app).get(
        '/stock/transactions?fromDate=2024-03-01&toDate=2024-03-06&limit=2&page=1'
      );
      expect(res.body.transactions).toHaveLength(2);
      expect(res.body.pagination.totalPages).toBe(2);
    });

    it('page 2 returns remaining transactions', async () => {
      const res = await request(app).get(
        '/stock/transactions?fromDate=2024-03-01&toDate=2024-03-06&limit=2&page=2'
      );
      expect(res.body.transactions).toHaveLength(1);
    });

    it('filters by type=IN', async () => {
      const res = await request(app).get(
        '/stock/transactions?fromDate=2024-03-01&toDate=2024-03-06&type=IN'
      );
      expect(res.status).toBe(200);
      expect(res.body.transactions.every((t: any) => t.type === 'IN')).toBe(true);
    });

    it('filters by meal=BREAKFAST', async () => {
      const res = await request(app).get(
        '/stock/transactions?fromDate=2024-03-01&toDate=2024-03-06&meal=BREAKFAST'
      );
      expect(res.status).toBe(200);
      expect(res.body.transactions).toHaveLength(1);
      expect(res.body.transactions[0].meal).toBe('BREAKFAST');
    });

    it('returns empty result for a date range with no transactions', async () => {
      const res = await request(app).get(
        '/stock/transactions?fromDate=2020-01-01&toDate=2020-01-31'
      );
      expect(res.status).toBe(200);
      expect(res.body.transactions).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it('returns transactions sorted descending when sortOrder=DESC', async () => {
      const res = await request(app).get(
        '/stock/transactions?fromDate=2024-03-01&toDate=2024-03-06&sortOrder=DESC'
      );
      const dates = res.body.transactions.map((t: any) => new Date(t.date).getTime());
      expect(dates).toEqual([...dates].sort((a: number, b: number) => b - a));
    });

    it('caps limit at 200', async () => {
      const res = await request(app).get(
        '/stock/transactions?fromDate=2024-03-01&toDate=2024-03-06&limit=999'
      );
      expect(res.body.pagination.limit).toBe(200);
    });
  });
});

// =============================================================================
// 5. TRANSACTION EDIT  (PUT /transaction/:id)
// =============================================================================
describe('Transaction Edit', () => {
  it('returns 400 for invalid (zero) quantity', async () => {
    const item = await seedItem();
    const tx = await seedIN(item._id, 10, 100);
    const res = await request(app)
      .put(`/stock/transaction/${tx._id}`)
      .send({ quantityChange: 0, pricePerUnit: 100, date: DATE });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/quantity/i);
  });

  it('returns 404 for non-existent transaction', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/stock/transaction/${fakeId}`)
      .send({ quantityChange: 10, pricePerUnit: 100, date: DATE });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/transaction not found/i);
  });

  // ── STORED IN edit ───────────────────────────────────────────────────────────
  describe('Editing a STORED IN transaction', () => {
    it('updates quantity + price and cascades to downstream OUTs', async () => {
      const item = await seedItem();
      await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });

      const inTx  = await seedIN(item._id, 10, 100, '2024-03-01');
      const outTx = await seedOUT(item._id, 5, 100, '2024-03-05');

      // Edit IN: change price to 200 → avg should become 200 → OUT should be 200*5=1000
      const res = await request(app)
        .put(`/stock/transaction/${inTx._id}`)
        .send({ quantityChange: 10, pricePerUnit: 200, date: '2024-03-01' });

      expect(res.status).toBe(200);
      expect(res.body.updatedTransaction.unitPrice).toBe(200);
      expect(res.body.updatedTransaction.transactionAmount).toBeCloseTo(2000);

      const correctedOut = await StockTransaction.findById(outTx._id);
      expect(correctedOut!.unitPrice).toBeCloseTo(200);
      expect(correctedOut!.transactionAmount).toBeCloseTo(1000);
    });

    it('returns 400 when pricePerUnit is missing for STORED IN edit', async () => {
      const item = await seedItem();
      const tx = await seedIN(item._id, 10, 100);
      const res = await request(app)
        .put(`/stock/transaction/${tx._id}`)
        .send({ quantityChange: 10, date: DATE });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/pricePerUnit is required/i);
    });

    it('returns affectedDates listing dates with changed OUT amounts', async () => {
      const item = await seedItem();
      await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });
      const inTx = await seedIN(item._id, 10, 100, '2024-03-01');
      await seedOUT(item._id, 5, 100, '2024-03-05');

      const res = await request(app)
        .put(`/stock/transaction/${inTx._id}`)
        .send({ quantityChange: 10, pricePerUnit: 200, date: '2024-03-01' });

      expect(res.body.affectedDates).toContain('2024-03-05');
    });

    it('multiple OUTs after one IN all get corrected', async () => {
      const item = await seedItem();
      await Stock.create({ item: item._id, quantity: 10, price: 100, wing: WING });
      const inTx = await seedIN(item._id, 20, 100, '2024-03-01');
      const out1 = await seedOUT(item._id, 5, 100, '2024-03-03', 'BREAKFAST');
      const out2 = await seedOUT(item._id, 5, 100, '2024-03-06', 'LUNCH');

      await request(app)
        .put(`/stock/transaction/${inTx._id}`)
        .send({ quantityChange: 20, pricePerUnit: 200, date: '2024-03-01' });

      const [c1, c2] = await Promise.all([
        StockTransaction.findById(out1._id),
        StockTransaction.findById(out2._id),
      ]);
      expect(c1!.unitPrice).toBeCloseTo(200);
      expect(c2!.unitPrice).toBeCloseTo(200);
    });
  });

  // ── STORED OUT edit ──────────────────────────────────────────────────────────
  describe('Editing a STORED OUT transaction', () => {
    it('updates quantity and recomputes bill for old and new date', async () => {
      const item = await seedItem();
      await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });
      await seedIN(item._id, 10, 100, '2024-03-01');
      const outTx = await seedOUT(item._id, 5, 100, '2024-03-05');

      const res = await request(app)
        .put(`/stock/transaction/${outTx._id}`)
        .send({ quantityChange: 3, date: '2024-03-07' });

      expect(res.status).toBe(200);
      expect(res.body.updatedTransaction.quantityChange).toBe(3);
      // Both old and new date should appear in affectedDates
      expect(res.body.affectedDates).toContain('2024-03-05');
      expect(res.body.affectedDates).toContain('2024-03-07');
    });

    it('updates meal on STORED OUT', async () => {
      const item = await seedItem();
      await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });
      await seedIN(item._id, 10, 100, '2024-03-01');
      const outTx = await seedOUT(item._id, 5, 100, '2024-03-05', 'LUNCH');

      const res = await request(app)
        .put(`/stock/transaction/${outTx._id}`)
        .send({ quantityChange: 5, meal: 'DINNER', date: '2024-03-05' });

      expect(res.status).toBe(200);
      expect(res.body.updatedTransaction.meal).toBe('DINNER');
    });
  });

  // ── NON_STORED edit ──────────────────────────────────────────────────────────
  describe('Editing a NON_STORED transaction', () => {
    it('updates quantity and price, regenerates bills for old+new dates', async () => {
      const item = await seedItem({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED' });
      const tx = await StockTransaction.create({
        item: item._id, quantityChange: 30, type: 'OUT', category: 'NON_STORED',
        meal: 'BREAKFAST', date: new Date('2024-03-05'), unitPrice: 10,
        transactionAmount: 300, wing: WING,
      });

      const res = await request(app)
        .put(`/stock/transaction/${tx._id}`)
        .send({ quantityChange: 20, pricePerUnit: 15, date: '2024-03-08' });

      expect(res.status).toBe(200);
      expect(res.body.updatedTransaction.quantityChange).toBe(20);
      expect(res.body.updatedTransaction.unitPrice).toBe(15);
      expect(res.body.updatedTransaction.transactionAmount).toBeCloseTo(300);
    });

    it('returns 400 when pricePerUnit is missing for NON_STORED edit', async () => {
      const item = await seedItem({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED' });
      const tx = await StockTransaction.create({
        item: item._id, quantityChange: 30, type: 'OUT', category: 'NON_STORED',
        meal: 'BREAKFAST', date: new Date(DATE), unitPrice: 10,
        transactionAmount: 300, wing: WING,
      });

      const res = await request(app)
        .put(`/stock/transaction/${tx._id}`)
        .send({ quantityChange: 20, date: DATE });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/pricePerUnit is required/i);
    });
  });
});

// =============================================================================
// 6. TRANSACTION DELETE  (DELETE /transaction/:id)
// =============================================================================
describe('Transaction Delete', () => {
  it('returns 404 for non-existent transaction', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/stock/transaction/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('deletes a STORED IN and recomputes downstream OUTs', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 10, price: 100, wing: WING });

    const in1 = await seedIN(item._id, 10, 100, '2024-03-01');
    const in2 = await seedIN(item._id, 10, 200, '2024-03-03');
    // With both INs avg = 150; seed the OUT at the now-correct avg price of 150
    const outTx = await seedOUT(item._id, 5, 150, '2024-03-05');

    // Delete in2 → avg drops to 100 → OUT at 150 must be corrected → 2024-03-05 affected
    const res = await request(app).delete(`/stock/transaction/${in2._id}`);
    expect(res.status).toBe(200);
    expect(res.body.affectedDates).toContain('2024-03-05');

    // OUT should now reflect avg of only in1: 100
    const correctedOut = await StockTransaction.findById(outTx._id);
    expect(correctedOut!.unitPrice).toBeCloseTo(100);

    const txCount = await StockTransaction.countDocuments({ item: item._id, type: 'IN' });
    expect(txCount).toBe(1);
  });

  it('deletes a NON_STORED transaction without running recompute', async () => {
    const item = await seedItem({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED' });
    const tx = await StockTransaction.create({
      item: item._id, quantityChange: 30, type: 'OUT', category: 'NON_STORED',
      meal: 'BREAKFAST', date: new Date(DATE), unitPrice: 10,
      transactionAmount: 300, wing: WING,
    });

    const res = await request(app).delete(`/stock/transaction/${tx._id}`);
    expect(res.status).toBe(200);
    const deleted = await StockTransaction.findById(tx._id);
    expect(deleted).toBeNull();
  });

  it('deletes a STORED OUT and rebuilds bill', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });
    await seedIN(item._id, 10, 100, '2024-03-01');
    const outTx = await seedOUT(item._id, 5, 100, '2024-03-05');

    const res = await request(app).delete(`/stock/transaction/${outTx._id}`);
    expect(res.status).toBe(200);
    expect(res.body.affectedDates).toContain('2024-03-05');
    expect(await StockTransaction.findById(outTx._id)).toBeNull();
  });

  it('stock quantity is restored after deleting an OUT', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });
    await seedIN(item._id, 10, 100, '2024-03-01');
    const outTx = await seedOUT(item._id, 5, 100, '2024-03-05');

    // Manually set stock qty to reflect the OUT happened
    await Stock.findOneAndUpdate({ item: item._id, wing: WING }, { quantity: 5 });

    await request(app).delete(`/stock/transaction/${outTx._id}`);

    const stock = await Stock.findOne({ item: item._id, wing: WING });
    // recomputeStockHistory will set quantity to IN qty (10) - 0 OUTs = 10
    expect(stock!.quantity).toBe(10);
  });
});

// =============================================================================
// 7. BATCH TRANSACTIONS  (POST /transaction/batch)
// =============================================================================
describe('Batch Transactions', () => {
  it('returns 400 when transactions array is missing', async () => {
    const res = await request(app).post('/stock/transaction/batch').send({ wing: WING });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when transactions is not an array', async () => {
    const res = await request(app).post('/stock/transaction/batch').send({ transactions: 'bad', wing: WING });
    expect(res.status).toBe(400);
  });

  it('processes a batch with IN + STORED OUT + NON_STORED', async () => {
    const res = await request(app).post('/stock/transaction/batch').send({
      wing: WING,
      transactions: [
        { type: 'IN',  name: 'Rice', unit: 'KG',  category: 'STORED',     quantity: 20, price: 100, date: DATE },
        { type: 'OUT', name: 'Rice', unit: 'KG',  category: 'STORED',     quantity: 5,  meal: 'LUNCH',      date: DATE },
        { type: 'OUT', name: 'Eggs', unit: 'PCS', category: 'NON_STORED', quantity: 30, price: 12, meal: 'BREAKFAST', date: DATE },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/processed successfully/i);

    const inTxCount  = await StockTransaction.countDocuments({ type: 'IN',  wing: WING });
    const outTxCount = await StockTransaction.countDocuments({ type: 'OUT', wing: WING });
    expect(inTxCount).toBe(1);
    expect(outTxCount).toBe(2);

    const riceStock = await Stock.findOne({ wing: WING }).populate('item');
    expect(riceStock!.quantity).toBeCloseTo(15); // 20 - 5
  });

  it('auto-creates StockItems that do not exist yet', async () => {
    await request(app).post('/stock/transaction/batch').send({
      wing: WING,
      transactions: [
        { type: 'IN', name: 'NewGrain', unit: 'KG', category: 'STORED', quantity: 10, price: 80, date: DATE },
      ],
    });
    // The schema setter only uppercases the FIRST character, so "NewGrain" → "NewGrain"
    const item = await StockItem.findOne({ name: 'NewGrain', wing: WING });
    expect(item).not.toBeNull();
  });

  it('returns 400 when a STORED OUT has insufficient stock', async () => {
    const res = await request(app).post('/stock/transaction/batch').send({
      wing: WING,
      transactions: [
        { type: 'IN',  name: 'Rice', quantity: 5,  price: 100, date: DATE },
        { type: 'OUT', name: 'Rice', quantity: 20, meal: 'LUNCH', date: DATE }, // more than available
      ],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient stock/i);
  });

  it('OUT uses weighted average price for STORED items in batch', async () => {
    await request(app).post('/stock/transaction/batch').send({
      wing: WING,
      transactions: [
        { type: 'IN',  name: 'Rice', quantity: 10, price: 100, date: DATE },
        { type: 'OUT', name: 'Rice', quantity: 5,  meal: 'DINNER', date: DATE },
      ],
    });
    const outTx = await StockTransaction.findOne({ type: 'OUT', wing: WING });
    expect(outTx!.unitPrice).toBeCloseTo(100);
    expect(outTx!.transactionAmount).toBeCloseTo(500);
  });
});

// =============================================================================
// 8. UTILITY: computeRunningAvgAtDate
// =============================================================================
describe('computeRunningAvgAtDate', () => {
  it('returns 0 when there are no IN transactions', async () => {
    const item = await seedItem();
    const avg = await computeRunningAvgAtDate(item._id, WING, new Date(DATE));
    expect(avg).toBe(0);
  });

  it('returns the unit price when there is a single IN', async () => {
    const item = await seedItem();
    await seedIN(item._id, 10, 100, '2024-03-01');
    const avg = await computeRunningAvgAtDate(item._id, WING, new Date('2024-03-01'));
    expect(avg).toBeCloseTo(100);
  });

  it('returns weighted average across multiple INs', async () => {
    const item = await seedItem();
    await seedIN(item._id, 10, 100, '2024-03-01'); // 1000
    await seedIN(item._id, 10, 200, '2024-03-05'); // 2000
    // total qty=20, total value=3000 → avg=150
    const avg = await computeRunningAvgAtDate(item._id, WING, new Date('2024-03-05'));
    expect(avg).toBeCloseTo(150);
  });

  it('returns 0 when queried before any INs', async () => {
    const item = await seedItem();
    await seedIN(item._id, 10, 100, '2024-03-05');
    const avg = await computeRunningAvgAtDate(item._id, WING, new Date('2024-03-01'));
    expect(avg).toBe(0);
  });

  it('only considers INs up to and including asOfDate (not future INs)', async () => {
    const item = await seedItem();
    await seedIN(item._id, 10, 100, '2024-03-01');
    await seedIN(item._id, 10, 300, '2024-03-10'); // future from asOfDate perspective
    // As of 2024-03-05 only first IN counts → avg=100
    const avg = await computeRunningAvgAtDate(item._id, WING, new Date('2024-03-05'));
    expect(avg).toBeCloseTo(100);
  });

  it('includes an IN on the exact asOfDate (end-of-day inclusive)', async () => {
    const item = await seedItem();
    await seedIN(item._id, 10, 100, '2024-03-01');
    await seedIN(item._id, 10, 200, '2024-03-05');
    const avg = await computeRunningAvgAtDate(item._id, WING, new Date('2024-03-05'));
    expect(avg).toBeCloseTo(150); // both INs included
  });

  it('is isolated per wing (MALE vs FEMALE INs don\'t mix)', async () => {
    // Use different names: bare unique index on name prevents same name across wings
    const maleItem   = await StockItem.create({ name: 'MaleRice', unit: 'KG', category: 'STORED', wing: 'MALE' });
    const femaleItem = await StockItem.create({ name: 'FemaleRice', unit: 'KG', category: 'STORED', wing: 'FEMALE' });
    await seedIN(maleItem._id, 10, 100, '2024-03-01');
    await StockTransaction.create({
      item: femaleItem._id, quantityChange: 10, type: 'IN', meal: '-',
      date: new Date('2024-03-01'), unitPrice: 999, transactionAmount: 9990, wing: 'FEMALE',
    });
    const avg = await computeRunningAvgAtDate(maleItem._id, 'MALE', new Date('2024-03-05'));
    expect(avg).toBeCloseTo(100); // FEMALE IN not included
  });

  it('rounds to 2 decimal places', async () => {
    const item = await seedItem();
    await seedIN(item._id, 3, 100, '2024-03-01'); // 300
    await seedIN(item._id, 3, 200, '2024-03-02'); // 600
    // avg = 900/6 = 150 (exact), but test uneven case:
    await StockTransaction.deleteMany({});
    await seedIN(item._id, 1, 100, '2024-03-01');
    await seedIN(item._id, 2, 200, '2024-03-02');
    // avg = 500/3 = 166.67 (rounded to 2dp)
    const avg = await computeRunningAvgAtDate(item._id, WING, new Date('2024-03-03'));
    expect(avg).toBe(Math.round((500 / 3) * 100) / 100); // 166.67
  });
});

// =============================================================================
// 9. UTILITY: recomputeStockHistory
// =============================================================================
describe('recomputeStockHistory', () => {
  it('returns empty array when there are no OUT transactions', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 10, price: 100, wing: WING });
    await seedIN(item._id, 10, 100);
    const affected = await recomputeStockHistory(item._id, WING);
    expect(affected).toEqual([]);
  });

  it('corrects a STORED OUT whose price is stale after an IN edit', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });
    // Seed an IN at old price and an OUT that recorded that old price
    await seedIN(item._id, 10, 100, '2024-03-01');
    const outTx = await seedOUT(item._id, 5, 100, '2024-03-05');

    // Simulate price correction on the IN
    await StockTransaction.findOneAndUpdate(
      { item: item._id, type: 'IN' },
      { unitPrice: 200, transactionAmount: 2000 }
    );

    const affected = await recomputeStockHistory(item._id, WING);
    expect(affected).toContain('2024-03-05');

    const corrected = await StockTransaction.findById(outTx._id);
    expect(corrected!.unitPrice).toBeCloseTo(200);
    expect(corrected!.transactionAmount).toBeCloseTo(1000); // 5 * 200, rounded by r2
  });

  it('does NOT modify NON_STORED OUT transaction prices', async () => {
    const item = await seedItem({ name: 'Eggs', unit: 'PCS', category: 'NON_STORED' });
    const nsTx = await StockTransaction.create({
      item: item._id, quantityChange: 30, type: 'OUT', category: 'NON_STORED',
      meal: 'BREAKFAST', date: new Date(DATE), unitPrice: 12,
      transactionAmount: 360, wing: WING,
    });
    await recomputeStockHistory(item._id, WING);
    const unchanged = await StockTransaction.findById(nsTx._id);
    expect(unchanged!.unitPrice).toBe(12);
    expect(unchanged!.transactionAmount).toBe(360);
  });

  it('updates Stock.quantity to IN qty minus OUT qty', async () => {
    const item = await seedItem();
    const stock = await Stock.create({ item: item._id, quantity: 999, price: 0, wing: WING });
    await seedIN(item._id, 20, 100, '2024-03-01');
    await seedOUT(item._id, 7, 100, '2024-03-03');

    await recomputeStockHistory(item._id, WING);

    const updated = await Stock.findById(stock._id);
    expect(updated!.quantity).toBe(13); // 20 - 7
  });

  it('updates Stock.price to current weighted average of INs', async () => {
    const item = await seedItem();
    const stock = await Stock.create({ item: item._id, quantity: 0, price: 0, wing: WING });
    await seedIN(item._id, 10, 100, '2024-03-01');
    await seedIN(item._id, 10, 200, '2024-03-03');

    await recomputeStockHistory(item._id, WING);

    const updated = await Stock.findById(stock._id);
    expect(updated!.price).toBeCloseTo(150);
  });

  it('returns affected date strings in YYYY-MM-DD format', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });
    await seedIN(item._id, 10, 100, '2024-03-01');
    await seedOUT(item._id, 5, 50 /* wrong price */, '2024-03-05');

    const affected = await recomputeStockHistory(item._id, WING);
    expect(affected).toHaveLength(1);
    expect(affected[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(affected[0]).toBe('2024-03-05');
  });

  it('does not include dates where OUT amount was already correct', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });
    await seedIN(item._id, 10, 100, '2024-03-01');
    // OUT at correct price (100 * 5 = 500)
    await seedOUT(item._id, 5, 100, '2024-03-05');

    const affected = await recomputeStockHistory(item._id, WING);
    expect(affected).toHaveLength(0);
  });

  it('handles multiple OUTs across different dates', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 0, price: 0, wing: WING });
    await seedIN(item._id, 30, 100, '2024-03-01');
    await seedOUT(item._id, 5, 50, '2024-03-02'); // wrong
    await seedOUT(item._id, 5, 50, '2024-03-04'); // wrong
    await seedOUT(item._id, 5, 100, '2024-03-06'); // already correct

    const affected = await recomputeStockHistory(item._id, WING);
    expect(affected).toContain('2024-03-02');
    expect(affected).toContain('2024-03-04');
    expect(affected).not.toContain('2024-03-06');
  });

  it('respects chronological order: OUT before a later IN uses only prior INs', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 5, price: 100, wing: WING });
    await seedIN(item._id, 10, 100, '2024-03-01');
    await seedOUT(item._id, 5, 999 /* stale */, '2024-03-03'); // between the two INs
    await seedIN(item._id, 10, 200, '2024-03-05'); // later IN should NOT affect the OUT above

    const affected = await recomputeStockHistory(item._id, WING);
    expect(affected).toContain('2024-03-03');

    const out = await StockTransaction.findOne({ type: 'OUT' });
    // Only first IN counted when OUT happened → avg = 100
    expect(out!.unitPrice).toBeCloseTo(100);
  });

  it('sets Stock.quantity to 0 (not negative) when OUTs exceed INs', async () => {
    const item = await seedItem();
    await Stock.create({ item: item._id, quantity: 999, price: 100, wing: WING });
    await seedIN(item._id, 10, 100, '2024-03-01');
    // Manually insert an OUT that exceeds IN (edge/corrupt data scenario)
    await StockTransaction.create({
      item: item._id, quantityChange: 20, type: 'OUT', category: 'STORED',
      meal: 'LUNCH', date: new Date('2024-03-02'), unitPrice: 100,
      transactionAmount: 2000, wing: WING,
    });

    await recomputeStockHistory(item._id, WING);

    const stock = await Stock.findOne({ item: item._id, wing: WING });
    expect(stock!.quantity).toBe(0); // Math.max(0, -10) = 0
  });
});
