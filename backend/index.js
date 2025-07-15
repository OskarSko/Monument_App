// backend/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import tras
const monumentRoutes = require('./routes/monuments');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Główne middleware
app.use(cors());
app.use(express.json()); // Do parsowania JSON z requestów

// Główne trasy
app.get('/', (req, res) => {
  res.send('Witaj w API do zarządzania pomnikami!');
});

// Użycie dedykowanych plików z trasami
app.use('/api/monuments', monumentRoutes);
app.use('/api/auth', authRoutes);


app.listen(port, () => {
  console.log(`Backend działa na http://localhost:${port}`);
});