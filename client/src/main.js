import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Global Stylesheet & Design Tokens
import './assets/styles/main.css';
import { setupGlobalAlertOverride } from './utils/swal';

// Install application-level alert interceptor (strictly no browser alerts)
setupGlobalAlertOverride();

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);

app.mount('#app');
