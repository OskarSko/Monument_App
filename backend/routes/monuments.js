// routes/monuments.js
const express = require('express');
const router = express.Router();
const { getAllMonuments, addMonument } = require('../controllers/monumentController');
const { protect } = require('../middleware/authMiddleware');
// Publiczna trasa do pobierania wszystkich pomników
router.get('/', getAllMonuments);
// Prywatna, chroniona trasa do dodawania nowego pomnika
// Middleware 'protect' uruchomi się przed kontrolerem 'addMonument'
router.post('/', protect, addMonument);
module.exports = router;