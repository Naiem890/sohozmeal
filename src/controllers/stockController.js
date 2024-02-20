const router = require("express").Router();
const { Stock, StockItem, StockTransaction } = require("../models/stock");
const { validateToken } = require("../utils/validateToken");

// Create a new Stock Item
router.post("/item", validateToken, async (req, res) => {
  try {
    if (!req.body?.item) {
      return res
        .status(400)
        .json({ error: "Item data is missing in the request body" });
    }

    const { item: itemData } = req.body;
    const stockItem = new StockItem(itemData);

    // Save the StockItem using a promise
    const savedItem = await stockItem.save();

    res.status(201).json(savedItem);
  } catch (error) {
    if (error.code === 11000) {
      res
        .status(400)
        .json({ error: "Duplicate item name. Name must be unique." });
    } else {
      console.log(error);
      res.status(500).json({ error: "Error creating stock item" });
    }
  }
});

// Get all Stock Items
router.get("/item", validateToken, async (req, res) => {
  try {
    const stockItems = await StockItem.find().sort({ category: -1 });
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
    console.log(itemData);
    const updatedItem = await StockItem.findByIdAndUpdate(itemId, itemData, {
      new: true,
    });

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
    const associatedTransaction = await StockTransaction.findOne({
      item: itemId,
    });

    if (associatedStock || associatedTransaction) {
      return res.status(400).json({
        error:
          "Cannot delete this item because it is associated with a stock or transactions.",
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

// Get all Stocks
router.get("/", validateToken, async (req, res) => {
  try {
    const stocks = await Stock.find().populate("item");
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving stocks" });
  }
});

// Create a new Stock or update an existing one
router.post("/", validateToken, async (req, res) => {
  try {
    if (!req.body?.stock) {
      return res
        .status(400)
        .json({ error: "Stock data is missing in the request body" });
    }

    const stockData = req.body.stock;
    const { item: itemId, date } = stockData;
    delete stockData.date;
    const stock = await Stock.findOne({ item: itemId });

    if (!stock) {
      // If the stock doesn't exist, create a new one with the given data
      const newStock = new Stock(stockData);
      const savedStock = await newStock.save();
      return res.status(201).json(savedStock);
    }

    // Calculate the new price based on the previous price and quantity
    const { price: prevPrice, quantity: prevQuantity } = stock;
    const { quantity: newQuantity, price: newPrice } = stockData;
    const totalPrice = prevPrice * prevQuantity + newPrice * newQuantity;
    const newPricePerUnit = (totalPrice / (prevQuantity + newQuantity)).toFixed(
      2
    );

    // Update the stock with the new quantity and price
    const updatedStock = await Stock.findOneAndUpdate(
      { item: itemId },
      { quantity: prevQuantity + newQuantity, price: newPricePerUnit },
      { new: true }
    );

    // Create a new StockTransaction record for stock in
    const newStockTransaction = new StockTransaction({
      item: itemId,
      quantityChange: newQuantity,
      type: "IN",
      meal: "-", // Set meal type as needed
      date: new Date(date),
      transactionAmount: newQuantity * newPricePerUnit,
    });
    console.log(newStockTransaction, "shovo");
    // Save the newStockTransaction
    await newStockTransaction.save();

    res.json({ updatedStock, newStockTransaction });
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
    const updatedStock = await Stock.findByIdAndUpdate(stockId, stockData, {
      new: true,
    });

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

// Stock Out API
// router.post("/out/:stockId", validateToken, async (req, res) => {
//   try {
//     const stockId = req.params.stockId;
//     const { quantityToReduce, date, meal, category } = req.body;
//     if (isNaN(quantityToReduce) || quantityToReduce <= 0) {
//       return res.status(400).json({ error: "Invalid quantity to reduce" });
//     }
//     if (category === "STORED") {
//       // Validate quantityToReduce
//       // Find the stock item by its reference in the Stock model
//       const stock = await Stock.findById(stockId).populate("item");

//       if (!stock) {
//         return res.status(404).json({ error: "Stock not found" });
//       }

//       const stockItem = stock.item;

//       // Calculate new quantity
//       const currentQuantity = stock.quantity;
//       const newQuantity = currentQuantity - quantityToReduce;

//       if (newQuantity < 0) {
//         return res.status(400).json({ error: "Stock Limit exceeded." });
//       }

//       // Update the stock item's quantity
//       stock.quantity = newQuantity;
//       await stock.save();

//       // Create a new StockTransaction record for stock out
//       const newStockTransaction = new StockTransaction({
//         item: stockItem._id,
//         quantityChange: quantityToReduce,
//         type: "OUT",
//         category: category,
//         meal,
//         date: new Date(date),
//       });
//       console.log("hh");
//       // Calculate the transaction amount for stock out
//       const stockItemPrice = stockItem.price; // Assuming you have a price field in your stock item schema
//       newStockTransaction.transactionAmount = quantityToReduce * stockItemPrice;
//       // console.log(newStockTransaction.transactionAmount, "shohan");
//       // Save the stock transaction
//       await newStockTransaction.save();
//     } else if (category === "NON_STORED") {
//       const stockItem = await StockItem.findById(stockId);
//       if (!stockItem) {
//         return res.status(404).json({ error: "Stock item not found" });
//       }
//       // Create a new StockTransaction record for stock out
//       console.log(req.body, "shohan");
//       const newStockTransaction = new StockTransaction({
//         item: stockItem._id,
//         quantityChange: quantityToReduce,
//         type: "OUT",
//         category: category,
//         meal,
//         date: new Date(date),
//       });
//       const stockItemPrice = req.body.price;
//       newStockTransaction.transactionAmount = quantityToReduce * stockItemPrice;
//       // Save the stock transaction
//       await newStockTransaction.save();
//     } else {
//       res.status(500).json({ error: "Undefined category" });
//     }

//     res.json({ message: "Stock out completed successfully" });
//   } catch (error) {
//     console.error("Error during stock out process:", error);
//     res.status(500).json({ error: "Error during stock out process" });
//   }
// });
// router.post("/out/:stockId", validateToken, async (req, res) => {
//   try {
//     const stockId = req.params.stockId;
//     const { quantityToReduce, date, meal, category } = req.body;

//     // Validate quantityToReduce
//     if (isNaN(quantityToReduce) || quantityToReduce <= 0) {
//       return res.status(400).json({ error: "Invalid quantity to reduce" });
//     }

//     if (category === "STORED") {
//       // Process for stored category
//       await processStoredCategory(stockId, quantityToReduce, date, meal, res);
//     } else if (category === "NON_STORED") {
//       // Process for non-stored category
//       await processNonStoredCategory(
//         stockId,
//         quantityToReduce,
//         date,
//         meal,
//         req.body.price,
//         res
//       );
//     } else {
//       // Unknown category
//       res.status(400).json({ error: "Invalid category" });
//     }
//   } catch (error) {
//     console.error("Error during stock out process:", error);
//     res.status(500).json({ error: "Error during stock out process" });
//   }
// });

// async function processStoredCategory(
//   stockId,
//   quantityToReduce,
//   date,
//   meal,
//   res
// ) {
//   try {
//     // Find the stock item by its reference in the Stock model
//     const stock = await Stock.findById(stockId).populate("item");
//     if (!stock) {
//       return res.status(404).json({ error: "Stock not found" });
//     }

//     const stockItem = stock.item;

//     // Calculate new quantity
//     const currentQuantity = stock.quantity;
//     const newQuantity = currentQuantity - quantityToReduce;

//     if (newQuantity < 0) {
//       return res.status(400).json({ error: "Stock Limit exceeded." });
//     }

//     // Update the stock item's quantity
//     stock.quantity = newQuantity;
//     await stock.save();

//     // Create a new StockTransaction record for stock out
//     const newStockTransaction = new StockTransaction({
//       item: stockItem._id,
//       quantityChange: quantityToReduce,
//       type: "OUT",
//       category: "STORED",
//       meal,
//       date: new Date(date),
//       transactionAmount: quantityToReduce * stock.price,
//     });

//     // Calculate the transaction amount for stock out
//     // newStockTransaction.transactionAmount = quantityToReduce * stockItemPrice;
//     // Save the stock transaction
//     await newStockTransaction.save();
//     res.json({
//       message: "Stock out completed successfully",
//       newStockTransaction,
//     });
//   } catch (error) {
//     throw new Error("Error processing stored category: " + error.message);
//   }
// }

// async function processNonStoredCategory(
//   stockId,
//   quantityToReduce,
//   date,
//   meal,
//   price,
//   res
// ) {
//   try {
//     const stockItem = await StockItem.findById(stockId);
//     if (!stockItem) {
//       return res.status(404).json({ error: "Stock item not found" });
//     }

//     // Create a new StockTransaction record for stock out
//     const newStockTransaction = new StockTransaction({
//       item: stockItem._id,
//       quantityChange: quantityToReduce,
//       type: "OUT",
//       category: "NON_STORED",
//       meal,
//       date: new Date(date),
//       transactionAmount: quantityToReduce * price,
//     });
//     // Save the stock transaction
//     await newStockTransaction.save();

//     res.json({
//       message:  "Stock out completed successfully",
//       newStockTransaction,
//     });
//   } catch (error) {
//     throw new Error("Error processing non-stored category: " + error.message);
//   }
// }

router.post("/out/:stockId", validateToken, async (req, res) => {
  try {
    const stockId = req.params.stockId;
    const { quantityToReduce, date, meal, category } = req.body;

    // Validate quantityToReduce
    if (isNaN(quantityToReduce) || quantityToReduce <= 0) {
      return res.status(400).json({ error: "Invalid quantity to reduce" });
    }

    if (!["STORED", "NON_STORED"].includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    let stockItem;
    let transactionAmount;
    let stockTransactionCategory;
    if (category === "STORED") {
      // Find the stock item by its reference in the Stock model
      const stock = await Stock.findById(stockId).populate("item");
      if (!stock) {
        return res.status(404).json({ error: "Stock not found" });
      }
      stockItem = stock.item;

      // Calculate new quantity
      const currentQuantity = stock.quantity;
      const newQuantity = currentQuantity - quantityToReduce;

      if (newQuantity < 0) {
        return res.status(400).json({ error: "Stock Limit exceeded." });
      }

      // Update the stock item's quantity
      stock.quantity = newQuantity;
      await stock.save();

      // Set transaction amount
      transactionAmount = quantityToReduce * stock.price;
      stockTransactionCategory = "STORED";
    } else if (category === "NON_STORED") {
      stockItem = await StockItem.findById(stockId);
      if (!stockItem) {
        return res.status(404).json({ error: "Stock item not found" });
      }

      // Set transaction amount
      transactionAmount = quantityToReduce * req.body.price;
      stockTransactionCategory = "NON_STORED";
    }

    // Create a new StockTransaction record for stock out
    const newStockTransaction = new StockTransaction({
      item: stockItem._id,
      quantityChange: quantityToReduce,
      type: "OUT",
      category: stockTransactionCategory,
      meal,
      date: new Date(date),
      transactionAmount,
    });

    // Save the stock transaction
    await newStockTransaction.save();

    res.json({
      message: "Stock out completed successfully",
      newStockTransaction,
    });
  } catch (error) {
    console.error("Error during stock out process:", error);
    res.status(500).json({ error: "Error during stock out process" });
  }
});

// Get all Stock Transactions
router.get("/transaction", validateToken, async (req, res) => {
  try {
    const stockTransactions = await StockTransaction.find()
      .sort({ date: -1 })
      .populate("item");
    res.json(stockTransactions);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving stock transactions" });
  }
});

// Update a stock transaction
router.put("/transaction/:id", validateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { quantityChange, date, meal } = req.body;

    if (isNaN(quantityChange)) {
      return res.status(400).json({ error: "Invalid quantity change" });
    }

    // Find the stock transaction by ID
    const stockTransaction = await StockTransaction.findById(transactionId);

    if (!stockTransaction) {
      return res.status(404).json({ error: "Stock transaction not found" });
    }

    // Update the stock transaction fields
    const prevQuantityChange = stockTransaction.quantityChange;
    stockTransaction.quantityChange = parseFloat(quantityChange).toFixed(2);
    if (date) {
      stockTransaction.date = new Date(date);
    }
    if (meal) {
      stockTransaction.meal = meal;
    }

    // Find the associated stock item
    const stockItem = await Stock.findOne({ item: stockTransaction.item });

    let updatedQuantityChange = stockItem.quantity;

    if (stockTransaction.type === "IN") {
      updatedQuantityChange += quantityChange - prevQuantityChange;
    } else {
      updatedQuantityChange += prevQuantityChange - quantityChange;
    }

    if (updatedQuantityChange < 0) {
      return res.status(400).json({ error: "Stock Limit exceeded." });
    }

    stockItem.quantity = updatedQuantityChange;

    // Save the updated stock item
    await stockItem.save();

    // Save the updated stock transaction
    const updatedTransaction = await stockTransaction.save();

    res.json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error: "Error updating stock transaction" });
  }
});

// Delete a stock transaction
router.delete("/transaction/:id", validateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;

    // Find the stock transaction by ID
    const stockTransaction = await StockTransaction.findById(transactionId);

    if (!stockTransaction) {
      return res.status(404).json({ error: "Stock transaction not found" });
    }

    // Find the associated stock item
    const stockItem = await Stock.findOne({ item: stockTransaction.item });

    if (stockTransaction.type === "IN") {
      // If it's a stock-in transaction, update the stock quantity accordingly
      stockItem.quantity -= stockTransaction.quantityChange;
    } else {
      // If it's a stock-out transaction, update the stock quantity
      stockItem.quantity += stockTransaction.quantityChange;
    }

    // Save the updated stock item
    await stockItem.save();

    // Delete the stock transaction
    await StockTransaction.deleteOne({ _id: stockTransaction._id });

    res.json({ message: "Stock transaction deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting stock transaction" });
  }
});

module.exports = router;