<template>
  <div id="app">
    <!-- Kontener mapy -->
    <div class="map-wrapper" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;">
      <MapView
        ref="mapViewComponent"
        :is-add-mode-active="addModeActive"
        :is-user-logged-in="!!token"
        @add-monument-mode="handleOpenAddPanel"
        @map-clicked="handleMapClick"
        @monument-selected="handleMonumentSelected"
        @request-login="handleLoginRequest"
      />
      <!-- Kontrolki logowania -->
      <div class="auth-controls">
        <button v-if="!token" @click="openLoginPanel">Zaloguj</button>
        <button v-if="token" @click="logout">Wyloguj</button>
      </div>
    </div>

    <!-- Panele jako nakładki -->
    <AuthPanel
      v-if="showAuthPanel"
      :initial-is-registering="isRegistering"
      @close="showAuthPanel = false"
      @auth-success="handleAuthSuccess"
    />
    <AddMonumentPanel
      :is-open="showAddForm"
      :coordinates="newMonumentCoords"
      :is-user-logged-in="!!token"
      @close="handleOpenAddPanel(false)"
      @monument-added="handleMonumentAdded"
    />
    <MonumentDetailsPanel
      :monument="selectedMonument"
      :is-open="!!selectedMonument"
      :token="token"  
      @close="selectedMonument = null"
    /> <!-- POPRAWKA: Dodano /> do zamknięcia tagu -->
  </div>
</template>

<script>
import MapView from './components/MapView.vue';
import AuthPanel from './components/AuthPanel.vue';
import AddMonumentPanel from './components/AddMonumentPanel.vue';
import MonumentDetailsPanel from './components/MonumentDetailsPanel.vue';

export default {
  name: 'App',
  components: {
    MapView,
    AuthPanel,
    AddMonumentPanel,
    MonumentDetailsPanel,
  },
  inject: ['toast'], // Vue-Toastification jest wstrzykiwane
  data() {
    return {
      token: null, // Przechowuje token JWT
      showAuthPanel: false, // Kontroluje widoczność panelu logowania/rejestracji
      isRegistering: false, // Flaga dla trybu rejestracji w AuthPanel
      selectedMonument: null, // Wybrany pomnik do wyświetlenia w details panelu
      showAddForm: false, // Kontroluje widoczność panelu dodawania pomnika
      addModeActive: false, // Tryb dodawania pomnika na mapie (kursor)
      newMonumentCoords: null, // Współrzędne z kliknięcia na mapie dla nowego pomnika
    };
  },
  mounted() {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      this.token = storedToken;
      this.toast.info("Twoja sesja została przywrócona.");
      // Odśwież mapę po przywróceniu sesji, aby pokazać dane dla zalogowanego użytkownika
      this.$nextTick(() => {
        this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers();
      });
    }
  },
  methods: {
    handleOpenAddPanel(isActive) {
      if (isActive && !this.token) {
        this.handleLoginRequest();
        return;
      }
      // Zamknij panel szczegółów, jeśli otwierasz panel dodawania
      if (isActive) {
        this.selectedMonument = null;
      }
      this.addModeActive = isActive;
      this.showAddForm = isActive;
    },

    // Ustawia współrzędne po kliknięciu na mapie
    handleMapClick(lngLat) {
      if (!this.addModeActive) return;
      this.newMonumentCoords = [lngLat.lng, lngLat.lat];
      this.toast.info('Współrzędne zostały ustawione z mapy.');
    },

    // Otwiera panel szczegółów
    handleMonumentSelected(monumentData) {
      this.selectedMonument = monumentData;
      // Zamknij panel dodawania, jeśli otwierasz panel szczegółów
      if (this.showAddForm) {
        this.handleOpenAddPanel(false);
      }
    },

    // Otwiera panel logowania na żądanie z komponentu potomnego (np. MapView)
    handleLoginRequest() {
      this.toast.info('Zaloguj się, aby wykonać tę akcję.');
      this.openLoginPanel();
    },

    // --- Metody obsługujące zdarzenia z Paneli ---

    // Reakcja na pomyślne zalogowanie/rejestrację z AuthPanel
    handleAuthSuccess(token) {
      this.token = token;
      localStorage.setItem('authToken', token); // Zapisz token w Local Storage
      this.showAuthPanel = false;
      this.toast.success('Zalogowano pomyślnie!');
      // Odśwież markery na mapie, aby odzwierciedlić status zalogowania
      this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers();
    },

    // Reakcja na pomyślne dodanie pomnika z AddMonumentPanel
    handleMonumentAdded() {
      this.handleOpenAddPanel(false); // Zamknij panel dodawania
      // Wywołujemy metodę na komponencie MapView, aby odświeżyć markery
      this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers();
      this.toast.success('Pomnik dodany pomyślnie!');
    },

    // --- Metody związane z autoryzacją (wywoływane przez przyciski) ---

    openLoginPanel() {
      this.isRegistering = false; // Domyślnie tryb logowania
      this.showAuthPanel = true;
    },

    logout() {
      this.token = null; // Wyczyść token w stanie komponentu
      localStorage.removeItem('authToken'); // Usuń token z Local Storage
      this.toast.success('Wylogowano pomyślnie.');
      // Jeśli panel dodawania był otwarty, zamknij go
      if (this.showAddForm) {
        this.handleOpenAddPanel(false);
      }
      // Odśwież markery na mapie, aby odzwierciedlić status wylogowania
      this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers();
    },
  }
};
</script>