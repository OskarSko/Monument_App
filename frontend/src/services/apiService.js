


const API_BASE_URL = 'http://localhost:3000/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Błąd serwera bez dodatkowych informacji.' }));
    // Jeśli status to 401 (brak autoryzacji), usuwamy token
    if (response.status === 401) {
      localStorage.removeItem('authToken');
    }
    // Rzucamy błąd, aby komponent mógł go złapać w bloku catch
    throw new Error(errorData.error || `Błąd serwera: ${response.statusText}`);
  }

  if (response.status === 204) {
      return null;
  }
  
  return response.json();
}

export default {
  register(credentials) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(credentials) });
  },
  login(credentials) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  },
  addMonument(monumentData) {
    return request('/monuments', { method: 'POST', body: JSON.stringify(monumentData) });
  },
  fetchConservationHistory(monumentId) {
    return request(`/monuments/${monumentId}/history`);
  },
  addConservationEntry(monumentId, entryData) {
    return request(`/monuments/${monumentId}/history`, { method: 'POST', body: JSON.stringify(entryData) });
  },
  // --- NOWA FUNKCJA DO EDYCJI ---
  /**
   * Aktualizuje istniejący wpis w historii konserwacji.
   * @param {number} entryId - ID konkretnego wpisu, który edytujemy.
   * @param {object} entryData - Nowe dane dla wpisu.
   */
  updateConservationEntry(entryId, entryData) {
    // ZMIANA: Dodano '/monuments' na początku ścieżki
    return request(`/monuments/history/${entryId}`, { method: 'PUT', body: JSON.stringify(entryData) });
  },

  deleteConservationEntry(entryId) {
    // ZMIANA: Dodano '/monuments' na początku ścieżki
    return request(`/monuments/history/${entryId}`, { method: 'DELETE' });
  },
};