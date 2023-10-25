const router = require("express").Router();
const { Stock, StockItem } = require("../models/stock");
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

    // Check if the item is associated with any existing stocks
    const associatedStock = await Stock.findOne({ item: itemId });

    if (associatedStock) {
      return res.status(400).json({
        error: "Cannot delete this item because it is associated with a stock.",
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

// Create a new Stock
router.post("/", validateToken, async (req, res) => {
  try {
    if (!req.body?.stock) {
      return res
        .status(400)
        .json({ error: "Stock data is missing in the request body" });
    }

    const stockData = req.body.stock;
    const { item: itemId } = stockData;
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

    res.json(updatedStock);
  } catch (error) {
    console.log("error =>", error);
    res.status(500).json({ error: "Error creating/updating stock" });
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

module.exports = router;

// Stock Out API
router.post("/out/:id", validateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    const { quantityToReduce } = req.body;
    if (isNaN(quantityToReduce) || quantityToReduce <= 0) {
      return res.status(400).json({ error: "Invalid quantity to reduce" });
    }
    const stockItem = await Stock.findOne({ item: itemId });
    console.log(stockItem);

    if (!stockItem) {
      return res.status(404).json({ error: "Stock item not found" });
    }
    const currentQuantity = stockItem.quantity;
    const newQuantity = currentQuantity - quantityToReduce;
    console.log(
      "newQuantity:",
      newQuantity,
      "currentQuantity:",
      currentQuantity,
      stockItem
    );

    if (newQuantity < 0) {
      return res.status(400).json({ error: "Stock Limit exceed." });
    }
    stockItem.quantity = newQuantity;
    await stockItem.save();
    res.json({ message: "Stock out completed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error during stock out process" });
  }
});