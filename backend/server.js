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
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // akses file foto
app.use("/models", express.static(path.join(__dirname, "models")));

// Koneksi ke database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // sesuaikan jika ada password
  database: "buku_tamu_sman1bone",
});

db.connect((err) => {
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
  },
});
const upload = multer({ storage });

// ==============================
// ENDPOINT: TAMBAH PENGUNJUNG
// ==============================
app.post(
  "/api/pengunjung",
  upload.single("foto"),
  (req, res) => {
    const { nama, hp, instansi, tujuan, keperluan } = req.body;
    if (!nama || !hp || !instansi || !tujuan || !keperluan) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }
    const waktu = new Date();
    const sql =
      "INSERT INTO pengunjung (nama, hp, instansi, tujuan, keperluan, waktu) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(
      sql,
      [nama, hp, instansi, tujuan, keperluan, waktu],
      (err, result) => {
        if (err) {
          console.error("❌ Gagal menyimpan pengunjung:", err);
          return res.status(500).json({ message: "Gagal menyimpan data." });
        }

        // Jika ada file foto, simpan ke wajah_pengunjung
        if (req.file) {
          const filePath = `/uploads/${req.file.filename}`;
          const sqlFoto = `
            INSERT INTO wajah_pengunjung (file_foto, pengunjung_id)
            VALUES (?, ?)
          `;
          db.query(sqlFoto, [filePath, result.insertId], (err2) => {
            if (err2) {
              console.error("❌ Gagal simpan foto:", err2);
              // Tidak return error, tetap lanjut
            }
            res.status(201).json({ message: "Pengunjung & foto ditambahkan.", id: result.insertId });
          });
        } else {
          res.status(201).json({ message: "Pengunjung ditambahkan.", id: result.insertId });
        }
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
      p.id, p.nama, p.hp, p.instansi, p.tujuan, p.keperluan, p.waktu,
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

// =============================
// ENDPOINT: UPDATE PENGUNJUNG
// =============================
app.put("/api/pengunjung/:id", (req, res) => {
  const { id } = req.params;
  const { nama, hp, instansi, tujuan, keperluan } = req.body;

  if (!nama || !hp || !instansi || !tujuan || !keperluan) {
    return res.status(400).json({ message: "Semua field wajib diisi." });
  }

  const sql = `
    UPDATE pengunjung 
    SET nama = ?, hp = ?, instansi= ?, tujuan = ?, keperluan = ? 
    WHERE id = ?
  `;

  db.query(sql, [nama, hp, instansi, tujuan, keperluan, id], (err, result) => {
    if (err) {
      console.error("❌ Gagal memperbarui data pengunjung:", err);
      return res.status(500).json({ message: "Gagal memperbarui data." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan." });
    }

    res.json({ message: "Data pengunjung berhasil diperbarui." });
  });
});

// ==============================
// ENDPOINT: HAPUS PENGUNJUNG
// ==============================
app.delete("/api/pengunjung/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM pengunjung WHERE id = ?";
  db.query(sql, [id], (err) => {
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
const uploadFaceRouter = require("./routes/upload-face");
app.use("/api", uploadFaceRouter);

// ==============================
// ENDPOINT: LOGIN ADMIN
// ==============================
const jwt = require("jsonwebtoken");

const SECRET_KEY = "your_secret_key"; // Ganti dengan kunci rahasia Anda

// Endpoint login admin
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  // Query untuk memeriksa username dan password di database
  const sql = "SELECT * FROM admin WHERE nama = ? AND password = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Error saat login:", err);
      return res.status(500).json({ message: "Terjadi kesalahan server." });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Username atau password salah." });
    }

    // Jika login berhasil, buat token JWT
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  });
});

// Middleware untuk memverifikasi token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token)
    return res.status(403).json({ message: "Token tidak ditemukan." });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Token tidak valid." });
    req.user = user;
    next();
  });
};

// Contoh endpoint yang dilindungi
app.get("/api/admin/protected", authenticateToken, (req, res) => {
  res.json({
    message: "Ini adalah data rahasia yang hanya bisa diakses oleh admin.",
  });
});

// ==============================
// JALANKAN SERVER              
// ==============================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
