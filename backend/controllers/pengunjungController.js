const db = require('../config/database');

exports.tambahPengunjung = (req, res) => {
  const { nama, hp, instansi, tujuan, keperluan } = req.body;

  const query = `
    INSERT INTO pengunjung (nama, hp, instansi, tujuan, keperluan)
    VALUES (?, ?, ?, ?, ?) 
  `;

  db.query(query, [nama, hp, instasni, tujuan, keperluan], (err, result) => {
    if (err) {
      console.error("Gagal menambah pengunjung:", err);
      return res.status(500).json({ message: 'Gagal menambah pengunjung' });
    }
    res.status(200).json({ message: 'Pengunjung berhasil ditambahkan' });
  });
};                                              

exports.getPengunjung = (req, res) => {
  const sql = 'SELECT * FROM pengunjung ORDER BY waktu DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal mengambil data pengunjung' });
    }
    res.json(results);
  });
};

exports.hapusPengunjung = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM pengunjung WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal menghapus pengunjung' });
    }
    res.json({ message: 'Pengunjung berhasil dihapus' });
  });
};
