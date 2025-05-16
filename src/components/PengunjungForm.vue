<template>
  <div class="form-page">
    <div class="form-container animate__animated animate__fadeInUp">
      <h1>Buku Tamu SMAN 1 BONE</h1>
      <form @submit.prevent="handleSubmit">
        <label>Nama Pengunjung*</label>
        <input type="text" v-model="form.nama" required class="animate-focus" />

        <label>Alasan Berkunjung*</label>
        <textarea
          v-model="form.alasan"
          required
          class="animate-focus"
        ></textarea>

        <label>Ingin Mengunjungi (opsional)</label>
        <input type="text" v-model="form.tujuan" class="animate-focus" />
        <label>Dari Kelas (opsional)</label>
        <input type="text" v-model="form.kelas" class="animate-focus" />

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
import axios from "axios";

export default {
  data() {
    return {
      form: {
        nama: "",
        alasan: "",
        tujuan: "",
        kelas: "",
      },
    };
  },
  methods: {
    async handleSubmit() {
      try {
        const formData = new FormData();
        formData.append("nama", this.form.nama);
        formData.append("alasan", this.form.alasan);
        formData.append("tujuan", this.form.tujuan);
        formData.append("kelas", this.form.kelas);

        const response = await axios.post(
          "http://localhost:5000/api/pengunjung",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log(response.data);
        const pengunjungId = response.data.id;
        this.$router.push(`/facescan/${pengunjungId}`);
      } catch (error) {
        console.error(
          "Gagal mengirim data pengunjung:",
          error.response?.data || error.message
        );
        alert("Gagal mengirim data, silakan coba lagi.");
      }
    },
  },
};
</script>

<style scoped>
@import "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css";

html, body {
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
  min-height: 360px;
  max-height: 430px;
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
  box-sizing: border-box;      /* Tambahkan ini */
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
