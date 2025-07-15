// controllers/authController.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// Funkcja pomocnicza do generowania tokena
const generateToken = (user) => {
  // Tworzymy payload z polami 'userId' i 'username'
  return jwt.sign(
    { userId: user.id, username: user.username }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h' // Dodaj domyślny czas wygaśnięcia
    }
  );
};

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Proszę podać nazwę użytkownika i hasło.' });
  }
  
  try {
    // Hashowanie hasła
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUserQuery = `
      INSERT INTO users (username, password_hash)
      VALUES ($1, $2)
      RETURNING id, username;
    `;
    const { rows } = await pool.query(newUserQuery, [username, passwordHash]);
    
    res.status(201).json({ success: true, user: rows[0] });

  } catch (err) {
    // Kod '23505' w PostgreSQL oznacza naruszenie unikalności (UNIQUE constraint)
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Użytkownik o tej nazwie już istnieje.' });
    }
    console.error('Błąd podczas rejestracji:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Proszę podać nazwę użytkownika i hasło.' });
    }

    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania.' });
        }

        // Przekazujemy cały obiekt 'user' do funkcji generującej token
        const token = generateToken(user); 
        res.status(200).json({ success: true, token });

    } catch (err) {
        console.error('Błąd podczas logowania:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};