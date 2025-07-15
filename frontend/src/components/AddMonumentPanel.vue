<template>
  <div class="side-panel add-monument-panel" :class="{ 'is-open': isOpen }">
    <h2>Dodaj nowy pomnik</h2>
    <form @submit.prevent="addMonument">
      <div class="form-group">
        <label for="name">Nazwa:</label>
        <input type="text" id="name" v-model="form.name" required />
      </div>
      <div class="form-group">
        <label for="description">Opis:</label>
        <textarea id="description" v-model="form.description"></textarea>
      </div>
      <div class="form-group">
        <label for="year">Rok powstania:</label>
        <input type="number" id="year" v-model.number="form.year" placeholder="np. 1984" />
      </div>
      <div class="form-group">
        <label for="author">Autor:</label>
        <input type="text" id="author" v-model="form.author" />
      </div>
      <div class="form-group">
        <label for="last_restoration_date">Data ostatniej konserwacji:</label>
        <input type="date" id="last_restoration_date" v-model="form.last_restoration_date" />
      </div>
      <div class="form-group">
        <label for="status">Status:</label>
        <select id="status" v-model="form.status">
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
        <input type="text" id="coords" v-model="form.coordsInput" placeholder="np. 19.4000, 54.1667" required />
        <small>Możesz też kliknąć na mapie, aby ustawić współrzędne.</small>
      </div>
      <button type="submit">Dodaj pomnik</button>
      <button type="button" @click="cancel">Anuluj</button>
    </form>
  </div>
</template>

<script>
import apiService from '@/services/apiService';

const getInitialFormState = () => ({
  name: '',
  description: '',
  year: null,
  author: '',
  last_restoration_date: null,
  status: '',
  coordsInput: '',
});

export default {
  name: 'AddMonumentPanel',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    coordinates: {
      type: Array,
      default: null,
    },
  },
  emits: ['close', 'monument-added'],
  inject: ['toast'],
  data() {
    return {
      form: getInitialFormState(),
    };
  },
  watch: {
    // Reaguj na kliknięcie na mapie i zaktualizuj pole w formularzu
    coordinates(newCoords) {
      if (newCoords && newCoords.length === 2) {
        const [lon, lat] = newCoords;
        this.form.coordsInput = `${lon.toFixed(6)}, ${lat.toFixed(6)}`;
      }
    },
    // Resetuj formularz, gdy panel jest zamykany
    isOpen(newVal, oldVal) {
      // Resetuj formularz tylko wtedy, gdy panel jest zamykany
      if (oldVal === true && newVal === false) {
        // Opóźniamy reset, aby nie było widać "mignięcia" czyszczonych pól
        setTimeout(() => {
          this.resetForm();
        }, 300); // 300ms to czas trwania animacji wysuwania panelu
      }
    },
  },
  methods: {
    resetForm() {
      Object.assign(this.form, getInitialFormState());
    },
    async addMonument() {
      // POPRAWKA: Dodano `this.` przed `form`
      const parts = this.form.coordsInput.split(',').map(s => parseFloat(s.trim()));
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        this.$toast.error('Proszę wprowadzić poprawne współrzędne w formacie: długość, szerokość.');
        return;
      }

      const payload = {
        name: this.form.name,
        description: this.form.description,
        year: this.form.year || null,
        author: this.form.author || null,
        last_restoration_date: this.form.last_restoration_date || null,
        status: this.form.status || null,
        location: {
          type: 'Point',
          coordinates: [parts[0], parts[1]] // [długość, szerokość]
        }
      };

      try {
        await apiService.addMonument(payload);
        this.$emit('monument-added');
      } catch (error) {
        this.$toast.error(`Błąd podczas dodawania pomnika: ${error.message}`);
      }
    },
    cancel() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped lang="scss" src="@/styles/components/_add-monument-panel.scss"></style>