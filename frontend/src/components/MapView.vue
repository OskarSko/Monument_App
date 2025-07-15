<template>
  <div class="map-container" :class="{ 'add-mode': isAddModeActive }">
    <!-- Kontener mapy, jego style są teraz w sekcji <style> -->
    <div id="map"></div>
    <!-- Przycisk do dodawania, bez zmian -->
    <button @click="openAddMonumentPanel" class="add-button" title="Dodaj nowy pomnik">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>
  </div>
</template>

<script>
import maplibregl from 'maplibre-gl';

export default {
  name: 'MapView',
  props: {
    isAddModeActive: {
      type: Boolean,
      default: false
    },
    isUserLoggedIn: {
      type: Boolean,
      default: false
    }
  },
  // Wstrzykujemy 'toast' aby móc wyświetlać powiadomienia, np. o błędach
  inject: ['toast'],
  data() {
    return {
      map: null,
      monuments: [],
      markers: [],
      tempMarker: null,
      hoverPopup: new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 25
      })
    };
  },
  // WAŻNE: Poprawiona sekcja watch
  watch: {
    isAddModeActive(isAdding) {
      if (!isAdding && this.tempMarker) {
        this.tempMarker.remove();
        this.tempMarker = null;
      }
    },
    // To jest teraz poprawny watcher, który zareaguje na zmianę statusu logowania
    isUserLoggedIn() {
      // Po prostu odświeżamy markery, aby pokazać/ukryć prompt do kliknięcia
      this.fetchMonumentsAndAddMarkers();
    }
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      this.map = new maplibregl.Map({
        container: 'map',
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap Contributors'
            }
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
        },
        center: [19.4000, 54.1667], // Elbląg
        zoom: 13
      });

      this.map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

      this.map.on('load', () => {
        this.fetchMonumentsAndAddMarkers();

        this.map.on('click', (e) => {
          if (this.isAddModeActive) {
            if (this.tempMarker) {
              this.tempMarker.remove();
            }
            this.tempMarker = new maplibregl.Marker({ color: '#d9534f' })
              .setLngLat(e.lngLat)
              .addTo(this.map);
            this.$emit('map-clicked', e.lngLat);
          }
        });
      });

      this.map.on('error', (e) => {
        console.error('Błąd mapy:', e.error)
        this.toast.error('Wystąpił błąd podczas ładowania mapy.');
      });
    },
    
    clearMarkers() {
      this.markers.forEach(marker => marker.remove());
      this.markers = [];
    },
    
    async fetchMonumentsAndAddMarkers() {
      this.clearMarkers();
      try {
        const response = await fetch('http://localhost:3000/api/monuments');
        if (!response.ok) throw new Error('Błąd sieci podczas pobierania pomników');
        
        this.monuments = await response.json();
        this.addMonumentsToMap();
      } catch (error) {
        console.error('Błąd podczas pobierania pomników:', error);
        this.toast.error(error.message);
      }
    },

    addMonumentsToMap() {
      this.monuments.forEach(monument => {
        if (monument.location?.coordinates) {
          const marker = new maplibregl.Marker()
            .setLngLat(monument.location.coordinates)
            .addTo(this.map);
            
          this.markers.push(marker);

          const markerEl = marker.getElement();
          markerEl.style.cursor = 'pointer';

          markerEl.addEventListener('mouseenter', () => {
            this.hoverPopup
              .setLngLat(monument.location.coordinates)
              .setHTML(this.createPopupContent(monument))
              .addTo(this.map);
          });

          markerEl.addEventListener('mouseleave', () => {
            this.hoverPopup.remove();
          });

          markerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          
          if (this.isUserLoggedIn) {
            // Użytkownik zalogowany - można otworzyć panel szczegółów
            this.$emit('monument-selected', monument);
        }});
        }
      });
    },

    createPopupContent(monument) {
      const yearInfo = monument.year ? `<p><strong>Rok:</strong> ${monument.year}</p>` : '';
      const authorInfo = monument.author ? `<p><strong>Autor:</strong> ${monument.author}</p>` : '';
      const statusInfo = monument.status ? `<p><strong>Status:</strong> ${monument.status}</p>` : '';
      const clickPrompt = this.isUserLoggedIn ? `<p class="popup-click-prompt">Kliknij, aby otworzyć panel szczegółów.</p>` : `<p class="popup-click-prompt">Zaloguj się, by zobaczyć szczegóły.</p>`;

      return `
        <div class="monument-popup">
          <h3 class="popup-title">${monument.name}</h3>
          <div class="popup-details">
            ${yearInfo}
            ${authorInfo}
            ${statusInfo}
          </div>
          ${clickPrompt}
        </div>`;
    },

    openAddMonumentPanel() {
      this.$emit('add-monument-mode', true);
    }
  },
  beforeUnmount() {
    if (this.map) {
      this.map.remove();
    }
  }
};
</script>

<style scoped>
.map-container, #map {
  position: relative;
  height: 100%;
  width: 100%;
}

.map-container.add-mode {
  cursor: crosshair;
}

.add-button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  padding: 0; /* Dodano dla pewności */
  margin: 0; /* Dodano dla pewności */
}

.add-button svg {
  color: #333;
}

.add-button:hover {
  background-color: #f8f9fa;
  border-color: #a0a0a0;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Style dla popupu, można je przenieść do globalnego CSS jeśli będą reużywane */
:deep(.monument-popup .popup-title) {
  margin: 0 0 5px 0;
  color: #005a8d;
}
:deep(.monument-popup .popup-details p) {
  margin: 0;
  font-size: 13px;
}
:deep(.monument-popup .popup-click-prompt) {
  margin-top: 8px;
  font-style: italic;
  font-size: 12px;
  color: #555;
  border-top: 1px solid #eee;
  padding-top: 5px;
}
</style>