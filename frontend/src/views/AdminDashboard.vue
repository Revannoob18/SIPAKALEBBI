<template>
  <div class="admin-dashboard">
    <h1>Dashboard Admin</h1>

    <div class="form-section">
      <h2>{{ isEdit ? "Edit Pengunjung" : "Tambah Pengunjung" }}</h2>
      <form @submit.prevent="tambahPengunjung">
        <input type="text" v-model="form.nama" placeholder="Nama" required />
        <input
          type="text"
          v-model="form.alasan"
          placeholder="Alasan"
          required
        />
        <input
          type="text"
          v-model="form.tujuan"
          placeholder="Ingin Mengunjungi (opsional)"
        />
        <input
          type="text"
          v-model="form.dari_kelas"
          placeholder="Dari Kelas (opsional)"
        />
        <input type="file" @change="onFileChange" accept="image/*" />

        <button type="submit">
          {{ isEdit ? "Edit" : "Tambah Pengunjung" }}
        </button>
        <button type="button" @click="resetForm" v-if="isEdit">
          Batal Edit
        </button>
      </form>
    </div>

    <div class="list-section">
      <h2>Daftar Pengunjung</h2>
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Alasan</th>
            <th>Tujuan</th>
            <th>Kelas</th>
            <th>Foto</th>
            <th>Waktu</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pengunjungList" :key="p.id">
            <td>{{ p.nama }}</td>
            <td>{{ p.alasan }}</td>
            <td>{{ p.tujuan }}</td>
            <td>{{ p.kelas }}</td>
            <td>
              <img
                v-if="p.foto"
                :src="`http://localhost:5000${p.foto}`"
                alt="Foto Pengunjung"
                class="foto-thumbnail"
              />
              <span v-else>-</span>
            </td>
            <td>{{ new Date(p.waktu).toLocaleString() }}</td>
            <td>
              <button @click="prepareEdit(p)">Edit</button>
              <button @click="hapus(p.id)">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      pengunjungList: [],
      form: {
        nama: "",
        alasan: "",
        tujuan: "",
        dari_kelas: "",
      },
      selectedFile: null,
      isEdit: false,
      editId: null,
    };
  },
  methods: {
    async ambilData() {
      try {
        const res = await axios.get("http://localhost:5000/api/pengunjung");
        this.pengunjungList = res.data;
      } catch (err) {
        console.error("Gagal mengambil data pengunjung:", err);
      }
    },
    onFileChange(e) {
      this.selectedFile = e.target.files[0];
    },
    resetForm() {
      this.form = {
        nama: "",
        alasan: "",
        tujuan: "",
        dari_kelas: "",
      };
      this.selectedFile = null;
      this.isEdit = false;
      this.editId = null;
    },
    prepareEdit(p) {
      this.form = {
        nama: p.nama,
        alasan: p.alasan,
        tujuan: p.tujuan,
        dari_kelas: p.kelas,
      };
      this.editId = p.id;
      this.isEdit = true;
    },
    async tambahPengunjung() {
      // Kirim data teks dulu
      try {
        const res = await axios.post("http://localhost:5000/api/pengunjung", {
          nama: this.form.nama,
          alasan: this.form.alasan,
          tujuan: this.form.tujuan,
          kelas: this.form.dari_kelas,
        });
        const newId = res.data.id;

        // Jika ada file foto, kirim ke endpoint upload
        if (this.selectedFile) {
          const fd = new FormData();
          fd.append("foto", this.selectedFile);
          fd.append("pengunjung_id", newId);
          await axios.post("http://localhost:5000/api/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        this.resetForm();
        this.ambilData();
      } catch (err) {
        console.error("Gagal tambah/edit pengunjung:", err);
        alert("Terjadi kesalahan saat menyimpan data.");
      }
    },
    async hapus(id) {
      try {
        await axios.delete(`http://localhost:5000/api/pengunjung/${id}`);
        this.ambilData();
      } catch (err) {
        console.error("Gagal menghapus pengunjung:", err);
        alert("Terjadi kesalahan saat menghapus data.");
      }
    },
  },
  mounted() {
    this.ambilData();
  },
};
</script>

<style scoped>
/* Animasi masuk lembut */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-dashboard {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 2rem;
  background: linear-gradient(to bottom right, #f0f4ff, #ffffff);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  animation: fadeInUp 0.6s ease-out;
  font-family: "Segoe UI", sans-serif;
}

/* Judul utama */
.admin-dashboard h1 {
  text-align: center;
  font-size: 2.4rem;
  color: #2a2a2a;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

/* Seksi form & daftar */
.form-section,
.list-section {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  transition: box-shadow 0.3s ease;
}

.form-section:hover,
.list-section:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.form-section h2,
.list-section h2 {
  font-size: 1.6rem;
  margin-bottom: 1rem;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}

/* Grid Form */
.form-section form {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

/* Input field */
.form-section input[type="text"],
.form-section input[type="file"] {
  padding: 0.7rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 15px;
  transition: border-color 0.3s ease;
}

.form-section input:focus {
  border-color: #007bff;
  outline: none;
}

/* Tombol */
.form-section button {
  padding: 0.7rem 1.4rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.form-section button[type="button"] {
  background-color: #6c757d;
}

.form-section button:hover {
  background-color: #0056b3;
}

.list-section table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
}

.list-section th,
.list-section td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.list-section th {
  background-color: #007bff;
  color: white;
  font-weight: 600;
  font-size: 15px;
}

.list-section tr:nth-child(even) td {
  background-color: #f8f9fa;
}

.list-section tr:hover td {
  background-color: #eaf4ff;
}

.foto-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.list-section button {
  padding: 0.4rem 0.9rem;
  margin: 0 0.2rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.list-section button:hover {
  background-color: #c82333;
}

/* Responsive */
@media (max-width: 768px) {
  .form-section form {
    grid-template-columns: 1fr;
  }

  .list-section th,
  .list-section td {
    padding: 0.6rem;
  }

  .admin-dashboard {
    padding: 1.2rem;
  }
}
</style>
