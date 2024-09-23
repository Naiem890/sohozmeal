const router = require("express").Router();
const { Stock, StockItem, StockTransaction } = require("../models/stock");
const HallFeast = require("../models/hallFeast");
const Student = require("../models/student");
const { validateToken } = require("../utils/validateToken");
const { createOrUpdateBill } = require("../utils/billService");
const Cost = require("../models/cost");
const { default: mongoose } = require("mongoose");

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
      meal: "-", // Set meal type as needed
      date: new Date(date),
      transactionAmount: newQuantity * newPrice,
      wing, // Set wing for the transaction
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

// Stock Out an item (added wing handling)
router.post("/out/:stockId", validateToken, async (req, res) => {
  try {
    const stockId = req.params.stockId;
    const { quantityToReduce, date, meal, category, wing } = req.body; // Include wing in the request body

    // Validate quantityToReduce
    if (isNaN(quantityToReduce) || quantityToReduce <= 0) {
      return res.status(400).json({ error: "Invalid quantity to reduce" });
    }

    // Validate category
    if (!["STORED", "NON_STORED"].includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    // Validate wing
    if (!wing || !["MALE", "FEMALE"].includes(wing.toUpperCase())) {
      return res.status(400).json({ error: "Invalid or missing wing parameter" });
    }

    let stockItem;
    let transactionAmount;
    let stockTransactionCategory;

    // STORED category: Find stock item, calculate new quantity, and set transaction amount
    if (category === "STORED") {
      const stock = await Stock.findOne({ _id: stockId, wing: wing.toUpperCase() }).populate("item"); // Filter by wing
      if (!stock) {
        return res.status(404).json({ error: "Stock not found" });
      }
      stockItem = stock.item;

      const currentQuantity = stock.quantity;
      const newQuantity = currentQuantity - quantityToReduce;

      if (newQuantity < 0) {
        return res.status(400).json({ error: "Stock limit exceeded" });
      }

      stock.quantity = newQuantity;
      await stock.save();

      transactionAmount = quantityToReduce * stock.price;
      stockTransactionCategory = "STORED";
    }

    // NON_STORED category: Find stock item and calculate transaction amount based on price provided
    else if (category === "NON_STORED") {
      stockItem = await StockItem.findOne({ _id: stockId, wing: wing.toUpperCase() }); // Filter by wing
      if (!stockItem) {
        return res.status(404).json({ error: "Stock item not found" });
      }

      transactionAmount = quantityToReduce * req.body.price;
      stockTransactionCategory = "NON_STORED";
    }

    // Step 1: Check if a hall feast exists for the given date and meal
    const hallFeast = await HallFeast.findOne({ date: new Date(date), meal });

    // Step 2: Calculate student count
    let studentCount;
    if (hallFeast) {
      // If hall feast exists, count all students of the specific wing
      studentCount = await Student.countDocuments({ wing: wing.toUpperCase() });
    } else {
      // If no hall feast exists, count only students of the specific wing with their meal turned on for the specified meal
      studentCount = await Student.countDocuments({ [`meal.${meal}`]: true, wing: wing.toUpperCase() });
    }

    if (studentCount === 0) {
      return res.status(400).json({ error: "No students found for the meal." });
    }

    // Step 3: Calculate total transaction amount based on student count
    const totalTransactionAmount = transactionAmount;

    // Step 4: Create a new StockTransaction record for stock out
    const newStockTransaction = new StockTransaction({
      item: stockItem._id,
      quantityChange: quantityToReduce,
      type: "OUT",
      category: stockTransactionCategory,
      meal,
      date: new Date(date),
      transactionAmount: totalTransactionAmount, // Total cost for all students
      wing: wing.toUpperCase(), // Set wing for the transaction
    });

    // Save the stock transaction
    await newStockTransaction.save();

    // Step 5: Update or create a bill for the date and meal
    try {
      const updatedBill = await createOrUpdateBill(date, wing.toUpperCase());
      console.log(updatedBill,'sai sia');
      res.json({
        message: "Stock out completed successfully",
        newStockTransaction,
        studentCount,
        totalTransactionAmount,
        updatedBill,
      });
    } catch (error) {
      console.error("Error updating the bill:", error);
      return res.status(500).json({ error: "Failed to update bill." });
    }
  } catch (error) {
    console.error("Error during stock out process:", error);
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
// Get stock transactions between two dates
router.get("/transactions", validateToken, async (req, res) => {
  try {
    // Get fromDate, toDate, and wing from the query parameters
    const { fromDate, toDate, wing } = req.query;

    // Validate that both dates are provided
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: "fromDate and toDate are required" });
    }

    // Convert fromDate and toDate to JavaScript Date objects
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Build the query, including wing if provided
    const query = {
      date: {
        $gte: from, // Greater than or equal to fromDate
        $lte: to,   // Less than or equal to toDate
      },
    };

    if (wing) {
      query.wing = wing; // Add wing filter if provided
    }

    // Query the StockTransaction model for transactions within the date range
    const stockTransactions = await StockTransaction.find(query)
      .populate("item") // Populate the item details
      .sort({ date: 1 }); // Sort by date in ascending order

    // Format the response to match the required structure
    const formattedTransactions = stockTransactions.map((transaction) => ({
      _id: transaction._id,
      item: {
        _id: transaction.item._id,
        name: transaction.item.name,
        unit: transaction.item.unit,
        category: transaction.item.category,
      },
      quantityChange: transaction.quantityChange,
      date: transaction.date.toISOString(),
      type: transaction.type,
      category: transaction.item.category,
      meal: transaction.meal,
      wing: transaction.wing, // Include wing in the response
      transactionAmount: transaction.transactionAmount,
      createdAt: transaction.createdAt
    }));
    // Send the formatted transactions as the response
    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error retrieving stock transactions:", error);
    res.status(500).json({ error: "Error retrieving stock transactions" });
  }
});

// Update a stock transaction (include wing)
// router.put("/transaction/:transactionId", validateToken, async (req, res) => {
//   try {
//     const transactionId = req.params.transactionId;
//     const {
//       quantityChange: newQuantityChange,
//       date,
//       pricePerUnit,
//       meal,
//       type,
//       category,
//       wing, // Include wing in the request body
//     } = req.body;

//     console.log(newQuantityChange, date, pricePerUnit, meal, type, category, wing);

//     // Validate quantityChange
//     if (isNaN(newQuantityChange) || newQuantityChange <= 0) {
//       return res.status(400).json({ error: "Invalid quantity change" });
//     }

//     // Validate transaction type (IN or OUT)
//     const validTypes = ["IN", "OUT"];
//     if (!validTypes.includes(type)) {
//       return res.status(400).json({ error: "Invalid transaction type. Must be 'IN' or 'OUT'." });
//     }

//     // Validate meal type for stock-out (optional, as "-" is allowed for stock-in)
//     const validMeals = ["BREAKFAST", "LUNCH", "DINNER", "-"];
//     if (!validMeals.includes(meal)) {
//       return res.status(400).json({ error: "Invalid meal type." });
//     }

//     // Find the stock transaction by its ID
//     const stockTransaction = await StockTransaction.findById(transactionId).populate("item");
//     if (!stockTransaction) {
//       return res.status(404).json({ error: "Stock transaction not found." });
//     }

//     if (stockTransaction.type !== type) {
//       return res.status(400).json({ error: "Cannot change transaction type." });
//     }

//     const prevQuantityChange = stockTransaction.quantityChange;

//     // Handle Stored Items
//     if (category === "STORED") {
//       // Find the associated stock item
//       const stock = await Stock.findOne({ item: stockTransaction.item._id, wing });
//       if (!stock) {
//         return res.status(404).json({ error: "Stock not found for this transaction." });
//       }

//       // Handle Stock-In Transaction (IN)
//       if (type === "IN") {
//         // Adjust stock quantity and value based on the new stock-in quantity
//         const prevTotalQuantity = stock.quantity - prevQuantityChange; // Stock before this transaction
//         const prevTotalValue = stock.quantity * stock.price - stockTransaction.transactionAmount; // Total value before this transaction
//         const newTotalQuantity = prevTotalQuantity + newQuantityChange;
//         const newTotalValue = prevTotalValue + newQuantityChange * pricePerUnit;
//         const newAvgPrice = (newTotalValue / newTotalQuantity).toFixed(2);

//         // Update the stock with new quantity and price
//         stock.quantity = newTotalQuantity;
//         stock.price = newAvgPrice;

//         // Save the updated stock
//         await stock.save();

//         // Update the stock transaction
//         stockTransaction.quantityChange = newQuantityChange;
//         stockTransaction.transactionAmount = newQuantityChange * pricePerUnit;
//         stockTransaction.date = new Date(date);
//         stockTransaction.wing = wing; // Update wing if needed
//         await stockTransaction.save();
//       } else if (type === "OUT") {
//         // Handle Stock-Out Transaction (OUT)
//         let newStockQuantity = stock.quantity + prevQuantityChange - newQuantityChange;

//         if (newStockQuantity < 0) {
//           return res.status(400).json({ error: "Stock limit exceeded. Cannot stock out more than available." });
//         }

//         stock.quantity = newStockQuantity;

//         // Save the updated stock
//         await stock.save();

//         // Update the stock transaction
//         stockTransaction.quantityChange = newQuantityChange;
//         stockTransaction.transactionAmount = newQuantityChange * stock.price;
//         stockTransaction.meal = meal;
//         stockTransaction.date = new Date(date);
//         stockTransaction.wing = wing; // Update wing if needed
//         await stockTransaction.save();
//       }
//     } else if (category === "NON_STORED") {
//       // Handle Non-Stored Items
//       stockTransaction.quantityChange = newQuantityChange;
//       stockTransaction.transactionAmount = newQuantityChange * pricePerUnit;
//       stockTransaction.date = new Date(date);
//       stockTransaction.wing = wing; // Update wing if needed
//       await stockTransaction.save();
//     }

//     // Adjust the bill for OUT transactions
//     if (type === "OUT") {
//       const bill = await Bill.findOne({ date: stockTransaction.date });
//       if (bill) {
//         const prevTransactionAmount = prevQuantityChange * pricePerUnit;
//         const newTransactionAmount = newQuantityChange * pricePerUnit;
//         const costDifference = newTransactionAmount - prevTransactionAmount;

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
//       updatedTransaction: stockTransaction,
//     });
//   } catch (error) {
//     console.error("Error updating stock transaction:", error);
//     res.status(500).json({ error: "Error updating stock transaction" });
//   }
// });

// router.put("/transaction/:transactionId", validateToken, async (req, res) => {
//   try {
//     const transactionId = req.params.transactionId;
//     const {
//       quantityChange: newQuantityChange,
//       pricePerUnit,
//       date,
//       meal,
//       wing, // Include wing in the request body
//     } = req.body;

//     // Validate quantityChange
//     if (isNaN(newQuantityChange) || newQuantityChange <= 0) {
//       return res.status(400).json({ error: "Invalid quantity change" });
//     }

//     // Find the stock transaction by its ID
//     const stockTransaction = await StockTransaction.findById(transactionId).populate("item");
//     if (!stockTransaction) {
//       return res.status(404).json({ error: "Stock transaction not found." });
//     }

//     // Save the current transactionAmount as prevTransactionAmount
//     const prevTransactionAmount = stockTransaction.transactionAmount;
//     const prevQuantityChange = stockTransaction.quantityChange;

//     // Handle STORED Items
//     if (stockTransaction.item.category === "STORED") {
//       // Find the associated stock item
//       const stock = await Stock.findOne({
//         item: stockTransaction.item._id,
//         wing: stockTransaction.wing,
//       });
//       if (!stock) {
//         return res.status(404).json({ error: "Stock not found for this transaction." });
//       }

//       // Handle Stock-In Transaction (IN)
//       if (stockTransaction.type === "IN") {
//         const prevTotalQuantity = stock.quantity - prevQuantityChange; // Stock before this transaction
//         const prevTotalValue = stock.quantity * stock.price - prevTransactionAmount; // Total value before this transaction
//         const newTotalQuantity = prevTotalQuantity + newQuantityChange;
//         const newTotalValue = prevTotalValue + newQuantityChange * pricePerUnit;
//         const newAvgPrice = (newTotalValue / newTotalQuantity).toFixed(2);

//         // Update the stock with new quantity and price
//         stock.quantity = newTotalQuantity;
//         stock.price = newAvgPrice;
//         await stock.save();

//         // Update the stock transaction
//         stockTransaction.quantityChange = newQuantityChange;
//         stockTransaction.transactionAmount = newQuantityChange * pricePerUnit;
//         stockTransaction.date = new Date(date);
//         stockTransaction.wing = wing; // Update wing if needed
//         await stockTransaction.save();
//       } else if (stockTransaction.type === "OUT") {
//         // Handle Stock-Out Transaction (OUT)
//         let newStockQuantity = stock.quantity + prevQuantityChange - newQuantityChange;

//         if (newStockQuantity < 0) {
//           return res.status(400).json({ error: "Stock limit exceeded. Cannot stock out more than available." });
//         }

//         stock.quantity = newStockQuantity;
//         await stock.save();

//         // Update the stock transaction
//         stockTransaction.quantityChange = newQuantityChange;
//         stockTransaction.transactionAmount = newQuantityChange * stock.price;
//         stockTransaction.meal = meal;
//         stockTransaction.date = new Date(date);
//         stockTransaction.wing = wing; // Update wing if needed
//         await stockTransaction.save();
//       }
//     } else if (stockTransaction.item.category === "NON_STORED") {
//       // Handle Non-Stored Items - No restriction on transaction age
//       stockTransaction.quantityChange = newQuantityChange;
//       stockTransaction.transactionAmount = newQuantityChange * pricePerUnit;
//       stockTransaction.date = new Date(date);
//       stockTransaction.wing = wing; // Update wing if needed
//       await stockTransaction.save();
//     }

//     // Adjust the bill for OUT transactions
//     if (stockTransaction.type === "OUT") {
//       const bill = await Cost.findOne({ date: stockTransaction.date });
//       if (bill) {
//         const newTransactionAmount = newQuantityChange * pricePerUnit;
//         const costDifference = newTransactionAmount - prevTransactionAmount; // Use prevTransactionAmount here

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
//       message: `Stock ${stockTransaction.type.toLowerCase()} transaction updated successfully`,
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
      pricePerUnit,
      date,
      meal,
      wing, // Include wing in the request body
    } = req.body;

    // Validate quantityChange
    if (isNaN(newQuantityChange) || newQuantityChange <= 0) {
      return res.status(400).json({ error: "Invalid quantity change" });
    }

    // Find the stock transaction by its ID
    const stockTransaction = await StockTransaction.findById(transactionId).populate("item");
    if (!stockTransaction) {
      return res.status(404).json({ error: "Stock transaction not found." });
    }

    // Get the current date and transaction date
    const currentDate = new Date();
    const transactionDate = new Date(stockTransaction.date);

    // Calculate the range for editable transactions
    const firstOfTransactionMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 2);
    let fifteenthOfNextMonth;

    // Handle the case where the transaction is in December (year transition)
    if (transactionDate.getMonth() === 11) { // December
      fifteenthOfNextMonth = new Date(transactionDate.getFullYear() + 1, 0, 15); // January 15th of next year
    } else {
      fifteenthOfNextMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 16); // 15th of next month
    }
    // Check if the current date falls within the editable range (1st of transaction month to 15th of next month)
    if (currentDate < firstOfTransactionMonth || currentDate > fifteenthOfNextMonth) {
      return res.status(400).json({
        error: "You can only modify transactions from the month they occurred to the 15th of the following month.",
      });
    }

    // Save the current transactionAmount as prevTransactionAmount
    const prevTransactionAmount = stockTransaction.transactionAmount;
    const prevQuantityChange = stockTransaction.quantityChange;

    // Handle STORED Items
    if (stockTransaction.item.category === "STORED") {
      // Find the associated stock item
      const stock = await Stock.findOne({
        item: stockTransaction.item._id,
        wing: stockTransaction.wing,
      });
      if (!stock) {
        return res.status(404).json({ error: "Stock not found for this transaction." });
      }

      // Handle Stock-In Transaction (IN)
      if (stockTransaction.type === "IN") {
        const prevTotalQuantity = stock.quantity - prevQuantityChange; // Stock before this transaction
        const prevTotalValue = stock.quantity * stock.price - prevTransactionAmount; // Total value before this transaction
        const newTotalQuantity = prevTotalQuantity + newQuantityChange;
        const newTotalValue = prevTotalValue + newQuantityChange * pricePerUnit;
        const newAvgPrice = (newTotalValue / newTotalQuantity).toFixed(2);
        console.log(prevQuantityChange, stock, newTotalValue, newAvgPrice, "ssh");
        // Update the stock with new quantity and price
        stock.quantity = newTotalQuantity;
        stock.price = newAvgPrice;
        await stock.save();

        // Update the stock transaction
        stockTransaction.quantityChange = newQuantityChange;
        stockTransaction.transactionAmount = newQuantityChange * pricePerUnit;
        stockTransaction.date = new Date(date || stockTransaction.date);
        stockTransaction.wing = wing; // Update wing if needed
        await stockTransaction.save();
      } else if (stockTransaction.type === "OUT") {
        // Handle Stock-Out Transaction (OUT)
        let newStockQuantity = stock.quantity + prevQuantityChange - newQuantityChange;

        if (newStockQuantity < 0) {
          return res.status(400).json({ error: "Stock limit exceeded. Cannot stock out more than available." });
        }

        stock.quantity = newStockQuantity;
        await stock.save();

        // Update the stock transaction
        stockTransaction.quantityChange = newQuantityChange;
        stockTransaction.transactionAmount = newQuantityChange * stock.price;
        stockTransaction.meal = meal;
        stockTransaction.date = new Date(date || stockTransaction.date);
        stockTransaction.wing = wing; // Update wing if needed
        await stockTransaction.save();
      }
    } else if (stockTransaction.item.category === "NON_STORED") {
      // Handle Non-Stored Items - No restriction on transaction age
      stockTransaction.quantityChange = newQuantityChange;
      stockTransaction.transactionAmount = newQuantityChange * pricePerUnit;
      stockTransaction.date = new Date(date || stockTransaction.date);
      stockTransaction.wing = wing; // Update wing if needed
      await stockTransaction.save();
    }

    // Adjust the bill for OUT transactions
    if (stockTransaction.type === "OUT") {
      const bill = await Cost.findOne({ date: stockTransaction.date });
      if (bill) {
        const newTransactionAmount = newQuantityChange * pricePerUnit;
        const costDifference = newTransactionAmount - prevTransactionAmount; // Use prevTransactionAmount here

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
      message: `Stock ${stockTransaction.type.toLowerCase()} transaction updated successfully`,
      updatedTransaction: stockTransaction,
    });
  } catch (error) {
    console.error("Error updating stock transaction:", error);
    res.status(500).json({ error: "Error updating stock transaction" });
  }
});




// Delete a stock transaction (include wing in lookup)
// router.delete("/transaction/:id", validateToken, async (req, res) => {
//   try {
//     const transactionId = req.params.id;

//     // Find the stock transaction by ID
//     const stockTransaction = await StockTransaction.findById(transactionId).populate("item");
//     if (!stockTransaction) {
//       return res.status(404).json({ error: "Stock transaction not found" });
//     }

//     if (stockTransaction.item.category === "STORED") {
//       // Check if this is the last transaction for the stock item
//       const lastTransaction = await StockTransaction.findOne({ item: stockTransaction.item._id })
//         .sort({ date: -1, createdAt: -1 });

//       if (lastTransaction._id.toString() !== transactionId) {
//         return res.status(400).json({
//           error: "Only the most recent transaction can be deleted. Please delete subsequent transactions first.",
//         });
//       }

//       // Find the associated stock item and adjust its quantity and price
//       const stockItem = await Stock.findOne({ item: stockTransaction.item, wing: stockTransaction.wing });
//       if (!stockItem) {
//         return res.status(404).json({ error: "Associated stock item not found" });
//       }

//       if (stockTransaction.type === "IN") {
//         const totalValue = stockItem.quantity * stockItem.price;
//         const newTotalValue = totalValue - stockTransaction.transactionAmount;
//         const newQuantity = stockItem.quantity - stockTransaction.quantityChange;

//         if (newQuantity <= 0) {
//           stockItem.price = 0;
//           stockItem.quantity = 0;
//         } else {
//           stockItem.price = (newTotalValue / newQuantity).toFixed(2);
//           stockItem.quantity = newQuantity;
//         }
//       } else if (stockTransaction.type === "OUT") {
//         stockItem.quantity += stockTransaction.quantityChange;
//       }

//       await stockItem.save();
//     }

//     // Update the associated bill (for OUT transactions)
//     const bill = await Cost.findOne({ date: stockTransaction.date });
//     if (bill) {
//       switch (stockTransaction.meal) {
//         case "BREAKFAST":
//           bill.mealBill.breakfast.totalCost -= stockTransaction.transactionAmount;
//           break;
//         case "LUNCH":
//           bill.mealBill.lunch.totalCost -= stockTransaction.transactionAmount;
//           break;
//         case "DINNER":
//           bill.mealBill.dinner.totalCost -= stockTransaction.transactionAmount;
//           break;
//       }
//       await bill.save();
//     }

//     await StockTransaction.deleteOne({ _id: stockTransaction._id });

//     res.json({ message: "Stock transaction deleted successfully" });
//   } catch (error) {
//     console.log("Error deleting stock transaction:", error);
//     res.status(500).json({ error: "Error deleting stock transaction" });
//   }
// });
// Delete a stock transaction (include wing in lookup)
router.delete("/transaction/:id", validateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;

    // Find the stock transaction by ID
    const stockTransaction = await StockTransaction.findById(transactionId).populate("item");
    if (!stockTransaction) {
      return res.status(404).json({ error: "Stock transaction not found" });
    }

    const transactionDate = new Date(stockTransaction.date);
    const currentDate = new Date();

    // Check if the transaction is from the current month
    const isCurrentMonth = 
      currentDate.getFullYear() === transactionDate.getFullYear() &&
      currentDate.getMonth() === transactionDate.getMonth();

    // Check if the transaction is from the previous month
    const isPreviousMonth = 
      currentDate.getFullYear() === transactionDate.getFullYear() &&
      currentDate.getMonth() === transactionDate.getMonth() + 1;

    // Allow deletion only if:
    // - It is from the current month, OR
    // - It is from the previous month and the current date is on or before the 15th
    if (!isCurrentMonth && (!isPreviousMonth || currentDate.getDate() > 15)) {
      return res.status(400).json({
        error: "Current & Previous month's transaction can be deleted."
      });
    }

    const prevTransactionAmount = stockTransaction.transactionAmount;
    const prevQuantityChange = stockTransaction.quantityChange;

    if (stockTransaction.item.category === "STORED") {
      // Find the associated stock item
      const stockItem = await Stock.findOne({ item: stockTransaction.item, wing: stockTransaction.wing });
      if (!stockItem) {
        return res.status(404).json({ error: "Associated stock item not found" });
      }

      // If it's a stock-in transaction, adjust the stock quantity and price
      if (stockTransaction.type === "IN") {
        const totalValue = stockItem.quantity * stockItem.price;
        const newTotalValue = totalValue - stockTransaction.transactionAmount;
        const newQuantity = stockItem.quantity - stockTransaction.quantityChange;

        if (newQuantity <= 0) {
          stockItem.price = 0;
          stockItem.quantity = 0;
        } else {
          stockItem.price = (newTotalValue / newQuantity).toFixed(2);
          stockItem.quantity = newQuantity;
        }
      } 
      // If it's a stock-out transaction, return the quantity back to the stock
      else if (stockTransaction.type === "OUT") {
        stockItem.quantity += stockTransaction.quantityChange;
      }

      // Save the updated stock
      await stockItem.save();
    }

    // Update the associated bill (for OUT transactions)
    if (stockTransaction.type === "OUT") {
      const bill = await Cost.findOne({ date: stockTransaction.date });
      if (bill) {
        switch (stockTransaction.meal) {
          case "BREAKFAST":
            bill.mealBill.breakfast.totalCost -= stockTransaction.transactionAmount;
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
    }

    // Delete the stock transaction
    await StockTransaction.deleteOne({ _id: stockTransaction._id });

    res.json({ message: "Stock transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting stock transaction:", error);
    res.status(500).json({ error: "Error deleting stock transaction" });
  }
});



// Batch add stock transactions
// router.post("/transaction/batch", validateToken, async (req, res) => {
//   const { transactions, wing } = req.body;

//   if (!transactions || !Array.isArray(transactions)) {
//     return res.status(400).json({ error: "Transactions are missing or invalid" });
//   }

//   try {
//     const inTransactions = [];
//     const outTransactions = [];
//     const nonStoredTransactions = [];

//     // Step 1: Categorize transactions into IN, OUT, and NON_STORED
//     transactions.forEach((transaction) => {
//       if (transaction.type === "IN") {
//         transaction.meal = "-"; // For IN transactions, meal type is not required
//         inTransactions.push(transaction);
//       } else if (transaction.type === "OUT" && transaction.category !== "NON_STORED") {
//         outTransactions.push(transaction);
//       } else if (transaction.category === "NON_STORED") {
//         nonStoredTransactions.push(transaction);
//       }
//     });

//     // Step 2: Process IN transactions first
//     for (let transaction of inTransactions) {
//       const { item, quantity, price, date, name } = transaction;

//       // Find or create the stock item in StockItem collection
//       let stockItem = await StockItem.findOne({ name, wing });
//       if (!stockItem) {
//         stockItem = new StockItem({ name, wing, unit: 'KG', category: 'STORED' });
//         await stockItem.save();
//       }

//       // Find or create stock
//       let stock = await Stock.findOne({ item: stockItem._id, wing });
//       if (!stock) {
//         stock = new Stock({ item: stockItem._id, quantity: parseFloat(quantity), wing });
//         await stock.save();
//       } else {
//         // Ensure the quantity is treated as a number
//         const newQuantity = stock.quantity + parseFloat(quantity);
//         stock.quantity = newQuantity;
//         await stock.save();
//       }

//       // Create the stock transaction for IN
//       const stockTransaction = new StockTransaction({
//         item: stockItem._id,
//         quantityChange: parseFloat(quantity), // Ensure quantity is a number
//         type: "IN",
//         date: new Date(date),
//         transactionAmount: parseFloat(quantity) * parseFloat(price), // Ensure price and quantity are numbers
//         meal: "-",
//         wing,
//       });
//       await stockTransaction.save();
//     }
//     // Step 3: Process OUT transactions
//     for (let transaction of outTransactions) {
//       const { item, quantity, date, meal, name } = transaction;

//       // Find the stock item by name
//       let stockItem = await StockItem.findOne({ name, wing });
//       if (!stockItem) {
//         return res.status(400).json({ error: `Stock item not found: ${name}` });
//       }

//       // Find the stock record
//       let stock = await Stock.findOne({ item: stockItem._id, wing });
//       if (!stock || stock.quantity < parseFloat(quantity)) {
//         return res.status(400).json({ error: `Not enough stock for item: ${name}` });
//       }

//       // Update the stock quantity
//       stock.quantity -= parseFloat(quantity); // Ensure quantity is a number
//       console.log(stock, "sdf");
//       await stock.save();

//       // Create the stock transaction for OUT
//       const stockTransaction = new StockTransaction({
//         item: stockItem._id,
//         quantityChange: parseFloat(quantity), // Ensure quantity is a number
//         type: "OUT",
//         date: new Date(date),
//         transactionAmount: parseFloat(quantity) * stock.price, // Ensure transaction amount is numeric
//         meal,
//         wing,
//       });
//       console.log(stockTransaction, "shk");
//       await stockTransaction.save();
//     }

//     // Step 4: Process NON_STORED transactions
//     for (let transaction of nonStoredTransactions) {
//       const { item, quantity, price, date, meal, name } = transaction;

//       // Find or create the stock item in StockItem collection
//       let stockItem = await StockItem.findOne({ name, wing });
//       if (!stockItem) {
//         stockItem = new StockItem({ name, wing, unit: 'PCS', category: 'NON_STORED' });
//         await stockItem.save();
//       }

//       // Create the stock transaction for NON_STORED
//       const stockTransaction = new StockTransaction({
//         item: stockItem._id,
//         quantityChange: parseFloat(quantity), // Ensure quantity is a number
//         type: "OUT",
//         date: new Date(date),
//         transactionAmount: parseFloat(quantity) * parseFloat(price), // Ensure price and quantity are numbers
//         category: "NON_STORED",
//         meal,
//         wing,
//       });
//       await stockTransaction.save();
//     }

//     res.json({
//       message: "All transactions processed successfully",
//     });
//   } catch (error) {
//     console.error("Error processing transactions:", error);
//     res.status(500).json({ error: "Error processing transactions" });
//   }
// });

// router.post("/transaction/batch", validateToken, async (req, res) => {
//   const { transactions, wing } = req.body;

//   if (!transactions || !Array.isArray(transactions)) {
//     return res.status(400).json({ error: "Transactions are missing or invalid" });
//   }

//   try {
//     const inTransactions = [];
//     const outTransactions = [];
//     const nonStoredTransactions = [];
//     let transactionDate = null;

//     // Step 1: Categorize transactions into IN, OUT, and NON_STORED
//     transactions.forEach((transaction) => {
//       if (transaction.type === "IN") {
//         transaction.meal = "-"; // For IN transactions, meal type is not required
//         inTransactions.push(transaction);
//       } else if (transaction.type === "OUT" && transaction.category !== "NON_STORED") {
//         outTransactions.push(transaction);
//       } else if (transaction.category === "NON_STORED") {
//         nonStoredTransactions.push(transaction);
//       }
//       // Set transactionDate to the date of the first transaction (assumes all transactions are for the same day)
//       if (!transactionDate) transactionDate = transaction.date;
//     });

//     // Step 2: Process IN transactions first
//     for (let transaction of inTransactions) {
//       const { item, quantity, price, date, name } = transaction;

//       // Find or create the stock item in StockItem collection
//       let stockItem = await StockItem.findOne({ name, wing });
//       if (!stockItem) {
//         stockItem = new StockItem({ name, wing, unit: 'KG', category: 'STORED' });
//         await stockItem.save();
//       }

//       // Find or create stock
//       let stock = await Stock.findOne({ item: stockItem._id, wing });
//       if (!stock) {
//         stock = new Stock({ item: stockItem._id, quantity: parseFloat(quantity), wing });
//         await stock.save();
//       } else {
//         const newQuantity = stock.quantity + parseFloat(quantity);
//         stock.quantity = newQuantity;
//         await stock.save();
//       }

//       // Create the stock transaction for IN
//       const stockTransaction = new StockTransaction({
//         item: stockItem._id,
//         quantityChange: parseFloat(quantity),
//         type: "IN",
//         date: new Date(date),
//         transactionAmount: parseFloat(quantity) * parseFloat(price),
//         meal: "-",
//         wing,
//       });
//       await stockTransaction.save();
//     }

//     // Step 3: Process OUT transactions
//     for (let transaction of outTransactions) {
//       const { item, quantity, date, meal, name } = transaction;

//       // Find the stock item by name
//       let stockItem = await StockItem.findOne({ name, wing });
//       if (!stockItem) {
//         return res.status(400).json({ error: `Stock item not found: ${name}` });
//       }

//       // Find the stock record
//       let stock = await Stock.findOne({ item: stockItem._id, wing });
//       if (!stock || stock.quantity < parseFloat(quantity)) {
//         return res.status(400).json({ error: `Not enough stock for item: ${name}` });
//       }

//       // Update the stock quantity
//       stock.quantity -= parseFloat(quantity);
//       await stock.save();

//       // Create the stock transaction for OUT
//       const stockTransaction = new StockTransaction({
//         item: stockItem._id,
//         quantityChange: parseFloat(quantity),
//         type: "OUT",
//         date: new Date(date),
//         transactionAmount: parseFloat(quantity) * stock.price,
//         meal,
//         wing,
//       });
//       await stockTransaction.save();
//     }

//     // Step 4: Process NON_STORED transactions
//     for (let transaction of nonStoredTransactions) {
//       const { item, quantity, price, date, meal, name } = transaction;

//       // Find or create the stock item in StockItem collection
//       let stockItem = await StockItem.findOne({ name, wing });
//       if (!stockItem) {
//         stockItem = new StockItem({ name, wing, unit: 'PCS', category: 'NON_STORED' });
//         await stockItem.save();
//       }

//       // Create the stock transaction for NON_STORED
//       const stockTransaction = new StockTransaction({
//         item: stockItem._id,
//         quantityChange: parseFloat(quantity),
//         type: "OUT",
//         date: new Date(date),
//         transactionAmount: parseFloat(quantity) * parseFloat(price),
//         category: "NON_STORED",
//         meal,
//         wing,
//       });
//       await stockTransaction.save();
//     }

//     // Step 5: After processing transactions, trigger the bill service to update the bill for the day
//     await createOrUpdateBill(transactionDate, wing);

//     res.json({
//       message: "All transactions processed successfully",
//     });
//   } catch (error) {
//     console.error("Error processing transactions:", error);
//     res.status(500).json({ error: "Error processing transactions" });
//   }
// });

router.post("/transaction/batch", validateToken, async (req, res) => {
  const { transactions, wing } = req.body;

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: "Transactions are missing or invalid" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const inTransactions = [];
    const outTransactions = [];
    const nonStoredTransactions = [];
    let transactionDate = null;

    // Step 1: Categorize transactions into IN, OUT, and NON_STORED
    transactions.forEach((transaction) => {
      if (transaction.type === "IN") {
        transaction.meal = "-"; // For IN transactions, meal type is not required
        inTransactions.push(transaction);
      } else if (transaction.type === "OUT" && transaction.category !== "NON_STORED") {
        outTransactions.push(transaction);
      } else if (transaction.category === "NON_STORED") {
        nonStoredTransactions.push(transaction);
      }
      // Set transactionDate to the date of the first transaction (assumes all transactions are for the same day)
      if (!transactionDate) transactionDate = transaction.date;
    });

    // Step 2: Process IN transactions first
    for (let transaction of inTransactions) {
      const { item, quantity, price, date, name } = transaction;

      // Find or create the stock item in StockItem collection
      let stockItem = await StockItem.findOne({ name, wing }).session(session);
      if (!stockItem) {
        stockItem = new StockItem({ name, wing, unit: 'KG', category: 'STORED' });
        await stockItem.save({ session });
      }

      // Find or create stock
      let stock = await Stock.findOne({ item: stockItem._id, wing }).session(session);
      if (!stock) {
        stock = new Stock({ item: stockItem._id, quantity: parseFloat(quantity), wing });
        await stock.save({ session });
      } else {
        const newQuantity = stock.quantity + parseFloat(quantity);
        stock.quantity = newQuantity;
        await stock.save({ session });
      }

      // Create the stock transaction for IN
      const stockTransaction = new StockTransaction({
        item: stockItem._id,
        quantityChange: parseFloat(quantity),
        type: "IN",
        date: new Date(date),
        transactionAmount: parseFloat(quantity) * parseFloat(price),
        meal: "-",
        wing,
      });
      await stockTransaction.save({ session });
    }

    // Step 3: Process OUT transactions
    for (let transaction of outTransactions) {
      const { item, quantity, date, meal, name } = transaction;

      // Find the stock item by name
      let stockItem = await StockItem.findOne({ name, wing }).session(session);
      if (!stockItem) {
        throw new Error(`Stock item not found: ${name}`);
      }

      // Find the stock record
      let stock = await Stock.findOne({ item: stockItem._id, wing }).session(session);
      if (!stock || stock.quantity < parseFloat(quantity)) {
        throw new Error(`Not enough stock for item: ${name}`);
      }

      // Update the stock quantity
      stock.quantity -= parseFloat(quantity);
      await stock.save({ session });

      // Create the stock transaction for OUT
      const stockTransaction = new StockTransaction({
        item: stockItem._id,
        quantityChange: parseFloat(quantity),
        type: "OUT",
        date: new Date(date),
        transactionAmount: parseFloat(quantity) * stock.price,
        meal,
        wing,
      });
      await stockTransaction.save({ session });
    }

    // Step 4: Process NON_STORED transactions
    for (let transaction of nonStoredTransactions) {
      const { item, quantity, price, date, meal, name } = transaction;

      // Find or create the stock item in StockItem collection
      let stockItem = await StockItem.findOne({ name, wing }).session(session);
      if (!stockItem) {
        stockItem = new StockItem({ name, wing, unit: 'PCS', category: 'NON_STORED' });
        await stockItem.save({ session });
      }

      // Create the stock transaction for NON_STORED
      const stockTransaction = new StockTransaction({
        item: stockItem._id,
        quantityChange: parseFloat(quantity),
        type: "OUT",
        date: new Date(date),
        transactionAmount: parseFloat(quantity) * parseFloat(price),
        category: "NON_STORED",
        meal,
        wing,
      });
      await stockTransaction.save({ session });
    }

    // Step 5: After processing transactions, trigger the bill service to update the bill for the day
    await createOrUpdateBill(transactionDate, wing);

    // If everything is successful, commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "All transactions processed successfully",
    });
  } catch (error) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();
    console.error("Error processing transactions:", error);
    res.status(500).json({ error: "Error processing transactions" });
  }
});

module.exports = router;
