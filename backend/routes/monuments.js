// backend/routes/monuments.js - WERSJA POPRAWIONA

const express = require('express');
const router = express.Router();

// Importujemy kontrolery i middleware
const { getAllMonuments, addMonument } = require('../controllers/monumentController');

// ZMIANA: Importujemy WSZYSTKIE potrzebne funkcje z conservationController
const { 
  getConservationHistory, 
  addConservationEntry,
  updateConservationEntry, // <-- Brakowało tego importu
  deleteConservationEntry  // <-- Brakowało tego importu
} = require('../controllers/conservationController'); 

const authenticateToken = require('../middleware/authenticateToken');

// --- Trasy publiczne ---
// GET /api/monuments -> Pobiera wszystkie pomniki
router.get('/', getAllMonuments);
// GET /api/monuments/:id/history -> Pobiera historię konserwacji dla danego pomnika
router.get('/:id/history', getConservationHistory);

// --- Trasy chronione ---
// POST /api/monuments -> Dodaje nowy pomnik
router.post('/', authenticateToken, addMonument);
// POST /api/monuments/:id/history -> Dodaje nowy wpis do historii konserwacji
router.post('/:id/history', authenticateToken, addConservationEntry);


// --- NOWE, BRAKUJĄCE ŚCIEŻKI ---

// PUT /api/monuments/history/:id -> Aktualizuje konkretny wpis w historii
// Adres URL: '/history/:id' jest łączony z '/api/monuments' z pliku index.js
router.put('/history/:id', authenticateToken, updateConservationEntry);

// DELETE /api/monuments/history/:id -> Usuwa konkretny wpis z historii
router.delete('/history/:id', authenticateToken, deleteConservationEntry);


module.exports = router;