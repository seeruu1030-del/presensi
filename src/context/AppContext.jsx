import React, { createContext, useContext, useState, useEffect } from 'react';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../utils/sweetalert';
import { api } from '../utils/api';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const getTodayDateString = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatLocalDateString = (dateInput) => {
  if (!dateInput) return getTodayDateString();

  if (typeof dateInput === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateInput.split('T')[0];
  }

  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TODAY_DATE = getTodayDateString(); // Format YYYY-MM-DD

export const DEFAULT_TAPEL_LIST = [
  { id: 'tapel-1', tahun: '2024/2025', status: 'Non-Aktif' },
  { id: 'tapel-2', tahun: '2025/2026', status: 'Aktif' }
];

export const CARD_BG_PRESETS = [
  { id: 'indigo', label: 'Midnight Indigo / Emerald', guruGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)', siswaGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #10b981 100%)' },
  { id: 'ocean', label: 'Oceanic Deep Blue', guruGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 60%, #38bdf8 100%)', siswaGradient: 'linear-gradient(135deg, #075985 0%, #0369a1 60%, #0284c7 100%)' },
  { id: 'crimson', label: 'Crimson Red / Ruby', guruGradient: 'linear-gradient(135deg, #450a0a 0%, #991b1b 60%, #ef4444 100%)', siswaGradient: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 60%, #f87171 100%)' },
  { id: 'luxe', label: 'Dark Slate / Charcoal', guruGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', siswaGradient: 'linear-gradient(135deg, #18181b 0%, #27272a 60%, #52525b 100%)' },
  { id: 'sunset', label: 'Sunset Amber / Gold', guruGradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 60%, #f97316 100%)', siswaGradient: 'linear-gradient(135deg, #78350f 0%, #b45309 60%, #f59e0b 100%)' },
  { id: 'violet', label: 'Royal Purple Violet', guruGradient: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 60%, #a855f7 100%)', siswaGradient: 'linear-gradient(135deg, #581c87 0%, #7e22ce 60%, #c084fc 100%)' }
];

export const DEFAULT_TUGAS_GTK = [
  {
    id: 'tugas-1',
    guruId: '',
    namaPersonel: 'Dwi Intan Permata Sari, S.Pd',
    kategori: 'Guru',
    namaTugas: 'Wakil Kepala Sekolah Bidang Kurikulum',
    skNomor: '800/012/SK-GTK/2025',
    skTanggal: '2025-07-15',
    tahunPelajaran: '2025/2026',
    status: 'Aktif',
    keterangan: 'Menyusun Kurikulum Merdeka & Jadwal Pelajaran'
  },
  {
    id: 'tugas-2',
    guruId: '',
    namaPersonel: 'Budi Santoso, S.Kom',
    kategori: 'Guru',
    namaTugas: 'Kepala Laboratorium Komputer & Operator Dapodik',
    skNomor: '800/014/SK-GTK/2025',
    skTanggal: '2025-07-15',
    tahunPelajaran: '2025/2026',
    status: 'Aktif',
    keterangan: 'Pengelola Lab Komputer & Server UNBK/ANBK'
  },
  {
    id: 'tugas-3',
    guruId: '',
    namaPersonel: 'Siti Aminah, A.Md',
    kategori: 'Tendik',
    namaTugas: 'Bendahara BOS & Pengelola Keuangan',
    skNomor: '800/018/SK-GTK/2025',
    skTanggal: '2025-07-15',
    tahunPelajaran: '2025/2026',
    status: 'Aktif',
    keterangan: 'Pengelola Anggaran Operasional Sekolah'
  }
];

export const normalizeSiswa = (s) => {
  if (!s) return s;
  return {
    ...s,
    orangTua: s.orangTua || s.orang_tua || '',
    orang_tua: s.orang_tua || s.orangTua || '',
    noHp: s.noHp || s.no_hp || '',
    no_hp: s.no_hp || s.noHp || '',
    qrCode: s.qrCode || s.qr_code || '',
    qr_code: s.qr_code || s.qrCode || ''
  };
};

export const normalizeGuru = (g) => {
  if (!g) return g;
  return {
    ...g,
    noHp: g.noHp || g.no_hp || '',
    no_hp: g.no_hp || g.noHp || '',
    qrCode: g.qrCode || g.qr_code || '',
    qr_code: g.qr_code || g.qrCode || ''
  };
};

export const DEFAULT_JADWAL_HARIAN = {
  Senin:  { aktif: true,  jamMasuk: '07:00', jamPulang: '15:00' },
  Selasa: { aktif: true,  jamMasuk: '07:00', jamPulang: '15:00' },
  Rabu:   { aktif: true,  jamMasuk: '07:00', jamPulang: '15:00' },
  Kamis:  { aktif: true,  jamMasuk: '07:00', jamPulang: '15:00' },
  Jumat:  { aktif: true,  jamMasuk: '07:00', jamPulang: '14:00' },
  Sabtu:  { aktif: true,  jamMasuk: '07:00', jamPulang: '13:00' },
  Minggu: { aktif: false, jamMasuk: '07:00', jamPulang: '12:00' }
};

export const sortTapelList = (list) => {
  return [...(list || [])].sort((a, b) => {
    return String(a.tahun || '').localeCompare(String(b.tahun || ''), undefined, { numeric: true, sensitivity: 'base' });
  });
};

export const sortKelasList = (list) => {
  return [...(list || [])].sort((a, b) => {
    return String(a.nama || '').localeCompare(String(b.nama || ''), undefined, { numeric: true, sensitivity: 'base' });
  });
};

// Helper menentukan rombel aktif siswa yang strictly sesuai dengan Tapel & Semester aktif
export const getSiswaActiveRombel = (siswa, activeTapel, activeSemester, kelasList = [], riwayatMap = null) => {
  if (!siswa) return null;

  const activeKey = `${activeTapel}_${activeSemester || 'Ganjil'}`;

  // 1. Check riwayat_kelas mapping for activeKey
  const riwayat = (riwayatMap && riwayatMap[siswa.id]) || siswa.riwayat_kelas;
  if (riwayat && typeof riwayat === 'object' && activeKey in riwayat) {
    const mappedKlsId = riwayat[activeKey];
    if (mappedKlsId === null || mappedKlsId === '') return null;
    const klsFound = (kelasList || []).find(k => k.id === mappedKlsId || k.nama === mappedKlsId);
    return klsFound ? klsFound.nama : null;
  }

  // 2. Fallback to direct s.kelas / s.kelas_id
  let kls = (siswa.kelas && typeof siswa.kelas === 'object') ? siswa.kelas : null;
  if (!kls && siswa.kelas_id && kelasList.length > 0) {
    kls = kelasList.find(k => k.id === siswa.kelas_id);
  }

  if (!kls) return null;

  const klsTapel = kls.tapel || '';
  const klsSem = kls.semester || activeSemester || 'Ganjil';

  if (klsTapel === activeTapel && klsSem === (activeSemester || 'Ganjil')) {
    return kls.nama;
  }

  return null;
};

export const AppProvider = ({ children }) => {
  const [guruTendikList, setGuruTendikList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [riwayatKelasMap, setRiwayatKelasMap] = useState(() => {
    try {
      const saved = localStorage.getItem('presensi_siswa_riwayat_kelas');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('presensi_siswa_riwayat_kelas', JSON.stringify(riwayatKelasMap));
    } catch (e) {}
  }, [riwayatKelasMap]);

  const [tapelList, setTapelList] = useState(() => {
    try {
      const saved = localStorage.getItem('presensi_tapel_list');
      const list = saved ? JSON.parse(saved) : DEFAULT_TAPEL_LIST;
      return sortTapelList(list);
    } catch (e) {
      return sortTapelList(DEFAULT_TAPEL_LIST);
    }
  });

  useEffect(() => {
    localStorage.setItem('presensi_tapel_list', JSON.stringify(tapelList));
  }, [tapelList]);

  const [tugasGTKList, setTugasGTKList] = useState(() => {
    try {
      const saved = localStorage.getItem('presensi_tugas_gtk');
      return saved ? JSON.parse(saved) : DEFAULT_TUGAS_GTK;
    } catch (e) {
      return DEFAULT_TUGAS_GTK;
    }
  });

  useEffect(() => {
    localStorage.setItem('presensi_tugas_gtk', JSON.stringify(tugasGTKList));
  }, [tugasGTKList]);
  const [semesterAktif, setSemesterAktif] = useState(() => {
    try {
      return localStorage.getItem('presensi_semester_aktif') || 'Ganjil';
    } catch(e) { return 'Ganjil'; }
  });
  const [profilSekolah, setProfilSekolah] = useState({});
  const [pengaturan, setPengaturan] = useState({
    jam_masuk: '07:00',
    jam_pulang: '15:00',
    toleransi_menit: 15,
    voice_notification: true,
    hari_efektif: 'Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
    hari_libur: [],
    jadwal_harian: DEFAULT_JADWAL_HARIAN
  });
  const [presensiLogs, setPresensiLogs] = useState([]);
  
  const [bgCardGuru, setBgCardGuru] = useState(() => localStorage.getItem('presensi_bg_guru') || 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)');
  const [bgCardSiswa, setBgCardSiswa] = useState(() => localStorage.getItem('presensi_bg_siswa') || 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #10b981 100%)');

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [toastMessage, setToastMessage] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load Data from API on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [guru, siswa, kelas, profil, peng, logs] = await Promise.all([
          api.getGuruTendik(),
          api.getSiswa(),
          api.getKelas(),
          api.getProfilSekolah(),
          api.getPengaturan(),
          api.getPresensi()
        ]);
        setGuruTendikList((guru || []).map(normalizeGuru));
        setSiswaList((siswa || []).map(normalizeSiswa));
        setKelasList(sortKelasList(kelas || []));
        if (profil) {
          setProfilSekolah({
            ...profil,
            namaSekolah: profil.nama_sekolah || profil.namaSekolah || '',
            npsn: profil.npsn || '',
            alamat: profil.alamat || '',
            kepalaSekolah: profil.kepala_sekolah || profil.kepalaSekolah || '',
            nipKepalaSekolah: profil.nip_kepala_sekolah || profil.nipKepalaSekolah || '',
            noTelp: profil.no_telp || profil.noTelp || '',
            email: profil.email || '',
            website: profil.website || '',
            logo: profil.logo || '',
            mapsEmbed: profil.maps_embed || profil.mapsEmbed || '',
            latitude: profil.latitude || '',
            longitude: profil.longitude || '',
            radius: profil.radius || 0
          });
        }
        if (peng && peng.id) {
          let parsedHariLibur = [];
          let parsedJadwalHarian = { ...DEFAULT_JADWAL_HARIAN };
          try {
            if (typeof peng.hari_libur === 'string') parsedHariLibur = JSON.parse(peng.hari_libur || '[]');
            else if (Array.isArray(peng.hari_libur)) parsedHariLibur = peng.hari_libur;
          } catch(e) {}

          try {
            if (typeof peng.jadwal_harian === 'string' && peng.jadwal_harian.trim() && peng.jadwal_harian !== '{}') {
              parsedJadwalHarian = { ...DEFAULT_JADWAL_HARIAN, ...JSON.parse(peng.jadwal_harian) };
            } else if (typeof peng.jadwal_harian === 'object' && peng.jadwal_harian !== null) {
              parsedJadwalHarian = { ...DEFAULT_JADWAL_HARIAN, ...peng.jadwal_harian };
            }
          } catch(e) {}

          setPengaturan({
            ...peng,
            jam_masuk: peng.jam_masuk || '07:00',
            jam_pulang: peng.jam_pulang || '15:00',
            toleransi_menit: peng.toleransi_menit || 15,
            voice_notification: peng.voice_notification ?? true,
            hari_efektif: peng.hari_efektif || 'Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
            hari_efektif_bulanan: peng.hari_efektif_bulanan ? parseInt(peng.hari_efektif_bulanan, 10) : 20,
            hari_efektif_semester: peng.hari_efektif_semester ? parseInt(peng.hari_efektif_semester, 10) : 110,
            hari_libur: parsedHariLibur,
            jadwal_harian: parsedJadwalHarian
          });

          // Sinkronkan semester aktif dari pengaturan backend
          if (peng.semester_aktif) {
            setSemesterAktif(peng.semester_aktif);
          }
        }
        
        // Convert date format from DB and normalize all properties
        const normalizedGuruList = (guru || []).map(normalizeGuru);
        const normalizedSiswaList = (siswa || []).map(normalizeSiswa);

        const formattedLogs = (logs || []).map(l => {
          const tId = l.target_id || l.targetId || '';
          const tType = l.target_type || l.targetType || 'Siswa';
          let name = l.nama || '';
          let detail = l.detailInfo || '';

          if (!name) {
            if (tType === 'Siswa') {
              const s = normalizedSiswaList.find(x => x.id === tId);
              if (s) {
                name = s.nama;
                const k = (kelas || []).find(c => c.id === s.kelas_id);
                detail = `Kelas ${k ? k.nama : '-'}`;
              }
            } else {
              const g = normalizedGuruList.find(x => x.id === tId);
              if (g) {
                name = g.nama;
                detail = g.jabatan || g.kategori || 'Guru';
              }
            }
          }

          const jMasuk = l.jam_masuk || l.jamMasuk || '';
          const jPulang = l.jam_pulang || l.jamPulang || null;
          const tgl = l.tanggal ? formatLocalDateString(l.tanggal) : getTodayDateString();

          return {
            ...l,
            id: l.id,
            target_id: tId,
            targetId: tId,
            target_type: tType,
            targetType: tType,
            tanggal: tgl,
            jam_masuk: jMasuk,
            jamMasuk: jMasuk,
            jam_pulang: jPulang,
            jamPulang: jPulang,
            nama: name,
            detailInfo: detail
          };
        });

        setPresensiLogs(formattedLogs.reverse());
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Gagal memuat data dari database:", error);
        showToast("Gagal terhubung ke Database", "error");
      }
    };
    loadData();
  }, []);

  // Sync background settings to LocalStorage
  useEffect(() => { localStorage.setItem('presensi_bg_guru', bgCardGuru); }, [bgCardGuru]);
  useEffect(() => { localStorage.setItem('presensi_bg_siswa', bgCardSiswa); }, [bgCardSiswa]);
  useEffect(() => { localStorage.setItem('presensi_semester_aktif', semesterAktif); }, [semesterAktif]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to get daily schedule for a given date
  const getDaySchedule = (date = new Date()) => {
    const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDayIndo = dayNamesIndo[date.getDay()];
    
    let activeJadwal = DEFAULT_JADWAL_HARIAN;
    if (pengaturan.jadwal_harian) {
      if (typeof pengaturan.jadwal_harian === 'object') {
        activeJadwal = { ...DEFAULT_JADWAL_HARIAN, ...pengaturan.jadwal_harian };
      } else if (typeof pengaturan.jadwal_harian === 'string') {
        try {
          activeJadwal = { ...DEFAULT_JADWAL_HARIAN, ...JSON.parse(pengaturan.jadwal_harian) };
        } catch(e) {}
      }
    }
    
    const dayConfig = activeJadwal[currentDayIndo] || DEFAULT_JADWAL_HARIAN[currentDayIndo] || { aktif: true, jamMasuk: '07:00', jamPulang: '15:00' };
    return { currentDayIndo, schedule: dayConfig };
  };

  // Helper calculation for Attendance Status
  const calculateAttendanceStatus = (scanTimeStr, dayMasukTime) => {
    const targetTime = dayMasukTime || pengaturan.jam_masuk || '07:00';
    const [targetHour, targetMin] = targetTime.split(':').map(Number);
    const [scanHour, scanMin] = scanTimeStr.split(':').map(Number);

    const targetTotalMin = targetHour * 60 + targetMin + parseInt(pengaturan.toleransi_menit || 0, 10);
    const scanTotalMin = scanHour * 60 + scanMin;

    if (scanTotalMin <= targetTotalMin) {
      return { status: 'Hadir', keterangan: 'Masuk Tepat Waktu' };
    } else {
      const diff = scanTotalMin - (targetHour * 60 + targetMin);
      return { status: 'Terlambat', keterangan: `Terlambat ${diff} Menit` };
    }
  };

  // Save Settings Function
  const savePengaturan = async (newSettings) => {
    try {
      const payload = {
        jam_masuk: newSettings.jam_masuk || newSettings.jamMasuk || '07:00',
        jam_pulang: newSettings.jam_pulang || newSettings.jamPulang || '15:00',
        toleransi_menit: parseInt(newSettings.toleransi_menit ?? newSettings.toleransiMenit ?? 15, 10),
        voice_notification: newSettings.voice_notification ?? newSettings.voiceNotification ?? true,
        semester_aktif: semesterAktif || 'Ganjil',
        hari_efektif: Array.isArray(newSettings.hari_efektif) ? newSettings.hari_efektif.join(',') : (newSettings.hari_efektif || 'Senin,Selasa,Rabu,Kamis,Jumat,Sabtu'),
        hari_efektif_bulanan: parseInt(newSettings.hari_efektif_bulanan ?? 20, 10),
        hari_efektif_semester: parseInt(newSettings.hari_efektif_semester ?? 110, 10),
        hari_libur: JSON.stringify(newSettings.hari_libur || []),
        jadwal_harian: JSON.stringify(newSettings.jadwal_harian || DEFAULT_JADWAL_HARIAN),
        wa_provider: newSettings.wa_provider || 'Lokal',
        wa_domain: newSettings.wa_domain || null,
        wa_token: newSettings.wa_token || null
      };

      const saved = await api.savePengaturan(payload);

      let parsedHariLibur = [];
      let parsedJadwalHarian = { ...DEFAULT_JADWAL_HARIAN };
      try { parsedHariLibur = JSON.parse(saved.hari_libur || '[]'); } catch(e) {}
      try { parsedJadwalHarian = { ...DEFAULT_JADWAL_HARIAN, ...JSON.parse(saved.jadwal_harian || '{}') }; } catch(e) {}

      const updatedState = {
        ...saved,
        jam_masuk: saved.jam_masuk || '07:00',
        jam_pulang: saved.jam_pulang || '15:00',
        toleransi_menit: saved.toleransi_menit || 15,
        voice_notification: saved.voice_notification ?? true,
        hari_efektif: saved.hari_efektif || 'Senin,Selasa,Rabu,Kamis,Jumat,Sabtu',
        hari_efektif_bulanan: saved.hari_efektif_bulanan ? parseInt(saved.hari_efektif_bulanan, 10) : (parseInt(newSettings.hari_efektif_bulanan, 10) || 20),
        hari_efektif_semester: saved.hari_efektif_semester ? parseInt(saved.hari_efektif_semester, 10) : (parseInt(newSettings.hari_efektif_semester, 10) || 110),
        hari_libur: parsedHariLibur,
        jadwal_harian: parsedJadwalHarian,
        wa_provider: saved.wa_provider || 'Lokal',
        wa_domain: saved.wa_domain || null,
        wa_token: saved.wa_token || null
      };

      setPengaturan(updatedState);
      showSuccessAlert('Berhasil Simpan', 'Pengaturan presensi sekolah berhasil disimpan.');
      return updatedState;
    } catch(err) {
      console.error("Error savePengaturan:", err);
      showToast(err.message || "Gagal menyimpan pengaturan", "error");
    }
  };

  // Process QR Scan
  const processQRScan = async (qrCodeString) => {
    let code = qrCodeString.trim();
    if (code.includes('/verify/')) {
      code = code.split('/verify/').pop();
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const dateStr = getTodayDateString(now);

    const { currentDayIndo, schedule } = getDaySchedule(now);

    // 1. Check Specific Holiday Date List (Hari Libur Spesifik / Tanggal Merah)
    const activeHolidays = Array.isArray(pengaturan.hari_libur) ? pengaturan.hari_libur : [];
    const isHolidayActive = (h) => {
      if (h.aktif === false || h.aktif === 'false' || h.aktif === 'off' || h.aktif === 'non-aktif') return false;
      return true;
    };

    const foundHoliday = activeHolidays.find(h => {
      if (!isHolidayActive(h)) return false;
      const tM = typeof (h.tanggal_mulai || h.tanggalMulai || h.tanggal) === 'string' 
        ? (h.tanggal_mulai || h.tanggalMulai || h.tanggal).split('T')[0] 
        : (h.tanggal_mulai || h.tanggalMulai || h.tanggal);
      const tS = typeof (h.tanggal_selesai || h.tanggalSelesai || tM) === 'string' 
        ? (h.tanggal_selesai || h.tanggalSelesai || tM).split('T')[0] 
        : (h.tanggal_selesai || h.tanggalSelesai || tM);

      if (!tM) return false;
      return dateStr >= tM && dateStr <= tS;
    });

    if (foundHoliday) {
      return { 
        success: false, 
        message: `Presensi Ditutup: Hari ini libur (${foundHoliday.keterangan || 'Libur Nasional'}).` 
      };
    }

    // 2. Check Day-of-Week Effective Day (Hari Efektif Perminggu)
    if (!schedule.aktif) {
      return { 
        success: false, 
        message: `Presensi Ditutup: Hari ${currentDayIndo} adalah hari non-efektif / libur mingguan.` 
      };
    }
    
    // Find in Guru/Tendik or Siswa (check database fields)
    const foundGT = guruTendikList.find(g => 
      (g.qr_code || '').toLowerCase() === code.toLowerCase() || 
      g.nuptk === code ||
      g.id === code
    );
    const foundSIS = siswaList.find(s => 
      (s.qr_code || '').toLowerCase() === code.toLowerCase() || 
      s.nisn === code ||
      s.id === code
    );

    if (!foundGT && !foundSIS) {
      return { success: false, message: `Kode QR/ID "${code}" tidak ditemukan dalam sistem.` };
    }

    const targetObj = foundGT || foundSIS;
    const targetType = foundGT ? foundGT.kategori : 'Siswa';
    
    let detailInfo = '';
    if (foundGT) detailInfo = foundGT.jabatan;
    else {
      // Get class name
      const kelas = kelasList.find(k => k.id === foundSIS.kelas_id);
      detailInfo = `Kelas ${kelas ? kelas.nama : '-'}`;
    }

    // Helper format clean name for speech pronunciation
    const cleanSpeechName = (targetObj.nama || '')
      .split(',')[0]
      .replace(/^(Drs\.|Dra\.|Dr\.|Ir\.|H\.|Hj\.)\s+/ig, '')
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, a => a.toUpperCase())
      .trim();

    // Helper determine Bapak / Ibu for GTK based on gender
    const getGtkTitle = (user) => {
      if (!user) return 'Bapak/Ibu';
      const g = String(user.gender || user.jenis_kelamin || user.jk || '').trim().toUpperCase();
      if (g === 'L' || g.includes('LAKI')) return 'Bapak';
      if (g === 'P' || g.includes('PEREMPUAN')) return 'Ibu';
      return 'Bapak/Ibu';
    };

    // Time calculations
    const targetMasuk = schedule.jamMasuk || schedule.jam_masuk || pengaturan.jam_masuk || '07:00';
    const targetPulang = schedule.jamPulang || schedule.jam_pulang || pengaturan.jam_pulang || '15:00';

    const [tHour, tMin] = targetMasuk.split(':').map(Number);
    const [pHour, pMin] = targetPulang.split(':').map(Number);
    const [sHour, sMin] = timeStr.split(':').map(Number);

    const scanTotalMin = sHour * 60 + sMin;
    const masukTotalMin = tHour * 60 + tMin + parseInt(pengaturan.toleransi_menit || 0, 10);
    const pulangTotalMin = pHour * 60 + pMin;

    // Check if already scanned today
    const existingLogIndex = presensiLogs.findIndex(l => {
      const isSameTarget = (
        (l.target_id && String(l.target_id) === String(targetObj.id)) ||
        (l.targetId && String(l.targetId) === String(targetObj.id)) ||
        (foundSIS && (l.target_id === foundSIS.nisn || l.targetId === foundSIS.nisn)) ||
        (foundGT && (l.target_id === foundGT.nuptk || l.target_id === foundGT.nip || l.targetId === foundGT.nuptk || l.targetId === foundGT.nip))
      );
      const isSameDate = formatLocalDateString(l.tanggal) === dateStr;
      return isSameTarget && isSameDate;
    });

    if (existingLogIndex !== -1) {
      const existingLog = presensiLogs[existingLogIndex];

      // Scenario A: Already completed both check-in & check-out today
      if (existingLog.jam_pulang || existingLog.jamPulang) {
        return { 
          success: false, 
          code: 'SUDAH_PULANG',
          user: targetObj,
          targetType,
          detailInfo,
          message: `Maaf ${targetObj.nama} sudah presensi Masuk & Pulang hari ini`,
          voiceMessage: `Maaf ${cleanSpeechName}, Anda sudah presensi masuk dan pulang hari ini.`
        };
      }

      // Scenario B: Siswa / GTK presensi masuk yang kedua kali sebelum jam pulang
      if (scanTotalMin < pulangTotalMin) {
        const isGTK = targetType === 'Guru' || targetType === 'Tendik' || targetType === 'GTK';
        const title = isGTK ? getGtkTitle(targetObj) : '';
        const nameDisplay = isGTK ? `${title} ${targetObj.nama}` : targetObj.nama;
        const voiceNameDisplay = isGTK ? `${title} ${cleanSpeechName}` : cleanSpeechName;

        return { 
          success: false, 
          code: 'SUDAH_MASUK',
          user: targetObj,
          targetType,
          detailInfo,
          message: `${nameDisplay}, Sudah melakukan presensi masuk`,
          voiceMessage: `${voiceNameDisplay}, Sudah melakukan presensi masuk`
        };
      }

      // Scenario C: Siswa / GTK presensi pada waktu sudah saatnya pulang (scanTotalMin >= pulangTotalMin)
      try {
        const payload = {
          id: existingLog.id,
          target_id: existingLog.target_id || existingLog.targetId,
          target_type: existingLog.target_type || existingLog.targetType,
          tanggal: existingLog.tanggal,
          jam_masuk: existingLog.jam_masuk || existingLog.jamMasuk,
          jam_pulang: timeStr,
          status: existingLog.status,
          keterangan: `${existingLog.keterangan || ''} | Pulang ${timeStr}`.trim()
        };
        const response = await api.updatePresensi(existingLog.id, payload);
        
        const updatedLog = {
          ...existingLog,
          ...response,
          target_id: targetObj.id,
          targetId: targetObj.id,
          target_type: targetType,
          targetType: targetType,
          tanggal: dateStr,
          jam_masuk: existingLog.jamMasuk || existingLog.jam_masuk,
          jamMasuk: existingLog.jamMasuk || existingLog.jam_masuk,
          jam_pulang: timeStr,
          jamPulang: timeStr,
          nama: targetObj.nama,
          detailInfo: detailInfo
        };

        setPresensiLogs(prevLogs => {
          const list = [...(prevLogs || [])];
          const idx = list.findIndex(l => l.id === existingLog.id);
          if (idx !== -1) {
            list[idx] = updatedLog;
          } else {
            list.unshift(updatedLog);
          }
          return list;
        });
        
        const isGTK = targetType === 'Guru' || targetType === 'Tendik' || targetType === 'GTK';
        const title = isGTK ? getGtkTitle(targetObj) : '';
        const nameDisplay = isGTK ? `${title} ${targetObj.nama}` : targetObj.nama;
        const voiceNameDisplay = isGTK ? `${title} ${cleanSpeechName}` : cleanSpeechName;

        return {
          success: true, 
          mode: 'PULANG', 
          user: targetObj, 
          targetType, 
          detailInfo,
          status: 'Hadir (Pulang)', 
          timeStr, 
          message: `Berhasil presensi pulang, hati-hati dijalan ${nameDisplay}`,
          voiceMessage: `Berhasil presensi pulang, hati-hati dijalan ${voiceNameDisplay}`
        };
      } catch (err) {
        return { success: false, message: "Gagal menyimpan presensi pulang ke database." };
      }
    }

    // New Entry Scan (Check-in)
    const calc = calculateAttendanceStatus(timeStr, targetMasuk);
    const isOnTime = scanTotalMin <= masukTotalMin;

    if (!isOnTime) {
      const isGTK = targetType === 'Guru' || targetType === 'Tendik' || targetType === 'GTK';
      const title = isGTK ? getGtkTitle(targetObj) : '';
      const voiceNameDisplay = isGTK ? `${title} ${cleanSpeechName}` : cleanSpeechName;
      
      return {
        success: false,
        code: 'TERLAMBAT_DITOLAK',
        user: targetObj,
        targetType,
        detailInfo,
        message: `Maaf, batas waktu presensi masuk dan toleransi keterlambatan sudah habis.`,
        voiceMessage: `Maaf ${voiceNameDisplay}, batas waktu presensi masuk sudah habis.`
      };
    }

    const newLogData = {
      target_id: targetObj.id,
      target_type: targetType,
      tanggal: dateStr,
      jam_masuk: timeStr,
      jam_pulang: null,
      status: calc.status,
      keterangan: calc.keterangan
    };

    try {
      const response = await api.addPresensi(newLogData);
      
      const savedLog = {
        ...response,
        target_id: targetObj.id,
        targetId: targetObj.id,
        target_type: targetType,
        targetType: targetType,
        tanggal: dateStr,
        jam_masuk: timeStr,
        jamMasuk: timeStr,
        jam_pulang: null,
        jamPulang: null,
        nama: targetObj.nama,
        detailInfo: detailInfo,
        status: calc.status,
        keterangan: calc.keterangan
      };
      
      setPresensiLogs(prevLogs => {
        const filtered = (prevLogs || []).filter(l => l.id !== savedLog.id);
        return [savedLog, ...filtered];
      });

      // Presensi Masuk Berhasil (Tepat Waktu maupun Terlambat)
      const isGTK = targetType === 'Guru' || targetType === 'Tendik' || targetType === 'GTK';
      const title = isGTK ? getGtkTitle(targetObj) : '';

      const greetingMsg = isGTK
        ? `Assalamualaikum, ${title} ${targetObj.nama}`
        : `Assalamualaikum, ${targetObj.nama}`;

      const voiceMsg = isGTK
        ? `Assalamualaikum, ${title} ${cleanSpeechName}`
        : `Assalamualaikum, ${cleanSpeechName}`;

      return {
        success: true, 
        mode: 'MASUK', 
        user: targetObj, 
        targetType, 
        detailInfo,
        status: calc.status, 
        timeStr, 
        isOnTime,
        message: greetingMsg,
        voiceMessage: voiceMsg
      };
    } catch (err) {
      return { success: false, message: "Gagal menyimpan ke database." };
    }
  };

  // CRUD Actions - Guru & Tendik
  const addGuruTendik = async (item) => {
    try {
      const idIdentifier = item.nip || item.nuptk || item.nik || Date.now();
      const dbItem = { 
        ...item, 
        qr_code: item.qrCode || `GT-${idIdentifier}`,
        status: item.status || 'Aktif',
        kategori: item.kategori || 'Guru',
        gender: item.gender || 'L',
        nama: item.nama || 'Tanpa Nama',
        nik: item.nik ? String(item.nik) : null,
        nip: String(item.nip || '')
      };
      delete dbItem.qrCode; // clean up old naming
      if (dbItem.noHp !== undefined) { dbItem.no_hp = dbItem.noHp; delete dbItem.noHp; }
      if (dbItem.alasanNonAktif !== undefined) { dbItem.alasan_nonaktif = dbItem.alasanNonAktif; delete dbItem.alasanNonAktif; }
      if (dbItem.tglNonAktif !== undefined) { dbItem.tgl_nonaktif = dbItem.tglNonAktif; delete dbItem.tglNonAktif; }
      
      const saved = await api.addGuruTendik(dbItem);
      if (saved.error) throw new Error(saved.error);
      
      setGuruTendikList(prev => [saved, ...prev]);
      showSuccessAlert('Berhasil Simpan', `Data ${dbItem.kategori} "${dbItem.nama}" berhasil ditambahkan.`);
    } catch(err) { 
      showToast(err.message || "Gagal menyimpan guru", "error"); 
    }
  };

  const updateGuruTendik = async (id, updatedFields) => {
    try {
      const oldGuru = (guruTendikList || []).find(g => g.id === id);
      const oldName = oldGuru?.nama;

      const payload = { ...updatedFields };
      if ('qrCode' in payload) { payload.qr_code = payload.qrCode; delete payload.qrCode; }
      if ('noHp' in payload) { payload.no_hp = payload.noHp; delete payload.noHp; }
      if ('alasanNonAktif' in payload) { payload.alasan_nonaktif = payload.alasanNonAktif; delete payload.alasanNonAktif; }
      if ('tglNonAktif' in payload) { payload.tgl_nonaktif = payload.tglNonAktif; delete payload.tglNonAktif; }
      
      // Convert empty strings to null for unique or optional fields
      if ('nik' in payload) { payload.nik = payload.nik && String(payload.nik).trim() ? String(payload.nik).trim() : null; }
      if ('nip' in payload) { payload.nip = payload.nip && String(payload.nip).trim() ? String(payload.nip).trim() : null; }
      if ('nuptk' in payload) { payload.nuptk = payload.nuptk && String(payload.nuptk).trim() ? String(payload.nuptk).trim() : null; }

      delete payload.id;

      const updated = await api.updateGuruTendik(id, payload);
      const normalizedUpdated = normalizeGuru(updated);

      setGuruTendikList(prev => prev.map(g => g.id === id ? normalizedUpdated : g));

      // Synchronize updated teacher name across all assigned classes in kelasList
      const newName = normalizedUpdated.nama;
      if (oldName && newName && oldName !== newName) {
        setKelasList(prev => prev.map(k => {
          const kWali = k.wali_kelas || k.waliKelas;
          if (kWali && (kWali.trim() === oldName.trim() || kWali.trim().toLowerCase() === oldName.trim().toLowerCase() || newName.toLowerCase().startsWith(kWali.trim().toLowerCase()))) {
            return { ...k, wali_kelas: newName, waliKelas: newName };
          }
          return k;
        }));
      }

      showSuccessAlert('Berhasil Simpan', `Data Guru / Tendik berhasil diperbarui.`);
    } catch(err) { 
      console.error("Error updateGuruTendik:", err);
      showToast(err.message || "Gagal update data guru/tendik", "error"); 
    }
  };

  const deleteGuruTendik = async (id) => {
    try {
      await api.deleteGuruTendik(id);
      setGuruTendikList(prev => prev.filter(g => g.id !== id));
      showSuccessAlert('Berhasil Hapus', `Data telah dihapus.`);
    } catch(err) { showToast("Gagal menghapus", "error"); }
  };

  // CRUD Actions - Siswa
  const addSiswa = async (item) => {
    try {
      // Find kelas_id if item.kelas is a class name
      let mappedKelasId = item.kelas_id || '';
      if (!mappedKelasId && item.kelas) {
        const kName = typeof item.kelas === 'object' ? item.kelas.nama : item.kelas;
        const activeTapel = getTapelAktif();
        const activeSem = semesterAktif || 'Ganjil';

        let found = kelasList.find(k => 
          (k.nama.toLowerCase() === String(kName).toLowerCase() || k.id === kName) &&
          (k.tapel || activeTapel) === activeTapel &&
          (k.semester || activeSem) === activeSem
        );
        if (!found) {
          found = kelasList.find(k => k.nama.toLowerCase() === String(kName).toLowerCase() || k.id === kName);
        }
        if (found) mappedKelasId = found.id;
      }
      
      // Fallback to first class if not found (to prevent prisma error)
      if (!mappedKelasId && kelasList.length > 0) {
        mappedKelasId = kelasList[0].id;
      }

      if (!mappedKelasId) throw new Error("Tidak ada data Kelas. Silakan tambahkan kelas di menu Akademik terlebih dahulu.");

      const dbItem = { 
        ...item, 
        qr_code: item.qrCode || `SIS-${item.nisn || Date.now()}`,
        nama: item.nama || 'Tanpa Nama',
        nisn: String(item.nisn || Date.now()),
        gender: item.gender || 'L',
        kelas_id: mappedKelasId
      };
      delete dbItem.qrCode;
      if(dbItem.orangTua !== undefined) { dbItem.orang_tua = dbItem.orangTua; delete dbItem.orangTua; }
      if(dbItem.noHp !== undefined) { dbItem.no_hp = dbItem.noHp; delete dbItem.noHp; }
      delete dbItem.kelas;

      const saved = await api.addSiswa(dbItem);
      if (saved.error) throw new Error(saved.error);
      
      // Ensure kelas object is attached for frontend display
      if (!saved.kelas && mappedKelasId) {
        const kls = kelasList.find(k => k.id === mappedKelasId);
        if (kls) saved.kelas = kls;
      }
      
      setSiswaList(prev => [normalizeSiswa(saved), ...prev]);
      showSuccessAlert('Berhasil Simpan', `Data siswa "${dbItem.nama}" berhasil ditambahkan.`);
    } catch(err) { 
      showToast(err.message || "Gagal menyimpan siswa", "error"); 
    }
  };

  const bulkAddGuruTendik = async (items, fallbackKategori = 'Guru') => {
    try {
      if (!Array.isArray(items) || items.length === 0) return;
      let count = 0;
      const addedList = [];

      for (const item of items) {
        try {
          const idIdentifier = item.nip || item.nuptk || item.nik || (Date.now() + Math.floor(Math.random() * 1000));
          const targetKat = item.kategori || fallbackKategori || 'Guru';
          const dbItem = { 
            ...item, 
            qr_code: item.qrCode || `GT-${idIdentifier}`,
            status: item.status || 'Aktif',
            kategori: targetKat,
            gender: item.gender || 'L',
            nama: item.nama || 'Tanpa Nama',
            nik: item.nik ? String(item.nik).trim() : null,
            nip: item.nip ? String(item.nip).trim() : null,
            nuptk: item.nuptk ? String(item.nuptk).trim() : null
          };
          delete dbItem.qrCode;
          delete dbItem.isDuplicate;
          if (dbItem.noHp !== undefined) { dbItem.no_hp = dbItem.noHp; delete dbItem.noHp; }
          if (dbItem.alasanNonAktif !== undefined) { dbItem.alasan_nonaktif = dbItem.alasanNonAktif; delete dbItem.alasanNonAktif; }
          if (dbItem.tglNonAktif !== undefined) { dbItem.tgl_nonaktif = dbItem.tglNonAktif; delete dbItem.tglNonAktif; }

          const saved = await api.addGuruTendik(dbItem);
          if (saved && !saved.error) {
            addedList.push(normalizeGuru(saved));
            count++;
          }
        } catch (e) {
          console.error("Error bulk item guru/tendik:", e);
        }
      }

      if (count > 0) {
        setGuruTendikList(prev => [...addedList, ...prev]);
        showSuccessAlert('Berhasil Impor', `Berhasil mengimpor ${count} data ${fallbackKategori === 'Tendik' ? 'Tendik (Tenaga Kependidikan)' : 'Guru'}.`);
      } else {
        showToast("Tidak ada data baru yang berhasil diimpor", "warning");
      }
    } catch (err) {
      console.error("Error bulkAddGuruTendik:", err);
      showToast(err.message || "Gagal mengimpor data", "error");
    }
  };

  const bulkAddSiswa = async (items) => {
    try {
      if (!Array.isArray(items) || items.length === 0) return;
      let count = 0;
      const addedList = [];
      const activeTapel = getTapelAktif();
      const activeSem = semesterAktif || 'Ganjil';

      for (const item of items) {
        try {
          let mappedKelasId = item.kelas_id || '';
          if (!mappedKelasId && item.kelas) {
            const kName = typeof item.kelas === 'object' ? item.kelas.nama : item.kelas;
            let found = kelasList.find(k => 
              (k.nama.toLowerCase() === String(kName).toLowerCase() || k.id === kName) &&
              (k.tapel || activeTapel) === activeTapel &&
              (k.semester || activeSem) === activeSem
            );
            if (!found) {
              found = kelasList.find(k => k.nama.toLowerCase() === String(kName).toLowerCase() || k.id === kName);
            }
            if (found) mappedKelasId = found.id;
          }
          
          if (!mappedKelasId && kelasList.length > 0) {
            mappedKelasId = kelasList[0].id;
          }

          if (!mappedKelasId) throw new Error("Tidak ada data Kelas.");

          const dbItem = { 
            ...item, 
            qr_code: item.qrCode || `SIS-${item.nisn || (Date.now() + Math.floor(Math.random() * 1000))}`,
            nama: item.nama || 'Tanpa Nama',
            nisn: String(item.nisn || Date.now()),
            gender: item.gender || 'L',
            kelas_id: mappedKelasId
          };
          delete dbItem.qrCode;
          delete dbItem.isDuplicate;
          if (dbItem.orangTua !== undefined) { dbItem.orang_tua = dbItem.orangTua; delete dbItem.orangTua; }
          if (dbItem.noHp !== undefined) { dbItem.no_hp = dbItem.noHp; delete dbItem.noHp; }
          delete dbItem.kelas;

          const saved = await api.addSiswa(dbItem);
          if (saved && !saved.error) {
            const normalized = normalizeSiswa(saved);
            if (!normalized.kelas && mappedKelasId) {
              const kls = kelasList.find(k => k.id === mappedKelasId);
              if (kls) normalized.kelas = kls;
            }

            const activeKey = `${activeTapel}_${activeSem}`;
            normalized.riwayat_kelas = { [activeKey]: mappedKelasId };
            addedList.push(normalized);
            count++;
          }
        } catch (e) {
          console.error("Error bulk item siswa:", e);
        }
      }

      if (count > 0) {
        const activeKey = `${activeTapel}_${activeSem}`;
        const updatedRiwayat = { ...riwayatKelasMap };
        addedList.forEach(s => {
          if (!updatedRiwayat[s.id]) updatedRiwayat[s.id] = {};
          updatedRiwayat[s.id][activeKey] = s.kelas_id;
        });
        setRiwayatKelasMap(updatedRiwayat);

        setSiswaList(prev => [...addedList, ...prev]);
        showSuccessAlert('Berhasil Impor', `Berhasil mengimpor ${count} data Siswa.`);
      } else {
        showToast("Tidak ada data baru yang berhasil diimpor", "warning");
      }
    } catch (err) {
      console.error("Error bulkAddSiswa:", err);
      showToast(err.message || "Gagal mengimpor data Siswa", "error");
    }
  };

  const updateSiswa = async (id, updatedFields) => {
    try {
      const payload = { ...updatedFields };
      if ('orangTua' in payload) { payload.orang_tua = payload.orangTua; delete payload.orangTua; }
      if ('noHp' in payload) { payload.no_hp = payload.noHp; delete payload.noHp; }
      if ('qrCode' in payload) { payload.qr_code = payload.qrCode; delete payload.qrCode; }

      let mappedKelasId = payload.kelas_id || '';
      if (!mappedKelasId && payload.kelas) {
        const kName = typeof payload.kelas === 'object' ? payload.kelas.nama : payload.kelas;
        const activeTapel = getTapelAktif();
        const activeSem = semesterAktif || 'Ganjil';
        let found = kelasList.find(k => 
          (k.nama.toLowerCase() === String(kName).toLowerCase() || k.id === kName) &&
          (k.tapel || activeTapel) === activeTapel &&
          (k.semester || activeSem) === activeSem
        );
        if (!found) {
          found = kelasList.find(k => k.nama.toLowerCase() === String(kName).toLowerCase() || k.id === kName);
        }
        if (found) mappedKelasId = found.id;
      }
      if (mappedKelasId) {
        payload.kelas_id = mappedKelasId;
      }
      delete payload.kelas;
      delete payload.id;

      const updated = await api.updateSiswa(id, payload);
      if (updated.error) throw new Error(updated.error);
      
      // Ensure kelas object is attached for frontend display
      if (!updated.kelas && updated.kelas_id) {
        const kls = kelasList.find(k => k.id === updated.kelas_id);
        if (kls) updated.kelas = kls;
      }
      
      setSiswaList(prev => prev.map(s => s.id === id ? normalizeSiswa(updated) : s));
      showSuccessAlert('Berhasil Simpan', `Data siswa berhasil diperbarui.`);
    } catch(err) { 
      console.error("Error updateSiswa:", err);
      showToast(typeof err.message === 'string' && err.message.length < 100 ? err.message : "Gagal memperbarui data siswa", "error"); 
    }
  };

  const deleteSiswa = async (id) => {
    try {
      const targetSiswa = (siswaList || []).find(s => s.id === id);
      if (!targetSiswa) return false;

      const activeKlsName = getSiswaActiveRombel(targetSiswa, getTapelAktif(), semesterAktif, kelasList);
      if (activeKlsName) {
        showErrorAlert(
          'Tidak Bisa Dihapus',
          `Siswa "${targetSiswa.nama}" tidak bisa dihapus karena sudah ditempatkan pada kelas ${activeKlsName}. Keluarkan dari rombel terlebih dahulu.`
        );
        return false;
      }

      await api.deleteSiswa(id);
      setSiswaList(prev => prev.filter(s => s.id !== id));
      showSuccessAlert('Berhasil Hapus', `Data siswa "${targetSiswa.nama}" telah dihapus.`);
      return true;
    } catch(err) { 
      showToast("Gagal menghapus siswa", "error");
      return false;
    }
  };

  const bulkDeleteSiswa = async (ids) => {
    try {
      if (!Array.isArray(ids) || ids.length === 0) return false;

      const activeTapel = getTapelAktif();
      const activeSem = semesterAktif || 'Ganjil';

      const targetStudents = (siswaList || []).filter(s => ids.includes(s.id));
      const inClassStudents = targetStudents.filter(s => !!getSiswaActiveRombel(s, activeTapel, activeSem, kelasList));
      const deletableStudents = targetStudents.filter(s => !getSiswaActiveRombel(s, activeTapel, activeSem, kelasList));

      if (deletableStudents.length === 0) {
        showErrorAlert(
          'Tidak Bisa Dihapus',
          'Siswa tidak bisa dihapus karena seluruh siswa yang dipilih sudah ditempatkan pada kelas/rombel. Keluarkan dari rombel terlebih dahulu.'
        );
        return false;
      }

      let count = 0;
      const deletedIds = [];
      for (const s of deletableStudents) {
        try {
          await api.deleteSiswa(s.id);
          deletedIds.push(s.id);
          count++;
        } catch (e) {}
      }

      setSiswaList(prev => prev.filter(s => !deletedIds.includes(s.id)));

      if (inClassStudents.length > 0) {
        showWarningAlert(
          'Sebagian Terhapus',
          `Berhasil menghapus ${count} siswa (Tanpa Kelas). ${inClassStudents.length} siswa tidak dihapus karena sudah ditempatkan pada kelas/rombel.`
        );
      } else {
        showSuccessAlert('Berhasil Hapus', `Berhasil menghapus ${count} data siswa.`);
      }
      return true;
    } catch (err) {
      console.error("Error bulkDeleteSiswa:", err);
      showToast("Gagal menghapus beberapa data siswa", "error");
      return false;
    }
  };

  const deleteAllSiswa = async () => {
    try {
      const allIds = (siswaList || []).map(s => s.id);
      return await bulkDeleteSiswa(allIds);
    } catch (err) {
      return false;
    }
  };

  // Kelas Actions
  const addKelas = async (nama, tingkat, waliKelas, tapel, semester) => {
    try {
      const activeTapel = tapel || getTapelAktif();
      const activeSem = semester || semesterAktif;
      const saved = await api.addKelas({ 
        nama: String(nama || ''), 
        tingkat: String(tingkat || 'X'), 
        wali_kelas: waliKelas || null,
        tapel: activeTapel,
        semester: activeSem
      });
      setKelasList(prev => [...prev, saved]);
      showSuccessAlert('Berhasil Simpan', `Kelas ${nama} berhasil ditambahkan.`);
    } catch(err) { 
      console.error("Error addKelas:", err);
      showToast(err.message || "Gagal menyimpan kelas", "error"); 
    }
  };

  const bulkMoveSiswaToKelas = async (siswaIds, targetKelasId, actionType = 'PINDAH_SEMESTER') => {
    try {
      const targetKelas = kelasList.find(k => k.id === targetKelasId || k.nama === targetKelasId);
      if (!targetKelas) throw new Error("Kelas tujuan tidak ditemukan");

      const activeT = targetKelas.tapel || getTapelAktif();
      const activeS = targetKelas.semester || semesterAktif || 'Ganjil';
      const activeKey = `${activeT}_${activeS}`;

      // Separate students into already mapped vs newly mapped
      const alreadyMappedIds = [];
      const newIdsToMap = [];

      siswaIds.forEach(id => {
        const s = (siswaList || []).find(item => item.id === id);
        const currentActiveRombel = getSiswaActiveRombel(s, activeT, activeS, kelasList, riwayatKelasMap);
        if (currentActiveRombel === targetKelas.nama) {
          alreadyMappedIds.push(id);
        } else {
          newIdsToMap.push(id);
        }
      });

      const isNaik = actionType === 'NAIK_KELAS';
      const actionName = isNaik ? 'dinaikkan' : 'dipindahkan';

      // CASE 1: All selected students are ALREADY mapped to targetKelas!
      if (newIdsToMap.length === 0 && alreadyMappedIds.length > 0) {
        showWarningAlert(
          'Siswa Sudah Terdaftar',
          `Seluruh ${alreadyMappedIds.length} siswa yang Anda pilih sudah terdaftar di Kelas "${targetKelas.nama}" untuk TP ${activeT} • Semester ${activeS}.`
        );
        return true;
      }

      // Process new student mappings
      let countNew = 0;
      const updatedRiwayat = { ...riwayatKelasMap };

      for (const id of newIdsToMap) {
        if (!updatedRiwayat[id]) updatedRiwayat[id] = {};
        updatedRiwayat[id][activeKey] = targetKelas.id;
        countNew++;

        try {
          await api.updateSiswa(id, { kelas_id: targetKelas.id });
        } catch (e) {}
      }

      setRiwayatKelasMap(updatedRiwayat);
      setSiswaList(prev => prev.map(s => {
        if (newIdsToMap.includes(s.id)) {
          const sRiwayat = s.riwayat_kelas ? { ...s.riwayat_kelas } : {};
          sRiwayat[activeKey] = targetKelas.id;
          return { ...s, riwayat_kelas: sRiwayat };
        }
        return s;
      }));

      // CASE 2: Some were already mapped, some are newly mapped
      if (alreadyMappedIds.length > 0) {
        showWarningAlert(
          'Sebagian Siswa Sudah Terdaftar',
          `Berhasil ${actionName} ${countNew} siswa ke kelas "${targetKelas.nama}". Terdapat ${alreadyMappedIds.length} siswa yang sebelumnya sudah terdaftar di kelas ini.`
        );
      } else {
        // CASE 3: All selected students are newly mapped
        const alertTitle = isNaik ? 'Berhasil Naik Kelas' : 'Berhasil Pindah Semester';
        const alertMsg = isNaik 
          ? `Berhasil menaikkan ${countNew} siswa ke kelas "${targetKelas.nama}".`
          : `Berhasil memindahkan ${countNew} siswa ke kelas "${targetKelas.nama}".`;

        showSuccessAlert(alertTitle, alertMsg);
      }

      return true;
    } catch (err) {
      console.error("Error bulkMoveSiswaToKelas:", err);
      showToast(err.message || "Gagal memindahkan siswa", "error");
      return false;
    }
  };

  const removeSiswaFromKelas = async (siswaId) => {
    try {
      const targetSiswa = siswaList.find(s => s.id === siswaId);
      if (!targetSiswa) return false;

      const activeT = getTapelAktif();
      const activeS = semesterAktif || 'Ganjil';
      const activeKey = `${activeT}_${activeS}`;

      const updatedRiwayat = { ...riwayatKelasMap };
      if (!updatedRiwayat[siswaId]) updatedRiwayat[siswaId] = {};
      updatedRiwayat[siswaId][activeKey] = null;

      setRiwayatKelasMap(updatedRiwayat);
      setSiswaList(prev => prev.map(s => {
        if (s.id === siswaId) {
          const sRiwayat = s.riwayat_kelas ? { ...s.riwayat_kelas } : {};
          sRiwayat[activeKey] = null;
          return { ...s, riwayat_kelas: sRiwayat };
        }
        return s;
      }));

      showSuccessAlert('Berhasil Dikeluarkan', `Siswa "${targetSiswa.nama}" berhasil dikeluarkan dari rombel.`);
      return true;
    } catch (err) {
      console.error("Error removeSiswaFromKelas:", err);
      showToast(err.message || "Gagal mengeluarkan siswa dari rombel", "error");
      return false;
    }
  };

  const bulkRemoveSiswaFromKelas = async (siswaIds) => {
    try {
      if (!Array.isArray(siswaIds) || siswaIds.length === 0) return false;

      const activeT = getTapelAktif();
      const activeS = semesterAktif || 'Ganjil';
      const activeKey = `${activeT}_${activeS}`;

      const updatedRiwayat = { ...riwayatKelasMap };
      let count = 0;

      for (const id of siswaIds) {
        if (!updatedRiwayat[id]) updatedRiwayat[id] = {};
        updatedRiwayat[id][activeKey] = null;
        count++;
      }

      setRiwayatKelasMap(updatedRiwayat);
      setSiswaList(prev => prev.map(s => {
        if (siswaIds.includes(s.id)) {
          const sRiwayat = s.riwayat_kelas ? { ...s.riwayat_kelas } : {};
          sRiwayat[activeKey] = null;
          return { ...s, riwayat_kelas: sRiwayat };
        }
        return s;
      }));

      showSuccessAlert('Berhasil Dikeluarkan', `Berhasil mengeluarkan ${count} siswa dari rombel.`);
      return true;
    } catch (err) {
      console.error("Error bulkRemoveSiswaFromKelas:", err);
      showToast("Gagal mengeluarkan siswa dari rombel", "error");
      return false;
    }
  };

  const deleteKelas = async (id) => {
    try {
      const targetKelas = kelasList.find(k => k.id === id);
      if (!targetKelas) return false;

      const activeTapel = targetKelas.tapel || getTapelAktif();
      const activeSem = targetKelas.semester || semesterAktif || 'Ganjil';

      // Check if class has student members in THIS specific Tapel & Semester
      const countSiswa = (siswaList || []).filter(s => {
        const activeKlsName = getSiswaActiveRombel(s, activeTapel, activeSem, kelasList);
        return activeKlsName === targetKelas.nama;
      }).length;

      if (countSiswa > 0) {
        showErrorAlert(
          'Tidak Dapat Dihapus',
          `Kelas "${targetKelas.nama}" tidak dapat dihapus karena masih memiliki ${countSiswa} siswa anggota rombel. Silakan keluarkan seluruh siswa dari rombel terlebih dahulu.`
        );
        return false;
      }

      const res = await api.deleteKelas(id);
      if (res && res.error) {
        showErrorAlert('Gagal Hapus', res.error);
        return false;
      }

      setKelasList(prev => prev.filter(k => k.id !== id));
      showSuccessAlert('Berhasil Hapus', `Kelas "${targetKelas.nama}" telah dihapus.`);
      return true;
    } catch (err) {
      console.error("Error deleteKelas:", err);
      showErrorAlert('Gagal Hapus', err.message || 'Gagal menghapus kelas.');
      return false;
    }
  };

  // Tapel Actions
  const setTapelAktif = (id) => {
    setTapelList(prev => prev.map(t => ({ ...t, status: t.id === id ? 'Aktif' : 'Non-Aktif' })));
    const target = tapelList.find(t => t.id === id);
    showSuccessAlert('Berhasil Diganti', `Tahun Pelajaran aktif diubah ke ${target?.tahun || ''}.`);
  };

  const addTapel = (tahun) => {
    if (!tahun || !tahun.trim()) return;
    const cleanTahun = tahun.trim();
    if (tapelList.some(t => t.tahun === cleanTahun)) {
      showToast(`Tahun Pelajaran ${cleanTahun} sudah ada.`, 'error');
      return;
    }
    const newTapel = {
      id: `tapel-${Date.now()}`,
      tahun: cleanTahun,
      status: tapelList.length === 0 ? 'Aktif' : 'Non-Aktif'
    };
    setTapelList(prev => sortTapelList([...prev, newTapel]));
    showSuccessAlert('Berhasil Simpan', `Tahun Pelajaran ${cleanTahun} berhasil ditambahkan.`);
  };

  const deleteTapel = (id) => {
    const target = tapelList.find(t => t.id === id);
    if (!target) return;
    if (target.status === 'Aktif') {
      showToast('Tahun Pelajaran aktif tidak boleh dihapus.', 'error');
      return;
    }
    setTapelList(prev => prev.filter(t => t.id !== id));
    showSuccessAlert('Berhasil Hapus', `Tahun Pelajaran ${target.tahun} telah dihapus.`);
  };

  const [tugasSiswaList, setTugasSiswaList] = useState(() => {
    try {
      const saved = localStorage.getItem('presensi_tugas_siswa');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('presensi_tugas_siswa', JSON.stringify(tugasSiswaList));
  }, [tugasSiswaList]);

  // Tugas GTK Actions
  const addTugasGTK = (item) => {
    const newItem = {
      ...item,
      id: `tugas-${Date.now()}`,
      status: item.status || 'Aktif'
    };
    setTugasGTKList(prev => [newItem, ...prev]);
    showSuccessAlert('Berhasil Simpan', `Tugas Tambahan untuk "${newItem.namaPersonel}" berhasil ditambahkan.`);
  };

  const updateTugasGTK = (id, updatedFields) => {
    setTugasGTKList(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
    showSuccessAlert('Berhasil Simpan', `Data Tugas GTK berhasil diperbarui.`);
  };

  const deleteTugasGTK = (id) => {
    setTugasGTKList(prev => prev.filter(t => t.id !== id));
    showSuccessAlert('Berhasil Hapus', `Data Tugas GTK telah dihapus.`);
  };

  // Tugas Siswa Actions
  const addTugasSiswa = (item) => {
    const newItem = {
      ...item,
      id: `tugas-siswa-${Date.now()}`,
      status: item.status || 'Aktif'
    };
    setTugasSiswaList(prev => [newItem, ...prev]);
    showSuccessAlert('Berhasil Simpan', `Tugas Tambahan untuk "${newItem.namaSiswa}" berhasil ditambahkan.`);
  };

  const updateTugasSiswa = (id, updatedFields) => {
    setTugasSiswaList(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
    showSuccessAlert('Berhasil Simpan', `Data Tugas Peserta Didik berhasil diperbarui.`);
  };

  const deleteTugasSiswa = (id) => {
    setTugasSiswaList(prev => prev.filter(t => t.id !== id));
    showSuccessAlert('Berhasil Hapus', `Data Tugas Peserta Didik telah dihapus.`);
  };

  const getTapelAktif = () => tapelList.find(t => t.status === 'Aktif')?.tahun || '2025/2026';

  // Save Profil Sekolah Function
  const saveProfilSekolah = async (newProfil) => {
    try {
      const payload = {
        nama_sekolah: newProfil.namaSekolah || newProfil.nama_sekolah || '',
        npsn: newProfil.npsn || '',
        alamat: newProfil.alamat || '',
        kepala_sekolah: newProfil.kepalaSekolah || newProfil.kepala_sekolah || '',
        nip_kepala_sekolah: newProfil.nipKepalaSekolah || newProfil.nip_kepala_sekolah || '',
        no_telp: newProfil.noTelp || newProfil.no_telp || '',
        email: newProfil.email || '',
        website: newProfil.website || '',
        logo: newProfil.logo || '',
        maps_embed: newProfil.mapsEmbed || newProfil.maps_embed || '',
        latitude: newProfil.latitude || '',
        longitude: newProfil.longitude || '',
        radius: newProfil.radius ? Number(newProfil.radius) : 0
      };

      const saved = await api.saveProfilSekolah(payload);

      const normalized = {
        ...saved,
        namaSekolah: saved.nama_sekolah || saved.namaSekolah || '',
        kepalaSekolah: saved.kepala_sekolah || saved.kepalaSekolah || '',
        nipKepalaSekolah: saved.nip_kepala_sekolah || saved.nipKepalaSekolah || '',
        noTelp: saved.no_telp || saved.noTelp || '',
        logo: saved.logo || '',
        mapsEmbed: saved.maps_embed || saved.mapsEmbed || '',
        latitude: saved.latitude || '',
        longitude: saved.longitude || '',
        radius: saved.radius || 0
      };

      setProfilSekolah(normalized);
      showSuccessAlert('Berhasil Simpan', 'Profil Sekolah berhasil diperbarui.');
      return normalized;
    } catch(err) {
      console.error("Error saveProfilSekolah:", err);
      showToast(err.message || "Gagal menyimpan profil sekolah", "error");
    }
  };

  const deleteAllPresensi = async () => {
    try {
      await api.deleteAllPresensi();
      setPresensiLogs([]);
      showSuccessAlert('Berhasil Hapus', 'Semua data log presensi berhasil dihapus dari database.');
      return true;
    } catch (err) {
      console.error("Error deleteAllPresensi:", err);
      showToast(err.message || "Gagal menghapus log presensi", "error");
      return false;
    }
  };

  const saveManualPresensi = async (targetObj, targetType, dateStr, status, keterangan) => {
    try {
      const existingLog = presensiLogs.find(l => {
        const isSameTarget = (
          (l.target_id && String(l.target_id) === String(targetObj.id)) ||
          (l.targetId && String(l.targetId) === String(targetObj.id)) ||
          (targetType === 'Siswa' && (l.target_id === targetObj.nisn || l.targetId === targetObj.nisn)) ||
          (targetType !== 'Siswa' && (l.target_id === targetObj.nuptk || l.target_id === targetObj.nip || l.targetId === targetObj.nuptk || l.targetId === targetObj.nip))
        );
        const isSameDate = l.tanggal === dateStr || formatLocalDateString(l.tanggal) === dateStr;
        return isSameTarget && isSameDate;
      });

      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      let detailInfo = '';
      if (targetType === 'Guru' || targetType === 'Tendik') {
        detailInfo = targetObj.jabatan || targetType;
      } else {
        const kelas = kelasList.find(k => k.id === targetObj.kelas_id);
        detailInfo = `Kelas ${kelas ? kelas.nama : '-'}`;
      }

      const isPresent = status.toLowerCase().includes('hadir') || status.toLowerCase().includes('terlambat');

      if (existingLog) {
        const payload = {
          id: existingLog.id,
          target_id: existingLog.target_id || existingLog.targetId || targetObj.id,
          target_type: existingLog.target_type || existingLog.targetType || targetType,
          tanggal: dateStr,
          jam_masuk: isPresent ? (existingLog.jam_masuk || existingLog.jamMasuk || timeStr) : null,
          jam_pulang: isPresent ? (existingLog.jam_pulang || existingLog.jamPulang || null) : null,
          status: status,
          keterangan: keterangan
        };
        const response = await api.updatePresensi(existingLog.id, payload);
        
        const updatedLog = {
          ...existingLog,
          ...response,
          status,
          keterangan,
          target_id: targetObj.id,
          target_type: targetType,
          targetId: targetObj.id,
          targetType: targetType,
          tanggal: dateStr,
          jam_masuk: isPresent ? (existingLog.jam_masuk || existingLog.jamMasuk || timeStr) : null,
          jamMasuk: isPresent ? (existingLog.jam_masuk || existingLog.jamMasuk || timeStr) : null,
          jam_pulang: isPresent ? (existingLog.jam_pulang || existingLog.jamPulang || null) : null,
          jamPulang: isPresent ? (existingLog.jam_pulang || existingLog.jamPulang || null) : null,
          nama: targetObj.nama,
          detailInfo
        };

        setPresensiLogs(prev => prev.map(l => l.id === existingLog.id ? updatedLog : l));
        showSuccessAlert('Berhasil Diperbarui', `Presensi ${targetObj.nama} berhasil diubah menjadi ${status}`);
        return updatedLog;
      } else {
        const payload = {
          target_id: targetObj.id,
          target_type: targetType,
          tanggal: dateStr,
          jam_masuk: isPresent ? timeStr : null,
          jam_pulang: null,
          status: status,
          keterangan: keterangan
        };
        const response = await api.addPresensi(payload);
        
        const newLog = {
          ...response,
          status,
          keterangan,
          target_id: targetObj.id,
          target_type: targetType,
          targetId: targetObj.id,
          targetType: targetType,
          tanggal: dateStr,
          jam_masuk: isPresent ? timeStr : null,
          jamMasuk: isPresent ? timeStr : null,
          jam_pulang: null,
          jamPulang: null,
          nama: targetObj.nama,
          detailInfo
        };

        setPresensiLogs(prev => [newLog, ...prev]);
        showSuccessAlert('Berhasil Disimpan', `Presensi ${targetObj.nama} berhasil diubah menjadi ${status}`);
        return newLog;
      }
    } catch (err) {
      console.error("Error saveManualPresensi:", err);
      showToast(err.message || "Gagal menyimpan presensi manual", "error");
      throw err;
    }
  };
  const getSiswaActiveRombelBound = (siswa, activeT, activeS, kList) => {
    return getSiswaActiveRombel(siswa, activeT || getTapelAktif(), activeS || semesterAktif, kList || kelasList, riwayatKelasMap);
  };

  return (
    <AppContext.Provider value={{
      isDataLoaded,
      guruTendikList, siswaList, kelasList, tapelList, semesterAktif, setSemesterAktif,
      tugasGTKList, addTugasGTK, updateTugasGTK, deleteTugasGTK,
      tugasSiswaList, addTugasSiswa, updateTugasSiswa, deleteTugasSiswa,
      profilSekolah, setProfilSekolah, saveProfilSekolah, pengaturan, setPengaturan, savePengaturan, getDaySchedule, presensiLogs, setPresensiLogs, deleteAllPresensi, saveManualPresensi,
      activeMenu, setActiveMenu, toastMessage, showToast, processQRScan,
      addGuruTendik, updateGuruTendik, deleteGuruTendik, bulkAddGuruTendik,
      addSiswa, updateSiswa, deleteSiswa, bulkAddSiswa, bulkDeleteSiswa, deleteAllSiswa, removeSiswaFromKelas, bulkRemoveSiswaFromKelas, getSiswaActiveRombel: getSiswaActiveRombelBound,
      addKelas, deleteKelas, setTapelAktif, getTapelAktif, addTapel, deleteTapel, bulkMoveSiswaToKelas,
      bgCardGuru, setBgCardGuru, bgCardSiswa, setBgCardSiswa
    }}>
      {children}
    </AppContext.Provider>
  );
};
