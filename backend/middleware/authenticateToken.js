// backend/middleware/authenticateToken.js

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ error: 'Brak tokena autoryzacyjnego.' });
  }

  // WAŻNE: Użyj tej samej zmiennej środowiskowej lub tego samego sekretu, co przy logowaniu
  const secret = process.env.JWT_SECRET || 'your_super_strong_and_secret_jwt_key_here_!!!!';

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.error('Błąd weryfikacji tokena:', err.message);
      return res.status(403).json({ error: 'Token jest nieprawidłowy lub wygasł.' });
    }
    req.user = user; // Dodaj payload do obiektu request
    next(); // Przejdź dalej
  });
};

module.exports = authenticateToken;