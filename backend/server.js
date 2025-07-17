// ========================================
// IMPORTS
// ========================================
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql");
const qrcode = require("qrcode");
const axios = require("axios");
const fs = require("fs");
const compression = require("compression");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

const app = express();
const PORT = 5000;

// ========================================
// CONSTANTS
// ========================================
const SECRET_KEY = "bukuTamuSMAN1Bone_2025!@#_xYzQwErTyUiOp1234567890$%^&*()_+";
const FONNTE_TOKEN = "Gy6atyukHHPiM9KWWdoY"; // Token Fonnte

// ========================================
// RATE LIMITING CONFIGURATION
// ========================================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  message: {
    error: "Terlalu banyak permintaan dari IP ini, coba lagi dalam 15 menit.",
    retry_after: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const pengunjungLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 detik
  max: 10,
  message: {
    error: "Terlalu banyak pendaftaran dari IP ini, tunggu 15 detik.",
    retry_after: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 3,
  message: {
    error: "Terlalu banyak percobaan login, coba lagi dalam 1 menit.",
    retry_after: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const whatsappLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 detik
  max: 10,
  message: {
    error: "Tunggu 15 detik sebelum mengirim WhatsApp lagi.",
    retry_after: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 10,
  delayMs: () => 500,
  maxDelayMs: 5000,
  validate: {
    delayMs: false
  }
});

// ========================================
// LOGGING MIDDLEWARE
// ========================================
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logMiddleware = (req, res, next) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    referer: req.get('Referer') || 'Direct'
  };
  
  const logPath = path.join(logsDir, 'access.log');
  fs.appendFile(logPath, JSON.stringify(logEntry) + '\n', (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
  next();
};

// ========================================
// MIDDLEWARE SETUP
// ========================================
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(logMiddleware);
app.use(generalLimiter);
app.use(speedLimiter);

// ========================================
// STATIC FILES
// ========================================
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use("/uploads", express.static(uploadsDir));
app.use('/models', express.static(path.join(__dirname, "models"), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

// ========================================
// DATABASE CONNECTION
// ========================================
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

// ========================================
// MULTER CONFIGURATION
// ========================================
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
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diperbolehkan!'));
    }
  }
});

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ message: "Token tidak ditemukan." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token tidak valid." });
    }
    req.user = user;
    next();
  });
};

// ========================================
// FONNTE WHATSAPP FUNCTIONS
// ========================================
async function sendWhatsAppMessage(target, message, imageUrl = null) {
  try {
    const payload = {
      target: target,
      message: message,
      countryCode: "62",
    };

    if (imageUrl) {
      payload.url = imageUrl;
    }

    const response = await axios.post(
      "https://api.fonnte.com/send",
      payload,
      {
        headers: {
          Authorization: FONNTE_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error.response?.data || error.message);
    throw error;
  }
}

// ========================================
// ENDPOINT: TAMBAH PENGUNJUNG
// ========================================
app.post("/api/pengunjung", pengunjungLimiter, upload.single("foto"), (req, res) => {
  const { nama, hp, instansi, tujuan, keperluan } = req.body;
  const foto = req.file ? req.file.filename : null;

  console.log("📷 Uploaded file:", req.file);
  console.log("📷 Foto filename:", foto);

  if (!nama || !hp || !instansi || !tujuan || !keperluan) {
    return res.status(400).json({ message: "Semua field wajib diisi." });
  }

  // ✅ INSERT PENGUNJUNG FIRST
  const sqlPengunjung = "INSERT INTO pengunjung (nama, hp, instansi, tujuan, keperluan) VALUES (?, ?, ?, ?, ?)";
  db.query(sqlPengunjung, [nama, hp, instansi, tujuan, keperluan], (err, result) => {
    if (err) {
      console.error("❌ Gagal menambahkan pengunjung:", err);
      return res.status(500).json({ message: "Gagal menambahkan pengunjung." });
    }

    const pengunjungId = result.insertId;
    console.log(`✅ Pengunjung ditambahkan: ${nama} dari ${instansi}, ID: ${pengunjungId}`);

    // ✅ INSERT FOTO IF EXISTS
    if (foto) {
      const sqlFoto = "INSERT INTO wajah_pengunjung (pengunjung_id, file_foto) VALUES (?, ?)";
      db.query(sqlFoto, [pengunjungId, foto], (fotoErr) => {
        if (fotoErr) {
          console.error("❌ Gagal menyimpan foto wajah:", fotoErr);
          // Still return success, foto optional
        } else {
          console.log(`✅ Foto wajah disimpan: ${foto} untuk pengunjung ID: ${pengunjungId}`);
        }

        // Return response after foto processing
        res.status(201).json({ 
          message: "Pengunjung berhasil ditambahkan.", 
          id: pengunjungId,
          foto: foto,
          foto_url: foto ? `${req.protocol}://${req.get('host')}/uploads/${foto}` : null
        });
      });
    } else {
      // No foto uploaded
      console.log("⚠️ No foto uploaded for pengunjung ID:", pengunjungId);
      res.status(201).json({ 
        message: "Pengunjung berhasil ditambahkan.", 
        id: pengunjungId,
        foto: null,
        foto_url: null
      });
    }
  });
});

// ========================================
// ENDPOINT: EDIT PENGUNJUNG
// ========================================
app.put("/api/pengunjung/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { nama, hp, instansi, tujuan, keperluan } = req.body;

  if (!nama || !hp || !instansi || !tujuan || !keperluan) {
    return res.status(400).json({ message: "Semua field wajib diisi." });
  }

  const sql = "UPDATE pengunjung SET nama = ?, hp = ?, instansi = ?, tujuan = ?, keperluan = ? WHERE id = ? AND is_deleted = 0";
  
  db.query(sql, [nama, hp, instansi, tujuan, keperluan, id], (err, result) => {
    if (err) {
      console.error("❌ Gagal memperbarui pengunjung:", err);
      return res.status(500).json({ message: "Gagal memperbarui data." });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengunjung tidak ditemukan." });
    }
    
    console.log(`✅ Pengunjung ID ${id} berhasil diperbarui`);
    res.json({ message: "Pengunjung berhasil diperbarui." });
  });
});

// ========================================
// ENDPOINT: HAPUS PENGUNJUNG (SOFT DELETE)
// ========================================
app.delete("/api/pengunjung/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  // Soft delete pengunjung
  const sqlPengunjung = "UPDATE pengunjung SET is_deleted = 1 WHERE id = ?";
  
  db.query(sqlPengunjung, [id], (err, result) => {
    if (err) {
      console.error("❌ Gagal menghapus pengunjung:", err);
      return res.status(500).json({ message: "Gagal menghapus pengunjung." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengunjung tidak ditemukan." });
    }

    // Soft delete related records
    const sqlWajah = "UPDATE wajah_pengunjung SET is_deleted = 1 WHERE pengunjung_id = ?";
    const sqlQr = "UPDATE qr_pengunjung SET is_deleted = 1 WHERE pengunjung_id = ?";

    db.query(sqlWajah, [id], (errWajah) => {
      if (errWajah) console.error("❌ Warning: Gagal menghapus foto wajah:", errWajah);
    });

    db.query(sqlQr, [id], (errQr) => {
      if (errQr) console.error("❌ Warning: Gagal menghapus QR code:", errQr);
    });

    console.log(`✅ Pengunjung ID ${id} berhasil dihapus (soft delete)`);
    res.json({ message: "Pengunjung berhasil dihapus." });
  });
});

// ========================================
// ENDPOINT: KIRIM QR CODE VIA WHATSAPP (TEXT ONLY)
// ========================================
app.post("/api/send-qr", whatsappLimiter, async (req, res) => {
  console.log("🔍 DEBUG send-qr request:");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  
  const { phoneNumber, pengunjungId } = req.body;

  console.log("📱 Extracted data:");
  console.log("- phoneNumber:", phoneNumber);
  console.log("- pengunjungId:", pengunjungId);

  if (!phoneNumber || !pengunjungId) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ 
      message: "Phone number dan pengunjung ID wajib diisi.",
      received: { phoneNumber, pengunjungId }
    });
  }

  try {
    // Get pengunjung data
    const sqlPengunjung = "SELECT * FROM pengunjung WHERE id = ? AND is_deleted = 0";
    
    console.log("🔍 Searching pengunjung with ID:", pengunjungId);
    
    db.query(sqlPengunjung, [pengunjungId], async (err, results) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ message: "Gagal mengambil data pengunjung." });
      }

      console.log("🔍 Database results:", results);

      if (results.length === 0) {
        console.log("❌ Pengunjung not found");
        return res.status(404).json({ message: "Pengunjung tidak ditemukan." });
      }

      const pengunjung = results[0];
      console.log("✅ Pengunjung found:", pengunjung.nama);

      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.slice(1);
      }

      console.log("📱 Formatted phone:", formattedPhone);

      // ✅ SEND MESSAGE WITHOUT IMAGE
      const message = `🎫 *BUKU TAMU SMAN 1 BONE* 🎫

Halo *${pengunjung.nama}*! 👋

Terima kasih telah berkunjung ke SMAN 1 Bone.

📋 *Detail Kunjungan:*
• Nama: ${pengunjung.nama}
• Instansi: ${pengunjung.instansi}
• Tujuan: ${pengunjung.tujuan}
• Keperluan: ${pengunjung.keperluan}
• Waktu: ${new Date(pengunjung.waktu).toLocaleString('id-ID')}

🔖 *ID Verifikasi Anda:* *${pengunjung.id}*

💡 *Cara verifikasi kunjungan:*
1. Tunjukkan ID Verifikasi ini kepada petugas
2. Atau tunjukkan screenshot pesan ini
3. Petugas akan memverifikasi dengan ID: *${pengunjung.id}*

✅ Selamat berkunjung di SMAN 1 Bone!

---
*SIPAKALEBBI - Sistem Informasi Buku Tamu*
SMAN 1 Bone`;

      try {
        console.log("📱 Sending WhatsApp TEXT to:", formattedPhone);
        
        // ✅ SEND WITHOUT IMAGE URL
        const result = await sendWhatsAppMessage(formattedPhone, message);

        console.log("✅ WhatsApp sent successfully:", result);
        
        if (result.status === false) {
          throw new Error(result.reason || "Failed to send WhatsApp");
        }
        
        res.json({ 
          message: "Pesan verifikasi berhasil dikirim via WhatsApp!",
          phone: formattedPhone,
          pengunjung: pengunjung.nama,
          verification_id: pengunjung.id,
          fonnte_response: result
        });

      } catch (whatsappError) {
        console.error("❌ WhatsApp error:", whatsappError);
        res.status(500).json({ 
          message: "Gagal mengirim WhatsApp.",
          error: whatsappError.message,
          pengunjung: pengunjung.nama
        });
      }
    });

  } catch (error) {
    console.error("❌ General error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
});

// ========================================
// ENDPOINT: GET PENGUNJUNG (dengan pagination dan foto)
// ========================================
app.get("/api/pengunjung", authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let whereClause = "WHERE p.is_deleted = 0";
  let params = [];

  if (search) {
    whereClause += " AND (p.nama LIKE ? OR p.instansi LIKE ? OR p.tujuan LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  console.log(`🔍 GET /api/pengunjung - Page: ${page}, Limit: ${limit}, Search: "${search}"`);

  const countSql = `SELECT COUNT(*) as total FROM pengunjung p ${whereClause}`;

  db.query(countSql, params, (countErr, countResult) => {
    if (countErr) {
      console.error("❌ Gagal menghitung data:", countErr);
      return res.status(500).json({ 
        message: "Gagal mengambil data.",
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      });
    }

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 Total records in database: ${total}`);

    const sql = `
      SELECT 
        p.*,
        w.file_foto AS foto,
        w.file_foto AS path_foto,
        q.file_qr AS qr_code,
        CASE 
          WHEN w.file_foto IS NOT NULL THEN CONCAT('${req.protocol}://${req.get('host')}/uploads/', w.file_foto)
          ELSE NULL 
        END AS foto_url,
        CASE 
          WHEN q.file_qr IS NOT NULL THEN CONCAT('${req.protocol}://${req.get('host')}/uploads/', q.file_qr)
          ELSE NULL 
        END AS qr_url
      FROM pengunjung p
      LEFT JOIN wajah_pengunjung w ON p.id = w.pengunjung_id AND w.is_deleted = 0
      LEFT JOIN qr_pengunjung q ON p.id = q.pengunjung_id AND q.is_deleted = 0
      ${whereClause}
      ORDER BY p.waktu DESC
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [...params, limit, offset], (err, results) => {
      if (err) {
        console.error("❌ Gagal mengambil data:", err);
        return res.status(500).json({ 
          message: "Gagal mengambil data.",
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      }

      console.log(`✅ Returning ${results.length} records from ${total} total`);

      // ✅ CONSISTENT RESPONSE FORMAT
      res.json({
        message: "Data pengunjung berhasil diambil.",
        data: results || [],
        pagination: {
          page: page,
          limit: limit,
          total: total,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    });
  });
});

// ========================================
// ENDPOINT: LAPORAN BULANAN PENGUNJUNG
// ========================================
app.get("/api/pengunjung/laporan-bulanan", authenticateToken, (req, res) => {
  const sql = `
    SELECT 
      DATE_FORMAT(waktu, '%Y-%m') AS bulan,
      DATE_FORMAT(waktu, '%M %Y') AS bulan_nama,
      COUNT(*) AS jumlah
    FROM pengunjung
    WHERE is_deleted = 0
    GROUP BY bulan
    ORDER BY bulan ASC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Gagal mengambil laporan bulanan:", err);
      return res.status(500).json({ 
        message: "Gagal mengambil laporan bulanan.",
        data: []
      });
    }
    
    console.log(`✅ Laporan bulanan diambil: ${results.length} data`);
    
    // ✅ RETURN CONSISTENT FORMAT
    res.json({
      message: "Laporan bulanan berhasil diambil.",
      data: results || [],
      total: results ? results.length : 0
    });
  });
});


// ========================================
// ENDPOINT: UPDATE JUMLAH KUNJUNGAN
// ========================================
app.patch("/api/pengunjung/visit/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "UPDATE pengunjung SET jumlah_kunjungan = jumlah_kunjungan + 1 WHERE id = ? AND is_deleted = 0";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Gagal memperbarui jumlah kunjungan:", err);
      return res.status(500).json({ message: "Gagal memperbarui jumlah kunjungan." });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengunjung tidak ditemukan." });
    }
    
    console.log(`✅ Jumlah kunjungan pengunjung ID ${id} berhasil diperbarui`);
    res.json({ message: "Jumlah kunjungan berhasil diperbarui." });
  });
});

// ========================================
// ENDPOINT: AMBIL PENGUNJUNG BY ID
// ========================================
app.get("/api/pengunjung/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      p.*,
      w.file_foto AS foto,
      q.file_qr AS qr_code,
      CASE 
        WHEN w.file_foto IS NOT NULL THEN CONCAT('${req.protocol}://${req.get('host')}/uploads/', w.file_foto)
        ELSE NULL 
      END AS foto_url,
      CASE 
        WHEN q.file_qr IS NOT NULL THEN CONCAT('${req.protocol}://${req.get('host')}/uploads/', q.file_qr)
        ELSE NULL 
      END AS qr_url
    FROM pengunjung p
    LEFT JOIN wajah_pengunjung w ON p.id = w.pengunjung_id AND w.is_deleted = 0
    LEFT JOIN qr_pengunjung q ON p.id = q.pengunjung_id AND q.is_deleted = 0
    WHERE p.id = ? AND p.is_deleted = 0
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Gagal mengambil data pengunjung:", err);
      return res.status(500).json({ message: "Gagal mengambil data." });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Pengunjung tidak ditemukan." });
    }
    
    console.log(`✅ Data pengunjung ID ${id} berhasil diambil`);
    res.json(results[0]);
  });
});

// ========================================
// ENDPOINT: NONAKTIFKAN PENGUNJUNG
// ========================================
app.patch("/api/pengunjung/deactivate/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const sql = "UPDATE pengunjung SET is_active = 0 WHERE id = ? AND is_deleted = 0";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Gagal menonaktifkan pengunjung:", err);
      return res.status(500).json({ message: "Gagal menonaktifkan pengunjung." });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengunjung tidak ditemukan." });
    }
    
    console.log(`✅ Pengunjung ID ${id} berhasil dinonaktifkan`);
    res.json({ message: "Pengunjung berhasil dinonaktifkan." });
  });
});

// ========================================
// ENDPOINT: UPLOAD FOTO WAJAH
// ========================================
app.post("/api/wajah/:pengunjungId", upload.single("foto"), (req, res) => {
  const { pengunjungId } = req.params;
  const foto = req.file ? req.file.filename : null;

  if (!foto) {
    return res.status(400).json({ message: "Foto wajah wajib diupload." });
  }

  const sql = "INSERT INTO wajah_pengunjung (pengunjung_id, file_foto) VALUES (?, ?)";
  db.query(sql, [pengunjungId, foto], (err) => {
    if (err) {
      console.error("❌ Gagal menyimpan foto wajah:", err);
      return res.status(500).json({ message: "Gagal menyimpan foto wajah." });
    }

    console.log(`✅ Foto wajah disimpan untuk pengunjung ID: ${pengunjungId}`);
    res.json({ 
      message: "Foto wajah berhasil disimpan.", 
      foto: foto,
      foto_url: `${req.protocol}://${req.get('host')}/uploads/${foto}`
    });
  });
});

// ========================================
// ENDPOINT: GENERATE QR CODE (FIXED)
// ========================================
app.post("/api/qr/:pengunjungId", (req, res) => {
  const { pengunjungId } = req.params;

  console.log("🔍 Generating QR for pengunjung ID:", pengunjungId);

  // Check if QR already exists
  const checkQrSql = "SELECT * FROM qr_pengunjung WHERE pengunjung_id = ? AND is_deleted = 0";
  db.query(checkQrSql, [pengunjungId], (checkErr, qrResults) => {
    if (checkErr) {
      console.error("❌ Error checking existing QR:", checkErr);
      return res.status(500).json({ message: "Gagal memeriksa QR code existing." });
    }

    // If QR already exists, return it
    if (qrResults.length > 0) {
      const existingQr = qrResults[0];
      console.log("✅ QR already exists:", existingQr.file_qr);
      return res.json({
        message: "QR code sudah ada.",
        qrFile: existingQr.file_qr,
        qrPath: `/uploads/${existingQr.file_qr}`,
        qr_url: `${req.protocol}://${req.get('host')}/uploads/${existingQr.file_qr}`
      });
    }

    // Get pengunjung data
    const sqlPengunjung = "SELECT * FROM pengunjung WHERE id = ? AND is_deleted = 0";
    db.query(sqlPengunjung, [pengunjungId], (err, results) => {
      if (err) {
        console.error("❌ Gagal mengambil data pengunjung:", err);
        return res.status(500).json({ message: "Gagal mengambil data pengunjung." });
      }

      if (results.length === 0) {
        console.error("❌ Pengunjung not found for ID:", pengunjungId);
        return res.status(404).json({ message: "Pengunjung tidak ditemukan." });
      }

      const pengunjung = results[0];
      console.log("✅ Found pengunjung:", pengunjung.nama);

      // Create QR data
      const qrData = {
        id: pengunjung.id,
        nama: pengunjung.nama,
        hp: pengunjung.hp,
        instansi: pengunjung.instansi,
        tujuan: pengunjung.tujuan,
        keperluan: pengunjung.keperluan,
        waktu: pengunjung.waktu
      };

      const qrText = JSON.stringify(qrData);
      const qrFileName = `qr-${pengunjungId}-${Date.now()}.png`;
      const qrPath = path.join(__dirname, "uploads", qrFileName);

      console.log("📱 Creating QR file:", qrFileName);

      // Generate QR code
      qrcode.toFile(qrPath, qrText, { width: 300, margin: 2 }, (qrErr) => {
        if (qrErr) {
          console.error("❌ Gagal membuat QR code:", qrErr);
          return res.status(500).json({ message: "Gagal membuat QR code: " + qrErr.message });
        }

        console.log("✅ QR file created successfully");

        // ✅ SAVE TO DATABASE WITHOUT qr_data COLUMN
        const sqlQr = "INSERT INTO qr_pengunjung (pengunjung_id, file_qr) VALUES (?, ?)";
        db.query(sqlQr, [pengunjungId, qrFileName], (dbErr) => {
          if (dbErr) {
            console.error("❌ Gagal menyimpan QR code ke database:", dbErr);
            
            // Delete the file if database save fails
            fs.unlink(qrPath, (unlinkErr) => {
              if (unlinkErr) console.error("❌ Failed to delete QR file:", unlinkErr);
            });
            
            return res.status(500).json({ message: "Gagal menyimpan QR code ke database." });
          }

          console.log(`✅ QR code berhasil dibuat untuk pengunjung: ${pengunjung.nama}`);
          res.json({ 
            message: "QR code berhasil dibuat.", 
            qrFile: qrFileName,
            qrPath: `/uploads/${qrFileName}`,
            qr_url: `${req.protocol}://${req.get('host')}/uploads/${qrFileName}`
          });
        });
      });
    });
  });
});

// ========================================
// ENDPOINT ADMIN DENGAN RATE LIMITING
// ========================================
app.post("/api/admin/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      message: "Username dan password harus diisi." 
    });
  }

  const sql = "SELECT * FROM admin WHERE nama = ? AND password = ?";
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error("❌ Error saat login:", err);
      return res.status(500).json({ 
        message: "Terjadi kesalahan server." 
      });
    }
    
    if (results.length === 0) {
      console.log(`❌ Failed login attempt for username: ${username} from IP: ${req.ip}`);
      return res.status(401).json({ 
        message: "Username atau password salah." 
      });
    }
    
    const token = jwt.sign(
      { 
        username: results[0].nama,
        id: results[0].id 
      }, 
      SECRET_KEY, 
      { expiresIn: "1h" }
    );
    
    console.log(`✅ Successful login for username: ${username} from IP: ${req.ip}`);
    
    res.json({ 
      token,
      message: "Login berhasil.",
      user: {
        id: results[0].id,
        nama: results[0].nama
      }
    });
  });
});

// Protected endpoint test
app.get("/api/admin/protected", authenticateToken, (req, res) => {
  res.json({ 
    message: "Ini adalah data rahasia yang hanya bisa diakses oleh admin.",
    user: req.user 
  });
});

// ========================================
// EXISTING DASHBOARD STATS (LINE 877-912) - HAS ISSUES
// ========================================
app.get("/api/admin/stats", authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  const queries = {
    totalPengunjung: "SELECT COUNT(*) as total FROM pengunjung WHERE is_deleted = 0",
    pengunjungHariIni: `SELECT COUNT(*) as total FROM pengunjung WHERE DATE(waktu) = '${today}' AND is_deleted = 0`,
    pengunjungBulanIni: `SELECT COUNT(*) as total FROM pengunjung WHERE DATE_FORMAT(waktu, '%Y-%m') = '${thisMonth}' AND is_deleted = 0`,
    instansiTerbanyak: `
      SELECT instansi, COUNT(*) as jumlah 
      FROM pengunjung 
      WHERE is_deleted = 0 
      GROUP BY instansi 
      ORDER BY jumlah DESC 
      LIMIT 5
    `
  };

  const stats = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.query(query, (err, results) => {
      if (err) {
        console.error(`❌ Error getting ${key}:`, err);
        stats[key] = key === 'instansiTerbanyak' ? [] : 0;
      } else {
        // ❌ PROBLEM: Inconsistent response format
        stats[key] = key === 'instansiTerbanyak' ? results : results[0].total;
      }
      
      completed++;
      if (completed === totalQueries) {
        // ❌ PROBLEM: No consistent response wrapper
        res.json(stats);
      }
    });
  });
});

// ========================================
// MANUAL ID VERIFICATION ENDPOINT (ADD AFTER STATS)
// ========================================
app.post("/api/admin/verify-id", authenticateToken, (req, res) => {
  const { pengunjungId } = req.body;

  if (!pengunjungId) {
    return res.status(400).json({ 
      message: "ID Verifikasi wajib diisi.",
      required: ["pengunjungId"]
    });
  }

  console.log(`🔍 Manual verification for ID: ${pengunjungId}`);

  const sql = `
    SELECT 
      p.*,
      w.file_foto AS foto,
      q.file_qr AS qr_code,
      CASE 
        WHEN w.file_foto IS NOT NULL THEN CONCAT('${req.protocol}://${req.get('host')}/uploads/', w.file_foto)
        ELSE NULL 
      END AS foto_url,
      CASE 
        WHEN q.file_qr IS NOT NULL THEN CONCAT('${req.protocol}://${req.get('host')}/uploads/', q.file_qr)
        ELSE NULL 
      END AS qr_url
    FROM pengunjung p
    LEFT JOIN wajah_pengunjung w ON p.id = w.pengunjung_id AND w.is_deleted = 0
    LEFT JOIN qr_pengunjung q ON p.id = q.pengunjung_id AND q.is_deleted = 0
    WHERE p.id = ? AND p.is_deleted = 0
  `;

  db.query(sql, [pengunjungId], (err, results) => {
    if (err) {
      console.error("❌ Error verifying ID:", err);
      return res.status(500).json({ 
        message: "Gagal memverifikasi ID.",
        error: err.message 
      });
    }

    if (results.length === 0) {
      console.log(`❌ ID ${pengunjungId} not found`);
      return res.status(404).json({ 
        message: "ID Verifikasi tidak ditemukan.",
        id: pengunjungId 
      });
    }

    const pengunjung = results[0];
    console.log(`✅ ID ${pengunjungId} verified for: ${pengunjung.nama}`);

    res.json({
      message: "ID Verifikasi berhasil diverifikasi.",
      verified: true,
      pengunjung: pengunjung,
      verification_time: new Date().toISOString()
    });
  });
});

// ========================================
// HEALTH CHECK & STATUS
// ========================================
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "1.0.0"
  });
});

app.get("/api/whatsapp/status", (req, res) => {
  res.json({ 
    provider: "Fonnte",
    status: "ready",
    message: "WhatsApp gateway menggunakan Fonnte API"
  });
});

// ========================================
// ROOT ENDPOINT
// ========================================
app.get("/", (req, res) => {
  res.json({
    message: "🚀 SIPAKALEBBI API Server",
    version: "1.0.0",
    description: "Sistem Informasi Buku Tamu SMAN 1 Bone",
    whatsapp_provider: "Fonnte API",
    endpoints: {
      pengunjung: "/api/pengunjung",
      admin: "/api/admin/login",
      whatsapp: "/api/whatsapp/status",
      health: "/api/health"
    },
    documentation: "https://github.com/your-repo/sipakalebbi"
  });
});

// ========================================
// ERROR HANDLING
// ========================================
app.use((req, res) => {
  res.status(404).json({ 
    message: "Endpoint tidak ditemukan",
    path: req.path,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ 
    message: "Terjadi kesalahan server",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================================
// JALANKAN SERVER
// ========================================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📱 WhatsApp Gateway: Fonnte API`);
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Access logs: ${path.join(__dirname, 'logs', 'access.log')}`);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server gracefully...');
  
  if (db) {
    db.end();
  }
  
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});