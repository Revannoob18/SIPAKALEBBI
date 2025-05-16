const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/database"); // pastikan meng-export koneksi mysql

// Konfigurasi multer untuk foto wajah
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `foto-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage });

// Endpoint: Upload foto wajah dan simpan ke DB
router.post("/", upload.single("foto"), (req, res) => {
  const { pengunjung_id } = req.body;
  if (!req.file || !pengunjung_id) {
    return res.status(400).json({ error: "pengunjung_id dan foto wajib diisi." });
  }
  const filePath = `/uploads/${req.file.filename}`;
  const waktu = new Date();
  const sql = `
    INSERT INTO wajah_pengunjung (file_foto, waktu, pengunjung_id)
    VALUES (?, ?, ?)
  `;
  db.query(sql, [filePath, waktu, pengunjung_id], err => {
    if (err) {
      console.error("❌ Gagal menyimpan foto:", err);
      return res.status(500).json({ error: "Gagal menyimpan foto." });
    }
    res.json({ message: "Foto berhasil diunggah.", filePath });
  });
});

module.exports = router;
