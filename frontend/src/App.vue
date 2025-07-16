<template>
  <div id="app">
    <div class="search-container">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Wyszukaj pomnik po nazwie..."
        @input="debouncedSearch"
      />
    </div>
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
      <div class="auth-controls">
        <button v-if="!token" @click="openLoginPanel">Zaloguj</button>
        <button v-if="token" @click="logout">Wyloguj</button>
      </div>
    </div>

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
    />
  </div>
</template>

<script>
import MapView from './components/MapView.vue';
import AuthPanel from './components/AuthPanel.vue';
import AddMonumentPanel from './components/AddMonumentPanel.vue';
import MonumentDetailsPanel from './components/MonumentDetailsPanel.vue';


function debounce(fn, delay) {
  let timeoutID = null;
  return function (...args) {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}


export default {
  name: 'App',
  components: {
    MapView,
    AuthPanel,
    AddMonumentPanel,
    MonumentDetailsPanel,
  },
  inject: ['toast'],
  data() {
    return {
      token: null,
      showAuthPanel: false,
      isRegistering: false,
      selectedMonument: null,
      showAddForm: false,
      addModeActive: false,
      newMonumentCoords: null,
      searchQuery: '',
    };
  },
  created() {
    this.debouncedSearch = debounce(this.triggerSearch, 300);
  },
  mounted() {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      this.token = storedToken;
      this.toast.info("Twoja sesja została przywrócona.");
      this.$nextTick(() => {
        this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers();
      });
    }
  },
  beforeUnmount() {
    if (this.debouncedSearch && this.debouncedSearch.cancel) {
      this.debouncedSearch.cancel();
    }
  },
  methods: {
    triggerSearch() {
      if (this.$refs.mapViewComponent) {
        this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers(this.searchQuery);
      }
    },
    handleOpenAddPanel(isActive) {
      if (isActive && !this.token) {
        this.handleLoginRequest();
        return;
      }
      if (isActive) {
        this.selectedMonument = null;
      }
      this.addModeActive = isActive;
      this.showAddForm = isActive;
    },

    handleMapClick(lngLat) {
      if (!this.addModeActive) return;
      this.newMonumentCoords = [lngLat.lng, lngLat.lat];
      this.toast.info('Współrzędne zostały ustawione z mapy.');
    },

    handleMonumentSelected(monumentData) {
      this.selectedMonument = monumentData;
      if (this.showAddForm) {
        this.handleOpenAddPanel(false);
      }
    },

    handleLoginRequest() {
      this.toast.info('Zaloguj się, aby wykonać tę akcję.');
      this.openLoginPanel();
    },


    handleAuthSuccess(token) {
      this.token = token;
      localStorage.setItem('authToken', token);
      this.showAuthPanel = false;
      this.toast.success('Zalogowano pomyślnie!');
      this.triggerSearch();
      this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers();
    },

    handleMonumentAdded() {
      this.handleOpenAddPanel(false);
      this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers();
      this.toast.success('Pomnik dodany pomyślnie!');
      this.triggerSearch();
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
      this.$refs.mapViewComponent.fetchMonumentsAndAddMarkers();
    },
  }
};
</script>
