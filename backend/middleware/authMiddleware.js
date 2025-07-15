// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Brak autoryzacji, token nie został dostarczony.' });
  }

  try {
    // Weryfikacja tokena
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Znajdź użytkownika w bazie i dołącz go do żądania (bez hasła)
    const { rows } = await pool.query('SELECT id, username FROM users WHERE id = $1', [decoded.id]);
    
    if (rows.length === 0) {
        return res.status(401).json({ error: 'Użytkownik powiązany z tym tokenem już nie istnieje.' });
    }
    
    req.user = rows[0]; // Dołącz obiekt użytkownika do req
    next();
  } catch (error) {
    res.status(401).json({ error: 'Brak autoryzacji, token jest nieprawidłowy lub wygasł.' });
  }
};