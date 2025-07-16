const pool = require('../config/db');

const getAllMonuments = async (req, res) => {
  const { search } = req.query;

  try {
    let query = `
      SELECT id, name, year, author, status, ST_AsGeoJSON(location) as location,
             description, last_restoration_date 
      FROM monuments
    `;
    const values = []; 

    if (search) {
      query += ' WHERE name ILIKE $1';
      values.push(`%${search}%`);
    }

    query += ' ORDER BY name;';

    const result = await pool.query(query, values);

    const monuments = result.rows.map(m => ({
      ...m,
      location: JSON.parse(m.location)
    }));
    
    res.json(monuments);

  } catch (err) {
    console.error('Błąd w `getAllMonuments`:', err);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania pomników.' });
  }
};

const addMonument = async (req, res) => {
  const { name, description, location, year, author, last_restoration_date, status } = req.body;
  const creator_user_id = req.user.userId;

  if (!name || !location || !location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    return res.status(400).json({ error: 'Nazwa i poprawny obiekt location z tablicą coordinates są wymagane.' });
  }

  const [lng, lat] = location.coordinates;

  try {
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

module.exports = {
  getAllMonuments,
  addMonument,
};