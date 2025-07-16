<template>
  <div class="form-page">
    <div class="form-container animate__animated animate__fadeInUp">
      <h1>Buku Tamu SMAN 1 BONE</h1>

      <!-- Rate limit warning -->
      <div v-if="showRateLimitWarning" class="rate-limit-warning">
        ⚠️ Harap tunggu {{ cooldownRemaining }} detik sebelum submit lagi
      </div>

      <form @submit.prevent="handleSubmit">
        <label>Nama Tamu*</label>
        <input type="text" v-model="form.nama" required class="animate-focus" />

        <label>No.Hp*</label>
        <vue-tel-input
          v-model="form.hp"
          required
          placeholder="Masukkan nomor telepon"
        />

        <label>Asal Instansi*</label>
        <input
          type="text"
          v-model="form.instansi"
          required
          class="animate-focus"
        />

        <label>Yang Ingin Ditemui*</label>
        <input
          type="text"
          v-model="form.tujuan"
          required
          class="animate-focus"
        />
        <label>Keperluan*</label>
        <input
          type="text"
          v-model="form.keperluan"
          required
          class="animate-focus"
        />

        <button
          type="submit"
          class="animate__animated animate__pulse animate__delay-1s"
        >
          Lanjut ke Scan Wajah
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { usePengunjungStore } from "../storage/pengunjungStore";
import { VueTelInput } from "vue-tel-input";
import "vue-tel-input/dist/vue-tel-input.css";
import { useRouter } from "vue-router";

export default {
  components: { VueTelInput },
  data() {
    return {
      form: {
        nama: "",
        hp: "",
        instansi: "",
        tujuan: "",
        keperluan: "",
      },
      isSubmitting: false,
      lastSubmitTime: 0,
      cooldownPeriod: 15 * 1000, 
      showRateLimitWarning: false,
      cooldownRemaining: 0,
      cooldownTimer: null,
    };
  },
  setup() {
    const pengunjungStore = usePengunjungStore();
    const router = useRouter();
    return { pengunjungStore, router };
  },
  methods: {
    handleSubmit() {
      // Cek rate limiting
      if (this.checkRateLimit()) {
        return;
      }
      
      // Validasi form
      if (!this.validateForm()) {
        return;
      }
      
      this.isSubmitting = true;
      this.lastSubmitTime = Date.now();
      
      // Simpan ke localStorage
      localStorage.setItem('lastSubmitTime', this.lastSubmitTime.toString());
      
      // Submit data
      this.pengunjungStore.setData(this.form);
      
      setTimeout(() => {
        this.isSubmitting = false;
        this.$router.push("/facescan");
      }, 1000);
    },
    
    checkRateLimit() {
      const now = Date.now();
      const lastSubmit = parseInt(localStorage.getItem('lastSubmitTime') || '0');
      const timeDiff = now - lastSubmit;
      
      if (timeDiff < this.cooldownPeriod) {
        this.showRateLimitWarning = true;
        this.cooldownRemaining = Math.ceil((this.cooldownPeriod - timeDiff) / 1000);
        this.startCooldownTimer();
        return true;
      }
      
      return false;
    },
    
    validateForm() {
      const required = ['nama', 'hp', 'instansi', 'tujuan', 'keperluan'];
      for (let field of required) {
        if (!this.form[field].trim()) {
          alert(`${field} harus diisi!`);
          return false;
        }
      }
      return true;
    },
    
    startCooldownTimer() {
      this.cooldownTimer = setInterval(() => {
        this.cooldownRemaining--;
        if (this.cooldownRemaining <= 0) {
          this.showRateLimitWarning = false;
          clearInterval(this.cooldownTimer);
        }
      }, 1000);
    },
  },
  
  mounted() {
    this.checkRateLimit();
  },
  
  beforeUnmount() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  },
};
</script>

<style scoped>
@import "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css";

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

.form-page {
  min-height: 100vh;
  background: url("/SIPAKALEBBI/images/background.jpg") no-repeat center center;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 10px 10px 10px;
  box-sizing: border-box;
}

.form-container {
  background: rgba(255, 255, 255, 0.82);
  padding: 1rem 1.2rem;
  max-width: 520px;
  min-width: 340px;
  min-height: 400px;
  max-height: 480px;
  width: 98%;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(6px);
  font-family: "Segoe UI", sans-serif;
  margin: 0 auto;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

label {
  display: block;
  margin-top: 0.6rem;
  font-weight: bold;
  color: #1976d2;
}

input,
textarea {
  width: 100%;
  box-sizing: border-box; /* Tambahkan ini */
  padding: 0.5rem;
  margin-top: 0.3rem;
  border: 1px solid #90caf9;
  border-radius: 10px;
  font-size: 1rem;
  background-color: #f9f9f9;
  transition: all 0.3s ease-in-out;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 10px rgba(33, 150, 243, 0.4);
  transform: scale(1.02);
}

button {
  margin-top: 1.5rem;
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #1976d2;
}
</style>
