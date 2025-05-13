<template>
  <div class="admin-dashboard">
    <header class="dashboard-header">
      <h1>Dashboard Admin</h1>
    </header>

    <main class="dashboard-content">
      <!-- List Section -->
      <section class="list-section">
        <h2>Daftar Pengunjung</h2>
        <div class="filter-section">
          <label for="filter-date">Filter Tanggal:</label>
          <input
            type="date"
            id="filter-date"
            v-model="filterDate"
            @change="filterPengunjung"
          />
          <p class="visitor-count">
            Jumlah Pengunjung: {{ filteredPengunjungList.length }}
          </p>
        </div>
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
            <tr v-for="p in filteredPengunjungList" :key="p.id">
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
      </section>

      <!-- Form Section -->
      <section
        class="form-section"
        ref="formSection"
        :class="{ visible: formVisible }"
      >
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

          <div class="form-buttons">
            <button type="submit">
              {{ isEdit ? "Edit" : "Tambah Pengunjung" }}
            </button>
            <button type="button" @click="resetForm" v-if="isEdit">
              Batal Edit
            </button>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup>
import axios from "axios";
import { useToast } from "vue-toastification";
import { h, ref, reactive, onMounted, watch } from "vue";

// Data dan State
const pengunjungList = ref([]);
const filteredPengunjungList = ref([]); // Daftar pengunjung yang difilter
const filterDate = ref(""); // Tanggal yang dipilih untuk filter
const form = reactive({
  nama: "",
  alasan: "",
  tujuan: "",
  dari_kelas: "",
});
const selectedFile = ref(null);
const isEdit = ref(false);
const editId = ref(null);
const formVisible = ref(false); // Kontrol visibilitas form

// Toast untuk notifikasi
const toast = useToast();

// Fungsi untuk mengambil data pengunjung
const ambilData = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/pengunjung");
    pengunjungList.value = res.data;
    filteredPengunjungList.value = res.data; // Perbarui daftar yang difilter
    toast.success("Data pengunjung berhasil dimuat!");
  } catch (err) {
    console.error("Gagal mengambil data pengunjung:", err);
    toast.error("Gagal memuat data pengunjung.");
  }
};

// Fungsi untuk memfilter pengunjung berdasarkan tanggal
const filterPengunjung = () => {
  if (!filterDate.value) {
    // Jika tidak ada tanggal yang dipilih, tampilkan semua data
    filteredPengunjungList.value = pengunjungList.value;
    return;
  }

  // Filter data berdasarkan tanggal
  const selectedDate = new Date(filterDate.value).toDateString();
  filteredPengunjungList.value = pengunjungList.value.filter((p) => {
    const pengunjungDate = new Date(p.waktu).toDateString();
    return pengunjungDate === selectedDate;
  });
};

// Fungsi untuk menangani perubahan file
const onFileChange = (e) => {
  selectedFile.value = e.target.files[0];
};

// Fungsi untuk mereset form
const resetForm = () => {
  form.nama = "";
  form.alasan = "";
  form.tujuan = "";
  form.dari_kelas = "";
  selectedFile.value = null;
  isEdit.value = false;
  editId.value = null;
};

// Fungsi untuk mempersiapkan mode edit
const prepareEdit = (p) => {
  form.nama = p.nama;
  form.alasan = p.alasan;
  form.tujuan = p.tujuan;
  form.dari_kelas = p.kelas;
  editId.value = p.id; // Simpan ID data yang akan diedit
  isEdit.value = true; // Aktifkan mode edit
};

// Fungsi untuk menambah atau mengedit pengunjung
const tambahPengunjung = async () => {
  try {
    if (isEdit.value) {
      // Mode Edit: Perbarui data pengunjung
      if (!editId.value) {
        toast.error("ID pengunjung tidak valid.");
        return;
      }

      await axios.put(`http://localhost:5000/api/pengunjung/${editId.value}`, {
        nama: form.nama,
        alasan: form.alasan,
        tujuan: form.tujuan,
        kelas: form.dari_kelas,
      });

      if (selectedFile.value) {
        const fd = new FormData();
        fd.append("foto", selectedFile.value);
        fd.append("pengunjung_id", editId.value);
        await axios.post("http://localhost:5000/api/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success("Data pengunjung berhasil diperbarui!");
    } else {
      // Mode Tambah: Tambahkan data pengunjung baru
      const res = await axios.post("http://localhost:5000/api/pengunjung", {
        nama: form.nama,
        alasan: form.alasan,
        tujuan: form.tujuan,
        kelas: form.dari_kelas,
      });
      const newId = res.data.id;

      if (selectedFile.value) {
        const fd = new FormData();
        fd.append("foto", selectedFile.value);
        fd.append("pengunjung_id", newId);
        await axios.post("http://localhost:5000/api/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success("Pengunjung berhasil ditambahkan!");
    }

    // Reset form dan ambil data terbaru
    resetForm();
    ambilData();
  } catch (err) {
    console.error("Gagal tambah/edit pengunjung:", err);
    toast.error("Terjadi kesalahan saat menyimpan data.");
  }
};

// Fungsi untuk menghapus pengunjung
const hapus = async (id) => {
  toast(
    () =>
      h("div", { style: { display: "flex", flexDirection: "column" } }, [
        h("p", "Apakah Anda yakin ingin menghapus data ini?"),
        h(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
            },
          },
          [
            h(
              "button",
              {
                style: {
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  cursor: "pointer",
                },
                onClick: async () => {
                  try {
                    await axios.delete(
                      `http://localhost:5000/api/pengunjung/${id}`
                    );
                    ambilData();
                    toast.success("Pengunjung berhasil dihapus!");
                  } catch (err) {
                    console.error("Gagal menghapus pengunjung:", err);
                    toast.error("Terjadi kesalahan saat menghapus data.");
                  }
                },
              },
              "Ya"
            ),
            h(
              "button",
              {
                style: {
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  cursor: "pointer",
                },
                onClick: () => {
                  toast.dismiss();
                },
              },
              "Tidak"
            ),
          ]
        ),
      ]),
    {
      timeout: false,
    }
  );
};

// IntersectionObserver untuk mendeteksi form
onMounted(() => {
  ambilData();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          formVisible.value = true;
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(document.querySelector(".form-section"));
});

// Panggil filterPengunjung setiap kali data pengunjung diperbarui
watch(pengunjungList, () => {
  filterPengunjung();
});
</script>

<style scoped>
/* Global Layout */
.admin-dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #ffffff; /* Latar belakang tetap putih */
  font-family: "Poppins", sans-serif; /* Font modern */
  color: #2f318b; /* Warna teks utama */
}

/* Header */
.dashboard-header {
  background-color: #2f318b; /* Warna biru gelap */
  color: white;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Bayangan lembut */
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
}

/* Main Content */
.dashboard-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  padding: 2rem;
}

/* Form Section */
.form-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* Bayangan lembut */
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.form-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #2f318b; /* Warna biru gelap */
}

.form-section form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section input {
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-section input:focus {
  border-color: #2f318b; /* Warna biru gelap */
  box-shadow: 0 0 8px rgba(47, 49, 139, 0.25);
  outline: none;
}

.form-buttons {
  display: flex;
  gap: 1rem;
}

.form-buttons button {
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.form-buttons button[type="submit"] {
  background-color: #2f318b; /* Warna biru gelap */
  color: white;
}

.form-buttons button[type="submit"]:hover {
  background-color: #1e206b; /* Warna biru lebih gelap */
  transform: scale(1.05);
}

.form-buttons button[type="button"] {
  background-color: #6c757d;
  color: white;
}

.form-buttons button[type="button"]:hover {
  background-color: #5a6268;
  transform: scale(1.05);
}

/* List Section */
.list-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); /* Bayangan lembut */
}

.list-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #2f318b; /* Warna biru gelap */
}

.list-section table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
}

.list-section th,
.list-section td {
  padding: 1rem;
  border: 1px solid #dee2e6;
  text-align: left;
}

.list-section th {
  background-color: #2f318b; /* Warna biru gelap */
  color: white;
  font-weight: 600;
}

.list-section tr:nth-child(even) {
  background-color: #f8f9fa;
}

.list-section tr:hover {
  background-color: #eaf4ff;
  transition: background-color 0.3s ease;
}

.foto-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.foto-thumbnail:hover {
  transform: scale(1.1);
}

/* Filter Section */
.filter-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-section label {
  font-size: 1rem;
  font-weight: 600;
  color: #2f318b;
}

.filter-section input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.filter-section input:focus {
  border-color: #2f318b;
  box-shadow: 0 0 8px rgba(47, 49, 139, 0.25);
  outline: none;
}

.visitor-count {
  font-size: 1rem;
  font-weight: bold;
  color: #2f318b;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>