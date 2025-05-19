// 1. Import dari Vue, App, Router, Toastification, Pinia
import { createApp } from "vue"; // createApp API dari Vue 3 :contentReference[oaicite:0]{index=0}
import App from "./App.vue"; // Root component :contentReference[oaicite:1]{index=1}
import router from "./router"; // Vue Router setup :contentReference[oaicite:2]{index=2}
import { createPinia } from 'pinia';

// 2. Import paket Toast dan CSS-nya terpisah
import Toast, { POSITION } from "vue-toastification"; // Plugin dan enum posisi :contentReference[oaicite:3]{index=3}
import "vue-toastification/dist/index.css"; // CSS for toast styles :contentReference[oaicite:4]{index=4}

// 3. Buat instance app, daftarkan plugin, lalu mount
const app = createApp(App); // Membuat instance aplikasi :contentReference[oaicite:5]{index=5}
app.use(router); // Daftarkan router sebelum mount :contentReference[oaicite:6]{index=6}
app.use(createPinia());
app.use(Toast, {
  // Daftarkan Toastification plugin
  position: POSITION.TOP_RIGHT, // Posisi toast: pojok kanan atas :contentReference[oaicite:7]{index=7}
  timeout: 3000, // Durasi tampil (ms) :contentReference[oaicite:8]{index=8}
});
app.mount("#app"); // Mount ke elemen dengan id="app" :contentReference[oaicite:9]{index=9}
