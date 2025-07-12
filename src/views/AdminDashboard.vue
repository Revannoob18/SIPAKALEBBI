<template>
  <div class="dashboard-root">
    <aside class="sidebar">
      <div class="logo">
        <svg width="32" height="32" fill="none"><circle cx="16" cy="16" r="16" fill="#2563eb"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-size="18" font-family="Arial" dy=".3em">BT</text></svg>
        <span>Buku Tamu</span>
      </div>
      <nav>
        <ul>
          <li :class="{active: tab==='qr'}" @click="tab='qr'">
            <span class="icon"><svg width="20" height="20" fill="none"><rect x="2" y="2" width="4" height="4" rx="1" fill="currentColor"/><rect x="14" y="2" width="4" height="4" rx="1" fill="currentColor"/><rect x="2" y="14" width="4" height="4" rx="1" fill="currentColor"/><rect x="14" y="14" width="4" height="4" rx="1" fill="currentColor"/></svg></span>
            Scan QR
          </li>
          <li :class="{active: tab==='list'}" @click="tab='list'">
            <span class="icon"><svg width="20" height="20" fill="none"><rect x="3" y="5" width="14" height="2" rx="1" fill="currentColor"/><rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor"/><rect x="3" y="13" width="14" height="2" rx="1" fill="currentColor"/></svg></span>
            Daftar Pengunjung
          </li>
          <li :class="{active: tab==='form'}" @click="tab='form'">
            <span class="icon"><svg width="20" height="20" fill="none"><rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M7 10h6M10 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            Tambah/Edit Pengunjung
          </li>
          <li :class="{active: tab==='report'}" @click="tab='report'">
            <span class="icon"><svg width="20" height="20" fill="none"><path d="M4 16v-4m4 4V8m4 8v-2m4 2V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
            Laporan Bulanan
          </li>
        </ul>
      </nav>
    </aside>
    <div class="main">
      <header class="header">
        <div class="header-title">
          <h1>Dashboard Admin</h1>
        </div>
        <div class="header-user">
          <svg width="28" height="28" fill="none"><circle cx="14" cy="10" r="5" fill="#2563eb"/><ellipse cx="14" cy="21" rx="8" ry="5" fill="#2563eb" fill-opacity="0.2"/></svg>
          <span>Admin</span>
        </div>
      </header>
      <main class="content">
        <!-- Statistik Card -->
        <div v-if="tab==='list' || tab==='report'" class="stats-row">
          <div class="stat-card">
            <div class="stat-title">Total Pengunjung</div>
            <div class="stat-value">{{ pengunjungList.length }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Aktif Bulan Ini</div>
            <div class="stat-value">{{ pengunjungBulanIni }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">QR Aktif</div>
            <div class="stat-value">{{ pengunjungList.filter(p=>p.is_active).length }}</div>
          </div>
        </div>

        <!-- QR Verification Section -->
        <section v-if="tab==='qr'" class="section">
          <h2>Verifikasi QR Code Pengunjung</h2>
          <div class="qr-actions">
            <button @click="showScanner = true" class="btn primary">
              <span class="icon"><svg width="20" height="20" fill="none"><rect x="2" y="2" width="4" height="4" rx="1" fill="currentColor"/><rect x="14" y="2" width="4" height="4" rx="1" fill="currentColor"/><rect x="2" y="14" width="4" height="4" rx="1" fill="currentColor"/><rect x="14" y="14" width="4" height="4" rx="1" fill="currentColor"/></svg></span>
              Scan QR Code
            </button>
            <div class="manual-input">
              <label for="manual-id">Masukkan ID Pengunjung:</label>
              <div class="input-wrapper">
                <input type="text" v-model="manualId" id="manual-id" placeholder="Contoh: 20" />
                <button @click="verifyManual" class="btn secondary">Verifikasi</button>
              </div>
            </div>
          </div>
          <!-- Scanner Modal -->
          <div v-if="showScanner" class="modal-backdrop">
            <div class="modal">
              <qrcode-stream camera="environment" @decode="onDecode" @init="onInit" />
              <button @click="showScanner = false" class="btn danger">Tutup Scanner</button>
            </div>
          </div>
          <!-- Data Hasil Scan -->
          <div v-if="scannedVisitor" class="visitor-details">
            <h3>Data Pengunjung</h3>
            <div class="visitor-info">
              <p><strong>Nama:</strong> {{ scannedVisitor.nama }}</p>
              <p><strong>No. HP:</strong> {{ scannedVisitor.hp }}</p>
              <p><strong>Asal Instansi:</strong> {{ scannedVisitor.instansi }}</p>
              <p><strong>Tujuan:</strong> {{ scannedVisitor.tujuan }}</p>
              <p><strong>Keperluan:</strong> {{ scannedVisitor.keperluan }}</p>
              <p><strong>Jumlah Kunjungan:</strong> {{ scannedVisitor.jumlah_kunjungan }}</p>
              <p><strong>Status QR:</strong> {{ scannedVisitor.is_active ? "Aktif" : "Nonaktif" }}</p>
            </div>
            <div class="action-buttons">
              <button @click="confirmVisit(scannedVisitor.id)" class="btn success">Konfirmasi Kunjungan</button>
              <button @click="revokeQR(scannedVisitor.id)" class="btn danger">Nonaktifkan QR Code</button>
            </div>
          </div>
        </section>

        <!-- List Section -->
        <section v-if="tab==='list'" class="section">
          <h2>Daftar Pengunjung</h2>
          <div class="filter-section">
            <label for="filter-date">Filter Tanggal:</label>
            <input type="date" id="filter-date" v-model="filterDate" @change="filterPengunjung" />
            <input type="text" v-model="searchNama" placeholder="Cari nama..." @input="filterPengunjung" />
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>No</th>
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
                <tr v-for="(p, i) in filteredPengunjungList" :key="p.id">
                  <td>{{ i + 1 }}</td>
                  <td>{{ p.nama }}</td>
                  <td>{{ p.hp }}</td>
                  <td>{{ p.instansi }}</td>
                  <td>{{ p.tujuan }}</td>
                  <td>{{ p.keperluan }}</td>
                  <td>
                    <img v-if="p.foto" :src="`http://localhost:5000${p.foto}`" alt="Foto Pengunjung" class="foto-thumbnail" />
                    <span v-else>-</span>
                  </td>
                  <td>{{ new Date(p.waktu).toLocaleString() }}</td>
                  <td>
                    <button @click="prepareEdit(p)" class="btn small">Edit</button>
                    <button @click="hapus(p.id)" class="btn small danger">Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Form Section -->
        <section v-if="tab==='form'" class="section">
          <h2>{{ isEdit ? "Edit Pengunjung" : "Tambah Pengunjung" }}</h2>
          <form @submit.prevent="tambahPengunjung" class="form-grid">
            <div>
              <label>Nama Tamu</label>
              <input type="text" v-model="form.nama" required />
            </div>
            <div>
              <label>No. HP</label>
              <input type="text" v-model="form.hp" required />
            </div>
            <div>
              <label>Asal Instansi</label>
              <input type="text" v-model="form.instansi" required />
            </div>
            <div>
              <label>Yang Ingin Ditemui</label>
              <input type="text" v-model="form.tujuan" required />
            </div>
            <div>
              <label>Keperluan</label>
              <input type="text" v-model="form.keperluan" required />
            </div>
            <div>
              <label>Foto (opsional)</label>
              <input type="file" @change="onFileChange" accept="image/*" />
            </div>
            <div class="form-buttons">
              <button type="submit" class="btn primary">{{ isEdit ? "Edit" : "Tambah Pengunjung" }}</button>
              <button type="button" @click="resetForm" v-if="isEdit" class="btn secondary">Batal Edit</button>
            </div>
          </form>
        </section>

        <!-- Report Section -->
        <section v-if="tab==='report'" class="section">
          <h2>Laporan Pengunjung Bulanan</h2>
          <VisitorChart :data="monthlyReport"/>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { useToast } from "vue-toastification";
import { h, ref, reactive, onMounted, watch, nextTick, computed } from "vue";
import { QrcodeStream } from "vue-qrcode-reader";
import VisitorChart from "@/components/VisitorChart.vue";

const tab = ref("qr");
const pengunjungList = ref([]);
const filteredPengunjungList = ref([]);
const filterDate = ref("");
const searchNama = ref("");
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
const formVisible = ref(false);
const showScanner = ref(false);
const manualId = ref("");
const scannedVisitor = ref(null);

const monthlyReport = ref({
  labels: [],
  data: []
});

const toast = useToast();

const pengunjungBulanIni = computed(() => {
  const now = new Date();
  const bulan = now.getMonth();
  const tahun = now.getFullYear();
  return pengunjungList.value.filter(p => {
    const tgl = new Date(p.waktu);
    return tgl.getMonth() === bulan && tgl.getFullYear() === tahun;
  }).length;
});

// Contoh: Ambil data admin yang butuh token
async function ambilDataAdmin() {
  try {
    const res = await axios.get("http://localhost:5000/api/admin/protected", {
      headers: {
        Authorization: localStorage.getItem("authToken")
      }
    });
    // proses data admin di sini
    console.log(res.data);
  } catch (err) {
    toast.error("Akses tidak diizinkan, silakan login ulang.");
    window.location.href = "/admin";
  }
}

async function ambilData() {
  try {
    const res = await axios.get("http://localhost:5000/api/pengunjung");
    pengunjungList.value = res.data;
    filteredPengunjungList.value = res.data;
  } catch (err) {
    toast.error("Gagal memuat data pengunjung.");
  }
}

async function ambilLaporanBulanan() {
  try {
    const res = await axios.get("http://localhost:5000/api/pengunjung/laporan-bulanan");
    console.log("Laporan bulanan:", res.data);
    monthlyReport.value.labels = res.data.map(d => d.bulan);
    monthlyReport.value.data = res.data.map(d => d.jumlah);
  } catch (err) {
    console.error("Error laporan bulanan:", err);
    toast.error("Gagal memuat laporan bulanan");
  }
}

function filterPengunjung() {
  let list = pengunjungList.value;
  if (filterDate.value) {
    const selectedDate = new Date(filterDate.value).toDateString();
    list = list.filter((p) => {
      const pengunjungDate = new Date(p.waktu).toDateString();
      return pengunjungDate === selectedDate;
    });
  }
  if (searchNama.value) {
    list = list.filter((p) =>
      p.nama.toLowerCase().includes(searchNama.value.toLowerCase())
    );
  }
  filteredPengunjungList.value = list;
}

function onFileChange(e) {
  selectedFile.value = e.target.files[0];
}

function resetForm() {
  form.nama = "";
  form.hp = "";
  form.instansi = "";
  form.tujuan = "";
  form.keperluan = "";
  selectedFile.value = null;
  isEdit.value = false;
  editId.value = null;
}

function prepareEdit(p) {
  form.nama = p.nama;
  form.hp = p.hp;
  form.instansi = p.instansi;
  form.tujuan = p.tujuan;
  form.keperluan = p.keperluan;
  editId.value = p.id;
  isEdit.value = true;
  tab.value = "form";
}

async function tambahPengunjung() {
  try {
    if (isEdit.value) {
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
    resetForm();
    ambilData();
  } catch (err) {
    toast.error("Terjadi kesalahan saat menyimpan data.");
  }
}

async function hapus(id) {
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
                    await axios.delete(`http://localhost:5000/api/pengunjung/${id}`);
                    ambilData();
                    toast.success("Pengunjung berhasil dihapus!");
                  } catch (err) {
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
}

async function onInit(promise) {
  try {
    await promise;
  } catch (error) {
    toast.error(`Gagal menginisialisasi pemindai: ${error.message}`, {
      timeout: 3000,
    });
  }
}

async function onDecode(result) {
  try {
    let id = result;
    if (typeof result === "string" && result.includes("/")) {
      id = result.split("/").pop();
    }
    if (!/^\d+$/.test(id)) {
      throw new Error("QR code tidak valid! (ID tidak ditemukan)");
    }
    const response = await axios.get(`http://localhost:5000/api/pengunjung/${id}`);
    scannedVisitor.value = response.data;
    showScanner.value = false;
    toast.success("Pengunjung ditemukan!", { timeout: 2000 });
  } catch (error) {
    toast.error(
      `Gagal memverifikasi QR code: ${
        error.response?.data?.message || error.message
      }`,
      { timeout: 3000 }
    );
  }
}

async function verifyManual() {
  if (!manualId.value) {
    toast.error("Masukkan ID pengunjung!", { timeout: 2000 });
    return;
  }
  try {
    const response = await axios.get(`http://localhost:5000/api/pengunjung/${manualId.value}`);
    scannedVisitor.value = response.data;
    toast.success("Pengunjung ditemukan!", { timeout: 2000 });
    manualId.value = "";
  } catch (error) {
    toast.error(
      `Gagal memverifikasi ID: ${
        error.response?.data?.message || error.message
      }`,
      { timeout: 3000 }
    );
  }
}

async function confirmVisit(id) {
  try {
    await axios.patch(`http://localhost:5000/api/pengunjung/visit/${id}`);
    toast.success("Kunjungan dikonfirmasi!", { timeout: 2000 });
    ambilData();
  } catch (error) {
    toast.error(
      `Gagal mengkonfirmasi kunjungan: ${
        error.response?.data?.message || error.message
      }`,
      { timeout: 3000 }
    );
  }
}

async function revokeQR(id) {
  try {
    await axios.patch(`http://localhost:5000/api/pengunjung/revoke/${id}`);
    toast.success("QR code dinonaktifkan!", { timeout: 2000 });
    ambilData();
    if (scannedVisitor.value && scannedVisitor.value.id === id) {
      scannedVisitor.value.is_active = false;
    }
  } catch (error) {
    toast.error(
      `Gagal menonaktifkan QR: ${
        error.response?.data?.message || error.message
      }`,
      { timeout: 3000 }
    );
  }
}

onMounted(async () => {
  await ambilDataAdmin();
  await ambilData();
  await ambilLaporanBulanan();
});

watch([pengunjungList, filterDate, searchNama], () => {
  filterPengunjung();
});
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  height: auto;
  background: #f4f6fb;
}
.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 2rem 1rem 1rem 1rem;
}
.logo {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-weight: bold;
  font-size: 1.2rem;
  color: #2563eb;
  margin-bottom: 2rem;
}
.sidebar nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sidebar nav li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.2rem;
  margin-bottom: 0.5rem;
  border-radius: 10px;
  cursor: pointer;
  color: #64748b;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}
.sidebar nav li.active,
.sidebar nav li:hover {
  background: #2563eb;
  color: #fff;
}
.sidebar nav li .icon {
  display: flex;
  align-items: center;
  color: inherit;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 1.5rem 2.5rem 1rem 2.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #222;
  margin: 0;
}
.header-user {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-weight: 500;
  color: #2563eb;
}
.content {
  padding: 2rem 2.5rem;
}
.stats-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(59,130,246,0.06);
  padding: 1.2rem 2rem;
  min-width: 180px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.stat-title {
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}
.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2563eb;
}
.section {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 12px 0 rgba(59,130,246,0.08);
  padding: 2rem 2rem 1.5rem 2rem;
  margin-bottom: 2rem;
}
.qr-actions {
  display: flex;
  gap: 2.5rem;
  align-items: flex-end;
  margin-bottom: 2rem;
}
.manual-input label {
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 0.3rem;
}
.input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
input[type="text"], input[type="date"], input[type="file"] {
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  padding: 0.6rem 1rem;
  font-size: 1rem;
  outline: none;
  background: #f8fafc;
  transition: border 0.2s;
}
input[type="text"]:focus, input[type="date"]:focus {
  border: 1.5px solid #2563eb;
}
.btn {
  border: none;
  border-radius: 7px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  background: #e5e7eb;
  color: #222;
}
.btn.primary {
  background: #2563eb;
  color: #fff;
}
.btn.secondary {
  background: #f1f5f9;
  color: #2563eb;
}
.btn.success {
  background: #22c55e;
  color: #fff;
}
.btn.danger {
  background: #ef4444;
  color: #fff;
}
.btn.small {
  padding: 0.3rem 0.7rem;
  font-size: 0.95rem;
}
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: #fff;
}
.data-table th, .data-table td {
  padding: 0.7rem 1rem;
  text-align: left;
}
.data-table th {
  background: #f1f5f9;
  color: #2563eb;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
}
.data-table tr:nth-child(even) {
  background: #f8fafc;
}
.data-table tr:hover {
  background: #e0e7ff;
}
.foto-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.filter-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2rem 2rem;
}
.form-grid label {
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 0.3rem;
  display: block;
}
.form-buttons {
  grid-column: 1 / -1;
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
.visitor-details {
  margin-top: 2rem;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 1.5rem;
}
.visitor-info p {
  margin: 0.3rem 0;
}
.action-buttons {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
}
.modal-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  background: rgba(30,41,59,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: #fff;
  border-radius: 14px;
  padding: 2rem 2.5rem;
  box-shadow: 0 4px 32px 0 rgba(59,130,246,0.13);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
}
@media (max-width: 900px) {
  .sidebar { width: 60px; padding: 1rem 0.2rem; }
  .sidebar .logo span { display: none; }
  .sidebar nav li { justify-content: center; gap: 0; }
  .sidebar nav li span:not(.icon) { display: none; }
  .main { padding-left: 0; }
  .header, .content { padding-left: 1rem; padding-right: 1rem; }
  .section { padding: 1rem; }
  .stats-row { flex-direction: column; gap: 1rem; }
}
</style>