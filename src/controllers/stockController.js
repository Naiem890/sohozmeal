const router = require("express").Router();
const { Stock, StockItem, StockTransaction } = require("../models/stock");
const { validateToken } = require("../utils/validateToken");
const { createOrUpdateBill } = require("../utils/billService");
const { computeRunningAvgAtDate, recomputeStockHistory } = require("../utils/stockRecompute");

// Create a new Stock Item
router.post("/item", validateToken, async (req, res) => {
  try {
    if (!req.body?.item) {
      return res.status(400).json({ error: "Item data is missing in the request body" });
    }

    const { item: itemData } = req.body;
    const stockItem = new StockItem(itemData);

    // Save the StockItem using a promise
    const savedItem = await stockItem.save();

    res.status(201).json(savedItem);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Duplicate item name. Name must be unique." });
    } else {
      console.log(error);
      res.status(500).json({ error: "Error creating stock item" });
    }
  }
});

// Get all Stock Items (add wing filter)
router.get("/item", validateToken, async (req, res) => {
  const { wing } = req.query; // Get the wing from query parameters
  try {
    // Filter by wing if provided
    const query = wing ? { wing } : {};
    const stockItems = await StockItem.find(query).sort({ category: -1 });
    const unitEnum = StockItem.schema.path("unit").enumValues;
    const categoryEnum = StockItem.schema.path("category").enumValues;
    res.json({ stockItems, units: unitEnum, categories: categoryEnum });
  } catch (error) {
    res.status(500).json({ error: "Error retrieving stock items" });
  }
});

// Update a Stock Item
router.put("/item/:id", validateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    const { item: itemData } = req.body;
    const updatedItem = await StockItem.findByIdAndUpdate(itemId, itemData, { new: true });

    if (!updatedItem) {
      return res.status(404).json({ error: "Stock item not found" });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: "Error updating stock item" });
  }
});

// Delete a Stock Item
router.delete("/item/:id", validateToken, async (req, res) => {
  try {
    const itemId = req.params.id;

    // Check if any stock is associated with the item
    const associatedStock = await Stock.findOne({ item: itemId });
    // Check if any previous transaction is listed for this item or not
    const associatedTransaction = await StockTransaction.findOne({ item: itemId });

    if (associatedStock || associatedTransaction) {
      return res.status(400).json({
        error: "Cannot delete this item because it is associated with a stock or transactions.",
      });
    }

    const deletedItem = await StockItem.findByIdAndRemove(itemId);

    if (!deletedItem) {
      return res.status(404).json({ error: "Stock item not found" });
    }

    // write a success message to the response
    res.json({ message: "Stock item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting stock item" });
  }
});

// Get all Stocks (add wing filter)
router.get("/", validateToken, async (req, res) => {
  const { wing } = req.query; // Get the wing from query parameters
  try {
    // Filter by wing if provided
    const query = wing ? { wing } : {};
    const stocks = await Stock.find(query).populate("item");
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving stocks" });
  }
});

// Create a new Stock or update an existing one
router.post("/", validateToken, async (req, res) => {
  try {
    if (!req.body?.stock) {
      return res.status(400).json({ error: "Stock data is missing in the request body" });
    }

    const stockData = req.body.stock;
    const { item: itemId, date, quantity: newQuantity, price: newPrice, wing } = stockData; // Include wing
    delete stockData.date;

    let stock = await Stock.findOne({ item: itemId, wing }); // Filter by item and wing
    let newPricePerUnit;
    let updatedStock;

    if (!stock) {
      // If the stock doesn't exist, create a new one
      stock = new Stock({ ...stockData, wing }); // Set wing
      newPricePerUnit = newPrice; // As this is the first entry, the unit price is the provided price
      stock.price = newPricePerUnit;
      stock.quantity = newQuantity;
      updatedStock = await stock.save();
    } else {
      // If the stock exists, calculate the new price and quantity
      const { price: prevPrice, quantity: prevQuantity } = stock;
      const totalPrice = prevPrice * prevQuantity + newPrice * newQuantity;
      newPricePerUnit = (totalPrice / (prevQuantity + newQuantity)).toFixed(2);

      // Update the stock with the new quantity and price
      updatedStock = await Stock.findOneAndUpdate(
        { item: itemId, wing }, // Filter by wing
        { quantity: prevQuantity + newQuantity, price: newPricePerUnit },
        { new: true }
      );
    }

    // Create a new StockTransaction record for the stock in
    const newStockTransaction = new StockTransaction({
      item: itemId,
      quantityChange: newQuantity,
      type: "IN",
      meal: "-",
      date: new Date(date),
      unitPrice: newPrice,
      transactionAmount: newQuantity * newPrice,
      wing,
    });

    await newStockTransaction.save();

    // Recompute the full history so any existing OUT transactions recorded
    // after this IN's date get their prices corrected automatically.
    const affectedDates = await recomputeStockHistory(itemId, wing);
    await Promise.all(affectedDates.map((d) => createOrUpdateBill(d, wing)));

    // Re-read the stock snapshot that recomputeStockHistory just corrected
    updatedStock = await Stock.findOne({ item: itemId, wing });

    res.json({ updatedStock, newStockTransaction, affectedDates });
  } catch (error) {
    console.log("error =>", error);
    res.status(500).json({ error: "Error creating/updating stock" });
  }
});

// Update a Stock
router.put("/:id", validateToken, async (req, res) => {
  try {
    const stockId = req.params.id;
    const stockData = req.body;
    const updatedStock = await Stock.findByIdAndUpdate(stockId, stockData, { new: true });

    if (!updatedStock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json(updatedStock);
  } catch (error) {
    res.status(500).json({ error: "Error updating stock" });
  }
});

// Delete a Stock
router.delete("/:id", validateToken, async (req, res) => {
  try {
    const stockId = req.params.id;
    const deletedStock = await Stock.findByIdAndRemove(stockId);

    if (!deletedStock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json(deletedStock);
  } catch (error) {
    res.status(500).json({ error: "Error deleting stock" });
  }
});

// ---------------------------------------------------------------------------
// POST /out/:stockId  — record stock consumption for a meal
// ---------------------------------------------------------------------------
// For STORED items   : stockId = Stock._id
// For NON_STORED items: stockId = StockItem._id
//
// Key change: STORED OUT price is derived fresh via computeRunningAvgAtDate()
// instead of reading from Stock.price (which was a stale aggregate).
// This means rollbacks are automatically correct — just edit the IN and the
// next OUT recorded after that will already use the corrected average.
// ---------------------------------------------------------------------------
router.post("/out/:stockId", validateToken, async (req, res) => {
  try {
    const { stockId } = req.params;
    const { quantityToReduce, date, meal, category, wing, price } = req.body;

    if (isNaN(quantityToReduce) || quantityToReduce <= 0) {
      return res.status(400).json({ error: "Invalid quantity to reduce" });
    }
    if (!["STORED", "NON_STORED"].includes(category)) {
      return res.status(400).json({ error: "Invalid category. Must be STORED or NON_STORED" });
    }
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }
    if (!meal || !["BREAKFAST", "LUNCH", "DINNER"].includes(meal.toUpperCase())) {
      return res.status(400).json({ error: "Invalid meal. Must be BREAKFAST, LUNCH, or DINNER" });
    }

    const outDate  = new Date(date);
    const outWing  = wing.toUpperCase();
    const outMeal  = meal.toUpperCase();
    let outTransaction;

    // -----------------------------------------------------------------------
    // STORED item
    // -----------------------------------------------------------------------
    if (category === "STORED") {
      const stock = await Stock.findOne({ _id: stockId, wing: outWing }).populate("item");
      if (!stock) {
        return res.status(404).json({ error: "Stock not found" });
      }
      if (stock.quantity < quantityToReduce) {
        return res.status(400).json({
          error: `Insufficient stock. Available: ${stock.quantity}, requested: ${quantityToReduce}`,
        });
      }

      // Compute the weighted average from IN/LEFT_OVER history — not from Stock.price
      const avgPrice        = await computeRunningAvgAtDate(stock.item._id, outWing, outDate);
      const transactionAmt  = parseFloat((quantityToReduce * avgPrice).toFixed(4));

      outTransaction = new StockTransaction({
        item:              stock.item._id,
        quantityChange:    quantityToReduce,
        type:              "OUT",
        category:          "STORED",
        meal:              outMeal,
        date:              outDate,
        unitPrice:         avgPrice,
        transactionAmount: transactionAmt,
        wing:              outWing,
      });
      await outTransaction.save();

      // Reduce stock on hand
      stock.quantity = stock.quantity - quantityToReduce;
      await stock.save();

    // -----------------------------------------------------------------------
    // NON_STORED item  (admin always provides the exact unit price)
    // -----------------------------------------------------------------------
    } else {
      if (!price || isNaN(price) || price <= 0) {
        return res.status(400).json({ error: "price is required for NON_STORED items" });
      }

      const stockItem = await StockItem.findOne({ _id: stockId, wing: outWing });
      if (!stockItem) {
        return res.status(404).json({ error: "Stock item not found" });
      }

      const transactionAmt = parseFloat((quantityToReduce * price).toFixed(4));

      outTransaction = new StockTransaction({
        item:              stockItem._id,
        quantityChange:    quantityToReduce,
        type:              "OUT",
        category:          "NON_STORED",
        meal:              outMeal,
        date:              outDate,
        unitPrice:         price,
        transactionAmount: transactionAmt,
        wing:              outWing,
      });
      await outTransaction.save();
    }

    // Rebuild the daily Cost document so the bill reflects this OUT immediately
    const updatedBill = await createOrUpdateBill(date, outWing);

    res.json({
      message:          "Stock out recorded successfully",
      outTransaction,
      updatedBill,
    });
  } catch (error) {
    console.error("Error during stock out:", error);
    res.status(500).json({ error: "Error during stock out process" });
  }
});

// Get all Stock Transactions (added wing filter)
router.get("/transactions/all", validateToken, async (req, res) => {
  const { wing } = req.query; // Get wing from query parameters
  try {
    // Filter by wing if provided
    const query = wing ? { wing } : {};
    const stockTransactions = await StockTransaction.find(query).sort({ date: -1 }).populate("item");
    res.json(stockTransactions);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving stock transactions" });
  }
});
// Get stock transactions between two dates (paginated)
router.get("/transactions", validateToken, async (req, res) => {
  try {
    const { fromDate, toDate, wing, type, meal, sortOrder = "ASC", page = 1, limit = 20 } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "fromDate and toDate are required" });
    }

    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 20));

    const query = {
      date: { $gte: new Date(fromDate), $lte: new Date(toDate) },
    };
    if (wing)                    query.wing = wing;
    if (type && type !== "BOTH") query.type = type;
    if (meal && meal !== "ALL")  query.meal = meal;

    const sortDir = sortOrder === "ASC" ? 1 : -1;

    const [stockTransactions, total] = await Promise.all([
      StockTransaction.find(query)
        .populate("item")
        .sort({ date: sortDir })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      StockTransaction.countDocuments(query),
    ]);

    const transactions = stockTransactions.map((t) => ({
      _id:               t._id,
      item:              { _id: t.item._id, name: t.item.name, unit: t.item.unit, category: t.item.category },
      quantityChange:    t.quantityChange,
      date:              t.date.toISOString(),
      type:              t.type,
      category:          t.item.category,
      meal:              t.meal,
      wing:              t.wing,
      transactionAmount: t.transactionAmount,
      createdAt:         t.createdAt,
    }));

    res.json({
      transactions,
      pagination: {
        page:       pageNum,
        limit:      limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error retrieving stock transactions:", error);
    res.status(500).json({ error: "Error retrieving stock transactions" });
  }
});


// ---------------------------------------------------------------------------
// PUT /transaction/:transactionId  — edit any transaction
// ---------------------------------------------------------------------------
// After updating the raw record, recomputeStockHistory() replays ALL IN and
// OUT transactions from the beginning of time, correcting every STORED OUT
// amount and syncing Stock.quantity/price. Cost documents are then
// regenerated for every date whose total changed.
// ---------------------------------------------------------------------------
router.put("/transaction/:transactionId", validateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { quantityChange: newQty, pricePerUnit, date, meal } = req.body;

    if (isNaN(newQty) || newQty <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const tx = await StockTransaction.findById(transactionId).populate("item");
    if (!tx) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const itemId  = tx.item._id;
    const wing    = tx.wing;
    const oldDate = tx.date;
    const newDate = date ? new Date(date) : tx.date;

    // -----------------------------------------------------------------------
    // STORED IN  — admin corrects quantity or unit price
    // -----------------------------------------------------------------------
    if (tx.item.category === "STORED" && tx.type === "IN") {
      if (!pricePerUnit || isNaN(pricePerUnit) || pricePerUnit <= 0) {
        return res.status(400).json({ error: "pricePerUnit is required for IN transactions" });
      }

      tx.quantityChange    = newQty;
      tx.unitPrice         = pricePerUnit;
      tx.transactionAmount = parseFloat((newQty * pricePerUnit).toFixed(4));
      tx.date              = newDate;
      await tx.save();

      const affectedDates = await recomputeStockHistory(itemId, wing);

      for (const d of affectedDates) {
        await createOrUpdateBill(d, wing);
      }

      return res.json({
        message: "IN transaction updated. Downstream prices and bills recalculated.",
        updatedTransaction: tx,
        affectedDates,
      });
    }

    // -----------------------------------------------------------------------
    // STORED OUT  — admin corrects quantity or date/meal
    // (unit price for STORED OUTs is always computed, never manually entered)
    // -----------------------------------------------------------------------
    if (tx.item.category === "STORED" && tx.type === "OUT") {
      tx.quantityChange = newQty;
      tx.date           = newDate;
      if (meal) tx.meal = meal.toUpperCase();
      await tx.save();

      const affectedDates = await recomputeStockHistory(itemId, wing);

      // Always include old and new date so bill totals are refreshed even if
      // transactionAmount didn't change (meal count may have shifted)
      const uniqueDates = [...new Set([
        ...affectedDates,
        oldDate.toISOString().split("T")[0],
        newDate.toISOString().split("T")[0],
      ])];
      for (const d of uniqueDates) {
        await createOrUpdateBill(d, wing);
      }

      return res.json({
        message: "OUT transaction updated. Prices and bills recalculated.",
        updatedTransaction: tx,
        affectedDates: uniqueDates,
      });
    }

    // -----------------------------------------------------------------------
    // NON_STORED OUT  — admin provides unit price directly
    // -----------------------------------------------------------------------
    if (tx.item.category === "NON_STORED") {
      if (!pricePerUnit || isNaN(pricePerUnit) || pricePerUnit <= 0) {
        return res.status(400).json({ error: "pricePerUnit is required for NON_STORED transactions" });
      }

      tx.quantityChange    = newQty;
      tx.unitPrice         = pricePerUnit;
      tx.transactionAmount = parseFloat((newQty * pricePerUnit).toFixed(4));
      tx.date              = newDate;
      if (meal) tx.meal    = meal.toUpperCase();
      await tx.save();

      const datesToRegen = [...new Set([
        oldDate.toISOString().split("T")[0],
        newDate.toISOString().split("T")[0],
      ])];
      for (const d of datesToRegen) {
        await createOrUpdateBill(d, wing);
      }

      return res.json({
        message: "NON_STORED transaction updated. Bills recalculated.",
        updatedTransaction: tx,
      });
    }

    return res.status(400).json({ error: "Unhandled transaction type or category" });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ error: "Error updating stock transaction" });
  }
});




// ---------------------------------------------------------------------------
// DELETE /transaction/:id
// ---------------------------------------------------------------------------
// Deletes the transaction then runs recomputeStockHistory so all downstream
// OUT amounts and bills are automatically corrected.
// ---------------------------------------------------------------------------
router.delete("/transaction/:id", validateToken, async (req, res) => {
  try {
    const tx = await StockTransaction.findById(req.params.id).populate("item");
    if (!tx) {
      return res.status(404).json({ error: "Stock transaction not found" });
    }

    const itemId    = tx.item._id;
    const wing      = tx.wing;
    const txDateStr = tx.date.toISOString().split("T")[0];

    await StockTransaction.deleteOne({ _id: tx._id });

    let allAffected = [txDateStr];

    if (tx.item.category === "STORED") {
      const affectedDates = await recomputeStockHistory(itemId, wing);
      allAffected = [...new Set([...allAffected, ...affectedDates])];
    }

    for (const d of allAffected) {
      await createOrUpdateBill(d, wing);
    }

    res.json({
      message: "Transaction deleted. Prices and bills recalculated.",
      affectedDates: allAffected,
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ error: "Error deleting stock transaction" });
  }
});

// ---------------------------------------------------------------------------
// POST /transaction/batch  — bulk-record a day's worth of IN/OUT transactions
// ---------------------------------------------------------------------------
router.post("/transaction/batch", validateToken, async (req, res) => {
  const { transactions, wing } = req.body;

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: "Transactions are missing or invalid" });
  }

  try {
    const inTransactions        = [];
    const outTransactions       = [];
    const nonStoredTransactions = [];
    const storedItemsWithNewIns = new Set(); // track items needing recompute
    let transactionDate = null;

    transactions.forEach((transaction) => {
      if (transaction.type === "IN") {
        transaction.meal = "-";
        inTransactions.push(transaction);
      } else if (transaction.type === "OUT" && transaction.category !== "NON_STORED") {
        outTransactions.push(transaction);
      } else if (transaction.category === "NON_STORED") {
        nonStoredTransactions.push(transaction);
      }
      if (!transactionDate) transactionDate = transaction.date;
    });

    // Step 1: Process IN transactions first (so their amounts are available for avg calc)
    for (const transaction of inTransactions) {
      const { quantity, price, date, name } = transaction;

      let stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) {
        stockItem = new StockItem({ name, wing, unit: "KG", category: "STORED" });
        await stockItem.save();
      }

      const qty       = parseFloat(quantity);
      const unitPrice = parseFloat(price);

      let stock = await Stock.findOne({ item: stockItem._id, wing });
      if (!stock) {
        stock = new Stock({ item: stockItem._id, quantity: qty, wing, price: unitPrice });
        await stock.save();
      } else {
        const newAvg = (stock.price * stock.quantity + unitPrice * qty) / (stock.quantity + qty);
        stock.quantity += qty;
        stock.price     = newAvg;
        await stock.save();
      }

      await new StockTransaction({
        item:              stockItem._id,
        quantityChange:    qty,
        type:              "IN",
        date:              new Date(date),
        unitPrice,
        transactionAmount: parseFloat((qty * unitPrice).toFixed(4)),
        meal:              "-",
        wing,
      }).save();

      storedItemsWithNewIns.add(stockItem._id.toString());
    }

    // Step 2: Process STORED OUT transactions using running avg
    for (const transaction of outTransactions) {
      const { quantity, date, meal, name } = transaction;

      const stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) throw new Error(`Stock item not found: ${name}`);

      const stock = await Stock.findOne({ item: stockItem._id, wing });
      if (!stock || stock.quantity < parseFloat(quantity)) {
        throw new Error(`Not enough stock for item: ${name}`);
      }

      const qty      = parseFloat(quantity);
      const outDate  = new Date(date);
      const avgPrice = await computeRunningAvgAtDate(stockItem._id, wing, outDate);

      stock.quantity -= qty;
      await stock.save();

      await new StockTransaction({
        item:              stockItem._id,
        quantityChange:    qty,
        type:              "OUT",
        category:          "STORED",
        date:              outDate,
        unitPrice:         avgPrice,
        transactionAmount: parseFloat((qty * avgPrice).toFixed(4)),
        meal,
        wing,
      }).save();
    }

    // Step 3: Process NON_STORED transactions (price always provided by admin)
    for (const transaction of nonStoredTransactions) {
      const { quantity, price, date, meal, name } = transaction;

      let stockItem = await StockItem.findOne({ name, wing });
      if (!stockItem) {
        stockItem = new StockItem({ name, wing, unit: "PCS", category: "NON_STORED" });
        await stockItem.save();
      }

      const qty       = parseFloat(quantity);
      const unitPrice = parseFloat(price);

      await new StockTransaction({
        item:              stockItem._id,
        quantityChange:    qty,
        type:              "OUT",
        category:          "NON_STORED",
        date:              new Date(date),
        unitPrice,
        transactionAmount: parseFloat((qty * unitPrice).toFixed(4)),
        meal,
        wing,
      }).save();
    }

    // Recompute history for every STORED item that received a new IN,
    // correcting any existing OUTs whose prices may have shifted.
    const allAffectedDates = new Set([transactionDate]);
    for (const itemIdStr of storedItemsWithNewIns) {
      const affected = await recomputeStockHistory(itemIdStr, wing);
      affected.forEach((d) => allAffectedDates.add(d));
    }

    // Rebuild bills for every affected date
    await Promise.all(Array.from(allAffectedDates).map((d) => createOrUpdateBill(d, wing)));

    res.json({
      message: "All transactions processed successfully",
    });
  } catch (error) {
    console.error("Error processing transactions:", error);
    res.status(500).json({ error: "Error processing transactions" });
  }
});

module.exports = router;
