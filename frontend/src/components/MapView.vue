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
        closeOnClick: false,
        offset: 25
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
  isUserLoggedIn(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.fetchMonumentsAndAddMarkers();
      }
  },
  mounted() {
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
    // Metoda do czyszczenia markerów przed ponownym załadowaniem
    clearMarkers() {
      if (this.markers.length > 0) {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
      }
    },
    
    // Zaktualizowana metoda do pobierania i wyświetlania pomników
    async fetchMonumentsAndAddMarkers() {
      this.clearMarkers(); // Najpierw czyścimy stare markery
      try {
        const response = await fetch('http://localhost:3000/api/monuments');
        if (!response.ok) {
          throw new Error('Błąd sieci podczas pobierania pomników');
        }
        const data = await response.json();
        this.monuments = data;
        this.addMonumentsToMap(); // Następnie dodajemy nowe
      } catch (error) {
        console.error('Błąd podczas pobierania lub przetwarzania pomników:', error);
      }
    },

    // Metoda do dodawania markerów na mapie
    addMonumentsToMap() {
        this.monuments.forEach(monument => {
            if (monument.location && monument.location.coordinates) {
                const marker = new maplibregl.Marker().setLngLat(monument.location.coordinates).addTo(this.map);
                this.markers.push(marker);

                const markerEl = marker.getElement();
                markerEl.style.cursor = 'pointer';

                // Popup po najechaniu (hover)
                markerEl.addEventListener('mouseenter', () => {
                    const popupContent = this.createPopupContent(monument);
                    this.hoverPopup
                        .setLngLat(monument.location.coordinates)
                        .setHTML(popupContent)
                        .addTo(this.map);
                });

                markerEl.addEventListener('mouseleave', () => {
                    this.hoverPopup.remove();
                });

                // Kliknięcie w marker
                markerEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // Zapobiega propagacji kliknięcia do mapy
                    if (this.isUserLoggedIn) {
                        this.$emit('monument-selected', monument); // Wyślij pełne dane do App.vue
                    } else {
                        // Poproś App.vue o otwarcie panelu logowania
                        this.$emit('request-login');
                    }
                });
            }
        });
    },

    // NOWA METODA: Dynamicznie tworzy treść HTML dla popupu
    createPopupContent(monument) {
      // Dla niezalogowanego użytkownika - prosty widok
      if (!this.isUserLoggedIn) {
        return `
          <div class="monument-popup">
            <h3 class="popup-title">${monument.name}</h3>
          </div>
        `;
      }
      
      // Dla zalogowanego użytkownika - widok szczegółowy
      const yearInfo = monument.year ? `<p><strong>Rok:</strong> ${monument.year}</p>` : '';
      const authorInfo = monument.author ? `<p><strong>Autor:</strong> ${monument.author}</p>` : '';
      const statusInfo = monument.status ? `<p><strong>Status:</strong> ${monument.status}</p>` : '';

      return `
        <div class="monument-popup">
          <h3 class="popup-title">${monument.name}</h3>
          <div class="popup-details">
            ${yearInfo}
            ${authorInfo}
            ${statusInfo}
          </div>
          <p class="popup-click-prompt">Kliknij, aby otworzyć panel szczegółów.</p>
        </div>
      `;
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