const express = require('express');
const Complaint = require('../models/complaint');
const Staff = require('../models/staff');
const router = express.Router();

// Create a new complaint (POST)
router.post('/complaints', async (req, res) => {
  try {
    const { studentId, complaintType, description, images } = req.body;
    const newComplaint = new Complaint({
      studentId,
      complaintType,
      description,
      images,
    });
    const savedComplaint = await newComplaint.save();
    res.status(201).json(savedComplaint);
  } catch (error) {
    res.status(400).json({ error: 'Error creating complaint', details: error.message });
  }
});

// Get all complaints (GET)
router.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('studentId').populate('assignedTo');
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching complaints', details: error.message });
  }
});

// Get a specific complaint by ID (GET)
router.get('/complaints/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('studentId').populate('assignedTo');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching complaint', details: error.message });
  }
});

// Update complaint status (PUT)
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, completedAt: status === 'COMPLETED' ? Date.now() : null },
      { new: true }
    );
    if (!updatedComplaint) return res.status(404).json({ error: 'Complaint not found' });
    res.status(200).json(updatedComplaint);
  } catch (error) {
    res.status(400).json({ error: 'Error updating complaint', details: error.message });
  }
});

// Assign a staff member to a complaint (PUT)
router.put('/complaints/:id/assign', async (req, res) => {
  try {
    const { staffId } = req.body;
    const staffMember = await Staff.findById(staffId);
    if (!staffMember) return res.status(404).json({ error: 'Staff member not found' });

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { assignedTo: staffId },
      { new: true }
    );
    if (!updatedComplaint) return res.status(404).json({ error: 'Complaint not found' });
    res.status(200).json(updatedComplaint);
  } catch (error) {
    res.status(400).json({ error: 'Error assigning complaint', details: error.message });
  }
});

// Delete a complaint (DELETE)
router.delete('/complaints/:id', async (req, res) => {
  try {
    const deletedComplaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!deletedComplaint) return res.status(404).json({ error: 'Complaint not found' });
    res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting complaint', details: error.message });
  }
});

module.exports = router;
