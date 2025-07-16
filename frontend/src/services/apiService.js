


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
    if (response.status === 401) {
      localStorage.removeItem('authToken');
    }
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
  // --- Metody dotyczące pomników ---
  /**
   * Pobiera listę pomników, opcjonalnie filtrując je po nazwie.
   * @param {string} [searchTerm]
   */
  fetchMonuments(searchTerm = '') {
    let url = '/monuments';
    if (searchTerm && searchTerm.trim()) {
      url += `?search=${encodeURIComponent(searchTerm.trim())}`;
    }
    return request(url);
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
  /**
   * Aktualizuje istniejący wpis w historii konserwacji.
   * @param {number} entryId
   * @param {object} entryData 
   */
  updateConservationEntry(entryId, entryData) {
    return request(`/monuments/history/${entryId}`, { method: 'PUT', body: JSON.stringify(entryData) });
  },

  deleteConservationEntry(entryId) {
    return request(`/monuments/history/${entryId}`, { method: 'DELETE' });
  },
};