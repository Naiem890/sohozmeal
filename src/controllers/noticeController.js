const router = require("express").Router();
const { validateToken } = require("../utils/validateToken");
const Notice = require("../models/notice");

// Get all notices
router.get("/", validateToken, async (req, res) => {
  try {
    const notices = await Notice.find({});
    res.status(200).json(notices);
  } catch (error) {
    console.error("Error fetching notices:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching notices" });
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
