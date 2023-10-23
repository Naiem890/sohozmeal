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
    const stockItems = await StockItem.find();
    res.json(stockItems);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving stock items" });
  }
});

// Update a Stock Item
router.put("/item/:id", validateToken, async (req, res) => {
  try {
    const itemId = req.params.id;
    const itemData = req.body;
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

    res.json(deletedItem);
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

    const stockData = req.body?.stock;
    const stock = new Stock(stockData);

    // Save the Stock using a promise
    const savedStock = await stock.save();

    res.status(201).json(savedStock);
  } catch (error) {
    res.status(500).json({ error: "Error creating stock" });
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
