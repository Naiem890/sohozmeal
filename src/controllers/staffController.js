const express = require('express');
const Staff = require('../models/staff');
const Complaint = require('../models/complaint');
const router = express.Router();

// Get all staff members (GET)
router.get('/staff', async (req, res) => {
  try {
    const staffMembers = await Staff.find();
    res.status(200).json(staffMembers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching staff members', details: error.message });
  }
});

// Get a specific staff member by ID (GET)
router.get('/staff/:id', async (req, res) => {
  try {
    const staffMember = await Staff.findById(req.params.id);
    if (!staffMember) return res.status(404).json({ error: 'Staff member not found' });
    res.status(200).json(staffMember);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching staff member', details: error.message });
  }
});

// Update staff member information (PUT)
router.put('/staff/:id', async (req, res) => {
  try {
    const { name, phoneNumber, role } = req.body;
    const updatedStaff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name, phoneNumber, role },
      { new: true }
    );
    if (!updatedStaff) return res.status(404).json({ error: 'Staff member not found' });
    res.status(200).json(updatedStaff);
  } catch (error) {
    res.status(400).json({ error: 'Error updating staff member', details: error.message });
  }
});

// Delete a staff member (DELETE)
router.delete('/staff/:id', async (req, res) => {
  try {
    const deletedStaff = await Staff.findByIdAndDelete(req.params.id);
    if (!deletedStaff) return res.status(404).json({ error: 'Staff member not found' });
    res.status(200).json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting staff member', details: error.message });
  }
});

// Get complaints assigned to a specific staff member (GET)
router.get('/staff/:id/complaints', async (req, res) => {
  try {
    const staffMember = await Staff.findById(req.params.id);
    if (!staffMember) return res.status(404).json({ error: 'Staff member not found' });

    const complaints = await Complaint.find({ assignedTo: req.params.id });
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching assigned complaints', details: error.message });
  }
});

module.exports = router;
