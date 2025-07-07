const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql");
const qrcode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const fs = require("fs");
const compression = require("compression");

const app = express();
const PORT = 5000;


// Middleware
app.use(compression()); 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use("/uploads", express.static(uploadsDir));
app.use('/models', express.static(path.join(__dirname, "models"), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 tahun
  }
}));

// Koneksi database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
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
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage });

// ======================================
// WHATSAPP CLIENT INISIALISASI
// ======================================
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    timeout: 60000,
  },
});

// Event handler: QR
client.on("qr", (qr) => {
  console.log("WhatsApp Web QR code event triggered.");
  qrcodeTerminal.generate(qr, { small: true });
  const qrFilePath = path.join(__dirname, "uploads", "whatsapp-auth-qr.png");
  qrcode.toFile(qrFilePath, qr, (err) => {
    if (err) {
      console.error("Gagal membuat file QR:", err);
    } else {
      console.log(`QR code WhatsApp Web disimpan di: ${qrFilePath}`);
      console.log("Buka file tersebut untuk memindai dengan WhatsApp.");
    }
  });
});

// Event handler: Client ready
client.on("ready", () => {
  console.log("WhatsApp client is ready!");
});

// Event handler: Auth failure
client.on("auth_failure", (msg) => {
  console.error("WhatsApp authentication failed:", msg);
});

// Event handler: Client error
client.on("error", (error) => {
  console.error("WhatsApp client error:", error);
});

// Inisialisasi client
client.initialize();


// ==============================
// ENDPOINT: TAMBAH PENGUNJUNG
// ==============================
app.post("/api/pengunjung", upload.single("foto"), (req, res) => {
  const { nama, hp, instansi, tujuan, keperluan } = req.body;
  if (!nama || !hp || !instansi || !tujuan || !keperluan) {
    return res.status(400).json({ message: "Semua field wajib diisi." });
  }
  const waktu = new Date();
  const sql =
    "INSERT INTO pengunjung (nama, hp, instansi, tujuan, keperluan, waktu, jumlah_kunjungan, is_active) VALUES (?, ?, ?, ?, ?, ?, 1, TRUE)";
  db.query(
    sql,
    [nama, hp, instansi, tujuan, keperluan, waktu],
    (err, result) => {
      if (err) {
        console.error("❌ Gagal menyimpan pengunjung:", err);
        return res.status(500).json({ message: "Gagal menyimpan data." });
      }

      const pengunjungId = result.insertId;

      // Generate QR code
      const qrData = `http://localhost:5000/api/pengunjung/${pengunjungId}`;
      const qrFileName = `qr_${pengunjungId}.png`;
      const qrFilePath = path.join(__dirname, "Uploads", qrFileName);

      qrcode.toFile(
        qrFilePath,
        qrData,
        {
          errorCorrectionLevel: "H",
          width: 600,
          margin: 6,
          scale: 8,
          color: { dark: "#000000", light: "#FFFFFF" },
          type: "png",
          quality: 1,
        },
        (qrErr) => {
          if (qrErr) {
            console.error("❌ Gagal membuat QR code:", qrErr);
          } else if (fs.existsSync(qrFilePath)) {
            // Save QR code path to database
            const sqlQR = `INSERT INTO qr_pengunjung (file_qr, pengunjung_id) VALUES (?, ?)`;
            db.query(sqlQR, [`/Uploads/${qrFileName}`, pengunjungId], (qrDbErr) => {
              if (qrDbErr) {
                console.error("❌ Gagal simpan QR ke database:", qrDbErr);
              }
            });

            // Format phone number for WhatsApp
            let formattedPhone = hp.replace(/[+ -]/g, "");
            if (!formattedPhone.startsWith("62")) {
              formattedPhone = `62${formattedPhone.replace(/^0/, "")}`;
            }
            const chatId = `${formattedPhone}@c.us`;

            // Send QR code via WhatsApp if client is ready
            if (client.info) {
              const media = MessageMedia.fromFilePath(qrFilePath);
              client
                .sendMessage(chatId, media, {
                  caption:
                    "Berikut QR Code Anda untuk verifikasi kunjungan di SMAN 1 BONE. Gunakan aplikasi pemindai QR umum (bukan pemindai WhatsApp) untuk memindai.",
                })
                .then(() => {
                  client.sendMessage(
                    chatId,
                    `Jika QR code tidak terbaca, gunakan ID pengunjung: ${pengunjungId} dan sebutkan pada Operator/Admin atau buka tautan ini di browser: ${qrData} untuk verifikasi ulang tanpa harus mengisi formulir kembali, Senang atas kunjungan anda di UPT SMAN 1 BONE`
                  );
                  console.log(`QR code sent to ${chatId}`);
                })
                .catch((sendErr) => {
                  console.error("❌ Gagal mengirim QR code via WhatsApp:", sendErr);
                });
            } else {
              console.log("WhatsApp client not ready, QR code not sent.");
            }
          }
        }
      );

      // Handle photo upload and response
      if (req.file) {
        const filePath = `/Uploads/${req.file.filename}`;
        const sqlFoto = `
          INSERT INTO wajah_pengunjung (file_foto, pengunjung_id)
          VALUES (?, ?)
        `;
        db.query(sqlFoto, [filePath, pengunjungId], (err2) => {
          if (err2) {
            console.error("❌ Gagal simpan foto:", err2);
          }
          res.status(201).json({
            message: "Pengunjung & foto ditambahkan.",
            id: pengunjungId,
          });
        });
      } else {
        res.status(201).json({
          message: "Pengunjung ditambahkan.",
          id: pengunjungId,
        });
      }
    }
  );
});

// ==============================
// ENDPOINT: EDIT PENGUNJUNG
// ==============================
app.put("/api/pengunjung/:id", (req, res) => {
  const { id } = req.params;
  const { nama, hp, instansi, tujuan, keperluan } = req.body;

  if (!nama || !hp || !instansi || !tujuan || !keperluan) {
    return res.status(400).json({ message: "Semua field wajib diisi." });
  }

  const sql =
    "UPDATE pengunjung SET nama = ?, hp = ?, instansi = ?, tujuan = ?, keperluan = ? WHERE id = ?";
  db.query(sql, [nama, hp, instansi, tujuan, keperluan, id], (err, result) => {
    if (err) {
      console.error("❌ Gagal memperbarui pengunjung:", err);
      return res.status(500).json({ message: "Gagal memperbarui data." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengunjung tidak ditemukan." });
    }
    res.json({ message: "Pengunjung berhasil diperbarui." });
  });
});

// ==============================
// ENDPOINT: HAPUS PENGUNJUNG
// ==============================
app.delete("/api/pengunjung/:id", (req, res) => {
  const { id } = req.params;

  // Soft delete data terkait di tabel wajah_pengunjung
  const sqlWajah = "UPDATE wajah_pengunjung SET is_deleted = 1 WHERE pengunjung_id = ?";
  db.query(sqlWajah, [id], (errWajah) => {
    if (errWajah) {
      console.error("❌ Gagal soft delete data wajah:", errWajah);
      return res.status(500).json({ message: "Gagal menghapus data wajah." });
    }

    // Soft delete data terkait di tabel qr_pengunjung
    const sqlQR = "UPDATE qr_pengunjung SET is_deleted = 1 WHERE pengunjung_id = ?";
    db.query(sqlQR, [id], (errQR) => {
      if (errQR) {
        console.error("❌ Gagal soft delete data QR:", errQR);
        return res.status(500).json({ message: "Gagal menghapus data QR." });
      }

      // Soft delete data pengunjung
      const sqlPengunjung = "UPDATE pengunjung SET is_deleted = 1 WHERE id = ?";
      db.query(sqlPengunjung, [id], (errPengunjung, result) => {
        if (errPengunjung) {
          console.error("❌ Gagal soft delete pengunjung:", errPengunjung);
          return res
            .status(500)
            .json({ message: "Gagal menghapus data pengunjung." });
        }
        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ message: "Pengunjung tidak ditemukan." });
        }
        res.json({ message: "Pengunjung berhasil dihapus (soft delete)." });
      });
    });
  });
});

// ==============================
// ENDPOINT: KIRIM QR CODE VIA WHATSAPP
// ==============================
app.post("/api/send-qr", async (req, res) => {
  const { phoneNumber, pengunjungId } = req.body;
  console.log("Received /api/send-qr request:", { phoneNumber, pengunjungId });

  if (!phoneNumber || !pengunjungId) {
    console.log("Missing required fields:", { phoneNumber, pengunjungId });
    return res
      .status(400)
      .json({ error: "Nomor telepon dan ID pengunjung diperlukan." });
  }

  try {
    let formattedPhone = phoneNumber.replace(/[+ -]/g, "");
    if (!formattedPhone.startsWith("62")) {
      formattedPhone = `62${formattedPhone.replace(/^0/, "")}`;
    }
    const chatId = `${formattedPhone}@c.us`;
    console.log("Formatted WhatsApp chatId:", chatId);

    // Generate QR code di folder Uploads
    const qrData = `http://localhost:5000/api/pengunjung/${pengunjungId}`;
    const qrFileName = `qr_${pengunjungId}.png`;
    const qrFilePath = path.join(__dirname, "uploads", qrFileName);
    console.log("Generating QR code at:", qrFilePath);

    await qrcode.toFile(qrFilePath, qrData, {
      errorCorrectionLevel: "H",
      width: 600,
      margin: 6,
      scale: 8,
      color: { dark: "#000000", light: "#FFFFFF" },
      type: "png",
      quality: 1,
    });

    if (!fs.existsSync(qrFilePath)) {
      console.error("QR code file not created:", qrFilePath);
      return res.status(500).json({ error: "Gagal membuat file QR code." });
    }
    console.log(`QR code berhasil dibuat di ${qrFilePath}`);

    // Simpan path QR ke database (opsional, jika diperlukan)
    const sqlQR = `INSERT INTO qr_pengunjung (file_qr, pengunjung_id) VALUES (?, ?)`;
    db.query(sqlQR, [`/uploads/${qrFileName}`, pengunjungId], (err) => {
      if (err) console.error("❌ Gagal simpan QR:", err);
    });

    // Cek apakah client WhatsApp siap
    if (!client.info) {
      console.log("WhatsApp client not ready");
      return res.status(200).json({
        message:
          "QR code berhasil dibuat, tetapi WhatsApp client belum siap. Silakan login ulang atau tunggu sampai client ready.",
        qrFilePath: `/uploads/${qrFileName}`,
      });
    }

    // Kirim QR code via WhatsApp
    console.log("Sending WhatsApp message to:", chatId);
    const media = MessageMedia.fromFilePath(qrFilePath);
    await client.sendMessage(chatId, media, {
      caption:
        "Berikut QR Code Anda untuk verifikasi kunjungan di SMAN 1 BONE. Gunakan aplikasi pemindai QR umum (bukan pemindai WhatsApp) untuk memindai.",
    });

    // Kirim pesan teks cadangan
    await client.sendMessage(
      chatId,
      `Jika QR code tidak terbaca, gunakan ID pengunjung: ${pengunjungId} atau buka tautan ini di browser: ${qrData}`
    );

    console.log(`QR code dan tautan dikirim ke ${chatId}`);
    res.json({
      message: "QR code dan tautan berhasil dikirim ke WhatsApp.",
      qrFilePath: `/uploads/${qrFileName}`,
    });
  } catch (error) {
    console.error(
      "❌ Detailed error in /api/send-qr:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Gagal mengirim QR code.", details: error.message });
  }
});

// ==============================
// ENDPOINT: GET PENGUNJUNG(+ FOTO)
// ==============================
app.get("/api/pengunjung", (req, res) => {
  const sql = `
    SELECT 
      p.id, p.nama, p.hp, p.instansi, p.tujuan, p.keperluan, p.waktu, p.jumlah_kunjungan, p.is_active,
      w.file_foto AS foto, w.waktu AS waktu_foto
    FROM pengunjung p
    LEFT JOIN wajah_pengunjung w ON p.id = w.pengunjung_id AND w.is_deleted = 0
    WHERE p.is_deleted = 0
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
// ENDPOINT: LAPORAN BULANAN PENGUNJUNG
// ==============================
app.get("/api/pengunjung/laporan-bulanan", (req, res) => {
  const sql = `
    SELECT DATE_FORMAT(waktu, '%Y-%m') AS bulan, COUNT(*) AS jumlah
    FROM pengunjung
    GROUP BY bulan
    ORDER BY bulan ASC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Gagal mengambil laporan bulanan:", err);
      return res.status(500).json({ message: "Gagal mengambil laporan bulanan." });
    }
    res.json(results);
  });
});

// ==============================
// ENDPOINT: UPDATE JUMLAH KUNJUNGAN
// ==============================
app.patch("/api/pengunjung/visit/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE pengunjung
    SET jumlah_kunjungan = IFNULL(jumlah_kunjungan, 0) + 1
    WHERE id = ?
  `;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Gagal update jumlah kunjungan:", err);
      return res.status(500).json({ message: "Gagal update jumlah kunjungan." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengunjung tidak ditemukan." });
    }
    res.json({ message: "Jumlah kunjungan berhasil diperbarui." });
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
      console.error("❌ Gagal mengambil data pengunjung:", err);
      return res.status(500).json({ message: "Gagal mengambil data pengunjung." });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan atau tidak aktif." });
    }
    res.json(results[0]);
  });
});

// =============================
// ENDPOINT: NONAKTIFKAN PENGUNJUNG
// =============================
app.patch("/api/pengunjung/revoke/:id", (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE pengunjung SET is_active = FALSE WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Gagal menonaktifkan pengunjung:", err);
      return res
        .status(500)
        .json({ message: "Gagal menonaktifkan pengunjung." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan." });
    }
    res.json({ message: "Pengunjung berhasil dinonaktifkan." });
  });
});

// ==============================
// ENDPOINT: UPLOAD FOTO WAJAH
// ==============================
const uploadRouter = require("./routes/upload");
app.use("/api/upload", uploadRouter);

// ==============================
// ENDPOINT: FACE SCAN WAJAH
// ==============================
const uploadFaceRouter = require("./routes/upload-face");
app.use("/api", uploadFaceRouter);

// ==============================
// ENDPOINT: LOGIN ADMIN
// ==============================
const jwt = require("jsonwebtoken");
const SECRET_KEY = "bukuTamuSMAN1Bone_2025!@#_xYzQwErTyUiOp1234567890$%^&*()_+"; // Ganti dengan secret key yang kuat!

// Middleware verifikasi token
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

// Endpoint login admin (menghasilkan token)
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM admin WHERE nama = ? AND password = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Error saat login:", err);
      return res.status(500).json({ message: "Terjadi kesalahan server." });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: "Username atau password salah." });
    }
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  });
});

// Contoh endpoint yang dilindungi (gunakan authenticateToken)
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