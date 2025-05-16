const express = require("express");
const router = express.Router();
const db = require("../config/database");
const multer = require("multer");
const upload = multer(); // Hanya parsing form-data

// GET semua pengunjung atau filter berdasarkan tanggal
router.get("/", (req, res) => {
  const { tanggal } = req.query;
  let sql = `
    SELECT p.*, w.filename
    FROM pengunjung p
    LEFT JOIN wajah_pengunjung w ON p.id = w.pengunjung_id
  `;
  const params = [];

  if (tanggal) {
    sql += " WHERE DATE(p.waktu) = ?";
    params.push(tanggal);
  }

  sql += " ORDER BY p.waktu DESC";

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST tambah pengunjung
router.post("/", upload.none(), (req, res) => {
  const { nama, hp, instansi, tujuan, keperluan } = req.body;
  const waktu = new Date();

  if (!nama) {
    return res.status(400).json({ error: "Field 'nama' wajib diisi." });
  }

  const sql = "INSERT INTO pengunjung (nama, hp, instansi, tujuan, keperluan, waktu) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [nama, hp, instansi, tujuan, keperluan, waktu], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Pengunjung ditambahkan", id: result.insertId });
  });
});

// DELETE pengunjung
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM pengunjung WHERE id = ?";
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Pengunjung dihapus" });
  });
});

// PATCH edit pengunjung
router.patch("/:id", upload.none(), (req, res) => {
  const { id } = req.params;
  const { nama, alasan, tujuan, kelas } = req.body;

  const sql = "UPDATE pengunjung SET nama = ?, hp = ?, instansi = ?, tujuan = ?, keperluan=?, WHERE id = ?";
  db.query(sql, [nama, hp, instansi, tujuan, keperluan, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Data pengunjung diperbarui" });
  });
});

module.exports = router;
