const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // akses file foto
app.use("/models", express.static(path.join(__dirname,"models")))

// Koneksi ke database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // sesuaikan jika ada password
  database: "buku_tamu_sman1bone"
});

db.connect(err => {
  if (err) {
    console.error("❌ Gagal koneksi database:", err);
  } else {
    console.log("✅ Berhasil terhubung ke database.");
  }
});

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// ==============================
// ENDPOINT: TAMBAH PENGUNJUNG
// ==============================
app.post(
  "/api/pengunjung",
  upload.none(),   // ← multer akan parse semua field non-file di req.body
  (req, res) => {
    const { nama, alasan, tujuan, kelas } = req.body;
    if (!nama || !alasan || !tujuan || !kelas) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }
    const waktu = new Date();
    const sql =
      "INSERT INTO pengunjung (nama, alasan, tujuan, kelas, waktu) VALUES (?, ?, ?, ?, ?)";
    db.query(
      sql,
      [nama, alasan, tujuan, kelas, waktu],
      (err, result) => {
        if (err) {
          console.error("❌ Gagal menyimpan pengunjung:", err);
          return res.status(500).json({ message: "Gagal menyimpan data." });
        }
        res.status(201).json({ message: "Pengunjung ditambahkan.", id: result.insertId });
      }
    );
  }
);

// ==============================
// ENDPOINT: AMBIL SEMUA DATA PENGUNJUNG (+ FOTO WAJAH)
// ==============================
app.get("/api/pengunjung", (req, res) => {
  const sql = `
    SELECT 
      p.id, p.nama, p.alasan, p.tujuan, p.kelas, p.waktu,
      w.file_foto AS foto, w.waktu AS waktu_foto
    FROM pengunjung p
    LEFT JOIN wajah_pengunjung w
      ON p.id = w.pengunjung_id
    ORDER BY p.waktu DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Gagal mengambil data:", err);
      return res.status(500).json({ message: "Gagal mengambil data." });
    }
    res.json(results);
  });
});

// ==============================
// ENDPOINT: AMBIL PENGUNJUNG BY ID
// ==============================
app.get("/api/pengunjung/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM pengunjung WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Gagal mengambil by ID:", err);
      return res.status(500).json({ message: "Gagal mengambil data." });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan." });
    }
    res.json(results[0]);
  });
});

// ==============================
// ENDPOINT: HAPUS PENGUNJUNG
// ==============================
app.delete("/api/pengunjung/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM pengunjung WHERE id = ?";
  db.query(sql, [id], err => {
    if (err) {
      console.error("❌ Gagal menghapus:", err);
      return res.status(500).json({ message: "Gagal menghapus data." });
    }
    res.json({ message: "Data berhasil dihapus." });
  });
});

// ==============================
// ROUTER: UPLOAD FOTO WAJAH
// ==============================
const uploadRouter = require("./routes/upload");
app.use("/api/upload", uploadRouter);

// ==============================
// ROUTER: FACE SCAN WAJAH
// ==============================
const uploadFaceRouter = require("./routes/upload-face")
app.use("/api", uploadFaceRouter)

// ==============================
// ENDPOINT: LOGIN ADMIN
// ==============================
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// ==============================
// JALANKAN SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
