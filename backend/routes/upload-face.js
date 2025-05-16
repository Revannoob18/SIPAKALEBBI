const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const db = require("../config/database");
const router = express.Router();

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer untuk handle upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder penyimpanan
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".jpg"); // timestamp + ekstensi
  },
});

const upload = multer({ storage: storage });

// Endpoint POST upload wajah
router.post("/upload-face", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: "Gambar wajah wajib diupload" });
  }

  const pengunjung_id = req.body.pengunjung_id;
  const filePath = `/uploads/${req.file.filename}`;
  const waktu = new Date();

  if (!pengunjung_id) {
    return res.status(400).send({ error: "ID pengunjung tidak ditemukan" });
  }

  const sql =
    "INSERT INTO wajah_pengunjung (pengunjung_id, file_foto, waktu) VALUES (?, ?, ?)";
  db.query(sql, [pengunjung_id, filePath, waktu], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).send({ error: "DB error saat simpan data" });
    }

    res.status(200).send({
      message: "Upload dan simpan sukses",
      filePath: filePath,
      waktu: waktu,
    });
  });
});

module.exports = router;
