const express = require("express");
const router = express.Router();
const db = require("../config/database");
const multer = require("multer");
const upload = multer(); // Hanya parsing form-data

// GET semua pengunjung atau filter berdasarkan tanggal
router.get("/", (req, res) => {
  const { tanggal, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  
  let sql = `
    SELECT 
      p.id, p.nama, p.hp, p.instansi, p.tujuan, p.keperluan, p.waktu, p.jumlah_kunjungan, p.is_active,
      w.file_foto AS foto
    FROM pengunjung p
    LEFT JOIN wajah_pengunjung w ON p.id = w.pengunjung_id AND w.is_deleted = 0
    WHERE p.is_deleted = 0
  `;
  const params = [];

  if (tanggal) {
    sql += " AND DATE(p.waktu) = ?";
    params.push(tanggal);
  }

  sql += " ORDER BY p.waktu DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching pengunjung:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// POST tambah pengunjung
router.post("/", upload.single('foto'), (req, res) => {
  const { nama, hp, instansi, tujuan, keperluan } = req.body;
  const waktu = new Date();

  if (!nama || !hp || !instansi || !tujuan || !keperluan) {
    return res.status(400).json({ 
      error: "Semua field wajib diisi.",
      required: ["nama", "hp", "instansi", "tujuan", "keperluan"]
    });
  }

  const sql = "INSERT INTO pengunjung (nama, hp, instansi, tujuan, keperluan, waktu, jumlah_kunjungan, is_active) VALUES (?, ?, ?, ?, ?, ?, 1, TRUE)";
  db.query(sql, [nama, hp, instansi, tujuan, keperluan, waktu], (err, result) => {
    if (err) {
      console.error("❌ Error adding pengunjung:", err);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      message: "Pengunjung ditambahkan", 
      id: result.insertId,
      success: true
    });
  });
});

// DELETE pengunjung (soft delete)
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE pengunjung SET is_deleted = 1 WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Error deleting pengunjung:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pengunjung tidak ditemukan" });
    }
    res.json({ message: "Pengunjung dihapus" });
  });
});

// PUT edit pengunjung
router.put("/:id", upload.none(), (req, res) => {
  const { id } = req.params;
  const { nama, hp, instansi, tujuan, keperluan } = req.body;

  if (!nama || !hp || !instansi || !tujuan || !keperluan) {
    return res.status(400).json({ error: "Semua field wajib diisi." });
  }

  const sql = "UPDATE pengunjung SET nama = ?, hp = ?, instansi = ?, tujuan = ?, keperluan = ? WHERE id = ? AND is_deleted = 0";
  db.query(sql, [nama, hp, instansi, tujuan, keperluan, id], (err, result) => {
    if (err) {
      console.error("❌ Error updating pengunjung:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pengunjung tidak ditemukan" });
    }
    res.json({ message: "Data pengunjung diperbarui" });
  });
});

module.exports = router;