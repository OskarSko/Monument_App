import { createApp } from 'vue';
import App from './App.vue';
import Toast, { useToast, POSITION } from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import './styles/main.scss'
import 'maplibre-gl/dist/maplibre-gl.css';

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
app.use(Toast, options);
const toast = useToast();
app.provide('toast', toast);
app.mount('#app');