const router = require("express").Router();
const { validateToken } = require("../utils/validateToken");
const Notice = require("../models/notice");

// Get all notices (paginated)
router.get("/", validateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const [notices, total] = await Promise.all([
      Notice.find({}).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Notice.countDocuments({}),
    ]);

    res.status(200).json({
      notices,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ message: "An error occurred while fetching notices" });
  }
});

// Get notices for a selected wing (paginated)
router.get("/:noticeFor", validateToken, async (req, res) => {
  try {
    const { noticeFor } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const filter = noticeFor === "ALL"
      ? { noticeFor: { $in: ["MALE", "FEMALE", "ALL"] } }
      : { noticeFor: { $in: [noticeFor, "ALL"] } };

    const [notices, total] = await Promise.all([
      Notice.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      Notice.countDocuments(filter),
    ]);

    res.status(200).json({
      notices,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    res.status(500).json({ message: "An error occurred while fetching notices" });
  }
});


// Create a new notice
router.post("/", validateToken, async (req, res) => {
  const { title, description, noticeFor } = req.body;

  try {
    const newNotice = new Notice({ title, description, noticeFor });
    await newNotice.save();
    res
      .status(201)
      .json({ message: "Notice created successfully", notice: newNotice });
  } catch (error) {
    console.error("Error creating notice:", error);
    res
      .status(500)
      .json({ message: "An error occurred while creating the notice" });
  }
});

// Update a notice by ID
router.put("/:id", validateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, noticeFor } = req.body;

  try {
    const updatedNotice = await Notice.findByIdAndUpdate(
      id,
      { title, description, noticeFor },
      { new: true }
    );

    if (!updatedNotice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res
      .status(200)
      .json({ message: "Notice updated successfully", notice: updatedNotice });
  } catch (error) {
    console.error("Error updating notice:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the notice" });
  }
});

// Delete a notice by ID
router.delete("/:id", validateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNotice = await Notice.findByIdAndDelete(id);

    if (!deletedNotice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Error deleting notice:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the notice" });
  }
});

module.exports = router;
