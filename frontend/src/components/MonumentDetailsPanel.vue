<template>
  <div class="side-panel details-panel" :class="{ 'is-open': isOpen }">
    <!-- v-if zapobiega błędom, gdy żaden pomnik nie jest wybrany (monument === null) -->
    <div v-if="monument">
      <h2>{{ monument.name }}</h2>
      
      <!-- Opis / Kontekst historyczny -->
      <p v-if="monument.description" class="details-description">
        {{ monument.description }}
      </p>
      
      <!-- Lista szczegółowych informacji -->
      <div class="details-list">
        <div v-if="monument.year" class="detail-item">
          <span class="detail-label">Rok powstania:</span>
          <span class="detail-value">{{ monument.year }}</span>
        </div>
        <div v-if="monument.author" class="detail-item">
          <span class="detail-label">Autor:</span>
          <span class="detail-value">{{ monument.author }}</span>
        </div>
        <div v-if="monument.status" class="detail-item">
          <span class="detail-label">Status:</span>
          <span class="detail-value">{{ monument.status }}</span>
        </div>
        <div v-if="monument.last_restoration_date" class="detail-item">
          <span class="detail-label">Ostatnia konserwacja:</span>
          <!-- Formatujemy datę, usuwając część z czasem -->
          <span class="detail-value">{{ new Date(monument.last_restoration_date).toLocaleDateString() }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Współrzędne:</span>
          <span class="detail-value">
            {{ monument.location.coordinates[1].toFixed(4) }}, {{ monument.location.coordinates[0].toFixed(4) }}
          </span>
        </div>
      </div>
      <hr class="section-divider">

      <div class="conservation-section">
        <h4>Historia Konserwacji</h4>
        
        <!-- Lista wpisów -->
        <ul v-if="conservationHistory.length > 0" class="history-list">
          <li v-for="entry in conservationHistory" :key="entry.id" class="history-item">
            <span class="history-date">{{ new Date(entry.conservation_date).toLocaleDateString() }}</span>
            <strong class="history-work-type">{{ entry.type_of_work }}</strong>
            <p v-if="entry.notes" class="history-notes">{{ entry.notes }}</p>
          </li>
        </ul>
        <p v-else class="no-history-message">Brak wpisów w historii konserwacji.</p>

        <button v-if="!showConservationForm" @click="showConservationForm = true" class="add-entry-button">
          Dodaj nowy wpis
        </button>
        
        <!-- Formularz dodawania nowego wpisu -->
        <form v-if="showConservationForm" @submit.prevent="addConservationEntry" class="conservation-form">
          <h5>Nowy wpis konserwacji</h5>
          <div class="form-group">
            <label for="conservation_date">Data pracy:</label>
            <input type="date" id="conservation_date" v-model="newConservationEntry.conservation_date" required />
          </div>
          <div class="form-group">
            <label for="type_of_work">Rodzaj pracy:</label>
            <input type="text" id="type_of_work" v-model="newConservationEntry.type_of_work" placeholder="np. Mycie, Malowanie" required />
          </div>
          <div class="form-group">
            <label for="notes">Uwagi:</label>
            <textarea id="notes" v-model="newConservationEntry.notes"></textarea>
          </div>
          <button type="submit">Zapisz wpis</button>
          <button type="button" @click="showConservationForm = false">Anuluj</button>
        </form>
      </div>

      <button @click="closePanel">Zamknij</button>
    </div>
  </div>
</template>

<script>
import apiService from '@/services/apiService';

export default {
  name: 'MonumentDetailsPanel',
  props: {
    monument: {
      type: Object,
      default: null,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    token: { // POPRAWKA: Prop 'token'
      type: String,
      default: null,
    },
  },
  emits: ['close'],
  inject: ['toast'], // POPRAWKA: Dodano inject dla toast
  data() {
    return {
      conservationHistory: [],
      showConservationForm: false,
      newConservationEntry: {
        conservation_date: '',
        type_of_work: '',
        notes: ''
      },
    };
  },
  watch: {
    monument(newMonument) {
      if (newMonument) {
        this.fetchHistory(newMonument.id);
      }
      if (!newMonument) {
        this.resetState();
      }
    }
  },
  methods: {
    async fetchHistory(monumentId) {
      try {
        this.conservationHistory = await apiService.fetchConservationHistory(monumentId);
      } catch (error) {
        this.toast.error(error.message || 'Nie udało się pobrać historii konserwacji.');
        this.conservationHistory = [];
      }
    },
    async addConservationEntry() {
      if (!this.monument) return;

      if (!this.token) { // Sprawdzamy przekazany token
        this.toast.error("Musisz być zalogowany, aby dodać wpis.");
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/api/monuments/${this.monument.id}/history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}` // Używamy przekazanego tokena
          },
          body: JSON.stringify(this.newConservationEntry)
        });

        if (!response.ok) {
          let errorText = 'Wystąpił błąd podczas zapisywania wpisu.';
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorText = errorData.error;
            }
          } catch (e) {
            errorText = `Błąd serwera: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorText);
        }

        this.toast.success('Wpis konserwacji został dodany!');
        this.showConservationForm = false;
        this.newConservationEntry = { conservation_date: '', type_of_work: '', notes: '' };

        await this.fetchHistory(this.monument.id);
      } catch (error) {
        this.toast.error(`Błąd: ${error.message}`);
      }
    },
    closePanel() {
      this.$emit('close');
    },
    resetState() {
      this.conservationHistory = [];
      this.showConservationForm = false;
      this.newConservationEntry = {
        conservation_date: '',
        type_of_work: '',
        notes: ''
      };
    }
  }
};
</script>

<style scoped lang="scss" src="@/styles/components/_monument-details-panel.scss"></style>