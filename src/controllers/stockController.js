const router = require("express").Router();
const { Stock, StockItem, StockTransaction } = require("../models/stock");
const Bill = require("../models/bill");
const { validateToken } = require("../utils/validateToken");
const { createOrUpdateBill } = require("../utils/billService");

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
    const {
      item: itemId,
      date,
      quantity: newQuantity,
      price: newPrice,
    } = stockData;
    delete stockData.date;

    let stock = await Stock.findOne({ item: itemId });
    let newPricePerUnit;
    let updatedStock;

    if (!stock) {
      // If the stock doesn't exist, create a new one
      stock = new Stock(stockData);
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
        { item: itemId },
        { quantity: prevQuantity + newQuantity, price: newPricePerUnit },
        { new: true }
      );
    }

    // Create a new StockTransaction record for the stock in
    const newStockTransaction = new StockTransaction({
      item: itemId,
      quantityChange: newQuantity,
      type: "IN",
      meal: "-", // Set meal type as needed
      date: new Date(date),
      transactionAmount: newQuantity * newPrice,
    });

    // Save the new StockTransaction
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

// Stock Out an item
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

    let bill = await Bill.findOne({ date: new Date(date) });
    if (bill) {
      switch (meal) {
        case "BREAKFAST":
          bill.mealBill.breakfast.totalCost += transactionAmount;
          break;
        case "LUNCH":
          bill.mealBill.lunch.totalCost += transactionAmount;
          break;
        case "DINNER":
          bill.mealBill.dinner.totalCost += transactionAmount;
          break;
      }
    } else {
      bill = await createOrUpdateBill(date);
    }
    bill.save();
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
router.get("/transactions/all", validateToken, async (req, res) => {
  try {
    const stockTransactions = await StockTransaction.find()
      .sort({ date: -1 })
      .populate("item");
    res.json(stockTransactions);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving stock transactions" });
  }
});

// Get stock transactions between two dates
router.get("/transactions", validateToken, async (req, res) => {
  try {
    // Get fromDate and toDate from the query parameters
    const { fromDate, toDate } = req.query;

    // Validate that both dates are provided
    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ error: "fromDate and toDate are required" });
    }

    // Convert fromDate and toDate to JavaScript Date objects
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Query the StockTransaction model for transactions within the date range
    const stockTransactions = await StockTransaction.find({
      date: {
        $gte: from, // Greater than or equal to fromDate
        $lte: to, // Less than or equal to toDate
      },
    })
      .populate("item") // Populate the item details
      .sort({ date: 1 }); // Sort by date in ascending order

    // Format the response to match the required structure
    const formattedTransactions = stockTransactions.map((transaction) => ({
      _id: transaction._id,
      item: {
        _id: transaction.item._id,
        name: transaction.item.name,
        unit: transaction.item.unit,
      },
      quantityChange: transaction.quantityChange,
      date: transaction.date.toISOString(),
      type: transaction.type,
      category: transaction.category,
      meal: transaction.meal,
      price:
        transaction.type === "IN" ? transaction.item.price : transaction.price, // Price based on type
      transactionAmount: transaction.transactionAmount,
    }));

    // Send the formatted transactions as the response
    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error retrieving stock transactions:", error);
    res.status(500).json({ error: "Error retrieving stock transactions" });
  }
});

// Update a stock transaction
// router.put("/transaction/:transactionId", validateToken, async (req, res) => {
//   try {
//     const transactionId = req.params.transactionId;
//     const {
//       quantityChange: newQuantityChange,
//       date,
//       pricePerUnit,
//       meal,
//       type,
//     } = req.body;
//     console.log(
//       transactionId,
//       newQuantityChange,
//       date,
//       pricePerUnit,
//       meal,
//       type,
//       "shovo"
//     );

//     // Validate quantityChange
//     if (isNaN(newQuantityChange) || newQuantityChange <= 0) {
//       return res.status(400).json({ error: "Invalid quantity change" });
//     }

//     // Validate transaction type (IN or OUT)
//     const validTypes = ["IN", "OUT"];
//     if (!validTypes.includes(type)) {
//       return res
//         .status(400)
//         .json({ error: "Invalid transaction type. Must be 'IN' or 'OUT'." });
//     }

//     // Validate meal type for stock-out (optional, as "-" is allowed for stock-in)
//     const validMeals = ["BREAKFAST", "LUNCH", "DINNER", "-"];
//     if (!validMeals.includes(meal)) {
//       return res.status(400).json({ error: "Invalid meal type." });
//     }

//     // Find the stock transaction by its ID
//     const stockTransaction = await StockTransaction.findById(
//       transactionId
//     ).populate("item");
//     if (!stockTransaction) {
//       return res.status(404).json({ error: "Stock transaction not found." });
//     }

//     if (stockTransaction.type !== type) {
//       return res.status(400).json({ error: "Cannot change transaction type." });
//     }

//     const prevQuantityChange = stockTransaction.quantityChange;

//     // Find the associated stock item
//     const stock = await Stock.findOne({ item: stockTransaction.item._id });
//     if (!stock) {
//       return res
//         .status(404)
//         .json({ error: "Stock not found for this transaction." });
//     }

//     // Check if there are any subsequent transactions that were created or modified after this one
//     const subsequentTransactions = await StockTransaction.find({
//       item: stockTransaction.item._id,
//       $or: [
//         { createdAt: { $gt: stockTransaction.createdAt } },
//         { updatedAt: { $gt: stockTransaction.updatedAt } },
//       ],
//     });

//     if (subsequentTransactions.length > 0) {
//       return res.status(400).json({
//         error:
//           "Cannot modify this transaction. There are subsequent transactions. Please delete those first.",
//       });
//     }

//     // Handle Stock-In Transaction (IN)
//     if (type === "IN") {
//       // Adjust stock quantity and value based on the new stock-in quantity
//       const prevTotalQuantity = stock.quantity - prevQuantityChange; // Stock before this transaction
//       const prevTotalValue =
//         stock.quantity * stock.price - stockTransaction.transactionAmount; // Total value before this transaction
//       // Calculate new total value after updating stock-in quantity
//       const newTotalQuantity = prevTotalQuantity + newQuantityChange;
//       const newTotalValue = prevTotalValue + newQuantityChange * pricePerUnit;
//       // Calculate new average price
//       const newAvgPrice = (newTotalValue / newTotalQuantity).toFixed(2);

//       // Update the stock with new quantity and price
//       stock.quantity = newTotalQuantity;
//       stock.price = newAvgPrice;

//       // Save the updated stock
//       await stock.save();

//       // Update the stock transaction
//       stockTransaction.quantityChange = newQuantityChange;
//       stockTransaction.transactionAmount = newQuantityChange * pricePerUnit;
//       stockTransaction.date = new Date(date);
//       await stockTransaction.save();
//     } else if (type === "OUT") {
//       // Handle Stock-Out Transaction (OUT)
//       // Adjust stock quantity based on the difference
//       let newStockQuantity =
//         stock.quantity + prevQuantityChange - newQuantityChange;

//       if (newStockQuantity < 0) {
//         return res
//           .status(400)
//           .json({
//             error:
//               "Stock limit exceeded. Cannot stock out more than available.",
//           });
//       }

//       // Stock price remains the same; adjust only the quantity
//       stock.quantity = newStockQuantity;

//       // Save the updated stock
//       await stock.save();

//       // Update the stock transaction
//       stockTransaction.quantityChange = newQuantityChange;
//       stockTransaction.transactionAmount = newQuantityChange * stock.price; // Transaction amount is based on the current price
//       stockTransaction.meal = meal; // Update the meal if needed
//       stockTransaction.date = new Date(date); // Update the date if necessary
//       await stockTransaction.save();

//       // Optionally, adjust the associated bill if needed for OUT transactions
//       const bill = await Bill.findOne({ date: stockTransaction.date });
//       if (bill) {
//         const prevTransactionAmount = prevQuantityChange * stock.price;
//         const newTransactionAmount = newQuantityChange * stock.price;
//         const costDifference = newTransactionAmount - prevTransactionAmount;

//         // Adjust the bill based on the meal type
//         switch (meal) {
//           case "BREAKFAST":
//             bill.mealBill.breakfast.totalCost += costDifference;
//             break;
//           case "LUNCH":
//             bill.mealBill.lunch.totalCost += costDifference;
//             break;
//           case "DINNER":
//             bill.mealBill.dinner.totalCost += costDifference;
//             break;
//         }

//         await bill.save();
//       }
//     }

//     res.json({
//       message: `Stock ${type.toLowerCase()} transaction updated successfully`,
//       updatedStock: stock,
//       updatedTransaction: stockTransaction,
//     });
//   } catch (error) {
//     console.error("Error updating stock transaction:", error);
//     res.status(500).json({ error: "Error updating stock transaction" });
//   }
// });

router.put("/transaction/:transactionId", validateToken, async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const {
      quantityChange: newQuantityChange,
      date,
      pricePerUnit,
      meal,
      type,
      category,
    } = req.body;

    console.log(newQuantityChange, date, pricePerUnit, meal, type, category, "shovo");
    // Validate quantityChange
    if (isNaN(newQuantityChange) || newQuantityChange <= 0) {
      return res.status(400).json({ error: "Invalid quantity change" });
    }

    // Validate transaction type (IN or OUT)
    const validTypes = ["IN", "OUT"];
    if (!validTypes.includes(type)) {
      return res
        .status(400)
        .json({ error: "Invalid transaction type. Must be 'IN' or 'OUT'." });
    }

    // Validate meal type for stock-out (optional, as "-" is allowed for stock-in)
    const validMeals = ["BREAKFAST", "LUNCH", "DINNER", "-"];
    if (!validMeals.includes(meal)) {
      return res.status(400).json({ error: "Invalid meal type." });
    }

    // Find the stock transaction by its ID
    const stockTransaction = await StockTransaction.findById(transactionId).populate("item");
    if (!stockTransaction) {
      return res.status(404).json({ error: "Stock transaction not found." });
    }

    if (stockTransaction.type !== type) {
      return res.status(400).json({ error: "Cannot change transaction type." });
    }

    const prevQuantityChange = stockTransaction.quantityChange;

    // Handle Stored Items
    if (category === "STORED") {
      // Find the associated stock item
      const stock = await Stock.findOne({ item: stockTransaction.item._id });
      if (!stock) {
        return res.status(404).json({ error: "Stock not found for this transaction." });
      }

      // Check if there are any subsequent transactions that were created or modified after this one
      const subsequentTransactions = await StockTransaction.find({
        item: stockTransaction.item._id,
        $or: [
          { createdAt: { $gt: stockTransaction.createdAt } },
          { updatedAt: { $gt: stockTransaction.updatedAt } },
        ],
      });

      if (subsequentTransactions.length > 0) {
        return res.status(400).json({
          error:
            "Cannot modify this transaction. There are subsequent transactions. Please delete those first.",
        });
      }

      // Handle Stock-In Transaction (IN)
      if (type === "IN") {
        // Adjust stock quantity and value based on the new stock-in quantity
        const prevTotalQuantity = stock.quantity - prevQuantityChange; // Stock before this transaction
        const prevTotalValue =
          stock.quantity * stock.price - stockTransaction.transactionAmount; // Total value before this transaction
        // Calculate new total value after updating stock-in quantity
        const newTotalQuantity = prevTotalQuantity + newQuantityChange;
        const newTotalValue = prevTotalValue + newQuantityChange * pricePerUnit;
        // Calculate new average price
        const newAvgPrice = (newTotalValue / newTotalQuantity).toFixed(2);

        // Update the stock with new quantity and price
        stock.quantity = newTotalQuantity;
        stock.price = newAvgPrice;

        // Save the updated stock
        await stock.save();

        // Update the stock transaction
        stockTransaction.quantityChange = newQuantityChange;
        stockTransaction.transactionAmount = newQuantityChange * pricePerUnit;
        stockTransaction.date = new Date(date);
        await stockTransaction.save();
      } else if (type === "OUT") {
        // Handle Stock-Out Transaction (OUT)
        // Adjust stock quantity based on the difference
        let newStockQuantity =
          stock.quantity + prevQuantityChange - newQuantityChange;

        if (newStockQuantity < 0) {
          return res.status(400).json({
            error: "Stock limit exceeded. Cannot stock out more than available.",
          });
        }

        // Stock price remains the same; adjust only the quantity
        stock.quantity = newStockQuantity;

        // Save the updated stock
        await stock.save();

        // Update the stock transaction
        stockTransaction.quantityChange = newQuantityChange;
        stockTransaction.transactionAmount = newQuantityChange * stock.price; // Transaction amount is based on the current price
        stockTransaction.meal = meal; // Update the meal if needed
        stockTransaction.date = new Date(date); // Update the date if necessary
        await stockTransaction.save();
      }

    } else if (category === "NON_STORED") {
      // Handle Non-Stored Items
      // Just update the quantityChange and pricePerUnit for non-stored items
      stockTransaction.quantityChange = newQuantityChange;
      stockTransaction.transactionAmount = newQuantityChange * pricePerUnit;
      stockTransaction.date = new Date(date);
      await stockTransaction.save();
    }

    // Adjust the bill for OUT transactions
    if (type === "OUT") {
      const bill = await Bill.findOne({ date: stockTransaction.date });
      if (bill) {
        const prevTransactionAmount = prevQuantityChange * pricePerUnit;
        const newTransactionAmount = newQuantityChange * pricePerUnit;
        const costDifference = newTransactionAmount - prevTransactionAmount;

        // Adjust the bill based on the meal type
        switch (meal) {
          case "BREAKFAST":
            bill.mealBill.breakfast.totalCost += costDifference;
            break;
          case "LUNCH":
            bill.mealBill.lunch.totalCost += costDifference;
            break;
          case "DINNER":
            bill.mealBill.dinner.totalCost += costDifference;
            break;
        }

        await bill.save();
      }
    }

    res.json({
      message: `Stock ${type.toLowerCase()} transaction updated successfully`,
      updatedTransaction: stockTransaction,
    });
  } catch (error) {
    console.error("Error updating stock transaction:", error);
    res.status(500).json({ error: "Error updating stock transaction" });
  }
});


// Delete a stock transaction
router.delete("/transaction/:id", validateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;

    // Find the stock transaction by ID
    const stockTransaction = await StockTransaction.findById(
      transactionId
    ).populate("item");
    if (!stockTransaction) {
      return res.status(404).json({ error: "Stock transaction not found" });
    }
    if (stockTransaction.category === "STORED") {
      // Check if this is the last transaction for the stock item
      const lastTransaction = await StockTransaction.findOne({
        item: stockTransaction.item._id,
      }).sort({ date: -1, createdAt: -1 }); // Sort by latest transaction

      if (lastTransaction._id.toString() !== transactionId) {
        return res.status(400).json({
          error:
            "Only the most recent transaction can be deleted. Please delete subsequent transactions first.",
        });
      }

      // Find the associated stock item and adjust its quantity and price
      const stockItem = await Stock.findOne({ item: stockTransaction.item });
      if (!stockItem) {
        return res
          .status(404)
          .json({ error: "Associated stock item not found" });
      }

      if (stockTransaction.type === "IN") {
        // If it's a stock-in transaction, reduce the stock quantity and recalculate the price
        const totalValue = stockItem.quantity * stockItem.price;
        const newTotalValue = totalValue - stockTransaction.transactionAmount;
        const newQuantity =
          stockItem.quantity - stockTransaction.quantityChange;

        if (newQuantity <= 0) {
          stockItem.price = 0;
          stockItem.quantity = 0;
        } else {
          stockItem.price = (newTotalValue / newQuantity).toFixed(2);
          stockItem.quantity = newQuantity;
        }
      } else if (stockTransaction.type === "OUT") {
        // If it's a stock-out transaction, increase the stock quantity
        stockItem.quantity += stockTransaction.quantityChange;
      }

      // Save the updated stock item
      await stockItem.save();
    }

    // Update the associated bill (for OUT transactions)
    const bill = await Bill.findOne({ date: stockTransaction.date });
    if (bill) {
      switch (stockTransaction.meal) {
        case "BREAKFAST":
          bill.mealBill.breakfast.totalCost -=
            stockTransaction.transactionAmount;
          break;
        case "LUNCH":
          bill.mealBill.lunch.totalCost -= stockTransaction.transactionAmount;
          break;
        case "DINNER":
          bill.mealBill.dinner.totalCost -= stockTransaction.transactionAmount;
          break;
      }
      await bill.save();
    }

    // Delete the stock transaction
    await StockTransaction.deleteOne({ _id: stockTransaction._id });

    res.json({ message: "Stock transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting stock transaction:", error);
    res.status(500).json({ error: "Error deleting stock transaction" });
  }
});

module.exports = router;
