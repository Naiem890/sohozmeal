import { Stock, StockTransaction } from '../models/stock';
import mongoose from 'mongoose';

const r2 = (v: number): number => Math.round(v * 100) / 100;
const r4 = (v: number): number => Math.round(v * 10000) / 10000;

export async function computeRunningAvgAtDate(
  itemId: mongoose.Types.ObjectId | string,
  wing: string,
  asOfDate: Date
): Promise<number> {
  const endOfDay = new Date(asOfDate);
  endOfDay.setHours(23, 59, 59, 999);

  const [agg] = await StockTransaction.aggregate([
    {
      $match: {
        item: new mongoose.Types.ObjectId(itemId.toString()),
        wing,
        type: 'IN',
        date: { $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        totalQty: { $sum: '$quantityChange' },
        totalValue: { $sum: '$transactionAmount' },
      },
    },
  ]);

  return agg && agg.totalQty > 0 ? r4(agg.totalValue / agg.totalQty) : 0;
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

  const bulkOps: any[] = [];
  const affectedDates = new Set<string>();

  for (const tx of allTx) {
    if (tx.type === 'IN') {
      poolQty += tx.quantityChange;
      poolValue += tx.transactionAmount;
      onHand += tx.quantityChange;
    } else if (tx.type === 'OUT' && tx.category === 'STORED') {
      const avgPrice = poolQty > 0 ? r4(poolValue / poolQty) : 0;
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
      onHand -= tx.quantityChange;
    }
  }

  if (bulkOps.length > 0) {
    await StockTransaction.bulkWrite(bulkOps);
  }

  const currentAvg = poolQty > 0 ? r4(poolValue / poolQty) : 0;
  await Stock.findOneAndUpdate(
    { item: itemId, wing },
    { quantity: Math.max(0, onHand), price: currentAvg }
  );

  return Array.from(affectedDates);
}
