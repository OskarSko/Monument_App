<template>
  <div class="map-container" :class="{ 'add-mode': isAddModeActive }">
    <div id="map" style="height: 100%; width: 100%;"></div>
    <button @click="openAddMonumentPanel" class="add-button" title="Dodaj nowy pomnik">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>
  </div>
</template>

<script>
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  data() {
    return {
      map: null,
      elblagCoords: [19.4000, 54.1667],
      monuments: [],
      markers: [],
      tempMarker: null,
      hoverPopup: new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
    })
    };
  },
  watch: {
    isAddModeActive(newValue) {
      if (newValue === false) {
        if (this.tempMarker) {
          this.tempMarker.remove();
          this.tempMarker = null;
        }
      }
    }
  },
  mounted() {
    // --- POCZĄTEK ZMIANY ---
    // Zamiast stylu Maptiler, używamy własnej definicji stylu
    // wskazującej bezpośrednio na kafelki OpenStreetMap.
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
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: this.elblagCoords,
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

    this.map.on('error', (e) => console.error('Błąd mapy:', e.error));
  },
  methods: {
    // Ta metoda pozostaje bez zmian - jest już poprawnie napisana.
    fetchMonumentsAndAddMarkers() {
      if (this.markers.length > 0) {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
      }
      fetch('http://localhost:3000/api/monuments')
        .then(response => response.json())
        .then(data => {
          this.monuments = data;
          this.monuments.forEach(monument => {
            if (monument.location && monument.location.coordinates) {
              const marker = new maplibregl.Marker().setLngLat(monument.location.coordinates).addTo(this.map);
              this.markers.push(marker);

              // Pobierz element DOM markera
              const markerEl = marker.getElement();
              markerEl.style.cursor = 'pointer';

              // --- NOWA LOGIKA DLA NAJAZDU MYSZKĄ ---
              markerEl.addEventListener('mouseenter', () => {
                // Gdy najeżdżamy, pokazujemy popup z samą nazwą
                this.hoverPopup
                  .setLngLat(monument.location.coordinates)
                  .setHTML(`<strong>${monument.name}</strong>`)
                  .addTo(this.map);
              });

              // --- NOWA LOGIKA DLA ZJAZDU MYSZKĄ ---
              markerEl.addEventListener('mouseleave', () => {
                this.hoverPopup.remove();
              });

              // --- NOWA LOGIKA DLA KLIKNIĘCIA ---
              markerEl.addEventListener('click', (e) => {
                e.stopPropagation();
                // Sprawdzamy stan zalogowania otrzymany z propsa
                if (this.isUserLoggedIn) {
                  // Jeśli zalogowany, emitujemy zdarzenie, aby pokazać szczegóły
                  this.$emit('monument-selected', monument);
                } else {
                  // Jeśli niezalogowany, emitujemy zdarzenie z prośbą o logowanie
                  this.$emit('request-login');
                }
              });
            }
          });
        })
        .catch(error => console.error('Błąd podczas pobierania pomników:', error));
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
/* Style pozostają bez zmian */
.map-container {
  position: relative;
  height: 100%;
  width: 100%;
}
.map-container.add-mode #map {
  cursor: crosshair !important;
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
  transition: all 0.2s ease-in-out;
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
</style>