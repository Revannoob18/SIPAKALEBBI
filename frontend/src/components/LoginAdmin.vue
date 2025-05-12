<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Login Admin</h2>
      <form @submit.prevent="login">
        <div class="input-group">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="Enter username"
            required
          />
        </div>
        <div class="input-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="Enter password"
            required
          />
        </div>
        <button type="submit" class="login-btn">Login</button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LoginAdmin",
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    async login() {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/admin/login",
          {
            nama: this.username,
            password: this.password,
          }
        );

        if (response.data.success) {
          // Login berhasil, arahkan langsung ke dashboard admin
          this.$router.push("/admin/dashboard");
        } else {
          alert("Login gagal: " + response.data.message);
        }
      } catch (error) {
        console.error("Login error:", error);
        alert(
          "Gagal login. Periksa kembali username/password atau koneksi ke server."
        );
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #2196f3, #ffffff);
  animation: backgroundAnimate 15s ease-in-out infinite;
  background-size: 200% 200%;
}

.login-form {
  background: rgba(255, 255, 255, 0.9);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 300px;
}

.input-group {
  margin-bottom: 15px;
  text-align: left;
}

.input-group label {
  display: block;
  color: #333;
  font-size: 14px;
  margin-bottom: 5px;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.login-btn {
  background-color: #0d6efd;
  color: white;
  font-size: 16px;
  padding: 10px;
  width: 100%;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover {
  background-color: #084298;
}

@keyframes backgroundAnimate {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}
</style>
