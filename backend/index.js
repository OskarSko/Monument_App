// backend/index.js - WERSJA FINALNA I POPRAWNA

require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Importujemy pliki z trasami (routerami)
const monumentRoutes = require('./routes/monuments');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Witaj w API do zarządzania pomnikami!');
});

// Ta linia musi być AKTYWNA. Przekierowuje wszystkie żądania
// /api/monuments/* do pliku routes/monuments.js
app.use('/api/monuments', monumentRoutes);

// Ta linia obsługuje autoryzację
app.use('/api/auth', authRoutes);


app.listen(port, () => {
  console.log(`Backend działa na http://localhost:${port}`);
});