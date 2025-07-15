const pool = require('../config/db');

const getConservationHistory = async (req, res) => {
    console.log('KROK 3: Żądanie dotarło do kontrolera getConservationHistory.');
  const { id } = req.params; 
  console.log(`KROK 3b: Otrzymane ID pomnika z URL: ${id}`);
  // LOG 2: Sprawdzamy, dla jakiego ID próbujemy pobrać historię.
  console.log(`--- POBIERAM HISTORIĘ dla pomnika ID: ${id} ---`);

  try {
    const query = `
      SELECT id, monument_id, conservation_date, type_of_work, notes, user_id, created_at 
      FROM conservation_history 
      WHERE monument_id = $1 
      ORDER BY conservation_date DESC
    `;
    const result = await pool.query(query, [id]);
    

    console.log('KROK 4: Baza danych zwróciła:', result.rows);
    
    // Logujemy, co faktycznie zwróciła baza danych
    console.log('--- WYNIK ZAPYTANIA Z BAZY DANYCH:', result.rows); 
    
    res.json(result.rows);
  } catch (err) {
    console.error('BŁĄD w `getConservationHistory`:', err);
    res.status(500).json({ error: 'Błąd serwera podczas pobierania historii.' });
  }
};

const addConservationEntry = async (req, res) => {
  const { id } = req.params;
  const { conservation_date, type_of_work, notes } = req.body;
  const user_id = req.user.userId;

  // LOG 1: Sprawdzamy, dla jakiego ID i z jakimi danymi próbujemy zapisać wpis.
  console.log(`--- ZAPISUJĘ WPIS dla pomnika ID: ${id} ---`);

  if (!conservation_date || !type_of_work) {
    return res.status(400).json({ error: 'Data i rodzaj pracy są wymagane.' });
  }

  try {
    const query = `
      INSERT INTO conservation_history (monument_id, conservation_date, type_of_work, notes, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [id, conservation_date, type_of_work, notes, user_id];
    
    // Logujemy, jakie dokładnie wartości wstawiamy do bazy
    console.log('--- WARTOŚCI DO INSERTU:', values);

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('BŁĄD w `addConservationEntry`:', err);
    res.status(500).json({ error: 'Błąd serwera podczas dodawania wpisu.' });
  }
};

module.exports = {
  getConservationHistory,
  addConservationEntry,
};