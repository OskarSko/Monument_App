const pool = require('../config/db');

// Logika z GET /api/monuments
const getAllMonuments = async (req, res) => {
  try {
    // POPRAWKA: Używamy dokładnej nazwy kolumny 'last_restoration_date' z Twojego obrazka
    const query = 'SELECT id, name, description, ST_AsGeoJSON(location) as location, year, author, last_restoration_date, status FROM monuments';
    const result = await pool.query(query);

    const monuments = result.rows.map(row => ({
      ...row,
      location: JSON.parse(row.location)
    }));
    res.json(monuments);
  } catch (err) {
    console.error('Błąd podczas pobierania pomników:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Logika z POST /api/monuments
const addMonument = async (req, res) => {
  const { name, description, location, year, author, last_restoration_date, status } = req.body;
  const creator_user_id = req.user.userId;

  if (!name || !location || !location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    return res.status(400).json({ error: 'Nazwa i poprawny obiekt location z tablicą coordinates są wymagane.' });
  }

  const [lng, lat] = location.coordinates;

  try {
    // POPRAWKA: Używamy dokładnej nazwy kolumny 'last_restoration_date' w zapytaniu INSERT
    const query = `
      INSERT INTO monuments (name, description, location, year, author, last_restoration_date, status, creator_user_id)
      VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9)
      RETURNING id, name;
    `;
    
    const values = [
      name,
      description,
      lng,
      lat,
      year || null,
      author || null,
      last_restoration_date || null,
      status || null,
      creator_user_id
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Błąd podczas dodawania pomnika:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Eksportujemy obie funkcje jako obiekt
module.exports = {
  getAllMonuments,
  addMonument,
};