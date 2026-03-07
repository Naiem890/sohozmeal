const { Stock, StockTransaction } = require("../models/stock");
const mongoose = require("mongoose");

const r2 = (v) => Math.round(v * 100) / 100;
const r4 = (v) => Math.round(v * 10000) / 10000;

// ---------------------------------------------------------------------------
// computeRunningAvgAtDate(itemId, wing, asOfDate)
// ---------------------------------------------------------------------------
// Returns the perpetual weighted-average unit price for a STORED item as of
// a specific date, derived from ALL IN transactions up to that date:
//
//   avgPrice = Σ IN.transactionAmount / Σ IN.quantityChange
//
// No period anchors or LEFT_OVER lookups needed — the full IN history is
// always the source of truth.
// ---------------------------------------------------------------------------
async function computeRunningAvgAtDate(itemId, wing, asOfDate) {
  const endOfDay = new Date(asOfDate);
  endOfDay.setHours(23, 59, 59, 999);

  const [agg] = await StockTransaction.aggregate([
    {
      $match: {
        item: new mongoose.Types.ObjectId(itemId.toString()),
        wing,
        type: "IN",
        date: { $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        totalQty:   { $sum: "$quantityChange" },
        totalValue: { $sum: "$transactionAmount" },
      },
    },
  ]);

  return agg && agg.totalQty > 0 ? r4(agg.totalValue / agg.totalQty) : 0;
}

// ---------------------------------------------------------------------------
// recomputeStockHistory(itemId, wing)
// ---------------------------------------------------------------------------
// Replays every IN and OUT transaction for the item/wing from the beginning
// of time, correcting:
//   - unitPrice and transactionAmount on every STORED OUT transaction
//   - Stock.quantity and Stock.price to the current accurate state
//
// Returns an array of date strings (YYYY-MM-DD) where OUT amounts changed,
// so the caller can regenerate Cost documents for those days.
//
// Called automatically after any edit or delete of a STORED transaction.
// ---------------------------------------------------------------------------
async function recomputeStockHistory(itemId, wing) {
  const allTx = await StockTransaction.find({
    item: itemId,
    wing,
    type: { $in: ["IN", "OUT"] },
  })
    .sort({ date: 1, createdAt: 1 })
    .lean();

  let poolQty   = 0; // cumulative quantity from all INs
  let poolValue = 0; // cumulative value from all INs
  let onHand    = 0; // actual stock on hand (INs minus OUTs)

  const bulkOps       = [];
  const affectedDates = new Set();

  for (const tx of allTx) {
    if (tx.type === "IN") {
      poolQty   += tx.quantityChange;
      poolValue += tx.transactionAmount;
      onHand    += tx.quantityChange;

    } else if (tx.type === "OUT" && tx.category === "STORED") {
      const avgPrice  = poolQty > 0 ? r4(poolValue / poolQty) : 0;
      const newAmount = r2(tx.quantityChange * avgPrice);

      if (Math.abs((tx.transactionAmount || 0) - newAmount) > 0.0001) {
        bulkOps.push({
          updateOne: {
            filter: { _id: tx._id },
            update: { $set: { unitPrice: avgPrice, transactionAmount: newAmount } },
          },
        });
        affectedDates.add(tx.date.toISOString().split("T")[0]);
      }
      onHand -= tx.quantityChange;
    }
    // NON_STORED OUTs: prices are explicitly set by admin, never recomputed
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

module.exports = { computeRunningAvgAtDate, recomputeStockHistory };
