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
              <th>Nama Tamu</th>
              <th>No. HP</th>
              <th>Asal Instansi</th>
              <th>Yang Ingin Ditemui</th>
              <th>Keperluan</th>
              <th>Foto</th>
              <th>Waktu</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredPengunjungList" :key="p.id">
              <td>{{ p.nama }}</td>
              <td>{{ p.hp }}</td>
              <td>{{ p.instansi }}</td>
              <td>{{ p.tujuan }}</td>
              <td>{{ p.keperluan }}</td>
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
          <input
            type="text"
            v-model="form.nama"
            placeholder="Nama Tamu"
            required
          />
          <input type="text" v-model="form.hp" placeholder="No. HP" required />
          <input
            type="text"
            v-model="form.instansi"
            placeholder="Asal Instansi"
            required
          />
          <input
            type="text"
            v-model="form.tujuan"
            placeholder="Yang Ingin Ditemui"
            required
          />
          <input
            type="text"
            v-model="form.keperluan"
            placeholder="Keperluan"
            required
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
  hp: "",
  instansi: "",
  tujuan: "",
  keperluan: "",
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
  form.hp = "";
  form.instansi = "";
  form.tujuan = "";
  form.keperluan = "";
  selectedFile.value = null;
  isEdit.value = false;
  editId.value = null;
};

// Fungsi untuk mempersiapkan mode edit
const prepareEdit = (p) => {
  form.nama = p.nama;
  form.hp = p.hp;
  form.instansi = p.instansi;
  form.tujuan = p.tujuan;
  form.keperluan = p.keperluan;
  editId.value = p.id;
  isEdit.value = true;
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
        hp: form.hp,
        instansi: form.instansi,
        tujuan: form.tujuan,
        keperluan: form.keperluan,
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
        hp: form.hp,
        instansi: form.instansi,
        tujuan: form.tujuan,
        keperluan: form.keperluan,
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
  background: linear-gradient(120deg, #e3f2fd 0%, #f8fafc 100%);
  font-family: "Poppins", sans-serif;
  color: #2f318b;
}

/* Header */
.dashboard-header {
  background: linear-gradient(90deg, #2f318b 60%, #1976d2 100%);
  color: white;
  padding: 2rem 1rem 1.2rem 1rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(47, 49, 139, 0.15);
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
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
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem 1.5rem;
  border-radius: 18px;
  box-shadow: 0 6px 24px rgba(47, 49, 139, 0.08);
  transition: box-shadow 0.3s, transform 0.3s;
  animation: fadeIn 0.7s;
}

.form-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #2f318b;
}

.form-section form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-buttons {
  display: flex;
  gap: 1rem;
}

.form-buttons button,
.list-section button {
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s, transform 0.2s;
  box-shadow: 0 2px 8px rgba(47, 49, 139, 0.08);
}

.form-buttons button[type="submit"],
.list-section button {
  background: linear-gradient(90deg, #2f318b 60%, #1976d2 100%);
  color: white;
}

.form-buttons button[type="submit"]:hover,
.list-section button:hover {
  background: linear-gradient(90deg, #1976d2 60%, #2f318b 100%);
  transform: scale(1.06);
}

.form-buttons button[type="button"] {
  background-color: #6c757d;
  color: white;
}

.form-buttons button[type="button"]:hover {
  background-color: #5a6268;
  transform: scale(1.05);
}

.form-section input {
  padding: 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-section input:focus {
  border-color: #2f318b;
  box-shadow: 0 0 8px rgba(47, 49, 139, 0.25);
  outline: none;
}

/* List Section */
.list-section {
  background: rgba(255, 255, 255, 0.95);
  padding: 2rem 1.5rem;
  border-radius: 18px;
  box-shadow: 0 6px 24px rgba(47, 49, 139, 0.08);
  transition: box-shadow 0.3s, transform 0.3s;
  animation: fadeIn 0.7s;
}

.list-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #2f318b;
}

.list-section table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
}

.list-section th,
.list-section td {
  padding: 1rem;
  border: 1px solid #dee2e6;
  text-align: left;
}

.list-section th {
  background: #1976d2;
  color: #fff;
  font-weight: 600;
}

.list-section tr:last-child td {
  border-bottom: none;
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

/* Animasi Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .dashboard-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.2rem;
  }
  .form-section,
  .list-section {
    padding: 1.2rem 0.7rem;
  }
}

@media (max-width: 600px) {
  .dashboard-header {
    padding: 1.2rem 0.5rem 0.8rem 0.5rem;
    border-bottom-left-radius: 18px;
    border-bottom-right-radius: 18px;
  }
  .dashboard-header h1 {
    font-size: 1.2rem;
  }
  .dashboard-content {
    padding: 0.5rem;
    gap: 0.7rem;
  }
  .form-section,
  .list-section {
    padding: 0.7rem 0.3rem;
    border-radius: 10px;
  }
  .list-section th,
  .list-section td {
    padding: 0.5rem;
    font-size: 0.95rem;
  }
  .foto-thumbnail {
    width: 36px;
    height: 36px;
  }
}
</style>
