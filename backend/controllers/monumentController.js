const pool = require('../config/db');

// Logika z GET /api/monuments
const getAllMonuments = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, description, ST_AsGeoJSON(location) as location FROM monuments');
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
  const { name, description, coordinates } = req.body;

  if (!name || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({ error: 'Missing required fields: name and valid coordinates array [lon, lat].' });
  }

  try {
    const query = `
      INSERT INTO monuments (name, description, location)
      VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326))
      RETURNING id, name, description, ST_AsGeoJSON(location) as location;
    `;
    const result = await pool.query(query, [name, description, coordinates[0], coordinates[1]]);
    const newMonument = {
      ...result.rows[0],
      location: JSON.parse(result.rows[0].location)
    };
    res.status(201).json(newMonument);
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