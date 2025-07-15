import { createApp } from 'vue';
import App from './App.vue';
import Toast, { POSITION } from 'vue-toastification';
// Importuj style CSS dla toastów
import 'vue-toastification/dist/index.css';

const app = createApp(App);

// Opcje konfiguracyjne dla toastów (opcjonalne)
const options = {
    position: POSITION.BOTTOM_CENTER,
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: "button",
    icon: true,
    rtl: false
};

// Zarejestruj wtyczkę w aplikacji Vue
app.use(Toast, options);

app.mount('#app');