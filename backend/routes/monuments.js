const express = require('express');
const router = express.Router();

// Importujemy kontrolery i middleware
const { getAllMonuments, addMonument } = require('../controllers/monumentController');
const { getConservationHistory, addConservationEntry } = require('../controllers/conservationController');
const authenticateToken = require('../middleware/authenticateToken');

// Trasy publiczne
// GET /api/monuments -> getAllMonuments
router.get('/', getAllMonuments);
// GET /api/monuments/:id/history -> getConservationHistory
router.get('/:id/history', getConservationHistory);

// Trasy chronione (wymagające tokena)
// POST /api/monuments -> addMonument
router.post('/', authenticateToken, addMonument);
// POST /api/monuments/:id/history -> addConservationEntry
router.post('/:id/history', authenticateToken, addConservationEntry);

module.exports = router;