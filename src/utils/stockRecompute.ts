import { Stock, StockTransaction } from '../models/stock';
import mongoose from 'mongoose';

const r2 = (v: number): number => Math.round(v * 100) / 100;

export async function computeQuantityAtDate(
  itemId: mongoose.Types.ObjectId | string,
  wing: string,
  asOfDate: Date
): Promise<number> {
  const endOfDay = new Date(asOfDate);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await StockTransaction.aggregate([
    {
      $match: {
        item: new mongoose.Types.ObjectId(itemId.toString()),
        wing,
        type: { $in: ['IN', 'OUT'] },
        date: { $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              { $eq: ['$type', 'IN'] },
              '$quantityChange',
              { $multiply: ['$quantityChange', -1] },
            ],
          },
        },
      },
    },
  ]);

  return result.length > 0 ? r2(result[0].total) : 0;
}

export async function computeRunningAvgAtDate(
  itemId: mongoose.Types.ObjectId | string,
  wing: string,
  asOfDate: Date
): Promise<number> {
  const endOfDay = new Date(asOfDate);
  endOfDay.setHours(23, 59, 59, 999);

  const allTx = await StockTransaction.find({
    item: new mongoose.Types.ObjectId(itemId.toString()),
    wing,
    type: { $in: ['IN', 'OUT'] },
    date: { $lte: endOfDay },
  })
    .sort({ date: 1, createdAt: 1 })
    .lean();

  let poolQty = 0;
  let poolValue = 0;
  let lastAvgPrice = 0;

  for (const tx of allTx) {
    if (tx.type === 'IN') {
      poolQty += tx.quantityChange;
      poolValue += tx.quantityChange * tx.unitPrice;
      lastAvgPrice = poolValue / poolQty;
    } else if (tx.type === 'OUT') {
      // Round intermediate avgPrice to match recomputeStockHistory behaviour
      const avgPrice = poolQty > 0 ? r2(poolValue / poolQty) : r2(lastAvgPrice);
      poolValue -= tx.quantityChange * avgPrice;
      poolQty -= tx.quantityChange;
      if (poolQty <= 0) {
        poolQty = 0;
        poolValue = 0;
      }
    }
  }

  return poolQty > 0 ? r2(poolValue / poolQty) : r2(lastAvgPrice);
}

export async function recomputeStockHistory(
  itemId: mongoose.Types.ObjectId | string,
  wing: string
): Promise<string[]> {
  const allTx = await StockTransaction.find({
    item: itemId,
    wing,
    type: { $in: ['IN', 'OUT'] },
  })
    .sort({ date: 1, createdAt: 1 })
    .lean();

  let poolQty = 0;
  let poolValue = 0;
  let onHand = 0;
  let lastAvgPrice = 0;

  const bulkOps: any[] = [];
  const affectedDates = new Set<string>();

  for (const tx of allTx) {
    if (tx.type === 'IN') {
      poolQty += tx.quantityChange;
      poolValue += tx.quantityChange * tx.unitPrice;
      lastAvgPrice = poolValue / poolQty;
      onHand += tx.quantityChange;
    } else if (tx.type === 'OUT' && tx.category === 'STORED') {
      const avgPrice = poolQty > 0 ? r2(poolValue / poolQty) : r2(lastAvgPrice);
      const newAmount = r2(tx.quantityChange * avgPrice);

      if (Math.abs((tx.transactionAmount || 0) - newAmount) > 0.0001) {
        bulkOps.push({
          updateOne: {
            filter: { _id: tx._id },
            update: { $set: { unitPrice: avgPrice, transactionAmount: newAmount } },
          },
        });
        affectedDates.add((tx.date as Date).toISOString().split('T')[0]);
      }

      // Drain pool by OUT quantity at current avg price
      poolValue -= tx.quantityChange * avgPrice;
      poolQty -= tx.quantityChange;
      if (poolQty <= 0) {
        poolQty = 0;
        poolValue = 0;
      }
      onHand -= tx.quantityChange;
    }
  }

  if (bulkOps.length > 0) {
    await StockTransaction.bulkWrite(bulkOps);
  }

  const currentAvg = poolQty > 0 ? r2(poolValue / poolQty) : r2(lastAvgPrice);
  await Stock.findOneAndUpdate(
    { item: itemId, wing },
    { quantity: r2(Math.max(0, onHand)), price: currentAvg }
  );

  return Array.from(affectedDates);
}
