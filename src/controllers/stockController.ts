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

/** Round to 2 decimal places — used for all monetary values, quantities, and prices before DB writes */
const r2 = (v: number): number => Math.round(v * 100) / 100;

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

router.delete('/item/:id/force', validateToken, async (req: Request, res: Response) => {
  try {
    const itemId = req.params.id as string;
    const wing = req.query.wing as string;
    if (!wing) return res.status(400).json({ error: 'wing is required' });

    const item = await StockItem.findById(itemId);
    if (!item) return res.status(404).json({ error: 'Stock item not found' });

    // Collect affected dates before deleting so bills can be recalculated
    const txDocs = await StockTransaction.find({ item: itemId, wing }, { date: 1 }).lean();
    const affectedDates = [...new Set(txDocs.map((t) => (t.date as Date).toISOString().split('T')[0]))];

    await StockTransaction.deleteMany({ item: itemId, wing });
    await Stock.deleteOne({ item: itemId, wing });
    await StockItem.findByIdAndDelete(itemId);

    // Recalculate bills for every date that had transactions for this item
    await Promise.all(affectedDates.map((d) => createOrUpdateBill(d, wing)));

    res.json({ message: `"${item.name}" and all associated transactions deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Error force deleting item' });
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
    const deletedItem = await StockItem.findByIdAndDelete(itemId);
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
      newPricePerUnit = r2(newPrice);
      stock.price = newPricePerUnit;
      stock.quantity = r2(newQuantity);
      updatedStock = await stock.save();
    } else {
      const { price: prevPrice, quantity: prevQuantity } = stock;
      const totalPrice = prevPrice * prevQuantity + newPrice * newQuantity;
      newPricePerUnit = r2(totalPrice / (prevQuantity + newQuantity));
      updatedStock = await Stock.findOneAndUpdate(
        { item: itemId, wing },
        { quantity: r2(prevQuantity + newQuantity), price: newPricePerUnit },
        { new: true }
      );
    }

    const newStockTransaction = new StockTransaction({
      item: itemId,
      quantityChange: r2(newQuantity),
      type: 'IN',
      meal: '-',
      date: new Date(date),
      unitPrice: r2(newPrice),
      transactionAmount: r2(newQuantity * newPrice),
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

    const existingStock = await Stock.findById(stockId);
    if (!existingStock) return res.status(404).json({ error: 'Stock not found' });

    // Prevent setting negative quantity
    if (stockData.quantity !== undefined && stockData.quantity < 0) {
      return res.status(400).json({ error: 'Stock quantity cannot be negative' });
    }

    // Prevent setting negative price
    if (stockData.price !== undefined && stockData.price < 0) {
      return res.status(400).json({ error: 'Stock price cannot be negative' });
    }

    const updatedStock = await Stock.findByIdAndUpdate(stockId, stockData, { new: true });
    res.json(updatedStock);
  } catch (error) {
    res.status(500).json({ error: 'Error updating stock' });
  }
});

router.delete('/:id', validateToken, async (req: Request, res: Response) => {
  try {
    const stockId = req.params.id;
    const existingStock = await Stock.findById(stockId);
    if (!existingStock) return res.status(404).json({ error: 'Stock not found' });

    // Check for associated transactions before deleting
    const hasTransactions = await StockTransaction.findOne({ item: existingStock.item, wing: existingStock.wing });
    if (hasTransactions) {
      return res.status(400).json({ error: 'Cannot delete stock with existing transactions. Delete the transactions first.' });
    }

    await Stock.findByIdAndDelete(stockId);
    res.json({ message: 'Stock deleted successfully' });
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

      outTransaction = new StockTransaction({
        item: (stock.item as any)._id,
        quantityChange: r2(quantityToReduce),
        type: 'OUT',
        category: 'STORED',
        meal: outMeal,
        date: outDate,
        unitPrice: r2(avgPrice),
        transactionAmount: r2(quantityToReduce * avgPrice),
        wing: outWing,
      });
      await outTransaction.save();
      stock.quantity = r2(stock.quantity - quantityToReduce);
      await stock.save();
    } else {
      if (!price) return res.status(400).json({ error: 'price is required for NON_STORED items' });
      const stockItem = await StockItem.findOne({ _id: stockId, wing: outWing });
      if (!stockItem) return res.status(404).json({ error: 'Stock item not found' });
      outTransaction = new StockTransaction({
        item: stockItem._id,
        quantityChange: r2(quantityToReduce),
        type: 'OUT',
        category: 'NON_STORED',
        meal: outMeal,
        date: outDate,
        unitPrice: r2(price),
        transactionAmount: r2(quantityToReduce * price),
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
    const stockTransactions = await StockTransaction.find(query).sort({ createdAt: 1 }).populate('item');
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
      StockTransaction.find(query).populate('item').sort({ createdAt: sortDir }).skip((pageNum - 1) * limitNum).limit(limitNum),
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
      createdAt: t.createdAt.toISOString(),
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

      // Check if reducing IN quantity would make stock go negative
      const qtyDiff = tx.quantityChange - newQty;
      if (qtyDiff > 0) {
        const stock = await Stock.findOne({ item: itemId, wing });
        const available = stock ? stock.quantity : 0;
        if (qtyDiff > available) {
          return res.status(400).json({
            error: `Cannot reduce IN quantity. Current available stock: ${available}, reduction needed: ${qtyDiff}. Reduce OUT transactions first.`,
          });
        }
      }

      tx.quantityChange = r2(newQty);
      tx.unitPrice = r2(pricePerUnit);
      tx.transactionAmount = r2(newQty * pricePerUnit);
      tx.date = newDate;
      await tx.save();
      const affectedDates = await recomputeStockHistory(itemId, wing);
      for (const d of affectedDates) await createOrUpdateBill(d, wing);
      return res.json({ message: 'IN transaction updated. Downstream prices and bills recalculated.', updatedTransaction: tx, affectedDates });
    }

    if ((tx.item as any).category === 'STORED' && tx.type === 'OUT') {
      // Check if increasing quantity would exceed available stock
      const qtyDiff = r2(newQty - tx.quantityChange);
      if (qtyDiff > 0) {
        const stock = await Stock.findOne({ item: itemId, wing });
        const available = stock ? stock.quantity : 0;
        if (qtyDiff > available) {
          return res.status(400).json({
            error: `Insufficient stock. Available: ${available}, additional needed: ${qtyDiff}`,
          });
        }
        // Update stock quantity to reflect the increased OUT
        if (stock) {
          stock.quantity = r2(stock.quantity - qtyDiff);
          await stock.save();
        }
      } else if (qtyDiff < 0) {
        // Decreasing OUT quantity - return stock
        const stock = await Stock.findOne({ item: itemId, wing });
        if (stock) {
          stock.quantity = r2(stock.quantity + Math.abs(qtyDiff));
          await stock.save();
        }
      }

      tx.quantityChange = r2(newQty);
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
      tx.quantityChange = r2(newQty);
      tx.unitPrice = r2(pricePerUnit);
      tx.transactionAmount = r2(newQty * pricePerUnit);
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

    // If deleting a STORED IN transaction, check if stock would go negative
    if ((tx.item as any).category === 'STORED' && tx.type === 'IN') {
      const stock = await Stock.findOne({ item: itemId, wing });
      const available = stock ? stock.quantity : 0;
      if (tx.quantityChange > available) {
        return res.status(400).json({
          error: `Cannot delete this IN transaction. Removing ${tx.quantityChange} would exceed available stock (${available}). Reduce OUT transactions first.`,
        });
      }
    }

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

router.post('/transactions/bulk-delete', validateToken, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const txList = await StockTransaction.find({ _id: { $in: ids } }).populate('item');
    if (txList.length === 0) return res.status(404).json({ error: 'No transactions found' });

    // Group by item+wing to validate stock availability for STORED IN deletions
    const storedInByGroup = new Map<string, { totalQty: number; itemId: any; wing: string }>();
    for (const tx of txList) {
      if ((tx.item as any).category === 'STORED' && tx.type === 'IN') {
        const key = `${(tx.item as any)._id}_${tx.wing}`;
        const existing = storedInByGroup.get(key) || { totalQty: 0, itemId: (tx.item as any)._id, wing: tx.wing };
        existing.totalQty += tx.quantityChange;
        storedInByGroup.set(key, existing);
      }
    }

    for (const [, group] of storedInByGroup) {
      const stock = await Stock.findOne({ item: group.itemId, wing: group.wing });
      const available = stock ? stock.quantity : 0;
      if (group.totalQty > available) {
        const item = await StockItem.findById(group.itemId);
        return res.status(400).json({
          error: `Cannot delete IN transactions for "${item?.name}". Removing ${group.totalQty} would exceed available stock (${available}).`,
        });
      }
    }

    // Collect affected items+wings and date+wing pairs BEFORE deleting
    const affectedGroups = new Map<string, { itemId: any; wing: string }>();
    const affectedDateWings = new Set<string>();

    for (const tx of txList) {
      const itemId = (tx.item as any)._id;
      const key = `${itemId}_${tx.wing}`;
      affectedGroups.set(key, { itemId, wing: tx.wing });
      affectedDateWings.add(`${tx.date.toISOString().split('T')[0]}__${tx.wing}`);
    }

    await StockTransaction.deleteMany({ _id: { $in: ids } });

    // Recompute stock history for each affected item+wing
    for (const [, group] of affectedGroups) {
      const dates = await recomputeStockHistory(group.itemId, group.wing);
      dates.forEach((d) => affectedDateWings.add(`${d}__${group.wing}`));
    }

    // Recalculate bills for each affected date+wing pair
    for (const dateWing of affectedDateWings) {
      const [d, w] = dateWing.split('__');
      try {
        await createOrUpdateBill(d, w);
      } catch {
        // Bill recalculation may fail for dates with no remaining transactions — safe to skip
      }
    }

    res.json({ message: `${txList.length} transactions deleted.`, deletedCount: txList.length });
  } catch (error) {
    console.error('Error bulk deleting transactions:', error);
    res.status(500).json({ error: 'Error bulk deleting transactions' });
  }
});

router.post('/transaction/batch', validateToken, validate(batchTransactionSchema), async (req: Request, res: Response) => {
  const { transactions, wing } = req.body;

  try {
    const inTransactions: any[] = [];
    const outTransactions: any[] = [];
    const nonStoredTransactions: any[] = [];
    const storedItemsToRecompute = new Set<string>();
    // Collect every transaction date upfront so all affected days get bill updates
    const allAffectedDates = new Set<string>();

    transactions.forEach((transaction: any) => {
      if (transaction.type === 'IN') {
        transaction.meal = '-';
        inTransactions.push(transaction);
      } else if (transaction.type === 'OUT' && transaction.category !== 'NON_STORED') {
        outTransactions.push(transaction);
      } else if (transaction.category === 'NON_STORED') {
        nonStoredTransactions.push(transaction);
      }
      if (transaction.date) allAffectedDates.add(transaction.date);
    });

    // Validate all IN transactions have a valid price
    for (const transaction of inTransactions) {
      const price = parseFloat(transaction.price);
      if (!price || isNaN(price) || price <= 0) {
        return res.status(400).json({ error: `Price is required and must be > 0 for IN transaction: ${transaction.name}` });
      }
    }

    // Validate all NON_STORED transactions have a valid price
    for (const transaction of nonStoredTransactions) {
      const price = parseFloat(transaction.price);
      if (!price || isNaN(price) || price <= 0) {
        return res.status(400).json({ error: `Price is required and must be > 0 for non-stock transaction: ${transaction.name}` });
      }
    }

    for (const transaction of inTransactions) {
      const { quantity, price, date, name } = transaction;
      let stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) {
        stockItem = new StockItem({ name, wing, unit: 'KG', category: 'STORED' });
        await stockItem.save();
      }
      const qty = r2(parseFloat(quantity));
      const unitPrice = r2(parseFloat(price));
      let stock = await Stock.findOne({ item: stockItem._id, wing });
      if (!stock) {
        stock = new Stock({ item: stockItem._id, quantity: qty, wing, price: unitPrice });
        await stock.save();
      } else {
        const newAvg = r2((stock.price * stock.quantity + unitPrice * qty) / (stock.quantity + qty));
        stock.quantity = r2(stock.quantity + qty);
        stock.price = newAvg;
        await stock.save();
      }
      await new StockTransaction({
        item: stockItem._id,
        quantityChange: qty,
        type: 'IN',
        date: new Date(date),
        unitPrice,
        transactionAmount: r2(qty * unitPrice),
        meal: '-',
        wing,
      }).save();
      storedItemsToRecompute.add(stockItem._id.toString());
    }

    // Pre-validate all OUT transactions have sufficient stock (accounting for cumulative deductions)
    const outQtyByItem = new Map<string, { total: number; names: string }>();
    for (const transaction of outTransactions) {
      const { quantity, name } = transaction;
      const stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) {
        return res.status(400).json({ error: `Stock item not found: ${name}` });
      }
      const qty = r2(parseFloat(quantity));
      const key = stockItem._id.toString();
      const existing = outQtyByItem.get(key) || { total: 0, names: name };
      existing.total = r2(existing.total + qty);
      outQtyByItem.set(key, existing);
    }

    for (const [itemId, { total, names }] of outQtyByItem) {
      const stock = await Stock.findOne({ item: itemId, wing });
      const available = stock ? stock.quantity : 0;
      if (total > available) {
        return res.status(400).json({
          error: `Insufficient stock for "${names}". Available: ${available}, requested: ${total}`,
        });
      }
    }

    for (const transaction of outTransactions) {
      const { quantity, date, meal, name } = transaction;
      const stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) {
        return res.status(400).json({ error: `Stock item not found: ${name}` });
      }
      const stock = await Stock.findOne({ item: stockItem._id, wing });
      if (!stock) {
        return res.status(400).json({ error: `No stock record for item: ${name}` });
      }
      const qty = r2(parseFloat(quantity));
      const outDate = new Date(date);
      const avgPrice = await computeRunningAvgAtDate(stockItem._id, wing, outDate);
      stock.quantity = r2(stock.quantity - qty);
      await stock.save();
      await new StockTransaction({
        item: stockItem._id,
        quantityChange: qty,
        type: 'OUT',
        category: 'STORED',
        date: outDate,
        unitPrice: r2(avgPrice),
        transactionAmount: r2(qty * avgPrice),
        meal,
        wing,
      }).save();
      storedItemsToRecompute.add(stockItem._id.toString());
    }

    for (const transaction of nonStoredTransactions) {
      const { quantity, price, date, meal, name } = transaction;
      let stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) {
        stockItem = new StockItem({ name, wing, unit: 'PCS', category: 'NON_STORED' });
        await stockItem.save();
      }
      const qty = r2(parseFloat(quantity));
      const unitPrice = r2(parseFloat(price));
      await new StockTransaction({
        item: stockItem._id,
        quantityChange: qty,
        type: 'OUT',
        category: 'NON_STORED',
        date: new Date(date),
        unitPrice,
        transactionAmount: r2(qty * unitPrice),
        meal,
        wing,
      }).save();
    }

    for (const itemIdStr of storedItemsToRecompute) {
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
