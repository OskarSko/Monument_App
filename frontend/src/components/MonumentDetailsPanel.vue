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
          <!-- ZMIANA: Pętla iterująca po historii -->
          <li v-for="entry in conservationHistory" :key="entry.id" class="history-item">
            
            <!-- NOWA SEKCJA: Formularz edycji (widoczny tylko dla edytowanego wpisu) -->
            <div v-if="editingEntryId === entry.id" class="conservation-form edit-form">
              <div class="form-group">
                <label :for="'edit-date-' + entry.id">Data pracy:</label>
                <input :id="'edit-date-' + entry.id" type="date" v-model="editFormData.conservation_date" required />
              </div>
              <div class="form-group">
                <label :for="'edit-work-' + entry.id">Rodzaj pracy:</label>
                <input :id="'edit-work-' + entry.id" type="text" v-model="editFormData.type_of_work" required />
              </div>
              <div class="form-group">
                <label :for="'edit-notes-' + entry.id">Uwagi:</label>
                <textarea :id="'edit-notes-' + entry.id" v-model="editFormData.notes"></textarea>
              </div>
              <div class="form-actions">
                <button @click="handleUpdate" class="btn-save">Zapisz zmiany</button>
                <button @click="cancelEdit" class="btn-cancel">Anuluj</button>
              </div>
            </div>

            <!-- ZMIANA: Widok standardowy (widoczny, gdy wpis NIE jest edytowany) -->
            <div v-else class="history-entry-content">
              <div class="entry-info">
                <span class="history-date">{{ new Date(entry.conservation_date).toLocaleDateString() }}</span>
                <strong class="history-work-type">{{ entry.type_of_work }}</strong>
                <p v-if="entry.notes" class="history-notes">{{ entry.notes }}</p>
              </div>
              <!-- NOWA SEKCJA: Przyciski akcji -->
              <div class="entry-actions">
                <button @click="startEdit(entry)" class="btn-edit">Edytuj</button>
                <button @click="handleDelete(entry.id)" class="btn-delete">Usuń</button>
              </div>
            </div>

          </li>
        </ul>

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
      editingEntryId: null, // Przechowuje ID aktualnie edytowanego wpisu
      editFormData: {}
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
    startEdit(entry) {
      // Ustawia, który wpis edytujemy
      this.editingEntryId = entry.id;
      // Kopiuje dane wpisu do formularza edycji, aby uniknąć modyfikacji oryginału
      // .slice(0, 10) formatuje datę do 'YYYY-MM-DD', wymaganego przez <input type="date">
      this.editFormData = { 
        ...entry, 
        conservation_date: entry.conservation_date.slice(0, 10) 
      };
      // Ukryj formularz dodawania, jeśli był otwarty
      this.showConservationForm = false;
    },
    cancelEdit() {
      // Resetuje stan edycji
      this.editingEntryId = null;
      this.editFormData = {};
    },
    async handleUpdate() {
      if (!this.editingEntryId) return;
      try {
        const updatedEntry = await apiService.updateConservationEntry(this.editingEntryId, this.editFormData);
        // Znajdź indeks edytowanego wpisu w lokalnej tablicy
        const index = this.conservationHistory.findIndex(e => e.id === this.editingEntryId);
        if (index !== -1) {
          // Zaktualizuj wpis, aby zmiana była od razu widoczna
          this.conservationHistory.splice(index, 1, updatedEntry);
        }
        this.toast.success('Wpis został zaktualizowany.');
        this.cancelEdit(); // Wyjdź z trybu edycji
      } catch (error) {
        this.toast.error(error.message || 'Błąd podczas aktualizacji wpisu.');
      }
    },
    async handleDelete(entryId) {
      if (window.confirm('Czy na pewno chcesz usunąć ten wpis?')) {
        try {
          await apiService.deleteConservationEntry(entryId);
          // Usuń wpis z lokalnej tablicy, aby odświeżyć widok
          this.conservationHistory = this.conservationHistory.filter(e => e.id !== entryId);
          this.toast.success('Wpis został usunięty.');
        } catch (error) {
          this.toast.error(error.message || 'Błąd podczas usuwania wpisu.');
        }
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
      this.cancelEdit();
    }
  }
};
</script>

<style scoped lang="scss" src="@/styles/components/_monument-details-panel.scss"></style>