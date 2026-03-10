import { Router, Request, Response } from 'express';
import { Stock, StockItem, StockTransaction } from '../models/stock';
import { validateToken } from '../utils/validateToken';
import { createOrUpdateBill } from '../utils/billService';
import { computeRunningAvgAtDate, recomputeStockHistory } from '../utils/stockRecompute';
import {
  createStockItemSchema,
  updateStockItemSchema,
  stockInSchema,
  stockOutSchema,
  editTransactionSchema,
  batchTransactionSchema,
  validate,
} from '../validation/stockSchemas';

const router = Router();

router.post('/item', validateToken, validate(createStockItemSchema), async (req: Request, res: Response) => {
  try {
    const { item: itemData } = req.body;
    const stockItem = new StockItem(itemData);
    const savedItem = await stockItem.save();
    res.status(201).json(savedItem);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Duplicate item name. Name must be unique.' });
    } else {
      console.log(error);
      res.status(500).json({ error: 'Error creating stock item' });
    }
  }
});

router.get('/item', validateToken, async (req: Request, res: Response) => {
  const { wing } = req.query as { wing?: string };
  try {
    const query = wing ? { wing } : {};
    const stockItems = await StockItem.find(query).sort({ category: -1 });
    const unitEnum = (StockItem.schema.path('unit') as any).enumValues;
    const categoryEnum = (StockItem.schema.path('category') as any).enumValues;
    res.json({ stockItems, units: unitEnum, categories: categoryEnum });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving stock items' });
  }
});

router.put('/item/:id', validateToken, validate(updateStockItemSchema), async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id;
    const { item: itemData } = req.body;
    const updatedItem = await StockItem.findByIdAndUpdate(itemId, itemData, { new: true });
    if (!updatedItem) return res.status(404).json({ error: 'Stock item not found' });
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Error updating stock item' });
  }
});

router.delete('/item/:id', validateToken, async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id;
    const associatedStock = await Stock.findOne({ item: itemId });
    const associatedTransaction = await StockTransaction.findOne({ item: itemId });
    if (associatedStock || associatedTransaction) {
      return res.status(400).json({ error: 'Cannot delete this item because it is associated with a stock or transactions.' });
    }
    const deletedItem = await StockItem.findByIdAndRemove(itemId);
    if (!deletedItem) return res.status(404).json({ error: 'Stock item not found' });
    res.json({ message: 'Stock item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting stock item' });
  }
});

router.get('/', validateToken, async (req: Request, res: Response) => {
  const { wing } = req.query as { wing?: string };
  try {
    const query = wing ? { wing } : {};
    const stocks = await Stock.find(query).populate('item');
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving stocks' });
  }
});

router.post('/', validateToken, validate(stockInSchema), async (req: Request, res: Response) => {
  try {
    const stockData = req.body.stock;
    const { item: itemId, date, quantity: newQuantity, price: newPrice, wing } = stockData;
    delete stockData.date;

    let stock = await Stock.findOne({ item: itemId, wing });
    let newPricePerUnit: number;
    let updatedStock: any;

    if (!stock) {
      stock = new Stock({ ...stockData, wing });
      newPricePerUnit = newPrice;
      stock.price = newPricePerUnit;
      stock.quantity = newQuantity;
      updatedStock = await stock.save();
    } else {
      const { price: prevPrice, quantity: prevQuantity } = stock;
      const totalPrice = prevPrice * prevQuantity + newPrice * newQuantity;
      newPricePerUnit = parseFloat((totalPrice / (prevQuantity + newQuantity)).toFixed(2));
      updatedStock = await Stock.findOneAndUpdate(
        { item: itemId, wing },
        { quantity: prevQuantity + newQuantity, price: newPricePerUnit },
        { new: true }
      );
    }

    const newStockTransaction = new StockTransaction({
      item: itemId,
      quantityChange: newQuantity,
      type: 'IN',
      meal: '-',
      date: new Date(date),
      unitPrice: newPrice,
      transactionAmount: newQuantity * newPrice,
      wing,
    });
    await newStockTransaction.save();

    const affectedDates = await recomputeStockHistory(itemId, wing);
    await Promise.all(affectedDates.map((d) => createOrUpdateBill(d, wing)));
    updatedStock = await Stock.findOne({ item: itemId, wing });

    res.json({ updatedStock, newStockTransaction, affectedDates });
  } catch (error) {
    console.log('error =>', error);
    res.status(500).json({ error: 'Error creating/updating stock' });
  }
});

router.put('/:id', validateToken, async (req: Request, res: Response) => {
  try {
    const stockId = req.params.id;
    const stockData = req.body;
    const updatedStock = await Stock.findByIdAndUpdate(stockId, stockData, { new: true });
    if (!updatedStock) return res.status(404).json({ error: 'Stock not found' });
    res.json(updatedStock);
  } catch (error) {
    res.status(500).json({ error: 'Error updating stock' });
  }
});

router.delete('/:id', validateToken, async (req: Request, res: Response) => {
  try {
    const stockId = req.params.id;
    const deletedStock = await Stock.findByIdAndRemove(stockId);
    if (!deletedStock) return res.status(404).json({ error: 'Stock not found' });
    res.json(deletedStock);
  } catch (error) {
    res.status(500).json({ error: 'Error deleting stock' });
  }
});

router.post('/out/:stockId', validateToken, validate(stockOutSchema), async (req: Request, res: Response) => {
  try {
    const { stockId } = req.params;
    const { quantityToReduce, date, meal, category, wing, price } = req.body;

    const outDate = new Date(date);
    const outWing = wing;
    const outMeal = meal;
    let outTransaction: any;

    if (category === 'STORED') {
      const stock = await Stock.findOne({ _id: stockId, wing: outWing }).populate('item');
      if (!stock) return res.status(404).json({ error: 'Stock not found' });
      if (stock.quantity < quantityToReduce) {
        return res.status(400).json({ error: `Insufficient stock. Available: ${stock.quantity}, requested: ${quantityToReduce}` });
      }

      const avgPrice = await computeRunningAvgAtDate((stock.item as any)._id, outWing, outDate);
      const transactionAmt = parseFloat((quantityToReduce * avgPrice).toFixed(4));

      outTransaction = new StockTransaction({
        item: (stock.item as any)._id,
        quantityChange: quantityToReduce,
        type: 'OUT',
        category: 'STORED',
        meal: outMeal,
        date: outDate,
        unitPrice: avgPrice,
        transactionAmount: transactionAmt,
        wing: outWing,
      });
      await outTransaction.save();
      stock.quantity = stock.quantity - quantityToReduce;
      await stock.save();
    } else {
      if (!price) return res.status(400).json({ error: 'price is required for NON_STORED items' });
      const stockItem = await StockItem.findOne({ _id: stockId, wing: outWing });
      if (!stockItem) return res.status(404).json({ error: 'Stock item not found' });
      const transactionAmt = parseFloat((quantityToReduce * price).toFixed(4));
      outTransaction = new StockTransaction({
        item: stockItem._id,
        quantityChange: quantityToReduce,
        type: 'OUT',
        category: 'NON_STORED',
        meal: outMeal,
        date: outDate,
        unitPrice: price,
        transactionAmount: transactionAmt,
        wing: outWing,
      });
      await outTransaction.save();
    }

    const updatedBill = await createOrUpdateBill(date, outWing);
    res.json({ message: 'Stock out recorded successfully', outTransaction, updatedBill });
  } catch (error) {
    console.error('Error during stock out:', error);
    res.status(500).json({ error: 'Error during stock out process' });
  }
});

router.get('/transactions/all', validateToken, async (req: Request, res: Response) => {
  const { wing, item } = req.query as any;
  try {
    const query: any = {};
    if (wing) query.wing = wing;
    if (item) query.item = item;
    const stockTransactions = await StockTransaction.find(query).sort({ date: 1 }).populate('item');
    res.json(stockTransactions);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving stock transactions' });
  }
});

router.get('/transactions', validateToken, async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, wing, type, meal, sortOrder = 'ASC', page = 1, limit = 20 } = req.query as any;
    if (!fromDate || !toDate) return res.status(400).json({ error: 'fromDate and toDate are required' });

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 20));

    const query: any = { date: { $gte: new Date(fromDate), $lte: new Date(toDate) } };
    if (wing) query.wing = wing;
    if (type && type !== 'BOTH') query.type = type;
    if (meal && meal !== 'ALL') query.meal = meal;

    const sortDir = sortOrder === 'ASC' ? 1 : -1;

    const [stockTransactions, total] = await Promise.all([
      StockTransaction.find(query).populate('item').sort({ date: sortDir }).skip((pageNum - 1) * limitNum).limit(limitNum),
      StockTransaction.countDocuments(query),
    ]);

    const transactions = stockTransactions.map((t) => ({
      _id: t._id,
      item: { _id: (t.item as any)._id, name: (t.item as any).name, unit: (t.item as any).unit, category: (t.item as any).category },
      quantityChange: t.quantityChange,
      unitPrice: t.unitPrice,
      date: t.date.toISOString(),
      type: t.type,
      category: (t.item as any).category,
      meal: t.meal,
      wing: t.wing,
      transactionAmount: t.transactionAmount,
      createdAt: t.createdAt,
    }));

    res.json({ transactions, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) {
    console.error('Error retrieving stock transactions:', error);
    res.status(500).json({ error: 'Error retrieving stock transactions' });
  }
});

router.put('/transaction/:transactionId', validateToken, validate(editTransactionSchema), async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { quantityChange: newQty, pricePerUnit, date, meal } = req.body;

    const tx = await StockTransaction.findById(transactionId).populate('item');
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const itemId = (tx.item as any)._id;
    const wing = tx.wing;
    const oldDate = tx.date;
    const newDate = date ? new Date(date) : tx.date;

    if ((tx.item as any).category === 'STORED' && tx.type === 'IN') {
      if (!pricePerUnit) return res.status(400).json({ error: 'pricePerUnit is required for IN transactions' });
      tx.quantityChange = newQty;
      tx.unitPrice = pricePerUnit;
      tx.transactionAmount = parseFloat((newQty * pricePerUnit).toFixed(4));
      tx.date = newDate;
      await tx.save();
      const affectedDates = await recomputeStockHistory(itemId, wing);
      for (const d of affectedDates) await createOrUpdateBill(d, wing);
      return res.json({ message: 'IN transaction updated. Downstream prices and bills recalculated.', updatedTransaction: tx, affectedDates });
    }

    if ((tx.item as any).category === 'STORED' && tx.type === 'OUT') {
      tx.quantityChange = newQty;
      tx.date = newDate;
      if (meal) tx.meal = meal.toUpperCase() as any;
      await tx.save();
      const affectedDates = await recomputeStockHistory(itemId, wing);
      const uniqueDates = [...new Set([...affectedDates, oldDate.toISOString().split('T')[0], newDate.toISOString().split('T')[0]])];
      for (const d of uniqueDates) await createOrUpdateBill(d, wing);
      return res.json({ message: 'OUT transaction updated. Prices and bills recalculated.', updatedTransaction: tx, affectedDates: uniqueDates });
    }

    if ((tx.item as any).category === 'NON_STORED') {
      if (!pricePerUnit) return res.status(400).json({ error: 'pricePerUnit is required for NON_STORED transactions' });
      tx.quantityChange = newQty;
      tx.unitPrice = pricePerUnit;
      tx.transactionAmount = parseFloat((newQty * pricePerUnit).toFixed(4));
      tx.date = newDate;
      if (meal) tx.meal = meal.toUpperCase() as any;
      await tx.save();
      const datesToRegen = [...new Set([oldDate.toISOString().split('T')[0], newDate.toISOString().split('T')[0]])];
      for (const d of datesToRegen) await createOrUpdateBill(d, wing);
      return res.json({ message: 'NON_STORED transaction updated. Bills recalculated.', updatedTransaction: tx });
    }

    return res.status(400).json({ error: 'Unhandled transaction type or category' });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Error updating stock transaction' });
  }
});

router.delete('/transaction/:id', validateToken, async (req: Request, res: Response) => {
  try {
    const tx = await StockTransaction.findById(req.params.id).populate('item');
    if (!tx) return res.status(404).json({ error: 'Stock transaction not found' });

    const itemId = (tx.item as any)._id;
    const wing = tx.wing;
    const txDateStr = tx.date.toISOString().split('T')[0];

    await StockTransaction.deleteOne({ _id: tx._id });

    let allAffected = [txDateStr];
    if ((tx.item as any).category === 'STORED') {
      const affectedDates = await recomputeStockHistory(itemId, wing);
      allAffected = [...new Set([...allAffected, ...affectedDates])];
    }

    for (const d of allAffected) await createOrUpdateBill(d, wing);

    res.json({ message: 'Transaction deleted. Prices and bills recalculated.', affectedDates: allAffected });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Error deleting stock transaction' });
  }
});

router.post('/transaction/batch', validateToken, validate(batchTransactionSchema), async (req: Request, res: Response) => {
  const { transactions, wing } = req.body;

  try {
    const inTransactions: any[] = [];
    const outTransactions: any[] = [];
    const nonStoredTransactions: any[] = [];
    const storedItemsWithNewIns = new Set<string>();
    let transactionDate: string | null = null;

    transactions.forEach((transaction: any) => {
      if (transaction.type === 'IN') {
        transaction.meal = '-';
        inTransactions.push(transaction);
      } else if (transaction.type === 'OUT' && transaction.category !== 'NON_STORED') {
        outTransactions.push(transaction);
      } else if (transaction.category === 'NON_STORED') {
        nonStoredTransactions.push(transaction);
      }
      if (!transactionDate) transactionDate = transaction.date;
    });

    for (const transaction of inTransactions) {
      const { quantity, price, date, name } = transaction;
      let stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) {
        stockItem = new StockItem({ name, wing, unit: 'KG', category: 'STORED' });
        await stockItem.save();
      }
      const qty = parseFloat(quantity);
      const unitPrice = parseFloat(price);
      let stock = await Stock.findOne({ item: stockItem._id, wing });
      if (!stock) {
        stock = new Stock({ item: stockItem._id, quantity: qty, wing, price: unitPrice });
        await stock.save();
      } else {
        const newAvg = (stock.price * stock.quantity + unitPrice * qty) / (stock.quantity + qty);
        stock.quantity += qty;
        stock.price = newAvg;
        await stock.save();
      }
      await new StockTransaction({
        item: stockItem._id,
        quantityChange: qty,
        type: 'IN',
        date: new Date(date),
        unitPrice,
        transactionAmount: parseFloat((qty * unitPrice).toFixed(4)),
        meal: '-',
        wing,
      }).save();
      storedItemsWithNewIns.add(stockItem._id.toString());
    }

    for (const transaction of outTransactions) {
      const { quantity, date, meal, name } = transaction;
      const stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) throw new Error(`Stock item not found: ${name}`);
      const stock = await Stock.findOne({ item: stockItem._id, wing });
      if (!stock || stock.quantity < parseFloat(quantity)) throw new Error(`Not enough stock for item: ${name}`);
      const qty = parseFloat(quantity);
      const outDate = new Date(date);
      const avgPrice = await computeRunningAvgAtDate(stockItem._id, wing, outDate);
      stock.quantity -= qty;
      await stock.save();
      await new StockTransaction({
        item: stockItem._id,
        quantityChange: qty,
        type: 'OUT',
        category: 'STORED',
        date: outDate,
        unitPrice: avgPrice,
        transactionAmount: parseFloat((qty * avgPrice).toFixed(4)),
        meal,
        wing,
      }).save();
    }

    for (const transaction of nonStoredTransactions) {
      const { quantity, price, date, meal, name } = transaction;
      let stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) {
        stockItem = new StockItem({ name, wing, unit: 'PCS', category: 'NON_STORED' });
        await stockItem.save();
      }
      const qty = parseFloat(quantity);
      const unitPrice = parseFloat(price);
      await new StockTransaction({
        item: stockItem._id,
        quantityChange: qty,
        type: 'OUT',
        category: 'NON_STORED',
        date: new Date(date),
        unitPrice,
        transactionAmount: parseFloat((qty * unitPrice).toFixed(4)),
        meal,
        wing,
      }).save();
    }

    const allAffectedDates = new Set<string>([transactionDate as string]);
    for (const itemIdStr of storedItemsWithNewIns) {
      const affected = await recomputeStockHistory(itemIdStr, wing);
      affected.forEach((d) => allAffectedDates.add(d));
    }

    await Promise.all(Array.from(allAffectedDates).map((d) => createOrUpdateBill(d, wing)));

    res.json({ message: 'All transactions processed successfully' });
  } catch (error) {
    console.error('Error processing transactions:', error);
    res.status(500).json({ error: 'Error processing transactions' });
  }
});

export default router;
