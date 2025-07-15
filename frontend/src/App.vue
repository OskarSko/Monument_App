<template>
  <div id="app">
    <div v-if="showAuthPanel" class="auth-overlay">
      <div class="auth-panel">
        <h2>{{ isRegistering ? 'Rejestracja nowego konta' : 'Logowanie' }}</h2>
        <form @submit.prevent="handleAuthAction">
          <div class="form-group">
            <label for="username">Nazwa użytkownika:</label>
            <input type="text" id="username" v-model="auth.username" required />
          </div>
          <div class="form-group">
            <label for="password">Hasło:</label>
            <input type="password" id="password" v-model="auth.password" required />
          </div>
          <button type="submit">{{ isRegistering ? 'Zarejestruj się' : 'Zaloguj' }}</button>
          <button type="button" @click="showAuthPanel = false">Anuluj</button>
          <p class="auth-toggle">
            {{ isRegistering ? 'Masz już konto?' : 'Nie masz jeszcze konta?' }}
            <a href="#" @click.prevent="isRegistering = !isRegistering">
              {{ isRegistering ? 'Zaloguj się' : 'Zarejestruj się' }}
            </a>
          </p>
        </form>
      </div>
    </div>

    <div class="map-wrapper">
      <MapView
        ref="mapViewComponent"
        :is-add-mode-active="addModeActive"
        :is-user-logged-in="!!token" 
        @add-monument-mode="handleOpenAddPanel"
        @map-clicked="handleMapClick"
        @monument-selected="showDetailsPanel"
        @request-login="handleLoginRequest"
      />
      <div class="auth-controls">
        <button v-if="!token" @click="openLoginPanel">Zaloguj</button>
        <button v-if="token" @click="logout">Wyloguj</button>
      </div>
    </div>

    <div class="add-monument-panel" :class="{ 'is-open': showAddForm }">
      <h2>Dodaj nowy pomnik</h2>
      <form @submit.prevent="addMonument">
        <div class="form-group">
          <label for="name">Nazwa:</label>
          <input type="text" id="name" v-model="newMonument.name" required />
        </div>
        <div class="form-group">
          <label for="description">Opis:</label>
          <textarea id="description" v-model="newMonument.description"></textarea>
        </div>
        <!-- NOWE POLE: Rok -->
        <div class="form-group">
          <label for="year">Rok powstania:</label>
          <input type="number" id="year" v-model.number="newMonument.year" placeholder="np. 1984" />
        </div>
        <!-- NOWE POLE: Autor -->
        <div class="form-group">
          <label for="author">Autor:</label>
          <input type="text" id="author" v-model="newMonument.author" />
        </div>
        <!-- NOWE POLE: Data ostatniej konserwacji -->
        <div class="form-group">
          <label for="last_restoration_date">Data ostatniej konserwacji:</label>
          <input type="date" id="last_restoration_date" v-model="newMonument.last_restoration_date" />
        </div>
        <!-- NOWE POLE: Status (jako lista rozwijana) -->
        <div class="form-group">
          <label for="status">Status:</label>
          <select id="status" v-model="newMonument.status">
            <option value="">(Wybierz status)</option>
            <option value="istniejący">Istniejący</option>
            <option value="zrekonstruowany">Zrekonstruowany</option>
            <option value="w ruinie">W ruinie</option>
            <option value="zniszczony">Zniszczony</option>
            <option value="inny">Inny</option>
          </select>
        </div>
        <div class="form-group">
          <label for="coords">Współrzędne (dł., szer.):</label>
          <input type="text" id="coords" v-model="newMonument.coordsInput" placeholder="np. 19.4000, 54.1667" required />
          <small>Możesz też kliknąć na mapie, aby ustawić współrzędne.</small>
        </div>
        <button type="submit" :disabled="!token">Dodaj pomnik</button>
        <button type="button" @click="cancelAddMonument">Anuluj</button>
      </form>
    </div>

    <div class="details-panel" :class="{ 'is-open': selectedMonument }">
      <div v-if="selectedMonument">
        <h2>{{ selectedMonument.name }}</h2>
        <p class="details-description">{{ selectedMonument.description || 'Brak opisu dla tego miejsca.' }}</p>
        <div class="details-coords">
          <strong>Współrzędne:</strong>
          <span>{{ selectedMonument.location.coordinates[1].toFixed(2) }} (szer.), {{ selectedMonument.location.coordinates[0].toFixed(4) }} (dł.)</span>
        </div>
        <button @click="closeDetailsPanel">Zamknij</button>
      </div>
    </div>

  </div>
</template>


<script>
import MapView from './components/MapView.vue';
import { useToast } from 'vue-toastification';

export default {
  name: 'App',
  components: {
    MapView
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      showAddForm: false,
      addModeActive: false,
      newMonument: {
        name: '',
        description: '',
        coordsInput: '',
        coordinates: []
      },
      token: null,
      showAuthPanel: false,
      isRegistering: false,
      auth: {
        username: '',
        password: ''
      },
      selectedMonument: null
    };
  },
  created() {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      this.token = storedToken;
      this.toast.info("Twoja sesja została przywrócona.");
    }
  },
  methods: {
    showDetailsPanel(monumentData) {
      this.selectedMonument = monumentData;
      if (this.showAddForm) {
        this.handleOpenAddPanel(false);
      }
    },

    closeDetailsPanel() {
      this.selectedMonument = null;
    },
    openLoginPanel() {
      this.isRegistering = false;
      this.showAuthPanel = true;
    },

    logout() {
      this.token = null;
      localStorage.removeItem('authToken');
      this.toast.success('Wylogowano pomyślnie.');
      if (this.showAddForm) {
        this.handleOpenAddPanel(false);
      }
    },

    async handleAuthAction() {
      const url = this.isRegistering
        ? 'http://localhost:3000/api/auth/register'
        : 'http://localhost:3000/api/auth/login';

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.auth)
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Wystąpił nieznany błąd.');
        }

        if (this.isRegistering) {
          this.toast.success('Rejestracja pomyślna! Teraz możesz się zalogować.');
          this.isRegistering = false;
          this.auth.password = '';
        } else {
          this.token = data.token;
          localStorage.setItem('authToken', data.token);
          this.toast.success('Zalogowano pomyślnie!');
          this.showAuthPanel = false;
          this.auth = { username: '', password: '' };
        }
      } catch (error) {
        this.toast.error(`Błąd: ${error.message}`);
      }
    },
    
    handleOpenAddPanel(isActive) {
      if (isActive && !this.token) {
        this.toast.warning('Musisz być zalogowany, aby dodać nowy pomnik.');
        this.openLoginPanel();
        return;
      }

      if (isActive) {
          this.closeDetailsPanel();
      }

      this.addModeActive = isActive;
      this.showAddForm = isActive;
      if (!isActive) {
        this.resetForm();
      }
    },

    resetForm() {
      this.newMonument = {
        name: '',
        historical_context: '',
        year: null,
        author: '',
        last_restoration_date: null,
        status: '',
        coordsInput: '',
        coordinates: []
      };
    },
    
    handleMapClick(lngLat) {
      if (!this.addModeActive) return;
      const lon = lngLat.lng.toFixed(6);
      const lat = lngLat.lat.toFixed(6);
      
      this.newMonument.coordsInput = `${lon}, ${lat}`;
      this.newMonument.coordinates = [parseFloat(lon), parseFloat(lat)];
      this.toast.info('Współrzędne zostały ustawione z mapy.');
    },

    async addMonument() {
      const parts = this.newMonument.coordsInput.split(',').map(s => parseFloat(s.trim()));
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        this.toast.error('Proszę wprowadzić poprawne współrzędne (długość, szerokość).');
        return;
      }
      this.newMonument.coordinates = [parts[0], parts[1]];

      try {
        const response = await fetch('http://localhost:3000/api/monuments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify({
              name: this.newMonument.name,
              // Upewnijmy się, że wysyłamy poprawną nazwę pola
              description: this.newMonument.historical_context, 
              year: this.newMonument.year || null, // Wyślij null, jeśli pole jest puste
              author: this.newMonument.author || null,
              last_restoration_date: this.newMonument.last_restoration_date || null,
              status: this.newMonument.status || null,
              // Backend musi teraz oczekiwać 'location' jako obiektu GeoJSON
              location: {
                  type: 'Point',
                  coordinates: this.newMonument.coordinates
              }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
             this.logout();
             this.toast.error("Twoja sesja wygasła. Proszę zalogować się ponownie.");
             return;
          }
          throw new Error(errorData.error || 'Nieznany błąd serwera');
        }
        
        this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers();
        this.toast.success('Pomnik dodany pomyślnie!');
        this.handleOpenAddPanel(false);

      } catch (error) {
        this.toast.error(`Błąd podczas dodawania pomnika: ${error.message}`);
      }
    },

    cancelAddMonument() {
      this.handleOpenAddPanel(false);
    }
  }
};
</script>

<style>
#app, body, html {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#app {
  text-align: center;
  color: #2c3e50;
  display: flex;
}
.map-wrapper {
  flex-grow: 1;
  height: 100%;
  position: relative;
}
.add-monument-panel {
  position: fixed; top: 0; right: -350px; width: 300px;
  height: 100%; background-color: white;
  box-shadow: -5px 0 15px rgba(0,0,0,0.2);
  padding: 20px; box-sizing: border-box;
  transition: right 0.3s ease-in-out;
  z-index: 1000; text-align: left;
}
.add-monument-panel.is-open { right: 0; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input[type="text"],
.form-group input[type="password"],
.form-group textarea {
  width: 100%; padding: 8px; border: 1px solid #ccc;
  border-radius: 4px; box-sizing: border-box;
}
.form-group small { font-size: 0.8em; color: #666; }
button {
  background-color: #007bff; color: white; padding: 10px 15px;
  border: none; border-radius: 4px; cursor: pointer;
  margin-right: 10px; transition: background-color 0.2s;
}
button:hover { background-color: #0056b3; }
button[type="button"] { background-color: #6c757d; }
button[type="button"]:hover { background-color: #5a6268; }


.auth-controls {
  position: absolute;
  bottom: 10px;
  left: 50px;
  z-index: 500;
}
.auth-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.auth-panel {
  background: white;
  padding: 25px 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  width: 340px;
  text-align: left;
}
.auth-panel h2 {
  margin-top: 0;
  text-align: center;
  margin-bottom: 20px;
}
.auth-toggle {
  font-size: 0.9em;
  margin-top: 15px;
  text-align: center;
  color: #666;
}
.auth-toggle a {
  color: #007bff;
  text-decoration: none;
  cursor: pointer;
  font-weight: bold;
}
.auth-toggle a:hover {
  text-decoration: underline;
}
</style>