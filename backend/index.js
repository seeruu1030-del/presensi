const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const whatsapp = require('./whatsapp');

const app = express();
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/auth', authRoutes);
app.get('/api/profil-sekolah', async (req, res) => {
  try {
    let profil = await prisma.profilSekolah.findFirst();
    res.json(profil || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profil-sekolah', async (req, res) => {
  try {
    const raw = req.body || {};
    const cleanData = {
      nama_sekolah: String(raw.nama_sekolah || raw.namaSekolah || ''),
      npsn: String(raw.npsn || ''),
      alamat: raw.alamat !== undefined ? String(raw.alamat) : null,
      kepala_sekolah: raw.kepala_sekolah !== undefined || raw.kepalaSekolah !== undefined ? String(raw.kepala_sekolah || raw.kepalaSekolah || '') : null,
      nip_kepala_sekolah: raw.nip_kepala_sekolah !== undefined || raw.nipKepalaSekolah !== undefined ? String(raw.nip_kepala_sekolah || raw.nipKepalaSekolah || '') : null,
      no_telp: raw.no_telp !== undefined || raw.noTelp !== undefined ? String(raw.no_telp || raw.noTelp || '') : null,
      email: raw.email !== undefined ? String(raw.email) : null,
      website: raw.website !== undefined ? String(raw.website) : null,
      logo: raw.logo !== undefined ? (raw.logo || null) : null,
      maps_embed: raw.maps_embed !== undefined || raw.mapsEmbed !== undefined ? String(raw.maps_embed || raw.mapsEmbed || '') : null,
      latitude: raw.latitude !== undefined ? String(raw.latitude || '') : null,
      longitude: raw.longitude !== undefined ? String(raw.longitude || '') : null,
    };

    let profil = await prisma.profilSekolah.findFirst();
    if (profil) {
      profil = await prisma.profilSekolah.update({
        where: { id: profil.id },
        data: cleanData
      });
    } else {
      profil = await prisma.profilSekolah.create({
        data: cleanData
      });
    }
    res.json(profil);
  } catch (error) {
    console.error("Error post /api/profil-sekolah:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES: PENGATURAN ---
app.get('/api/pengaturan', async (req, res) => {
  try {
    let pengaturan = await prisma.pengaturan.findFirst();
    res.json(pengaturan || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pengaturan', async (req, res) => {
  try {
    const raw = req.body || {};
    const data = {
      jam_masuk: String(raw.jam_masuk || raw.jamMasuk || '07:00'),
      jam_pulang: String(raw.jam_pulang || raw.jamPulang || '15:00'),
      toleransi_menit: parseInt(raw.toleransi_menit ?? raw.toleransiMenit ?? 15, 10),
      voice_notification: Boolean(raw.voice_notification ?? raw.voiceNotification ?? true),
      semester_aktif: String(raw.semester_aktif || 'Ganjil'),
      hari_efektif: typeof raw.hari_efektif === 'string' ? raw.hari_efektif : (Array.isArray(raw.hari_efektif) ? raw.hari_efektif.join(',') : 'Senin,Selasa,Rabu,Kamis,Jumat,Sabtu'),
      hari_libur: typeof raw.hari_libur === 'string' ? raw.hari_libur : JSON.stringify(raw.hari_libur || []),
      jadwal_harian: typeof raw.jadwal_harian === 'string' ? raw.jadwal_harian : JSON.stringify(raw.jadwal_harian || {}),
      wa_provider: raw.wa_provider || raw.waProvider || 'Lokal',
      wa_domain: raw.wa_domain || raw.waDomain || null,
      wa_token: raw.wa_token || raw.waToken || null
    };

    let pengaturan = await prisma.pengaturan.findFirst();
    if (pengaturan) {
      pengaturan = await prisma.pengaturan.update({ where: { id: pengaturan.id }, data });
    } else {
      pengaturan = await prisma.pengaturan.create({ data });
    }
    res.json(pengaturan);
  } catch (error) {
    console.error("Error savePengaturan backend:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES: GURU TENDIK ---
app.get('/api/guru-tendik', async (req, res) => {
  try {
    const guruTendik = await prisma.guruTendik.findMany();
    res.json(guruTendik);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guru-tendik', async (req, res) => {
  try {
    const raw = req.body || {};
    const data = {
      nik: raw.nik ? String(raw.nik) : null,
      nip: raw.nip ? String(raw.nip) : null,
      nuptk: raw.nuptk ? String(raw.nuptk) : null,
      nama: String(raw.nama || ''),
      kategori: raw.kategori || 'Guru',
      jabatan: raw.jabatan || null,
      gender: raw.gender || 'L',
      no_hp: raw.no_hp || raw.noHp || null,
      alamat: raw.alamat || null,
      status: raw.status || 'Aktif',
      alasan_nonaktif: raw.alasan_nonaktif || raw.alasanNonAktif || null,
      tgl_nonaktif: raw.tgl_nonaktif || raw.tglNonAktif || null,
      qr_code: raw.qr_code || raw.qrCode || `GT-${raw.nip || raw.nuptk || Date.now()}`,
      foto: raw.foto || null,
      password: raw.password || '123456'
    };
    const guru = await prisma.guruTendik.create({ data });
    res.json(guru);
  } catch (error) {
    console.error("Error post /api/guru-tendik:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/guru-tendik/:id', async (req, res) => {
  try {
    const raw = req.body || {};
    const data = {};
    if (raw.nik !== undefined) data.nik = raw.nik ? String(raw.nik) : null;
    if (raw.nip !== undefined) data.nip = raw.nip ? String(raw.nip) : null;
    if (raw.nuptk !== undefined) data.nuptk = raw.nuptk ? String(raw.nuptk) : null;
    if (raw.nama !== undefined) data.nama = String(raw.nama);
    if (raw.kategori !== undefined) data.kategori = raw.kategori;
    if (raw.jabatan !== undefined) data.jabatan = raw.jabatan;
    if (raw.gender !== undefined) data.gender = raw.gender;
    if (raw.no_hp !== undefined || raw.noHp !== undefined) data.no_hp = raw.no_hp || raw.noHp;
    if (raw.alamat !== undefined) data.alamat = raw.alamat;
    if (raw.status !== undefined) data.status = raw.status;
    if (raw.alasan_nonaktif !== undefined || raw.alasanNonAktif !== undefined) data.alasan_nonaktif = raw.alasan_nonaktif || raw.alasanNonAktif || null;
    if (raw.tgl_nonaktif !== undefined || raw.tglNonAktif !== undefined) data.tgl_nonaktif = raw.tgl_nonaktif || raw.tglNonAktif || null;
    if (raw.qr_code !== undefined || raw.qrCode !== undefined) data.qr_code = raw.qr_code || raw.qrCode;
    if (raw.foto !== undefined) data.foto = raw.foto;
    if (raw.password !== undefined) data.password = raw.password;

    const guru = await prisma.guruTendik.update({
      where: { id: req.params.id },
      data
    });
    res.json(guru);
  } catch (error) {
    console.error("Error put /api/guru-tendik/:id:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/guru-tendik/:id', async (req, res) => {
  try {
    await prisma.guruTendik.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES: SISWA ---
app.get('/api/siswa', async (req, res) => {
  try {
    const siswa = await prisma.siswa.findMany({ include: { kelas: true } });
    res.json(siswa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/siswa', async (req, res) => {
  try {
    const raw = req.body || {};
    const data = {
      nisn: String(raw.nisn || ''),
      nama: String(raw.nama || ''),
      gender: raw.gender || 'L',
      orang_tua: raw.orang_tua || raw.orangTua || null,
      no_hp: raw.no_hp || raw.noHp || null,
      alamat: raw.alamat || null,
      status: raw.status || 'Aktif',
      qr_code: raw.qr_code || raw.qrCode || `SIS-${raw.nisn || Date.now()}`,
      foto: raw.foto || null,
      password: raw.password || '123456'
    };

    if (raw.kelas_id) {
      data.kelas = { connect: { id: String(raw.kelas_id) } };
    }

    const siswa = await prisma.siswa.create({ data, include: { kelas: true } });
    res.json(siswa);
  } catch (error) {
    console.error("Error post /api/siswa:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/siswa/:id', async (req, res) => {
  try {
    const raw = req.body || {};
    const data = {};
    if (raw.nisn !== undefined) data.nisn = String(raw.nisn);
    if (raw.nama !== undefined) data.nama = String(raw.nama);
    if (raw.gender !== undefined) data.gender = raw.gender;
    if (raw.orang_tua !== undefined || raw.orangTua !== undefined) data.orang_tua = raw.orang_tua || raw.orangTua;
    if (raw.no_hp !== undefined || raw.noHp !== undefined) data.no_hp = raw.no_hp || raw.noHp;
    if (raw.alamat !== undefined) data.alamat = raw.alamat;
    if (raw.status !== undefined) data.status = raw.status;
    if (raw.qr_code !== undefined || raw.qrCode !== undefined) data.qr_code = raw.qr_code || raw.qrCode;
    if (raw.foto !== undefined) data.foto = raw.foto;
    if (raw.password !== undefined) data.password = raw.password;

    if (raw.kelas_id === null || raw.kelas_id === '' || raw.kelas_id === 'null' || (raw.kelas_id === undefined && 'kelas_id' in raw)) {
      data.kelas = { disconnect: true };
    } else if (raw.kelas_id) {
      data.kelas = { connect: { id: String(raw.kelas_id) } };
    }

    const siswa = await prisma.siswa.update({
      where: { id: req.params.id },
      data,
      include: { kelas: true }
    });
    res.json(siswa);
  } catch (error) {
    console.error("Error put /api/siswa/:id:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/siswa/:id', async (req, res) => {
  try {
    await prisma.siswa.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES: KELAS ---
app.get('/api/kelas', async (req, res) => {
  try {
    const kelas = await prisma.kelas.findMany();
    res.json(kelas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/kelas', async (req, res) => {
  try {
    const raw = req.body || {};
    const data = {
      nama: String(raw.nama || ''),
      tingkat: String(raw.tingkat || 'X'),
      wali_kelas: raw.wali_kelas || raw.waliKelas || null,
      tapel: raw.tapel || '2025/2026',
      semester: raw.semester || 'Ganjil'
    };
    const kelas = await prisma.kelas.create({ data });
    res.json(kelas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/kelas/:id', async (req, res) => {
  try {
    const raw = req.body || {};
    const data = {};
    if (raw.nama !== undefined) data.nama = String(raw.nama);
    if (raw.tingkat !== undefined) data.tingkat = String(raw.tingkat);
    if (raw.wali_kelas !== undefined || raw.waliKelas !== undefined) data.wali_kelas = raw.wali_kelas || raw.waliKelas;
    if (raw.tapel !== undefined) data.tapel = raw.tapel;
    if (raw.semester !== undefined) data.semester = raw.semester;

    const kelas = await prisma.kelas.update({
      where: { id: req.params.id },
      data
    });
    res.json(kelas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/kelas/:id', async (req, res) => {
  try {
    await prisma.kelas.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROUTES: PRESENSI LOGS ---
app.get('/api/presensi', async (req, res) => {
  try {
    const logs = await prisma.logPresensi.findMany();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/presensi/scan', async (req, res) => {
  try {
    const data = req.body; 
    
    const logData = {
      ...data,
      tanggal: new Date(data.tanggal)
    };
    
    // Remove transient fields if frontend sent them
    delete logData.nama;
    delete logData.noHp;

    const log = await prisma.logPresensi.create({ data: logData });
    
    // WHATSAPP NOTIFICATION LOGIC
    // We do it asynchronously so we don't block the response
    (async () => {
      try {
        let phone = null;
        let nama = data.nama; // Frontend might send it

        if (!nama || !phone) {
          if (log.target_type === 'Siswa') {
            const siswa = await prisma.siswa.findFirst({ where: { OR: [{ id: log.target_id }, { nisn: log.target_id }] }});
            if (siswa) {
              phone = siswa.no_hp || siswa.orang_tua_hp; // Adjust based on DB schema
              nama = siswa.nama;
            }
          } else {
            const gt = await prisma.guruTendik.findFirst({ where: { OR: [{ id: log.target_id }, { nip: log.target_id }, { nuptk: log.target_id }] }});
            if (gt) {
              phone = gt.no_hp;
              nama = gt.nama;
            }
          }
        } else {
          phone = data.noHp;
        }

        if (phone && (log.jam_masuk || log.jam_pulang)) {
           const action = log.jam_pulang && !log.jam_masuk ? 'PULANG' : 'MASUK'; // Simplified
           const time = log.jam_pulang || log.jam_masuk;
           const targetLabel = log.target_type === 'Siswa' ? 'Orang Tua/Wali dari' : 'Bapak/Ibu';
           const dateStr = new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

           const msg = `📢 *Info Kehadiran - MIN 1 CIANJUR*\n\nYth. ${targetLabel} *${nama}*\n\nDiberitahukan bahwa yang bersangkutan telah melakukan *Presensi ${action}* pada:\n📅 Tanggal: ${dateStr}\n⏰ Waktu: ${time} WIB\nStatus: ✅ ${log.status}\n\nTerima kasih.`;
           
           const pengaturan = await prisma.pengaturan.findFirst();
           await whatsapp.sendMessage(phone, msg, pengaturan);
        }
      } catch(waErr) {
        console.error('[WhatsApp] Error in presensi trigger:', waErr);
      }
    })();

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/presensi/all', async (req, res) => {
  try {
    await prisma.logPresensi.deleteMany({});
    res.json({ success: true, message: 'Semua log presensi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/presensi/:id', async (req, res) => {
  try {
    const raw = req.body || {};
    const updateData = {};

    if (raw.target_id !== undefined || raw.targetId !== undefined) updateData.target_id = String(raw.target_id || raw.targetId);
    if (raw.target_type !== undefined || raw.targetType !== undefined) updateData.target_type = String(raw.target_type || raw.targetType);
    if (raw.tanggal !== undefined) updateData.tanggal = new Date(raw.tanggal);
    if (raw.jam_masuk !== undefined || raw.jamMasuk !== undefined) updateData.jam_masuk = raw.jam_masuk || raw.jamMasuk || null;
    if (raw.jam_pulang !== undefined || raw.jamPulang !== undefined) updateData.jam_pulang = raw.jam_pulang || raw.jamPulang || null;
    if (raw.status !== undefined) updateData.status = String(raw.status);
    if (raw.keterangan !== undefined) updateData.keterangan = raw.keterangan ? String(raw.keterangan) : null;

    const log = await prisma.logPresensi.update({
      where: { id: req.params.id },
      data: updateData
    });

    // WHATSAPP NOTIFICATION LOGIC FOR PULANG
    if (updateData.jam_pulang) {
      (async () => {
        try {
          let phone = null;
          let nama = raw.nama; // Frontend might send it

          if (!nama || !phone) {
            if (log.target_type === 'Siswa') {
              const siswa = await prisma.siswa.findFirst({ where: { OR: [{ id: log.target_id }, { nisn: log.target_id }] }});
              if (siswa) {
                phone = siswa.no_hp || siswa.orang_tua_hp;
                nama = siswa.nama;
              }
            } else {
              const gt = await prisma.guruTendik.findFirst({ where: { OR: [{ id: log.target_id }, { nip: log.target_id }, { nuptk: log.target_id }] }});
              if (gt) {
                phone = gt.no_hp;
                nama = gt.nama;
              }
            }
          } else {
            phone = raw.noHp;
          }

          if (phone) {
             const targetLabel = log.target_type === 'Siswa' ? 'Orang Tua/Wali dari' : 'Bapak/Ibu';
             const dateStr = new Date(log.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
             const msg = `📢 *Info Kehadiran - MIN 1 CIANJUR*\n\nYth. ${targetLabel} *${nama}*\n\nDiberitahukan bahwa yang bersangkutan telah melakukan *Presensi PULANG* pada:\n📅 Tanggal: ${dateStr}\n⏰ Waktu: ${log.jam_pulang} WIB\n\nTerima kasih.`;
             const pengaturan = await prisma.pengaturan.findFirst();
             await whatsapp.sendMessage(phone, msg, pengaturan);
          }
        } catch(waErr) {
          console.error('[WhatsApp] Error in presensi trigger:', waErr);
        }
      })();
    }

    res.json(log);
  } catch (error) {
    console.error("Error put /api/presensi/:id:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- WHATSAPP ROUTES ---
app.get('/api/whatsapp/status', (req, res) => {
  res.json(whatsapp.getStatus());
});

app.post('/api/whatsapp/logout', async (req, res) => {
  await whatsapp.logout();
  res.json({ success: true, message: 'WhatsApp logged out & resetting.' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  whatsapp.initializeWhatsApp(); // Start WA client
});
