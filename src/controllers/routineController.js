const router = require("express").Router();
const Routine = require("../models/routine");
const { validateToken } = require("../utils/validateToken");

router.get('/routine',validateToken, async (req, res) => {
    try {
      const routines = await Routine.find();
      res.json(routines);
    } catch (err) {
      console.error('Error retrieving routines: ', err);
      res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;