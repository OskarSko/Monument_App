<template>
  <div class="auth-overlay">
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
        <button type="button" @click="closePanel">Anuluj</button>
        <p class="auth-toggle">
          {{ isRegistering ? 'Masz już konto?' : 'Nie masz jeszcze konta?' }}
          <a href="#" @click.prevent="toggleMode">
            {{ isRegistering ? 'Zaloguj się' : 'Zarejestruj się' }}
          </a>
        </p>
      </form>
    </div>
  </div>
</template>

<script>
import apiService from '@/services/apiService';

export default {
  name: 'AuthPanel',
  props: {
    initialIsRegistering: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'auth-success'],
  inject: ['toast'],
  data() {
    return {
      isRegistering: this.initialIsRegistering,
      auth: {
        username: '',
        password: '',
      },
    };
  },
  methods: {
    async handleAuthAction() {
      try {
        if (this.isRegistering) {
          // Rejestracja
          await apiService.register(this.auth);
          this.toast.success('Rejestracja pomyślna! Teraz możesz się zalogować.');
          // Automatyczne przełączenie do panelu logowania
          this.isRegistering = false;
          this.auth.password = ''; // Wyczyść hasło po udanej rejestracji
        } else {
          // Logowanie
          const data = await apiService.login(this.auth);
          localStorage.setItem('authToken', data.token);
          this.toast.success('Zalogowano pomyślnie!');
          this.$emit('auth-success', data.token);
          this.closePanel(); // Zamknij panel po udanym logowaniu
        }
      } catch (error) {
        this.toast.error(error.message || 'Wystąpił nieznany błąd.');
      }
    },
    toggleMode() {
      this.isRegistering = !this.isRegistering;
      // Resetuj pola formularza przy przełączaniu
      this.auth.username = '';
      this.auth.password = '';
    },
    closePanel() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped lang="scss" src="@/styles/components/_auth-panel.scss"></style>