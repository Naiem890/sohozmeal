const router = require("express").Router();
const HallFeast = require("../models/hallFeast");

// Check if a meal is on or off for a specific date and meal type
router.post("/check", async (req, res) => {
  try {
    const { date, meal } = req.body;

    // Find the hall feast for the specific date and meal type
    const hallFeast = await HallFeast.findOne({ date, meal });

    if (hallFeast) {
      // Meal is on because hall feast exists for this date and meal
      return res.status(200).json({ status: "on", message: `${meal} is on for ${date}` });
    } else {
      // Meal is off because no hall feast is found for this date and meal
      return res.status(200).json({ status: "off", message: `${meal} is off for ${date}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Create a new HallFeast
router.post("/", async (req, res) => {
  try {
    const hallFeast = new HallFeast(req.body);
    await hallFeast.save();
    res.status(201).json(hallFeast);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all HallFeasts
router.get("/", async (req, res) => {
  try {
    const hallFeasts = await HallFeast.find();
    res.status(200).json(hallFeasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single HallFeast by ID
router.get("/:id", async (req, res) => {
  try {
    const hallFeast = await HallFeast.findById(req.params.id);
    if (!hallFeast) {
      return res.status(404).json({ error: "HallFeast not found" });
    }
    res.status(200).json(hallFeast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a HallFeast by ID
router.put("/:id", async (req, res) => {
  try {
    const hallFeast = await HallFeast.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hallFeast) {
      return res.status(404).json({ error: "HallFeast not found" });
    }
    res.status(200).json(hallFeast);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a HallFeast by ID
router.delete("/:id", async (req, res) => {
  try {
    const hallFeast = await HallFeast.findByIdAndDelete(req.params.id);
    if (!hallFeast) {
      return res.status(404).json({ error: "HallFeast not found" });
    }
    res.status(200).json({ message: "HallFeast deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Get HallFeast by date
router.get("/date/:date", async (req, res) => {
  try {
    const { date } = req.params;

    // Find hallFeast by date
    const hallFeast = await HallFeast.find({ date });

    if (!hallFeast || hallFeast.length === 0) {
      return res.status(404).json({ error: "No HallFeast found for this date" });
    }

    res.status(200).json(hallFeast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Delete HallFeast by date and meal
router.delete("/date/:date/meal/:meal", async (req, res) => {
  try {
    const { date, meal } = req.params;

    // Find and delete the hall feast by date and meal
    const deletedHallFeast = await HallFeast.findOneAndDelete({ date, meal });

    if (!deletedHallFeast) {
      return res.status(404).json({ error: "No HallFeast found for this date and meal" });
    }

    res.status(200).json({ message: "HallFeast deleted successfully", deletedHallFeast });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
