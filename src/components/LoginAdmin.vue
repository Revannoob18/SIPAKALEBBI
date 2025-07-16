<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Login Admin</h1>
      <form @submit.prevent="login">
        <div class="input-group">
          <input
            type="text"
            v-model="form.username"
            placeholder="Username"
            required
          />
        </div>
        <div class="input-group">
          <input
            type="password"
            v-model="form.password"
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">Login</button>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

// Router
const router = useRouter();

// Reactive data
const form = ref({ 
  username: "", 
  password: "" 
});

const errorMessage = ref(""); // ✅ Ganti dari errorMsg ke errorMessage
const isLoading = ref(false);
const loginAttempts = ref(0);
const isBlocked = ref(false);
const blockTimeRemaining = ref(0);

// Constants
const MAX_ATTEMPTS = 3; // ✅ Dikurangi ke 3 sesuai permintaan
const BLOCK_DURATION = 1 * 60 * 1000; // ✅ 1 menit
let blockTimer = null;

// Login function
async function login() {
  // Cek jika sedang diblokir
  if (isBlocked.value) {
    errorMessage.value = `Terlalu banyak percobaan login. Coba lagi dalam ${blockTimeRemaining.value} detik.`;
    return;
  }
  
  if (isLoading.value) return;
  
  // Validasi input
  if (!form.value.username.trim() || !form.value.password.trim()) {
    errorMessage.value = "Username dan password harus diisi.";
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = ""; // ✅ Konsisten dengan errorMessage
  
  try {
    console.log("Sending login request:", {
      username: form.value.username,
      password: form.value.password
    });
    
    const res = await axios.post("http://localhost:5000/api/admin/login", {
      username: form.value.username,
      password: form.value.password,
    });
    
    console.log("Login response:", res.data);
    
    // Simpan token
    localStorage.setItem("authToken", res.data.token);
    
    // Reset attempts on successful login
    loginAttempts.value = 0;
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lastLoginAttempt');
    localStorage.removeItem('blockEndTime');
    
    // Redirect ke dashboard
    router.push("/admin/dashboard");
    
  } catch (err) {
    console.error("Login error:", err);
    
    if (err.response?.status === 429) {
      // Rate limited by backend
      errorMessage.value = err.response.data.error || "Terlalu banyak percobaan login.";
      isBlocked.value = true;
      startBlockTimer();
    } else if (err.response?.status === 400) {
      // Bad request - validation error
      errorMessage.value = err.response.data.message || "Username dan password harus diisi.";
    } else if (err.response?.status === 401) {
      // Unauthorized - wrong credentials
      loginAttempts.value++;
      localStorage.setItem('loginAttempts', loginAttempts.value.toString());
      localStorage.setItem('lastLoginAttempt', Date.now().toString());
      
      if (loginAttempts.value >= MAX_ATTEMPTS) {
        isBlocked.value = true;
        startBlockTimer();
        errorMessage.value = `Akun diblokir selama 1 menit karena terlalu banyak percobaan login yang gagal.`;
      } else {
        errorMessage.value = `Username atau password salah. Sisa percobaan: ${MAX_ATTEMPTS - loginAttempts.value}`;
      }
    } else {
      // Server error
      errorMessage.value = "Terjadi kesalahan server. Silakan coba lagi.";
    }
  } finally {
    isLoading.value = false;
  }
}

// Block timer function
function startBlockTimer() {
  const blockEndTime = Date.now() + BLOCK_DURATION;
  localStorage.setItem('blockEndTime', blockEndTime.toString());
  
  blockTimer = setInterval(() => {
    const now = Date.now();
    const remaining = blockEndTime - now;
    
    if (remaining <= 0) {
      // Block expired
      isBlocked.value = false;
      loginAttempts.value = 0;
      blockTimeRemaining.value = 0;
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lastLoginAttempt');
      localStorage.removeItem('blockEndTime');
      clearInterval(blockTimer);
      blockTimer = null;
    } else {
      blockTimeRemaining.value = Math.ceil(remaining / 1000);
    }
  }, 1000);
}

// Check block status on mount
function checkBlockStatus() {
  const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
  const blockEndTime = parseInt(localStorage.getItem('blockEndTime') || '0');
  
  loginAttempts.value = attempts;
  
  if (attempts >= MAX_ATTEMPTS && blockEndTime > Date.now()) {
    isBlocked.value = true;
    blockTimeRemaining.value = Math.ceil((blockEndTime - Date.now()) / 1000);
    startBlockTimer();
  }
}

// Lifecycle hooks
onMounted(() => {
  checkBlockStatus();
});

onUnmounted(() => {
  if (blockTimer) {
    clearInterval(blockTimer);
  }
});
</script>

<style scoped>
/* Latar belakang dengan animasi gradasi futuristik */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #2f318b, #ffffff);
  background-size: 300% 300%;
  animation: gradientMove 8s ease infinite;
  font-family: "Poppins", sans-serif;
  padding: 20px;
  box-sizing: border-box;
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Kartu login dengan efek futuristik */
.login-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  text-align: center;
  animation: fadeIn 1s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h1 {
  font-size: 2rem;
  color: #ffffff;
  margin-bottom: 1.5rem;
  font-weight: bold;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

/* Input field dengan efek neon */
.input-group {
  position: relative;
  margin-bottom: 1.5rem;
}

.input-group input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.input-group input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.input-group input:focus {
  border-color: #2f318b;
  box-shadow: 0 0 10px rgba(47, 49, 139, 0.8);
  outline: none;
}

/* Tombol login dengan efek futuristik */
button {
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #2f318b, #ffffff);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

button:hover {
  background: linear-gradient(135deg, #ffffff, #2f318b);
  color: #2f318b;
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

button:active {
  transform: scale(0.95);
}

/* Pesan error */
.error {
  color: red;
  font-size: 0.9rem;
  margin-top: 1rem;
}

/* Responsif */
@media (max-width: 768px) {
  .login-card {
    padding: 2rem;
  }

  h1 {
    font-size: 1.8rem;
  }

  button {
    font-size: 1rem;
  }
}
</style>