import React, { useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { useApp, DEFAULT_JADWAL_HARIAN } from '../context/AppContext';
import { 
  ClipboardCheck, 
  Printer, 
  GraduationCap, 
  Calendar, 
  FileSpreadsheet,
  Layers
} from 'lucide-react';

export const RekapSiswaPage = () => {
  const { 
    siswaList, 
    kelasList, 
    guruTendikList,
    profilSekolah,
    presensiLogs, 
    getTapelAktif, 
    semesterAktif, 
    pengaturan, 
    getSiswaActiveRombel,
    showToast 
  } = useApp();

  const tapelAktif = getTapelAktif();
  const kelasAktifList = kelasList.filter(kls => {
    const klsTapel = kls.tapel || '';
    const klsSem = kls.semester || semesterAktif || 'Ganjil';
    return klsTapel === tapelAktif && klsSem === (semesterAktif || 'Ganjil');
  });
  const kelasFilterList = kelasAktifList.length > 0 ? kelasAktifList : kelasList;

  // Filter States
  const [selectedKelas, setSelectedKelas] = useState(kelasFilterList[0]?.nama || 'Semua');
  const [jenisRekap, setJenisRekap] = useState('Bulanan'); // 'Bulanan' | 'Semester'
  const [selectedSemester, setSelectedSemester] = useState(semesterAktif || 'Ganjil');
  const [selectedBulan, setSelectedBulan] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // Helper date formatting in Indonesian
  const formatIndoDate = (dateInput = new Date()) => {
    const d = new Date(dateInput);
    const day = d.getDate();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Helper resolve Wali Kelas name strictly from Akademik rombel setup
  const getWaliKelasNama = () => {
    if (selectedKelas === 'Semua') return '...........................................';

    const activeT = getTapelAktif();
    const activeS = semesterAktif || 'Ganjil';

    // 1. Match class strictly by tapel & semester
    let kFound = (kelasList || []).find(k => 
      (k.nama === selectedKelas || k.id === selectedKelas) &&
      (k.tapel ? k.tapel === activeT : true) &&
      (k.semester ? k.semester === activeS : true)
    );

    // Fallback: match class by name
    if (!kFound) {
      kFound = (kelasList || []).find(k => k.nama === selectedKelas || k.id === selectedKelas);
    }

    if (!kFound || !kFound.wali_kelas) return '...........................................';

    const wVal = String(kFound.wali_kelas).trim();

    // Match with Guru/Tendik list by ID, NUPTK, NIP, or exact Name
    const gFound = (guruTendikList || []).find(g => 
      String(g.id) === wVal || 
      String(g.nuptk || '') === wVal ||
      String(g.nip || '') === wVal ||
      String(g.nama || '').toLowerCase() === wVal.toLowerCase()
    );

    return gFound ? gFound.nama : wVal;
  };

  // Helper resolving student active class name with robust fallback
  const getSiswaKelasNama = (s) => {
    if (!s) return null;
    let name = null;
    if (getSiswaActiveRombel) {
      name = getSiswaActiveRombel(s, tapelAktif, semesterAktif, kelasList);
    }
    if (!name && s.kelas && typeof s.kelas === 'object' && s.kelas.nama) {
      name = s.kelas.nama;
    }
    if (!name && s.kelas_id && kelasList.length > 0) {
      const kFound = kelasList.find(k => k.id === s.kelas_id || k.nama === s.kelas_id);
      if (kFound) name = kFound.nama;
    }
    if (!name && typeof s.kelas === 'string' && s.kelas) {
      name = s.kelas;
    }
    return name;
  };

  // Filter Siswa list by active class and status (Aktif only), sort alphabetically (A-Z)
  const filteredSiswa = (siswaList || [])
    .filter(s => {
      const statusVal = s.status || 'Aktif';
      const isAktif = statusVal !== 'Non-Aktif' && statusVal !== 'Lulus' && statusVal !== 'Mutasi' && statusVal !== 'Non Aktif';
      if (!isAktif) return false;

      const klsName = getSiswaKelasNama(s);
      if (selectedKelas === 'Semua') return true;
      return klsName === selectedKelas;
    })
    .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { numeric: true, sensitivity: 'base' }));

  // Robust date parser helper
  const extractDateStr = (rawDate) => {
    if (!rawDate) return '';
    if (typeof rawDate === 'string') {
      if (rawDate.includes('T')) return rawDate.split('T')[0];
      if (rawDate.includes(' ')) return rawDate.split(' ')[0];
      return rawDate;
    }
    if (rawDate instanceof Date) {
      const y = rawDate.getFullYear();
      const m = String(rawDate.getMonth() + 1).padStart(2, '0');
      const d = String(rawDate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(rawDate);
  };

  // --- 1. MONTHLY MATRIX CALCULATIONS ---
  const [yearStr, monthStr] = selectedBulan.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayInfo = (d) => {
    const dayDateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
    const dayObj = new Date(year, month - 1, d);
    const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayNameIndo = dayNamesIndo[dayObj.getDay()];

    const activeHolidays = Array.isArray(pengaturan?.hari_libur) 
      ? pengaturan.hari_libur 
      : (typeof pengaturan?.hari_libur === 'string' ? JSON.parse(pengaturan.hari_libur || '[]') : []);

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
      return dayDateStr >= tM && dayDateStr <= tS;
    });

    let activeJadwal = DEFAULT_JADWAL_HARIAN;
    if (pengaturan?.jadwal_harian) {
      if (typeof pengaturan.jadwal_harian === 'object') activeJadwal = { ...DEFAULT_JADWAL_HARIAN, ...pengaturan.jadwal_harian };
      else if (typeof pengaturan.jadwal_harian === 'string') {
        try { activeJadwal = { ...DEFAULT_JADWAL_HARIAN, ...JSON.parse(pengaturan.jadwal_harian) }; } catch(e) {}
      }
    }
    const daySchedule = activeJadwal[dayNameIndo] || { aktif: true };

    const isNonEffective = !daySchedule.aktif;
    const isHoliday = Boolean(foundHoliday) || isNonEffective;
    const holidayTitle = foundHoliday ? (foundHoliday.keterangan || 'Libur Sekolah') : (isNonEffective ? `Libur ${dayNameIndo}` : '');

    return {
      dayDateStr,
      dayNameIndo,
      isHoliday,
      holidayTitle
    };
  };

  const monthDaysInfo = daysArray.map(d => getDayInfo(d));
  const totalEffectiveDaysInMonth = monthDaysInfo.filter(info => !info.isHoliday).length;

  const monthlyMatrixData = filteredSiswa.map(siswa => {
    const studentLogsMap = {};
    (presensiLogs || []).forEach(l => {
      const tId = String(l.target_id || l.targetId || l.siswa_id || l.siswaId || '');
      const tNisn = String(l.nisn || l.targetNisn || '');
      const tNama = String(l.nama || l.targetNama || '').trim().toLowerCase();

      const sId = String(siswa.id || '');
      const sNisn = String(siswa.nisn || '');
      const sNama = String(siswa.nama || '').trim().toLowerCase();

      const isMatch = (tId && tId === sId) || 
                      (tNisn && tNisn === sNisn) || 
                      (tNama && sNama && tNama === sNama) ||
                      (siswa.qr_code && tId === String(siswa.qr_code));

      if (isMatch && l.tanggal) {
        const dStr = extractDateStr(l.tanggal);
        if (dStr && dStr.startsWith(selectedBulan)) {
          studentLogsMap[dStr] = l;
        }
      }
    });

    let hadirCount = 0;
    let izinCount = 0;
    let sakitCount = 0;
    let alpaCount = 0;

    const dailyStatus = daysArray.map(d => {
      const info = monthDaysInfo[d - 1];
      if (info.isHoliday) {
        return { code: '', title: info.holidayTitle, isHoliday: true };
      }

      const log = studentLogsMap[info.dayDateStr];
      if (!log) {
        return { code: '-', title: 'Belum Presensi', isHoliday: false };
      }

      const statusLower = (log.status || '').toLowerCase();
      if (statusLower.includes('terlambat')) {
        hadirCount++;
        return { code: 'T', title: 'Terlambat', isHoliday: false, status: log.status };
      } else if (statusLower.includes('hadir')) {
        hadirCount++;
        return { code: 'H', title: 'Hadir', isHoliday: false, status: log.status };
      } else if (statusLower.includes('izin')) {
        izinCount++;
        return { code: 'I', title: 'Izin', isHoliday: false, status: 'Izin' };
      } else if (statusLower.includes('sakit')) {
        sakitCount++;
        return { code: 'S', title: 'Sakit', isHoliday: false, status: 'Sakit' };
      } else if (statusLower.includes('alpa') || statusLower.includes('tanpa')) {
        alpaCount++;
        return { code: 'A', title: 'Alpa', isHoliday: false, status: 'Alpa' };
      }

      hadirCount++;
      return { code: 'H', title: 'Hadir', isHoliday: false };
    });

    const rate = Math.min(100, Math.round((hadirCount / (totalEffectiveDaysInMonth || 1)) * 100));

    return {
      ...siswa,
      kelasNama: getSiswaKelasNama(siswa) || '-',
      dailyStatus,
      hadirCount,
      izinCount,
      sakitCount,
      alpaCount,
      rate
    };
  });

  // --- 2. SEMESTER MATRIX CALCULATIONS ---
  const getSemesterMonths = () => {
    const [y1Str, y2Str] = (tapelAktif || '2026/2027').split('/');
    const y1 = parseInt(y1Str, 10) || 2026;
    const y2 = parseInt(y2Str, 10) || (y1 + 1);

    if (selectedSemester === 'Ganjil') {
      return [
        { key: `${y1}-07`, label: 'JULI' },
        { key: `${y1}-08`, label: 'AGUSTUS' },
        { key: `${y1}-09`, label: 'SEPTEMBER' },
        { key: `${y1}-10`, label: 'OKTOBER' },
        { key: `${y1}-11`, label: 'NOVEMBER' },
        { key: `${y1}-12`, label: 'DESEMBER' },
      ];
    } else {
      return [
        { key: `${y2}-01`, label: 'JANUARI' },
        { key: `${y2}-02`, label: 'FEBRUARI' },
        { key: `${y2}-03`, label: 'MARET' },
        { key: `${y2}-04`, label: 'APRIL' },
        { key: `${y2}-05`, label: 'MEI' },
        { key: `${y2}-06`, label: 'JUNI' },
      ];
    }
  };

  const semesterMonths = getSemesterMonths();

  const semesterMatrixData = filteredSiswa.map(siswa => {
    const monthlyStats = semesterMonths.map(mInfo => {
      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alpa = 0;

      (presensiLogs || []).forEach(l => {
        const tId = String(l.target_id || l.targetId || l.siswa_id || l.siswaId || '');
        const tNisn = String(l.nisn || l.targetNisn || '');
        const tNama = String(l.nama || l.targetNama || '').trim().toLowerCase();

        const sId = String(siswa.id || '');
        const sNisn = String(siswa.nisn || '');
        const sNama = String(siswa.nama || '').trim().toLowerCase();

        const isMatch = (tId && tId === sId) || 
                        (tNisn && tNisn === sNisn) || 
                        (tNama && sNama && tNama === sNama) ||
                        (siswa.qr_code && tId === String(siswa.qr_code));

        if (isMatch && l.tanggal) {
          const dStr = extractDateStr(l.tanggal);
          if (dStr && dStr.startsWith(mInfo.key)) {
            const statusLower = (l.status || '').toLowerCase();
            if (statusLower.includes('terlambat') || statusLower.includes('hadir')) {
              hadir++;
            } else if (statusLower.includes('izin')) {
              izin++;
            } else if (statusLower.includes('sakit')) {
              sakit++;
            } else if (statusLower.includes('alpa') || statusLower.includes('tanpa')) {
              alpa++;
            } else {
              hadir++;
            }
          }
        }
      });

      return {
        monthKey: mInfo.key,
        monthLabel: mInfo.label,
        hadir,
        izin,
        sakit,
        alpa
      };
    });

    const totalHadir = monthlyStats.reduce((acc, m) => acc + m.hadir, 0);
    const totalIzin = monthlyStats.reduce((acc, m) => acc + m.izin, 0);
    const totalSakit = monthlyStats.reduce((acc, m) => acc + m.sakit, 0);
    const totalAlpa = monthlyStats.reduce((acc, m) => acc + m.alpa, 0);

    const targetHariSemester = (pengaturan?.hari_efektif_semester && parseInt(pengaturan.hari_efektif_semester, 10) > 0)
      ? parseInt(pengaturan.hari_efektif_semester, 10)
      : 110;

    const rate = Math.min(100, Math.round((totalHadir / (targetHariSemester || 1)) * 100));

    return {
      ...siswa,
      kelasNama: getSiswaKelasNama(siswa) || '-',
      monthlyStats,
      totalHadir,
      totalIzin,
      totalSakit,
      totalAlpa,
      rate
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const titleRows = [
      [{ v: 'REKAPITULASI PRESENSI SISWA', t: 's', s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } } }],
      [{ v: profilSekolah?.namaSekolah || profilSekolah?.nama_sekolah || 'MIN 1 CIANJUR', t: 's', s: { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } } }],
      [{ v: `Kelas: ${selectedKelas} | ${jenisRekap === 'Bulanan' ? `Periode: ${getBulanNamaIndo(selectedBulan)}` : `Semester ${selectedSemester}`} (TP ${tapelAktif})`, t: 's', s: { alignment: { horizontal: 'center' } } }],
      []
    ];

    const createFooterRows = (totalCols) => {
      const sigColStart = totalCols - 5 > 0 ? totalCols - 5 : 0;
      return [
        [],
        Array(sigColStart).fill('').concat([{ v: `Cianjur, ${formatIndoDate(new Date())}`, t: 's', s: { alignment: { horizontal: 'left' } } }]),
        Array(sigColStart).fill('').concat([{ v: `Wali Kelas ${selectedKelas},`, t: 's', s: { alignment: { horizontal: 'left' } } }]),
        [],
        [],
        [],
        Array(sigColStart).fill('').concat([{ v: getWaliKelasNama(), t: 's', s: { font: { bold: true, underline: true }, alignment: { horizontal: 'left' } } }]),
      ];
    };

    if (jenisRekap === 'Bulanan') {
      if (!monthlyMatrixData || monthlyMatrixData.length === 0) {
        showToast('Tidak ada data rekapitulasi siswa untuk diekspor.', 'error');
        return;
      }

      const headers1 = [
        'No',
        'NISN',
        'Nama Siswa',
        'TANGGAL',
        ...Array(daysInMonth - 1).fill(''),
        'JUMLAH',
        '', '', '',
        '%'
      ];

      const headers2 = [
        '',
        '',
        '',
        ...daysArray.map(d => d),
        'H',
        'I',
        'S',
        'A',
        ''
      ];

      const rows = monthlyMatrixData.map((row, idx) => [
        idx + 1,
        { t: 's', v: String(row.nisn || '-') },
        row.nama || '',
        ...row.dailyStatus.map(st => {
          if (st.isHoliday) {
            return {
              v: idx === 0 ? st.title : '',
              t: 's',
              s: {
                fill: { fgColor: { rgb: "FFFFE4E6" } },
                alignment: idx === 0 ? { textRotation: 90, vertical: 'center', horizontal: 'center' } : undefined,
                font: idx === 0 ? { color: { rgb: "FFBE123C" }, bold: true } : undefined
              }
            };
          }
          return st.code === '-' ? '-' : st.code;
        }),
        row.hadirCount || 0,
        row.izinCount || 0,
        row.sakitCount || 0,
        row.alpaCount || 0,
        `${row.rate}%`
      ]);

      const totalColsBulanan = 3 + daysInMonth + 5;
      const wsData = [...titleRows, headers1, headers2, ...rows, ...createFooterRows(totalColsBulanan)];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Apply styling (Borders and Alignment)
      for (const key in ws) {
        if (key.startsWith('!')) continue;
        const cell = ws[key];
        if (!cell.s) cell.s = {};

        const cellRef = XLSX.utils.decode_cell(key);

        if (cellRef.r >= 4 && cellRef.r <= 5 + rows.length) {
          cell.s.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
        }

        if (cellRef.r === 4 || cellRef.r === 5) {
          cell.s.font = { bold: true };
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (cellRef.r >= 6 && cellRef.r <= 5 + rows.length) {
          // Preserve alignment if already set (like textRotation)
          if (!cell.s.alignment) {
            cell.s.alignment = { vertical: 'center' };
            if (cellRef.c === 0 || cellRef.c >= 3) {
              cell.s.alignment.horizontal = 'center';
            }
          }
        }
      }

      const sigColStartBulanan = totalColsBulanan - 5 > 0 ? totalColsBulanan - 5 : 0;
      const sigColEndBulanan = totalColsBulanan - 1;
      const footerStartRowBulanan = 4 + 2 + rows.length + 1;

      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalColsBulanan - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: totalColsBulanan - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: totalColsBulanan - 1 } },
        { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
        { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
        { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
        { s: { r: 4, c: 3 }, e: { r: 4, c: 3 + daysInMonth - 1 } },
        { s: { r: 4, c: 3 + daysInMonth }, e: { r: 4, c: 3 + daysInMonth + 3 } },
        { s: { r: 4, c: 3 + daysInMonth + 4 }, e: { r: 5, c: 3 + daysInMonth + 4 } }
      ];

      // Add merges for holiday columns
      if (rows.length > 0) {
        monthDaysInfo.forEach((info, dIdx) => {
          if (info.isHoliday) {
            merges.push({ s: { r: 6, c: 3 + dIdx }, e: { r: 6 + rows.length - 1, c: 3 + dIdx } });
          }
        });
      }

      ws['!merges'] = merges;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Siswa_Bulanan');

      const kelasSuffix = selectedKelas !== 'Semua' ? `_${selectedKelas.replace(/\s+/g, '_')}` : '';
      XLSX.writeFile(wb, `Rekap_Bulanan_Siswa${kelasSuffix}_${selectedBulan}.xlsx`);
      showToast(`Berhasil mengekspor rekap bulanan (${monthlyMatrixData.length} siswa) ke file Excel!`);

    } else {
      // Semester Export
      if (!semesterMatrixData || semesterMatrixData.length === 0) {
        showToast('Tidak ada data rekapitulasi semester untuk diekspor.', 'error');
        return;
      }

      // Row 1 Header for 6 Months
      const headers1 = [
        'No',
        'NISN',
        'Nama Siswa',
        ...semesterMonths.flatMap(m => [m.label, '', '', '']),
        'JUMLAH',
        '', '', '',
        '%'
      ];

      // Row 2 Header: H, I, S, A for each month & Total
      const headers2 = [
        '',
        '',
        '',
        ...semesterMonths.flatMap(() => ['H', 'I', 'S', 'A']),
        'H', 'I', 'S', 'A',
        ''
      ];

      const rows = semesterMatrixData.map((row, idx) => [
        idx + 1,
        { t: 's', v: String(row.nisn || '-') },
        row.nama || '',
        ...row.monthlyStats.flatMap(m => [m.hadir, m.izin, m.sakit, m.alpa]),
        row.totalHadir,
        row.totalIzin,
        row.totalSakit,
        row.totalAlpa,
        `${row.rate}%`
      ]);

      const totalColsSemester = 3 + (semesterMonths.length * 4) + 5;
      const wsData = [...titleRows, headers1, headers2, ...rows, ...createFooterRows(totalColsSemester)];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Apply styling (Borders and Alignment)
      for (const key in ws) {
        if (key.startsWith('!')) continue;
        const cell = ws[key];
        if (!cell.s) cell.s = {};

        const cellRef = XLSX.utils.decode_cell(key);

        if (cellRef.r >= 4 && cellRef.r <= 5 + rows.length) {
          cell.s.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
        }

        if (cellRef.r === 4 || cellRef.r === 5) {
          cell.s.font = { bold: true };
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (cellRef.r >= 6 && cellRef.r <= 5 + rows.length) {
          cell.s.alignment = { vertical: 'center' };
          if (cellRef.c === 0 || cellRef.c >= 3) {
            cell.s.alignment.horizontal = 'center';
          }
        }
      }

      const sigColStartSemester = totalColsSemester - 5 > 0 ? totalColsSemester - 5 : 0;
      const sigColEndSemester = totalColsSemester - 1;
      const footerStartRowSemester = 4 + 2 + rows.length + 1;

      // Merges
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalColsSemester - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: totalColsSemester - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: totalColsSemester - 1 } },
        { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
        { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
        { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }
      ];

      // Month colSpans
      let startCol = 3;
      semesterMonths.forEach(() => {
        merges.push({ s: { r: 4, c: startCol }, e: { r: 4, c: startCol + 3 } });
        startCol += 4;
      });

      // Total Semester colSpan
      merges.push({ s: { r: 4, c: startCol }, e: { r: 4, c: startCol + 3 } });
      // Rate rowSpan
      merges.push({ s: { r: 4, c: startCol + 4 }, e: { r: 5, c: startCol + 4 } });

      ws['!merges'] = merges;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Siswa_Semester');

      const kelasSuffix = selectedKelas !== 'Semua' ? `_${selectedKelas.replace(/\s+/g, '_')}` : '';
      XLSX.writeFile(wb, `Rekap_Semester_Siswa${kelasSuffix}_${selectedSemester}_${tapelAktif.replace('/', '-')}.xlsx`);
      showToast(`Berhasil mengekspor rekap semester (${semesterMatrixData.length} siswa) ke file Excel!`);
    }
  };

  const getBulanNamaIndo = (bulanIsoStr) => {
    const [y, m] = bulanIsoStr.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mIdx = parseInt(m, 10) - 1;
    return `${monthNames[mIdx] || ''} ${y}`;
  };

  return (
    <div className="page-container">
      {/* Header Actions */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">
            <ClipboardCheck color="#4f46e5" size={28} /> Rekapitulasi Presensi Siswa
          </h1>
          <p className="page-subtitle">
            Laporan matrik kehadiran siswa per kelas ({jenisRekap === 'Bulanan' ? `Bulan ${getBulanNamaIndo(selectedBulan)}` : `Semester ${selectedSemester} TP ${tapelAktif}`})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportExcel}
            style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', fontWeight: 700 }}
            title="Ekspor Matrik Rekapitulasi ke File Excel (.xlsx)"
          >
            <FileSpreadsheet size={18} />
            <span>Export Excel</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Cetak Rekap Kelas
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-modern no-print" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filter 1: Pilih Kelas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={18} color="#4f46e5" />
          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Kelas:</label>
          <select 
            className="form-control"
            style={{ width: '170px', fontSize: '0.88rem' }}
            value={selectedKelas}
            onChange={e => setSelectedKelas(e.target.value)}
          >
            <option value="Semua">Semua Kelas</option>
            {kelasFilterList.map(kls => (
              <option key={kls.id} value={kls.nama}>{kls.nama}</option>
            ))}
          </select>
        </div>

        {/* Filter 2: Jenis Rekap (Bulanan vs Semester) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="#4f46e5" />
          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Jenis Rekap:</label>
          <select 
            className="form-control"
            style={{ width: '160px', fontSize: '0.88rem', fontWeight: 700, color: '#4f46e5' }}
            value={jenisRekap}
            onChange={e => setJenisRekap(e.target.value)}
          >
            <option value="Bulanan">Per Bulan</option>
            <option value="Semester">Per Semester</option>
          </select>
        </div>

        {/* Filter 3: Periode Specific Control */}
        {jenisRekap === 'Bulanan' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#4f46e5" />
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Periode Bulan:</label>
            <input 
              type="month" 
              className="form-control"
              style={{ width: '170px', fontSize: '0.88rem' }}
              value={selectedBulan}
              onChange={e => setSelectedBulan(e.target.value)}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#4f46e5" />
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Semester:</label>
            <select
              className="form-control"
              style={{ width: '140px', fontSize: '0.88rem' }}
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        )}

        {/* Legend for Monthly View */}
        {jenisRekap === 'Bulanan' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 700, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '3px' }} /> H: Hadir
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fef3c7', border: '1px solid #fde047', borderRadius: '3px' }} /> T: Terlambat
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '3px' }} /> I: Izin
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '3px' }} /> S: Sakit
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '3px' }} /> A: Alpa
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ffe4e6', border: '1px solid #fecdd3', borderRadius: '3px' }} /> Red: Libur
            </span>
          </div>
        )}

        {/* Legend for Semester View */}
        {jenisRekap === 'Semester' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 700, flexWrap: 'wrap' }}>
            <span style={{ color: '#15803d' }}>H: Hadir</span>
            <span style={{ color: '#0369a1' }}>I: Izin</span>
            <span style={{ color: '#d97706' }}>S: Sakit</span>
            <span style={{ color: '#dc2626' }}>A: Alpa</span>
          </div>
        )}
      </div>

      {/* Printable Area Container */}
      <div className="printable-area card-modern" style={{ padding: '1.5rem', background: '#fff' }}>
        {/* Printable Header Title */}
        <div className="only-print" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>REKAPITULASI PRESENSI SISWA</h2>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.2rem 0 0', textTransform: 'uppercase', color: '#0f172a' }}>
            {profilSekolah?.namaSekolah || profilSekolah?.nama_sekolah || 'MIN 1 CIANJUR'}
          </h3>
          <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Kelas: {selectedKelas} | {jenisRekap === 'Bulanan' ? `Periode: ${getBulanNamaIndo(selectedBulan)}` : `Semester ${selectedSemester}`} (TP {tapelAktif})
          </p>
        </div>

        {/* VIEW 1: MONTHLY MATRIX TABLE */}
        {jenisRekap === 'Bulanan' ? (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table-modern" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              <thead>
                {/* Row 1: Group Headers */}
                <tr style={{ background: '#f1f5f9' }}>
                  <th rowSpan={2} style={{ width: '35px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NO</th>
                  <th rowSpan={2} style={{ minWidth: '170px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NAMA SISWA</th>
                  <th rowSpan={2} style={{ width: '90px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NISN</th>
                  
                  {/* TANGGAL Header Group */}
                  <th 
                    colSpan={daysInMonth} 
                    style={{ 
                      textAlign: 'center', 
                      background: '#f1f5f9', 
                      color: '#1e293b', 
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      letterSpacing: '0.05em',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid #cbd5e1'
                    }}
                  >
                    TANGGAL
                  </th>

                  {/* JUMLAH Header Group */}
                  <th 
                    colSpan={4} 
                    style={{ 
                      textAlign: 'center', 
                      background: '#f1f5f9', 
                      color: '#1e293b', 
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      letterSpacing: '0.05em',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid #cbd5e1'
                    }}
                  >
                    JUMLAH
                  </th>

                  <th rowSpan={2} style={{ width: '55px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>%</th>
                </tr>

                {/* Row 2: Sub-Headers */}
                <tr style={{ background: '#f1f5f9' }}>
                  {monthDaysInfo.map((info, idx) => (
                    <th 
                      key={idx} 
                      title={`${idx + 1} ${getBulanNamaIndo(selectedBulan)} - ${info.dayNameIndo}${info.holidayTitle ? ` (${info.holidayTitle})` : ''}`}
                      style={{ 
                        width: '28px', 
                        textAlign: 'center', 
                        padding: '0.35rem 0.15rem',
                        background: '#f1f5f9',
                        color: info.isHoliday ? '#e11d48' : '#334155',
                        borderBottom: '1px solid #cbd5e1',
                        fontSize: '0.78rem',
                        fontWeight: 800
                      }}
                    >
                      {idx + 1}
                    </th>
                  ))}
                  <th style={{ width: '45px', textAlign: 'center', color: '#15803d', background: '#f1f5f9', fontSize: '0.74rem', fontWeight: 800 }}>HADIR</th>
                  <th style={{ width: '45px', textAlign: 'center', color: '#0369a1', background: '#f1f5f9', fontSize: '0.74rem', fontWeight: 800 }}>IZIN</th>
                  <th style={{ width: '45px', textAlign: 'center', color: '#d97706', background: '#f1f5f9', fontSize: '0.74rem', fontWeight: 800 }}>SAKIT</th>
                  <th style={{ width: '45px', textAlign: 'center', color: '#dc2626', background: '#f1f5f9', fontSize: '0.74rem', fontWeight: 800 }}>ALPA</th>
                </tr>
              </thead>
              <tbody>
                {monthlyMatrixData.length === 0 ? (
                  <tr>
                    <td colSpan={3 + daysInMonth + 5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      Tidak ada data siswa untuk kelas yang dipilih.
                    </td>
                  </tr>
                ) : (
                  monthlyMatrixData.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 600, color: '#1e293b', textAlign: 'center', padding: '0.35rem 0.5rem' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: '#1e293b', padding: '0.35rem 0.5rem' }}>{row.nama}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'center', padding: '0.35rem 0.5rem' }}>{row.nisn || '-'}</td>
                      {row.dailyStatus.map((st, dIdx) => {
                        const isHol = st.isHoliday;
                        let bg = 'transparent';
                        let color = '#94a3b8';
                        let text = st.code;

                        if (isHol) {
                          if (idx !== 0) return null;

                          return (
                            <td 
                              key={dIdx} 
                              rowSpan={monthlyMatrixData.length}
                              title={`${dIdx + 1} ${getBulanNamaIndo(selectedBulan)}: ${st.title}`}
                              style={{ 
                                textAlign: 'center', 
                                verticalAlign: 'middle',
                                padding: 0,
                                background: '#ffe4e6',
                                borderLeft: '1px solid #fecdd3',
                                borderRight: '1px solid #fecdd3',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{ 
                                writingMode: 'vertical-rl', 
                                transform: 'rotate(180deg)', 
                                display: 'inline-block',
                                whiteSpace: 'nowrap',
                                color: '#be123c',
                                fontWeight: 800,
                                fontSize: '0.72rem'
                              }}>
                                {st.title}
                              </div>
                            </td>
                          );
                        } else if (st.code === 'H') {
                          bg = '#dcfce7';
                          color = '#15803d';
                        } else if (st.code === 'T') {
                          bg = '#fef3c7';
                          color = '#b45309';
                        } else if (st.code === 'I') {
                          bg = '#e0f2fe';
                          color = '#0369a1';
                        } else if (st.code === 'S') {
                          bg = '#fef9c3';
                          color = '#a16207';
                        } else if (st.code === 'A') {
                          bg = '#fee2e2';
                          color = '#dc2626';
                        }

                        return (
                          <td 
                            key={dIdx} 
                            title={`${dIdx + 1} ${getBulanNamaIndo(selectedBulan)}: ${st.title}`}
                            style={{ 
                              textAlign: 'center', 
                              padding: '0.25rem 0.1rem',
                              background: bg,
                              color: color,
                              fontWeight: st.code !== '-' ? 800 : 400,
                              fontSize: '0.72rem'
                            }}
                          >
                            {text}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#15803d', background: '#f0fdf4', padding: '0.35rem' }}>{row.hadirCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#0369a1', background: '#f0f9ff', padding: '0.35rem' }}>{row.izinCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#d97706', background: '#fffbeb', padding: '0.35rem' }}>{row.sakitCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '0.35rem' }}>{row.alpaCount}</td>
                      <td style={{ textAlign: 'center', padding: '0.35rem' }}>
                        <span style={{ fontWeight: 800, color: row.rate >= 75 ? '#10b981' : '#f59e0b' }}>
                          {row.rate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* VIEW 2: SEMESTER MATRIX TABLE */
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table-modern" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              <thead>
                {/* Row 1: Month Group Headers */}
                <tr style={{ background: '#f1f5f9' }}>
                  <th rowSpan={2} style={{ width: '35px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NO</th>
                  <th rowSpan={2} style={{ minWidth: '170px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NAMA SISWA</th>
                  <th rowSpan={2} style={{ width: '90px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NISN</th>
                  
                  {/* 6 Months Header Groups */}
                  {semesterMonths.map(m => (
                    <th 
                      key={m.key} 
                      colSpan={4} 
                      style={{ 
                        textAlign: 'center', 
                        background: '#f1f5f9', 
                        color: '#4f46e5', 
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        letterSpacing: '0.05em',
                        padding: '0.4rem 0',
                        borderBottom: '1px solid #cbd5e1'
                      }}
                    >
                      {m.label}
                    </th>
                  ))}

                  {/* TOTAL SEMESTER Header Group */}
                  <th 
                    colSpan={4} 
                    style={{ 
                      textAlign: 'center', 
                      background: '#e0e7ff', 
                      color: '#3730a3', 
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      letterSpacing: '0.05em',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid #c7d2fe'
                    }}
                  >
                    TOTAL SEMESTER
                  </th>

                  <th rowSpan={2} style={{ width: '55px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>%</th>
                </tr>

                {/* Row 2: Sub-Headers H, I, S, A for each Month */}
                <tr style={{ background: '#f1f5f9' }}>
                  {semesterMonths.map(m => (
                    <React.Fragment key={`sub-${m.key}`}>
                      <th style={{ width: '28px', textAlign: 'center', color: '#15803d', background: '#f8fafc', fontSize: '0.72rem', fontWeight: 800 }}>H</th>
                      <th style={{ width: '28px', textAlign: 'center', color: '#0369a1', background: '#f8fafc', fontSize: '0.72rem', fontWeight: 800 }}>I</th>
                      <th style={{ width: '28px', textAlign: 'center', color: '#d97706', background: '#f8fafc', fontSize: '0.72rem', fontWeight: 800 }}>S</th>
                      <th style={{ width: '28px', textAlign: 'center', color: '#dc2626', background: '#f8fafc', fontSize: '0.72rem', fontWeight: 800 }}>A</th>
                    </React.Fragment>
                  ))}

                  {/* Total Semester Sub-Headers */}
                  <th style={{ width: '32px', textAlign: 'center', color: '#15803d', background: '#f0fdf4', fontSize: '0.74rem', fontWeight: 800 }}>H</th>
                  <th style={{ width: '32px', textAlign: 'center', color: '#0369a1', background: '#f0f9ff', fontSize: '0.74rem', fontWeight: 800 }}>I</th>
                  <th style={{ width: '32px', textAlign: 'center', color: '#d97706', background: '#fffbeb', fontSize: '0.74rem', fontWeight: 800 }}>S</th>
                  <th style={{ width: '32px', textAlign: 'center', color: '#dc2626', background: '#fef2f2', fontSize: '0.74rem', fontWeight: 800 }}>A</th>
                </tr>
              </thead>
              <tbody>
                {semesterMatrixData.length === 0 ? (
                  <tr>
                    <td colSpan={3 + (6 * 4) + 4 + 1} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      Tidak ada data siswa untuk kelas yang dipilih.
                    </td>
                  </tr>
                ) : (
                  semesterMatrixData.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 600, color: '#94a3b8', textAlign: 'center', padding: '0.35rem 0.5rem' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: '#1e293b', padding: '0.35rem 0.5rem' }}>{row.nama}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', textAlign: 'center', padding: '0.35rem 0.5rem' }}>{row.nisn || '-'}</td>
                      
                      {/* Monthly Stats Cells */}
                      {row.monthlyStats.map(m => (
                        <React.Fragment key={m.monthKey}>
                          <td style={{ textAlign: 'center', fontWeight: m.hadir > 0 ? 800 : 400, color: m.hadir > 0 ? '#15803d' : '#cbd5e1' }}>{m.hadir || '-'}</td>
                          <td style={{ textAlign: 'center', fontWeight: m.izin > 0 ? 800 : 400, color: m.izin > 0 ? '#0369a1' : '#cbd5e1' }}>{m.izin || '-'}</td>
                          <td style={{ textAlign: 'center', fontWeight: m.sakit > 0 ? 800 : 400, color: m.sakit > 0 ? '#d97706' : '#cbd5e1' }}>{m.sakit || '-'}</td>
                          <td style={{ textAlign: 'center', fontWeight: m.alpa > 0 ? 800 : 400, color: m.alpa > 0 ? '#dc2626' : '#cbd5e1' }}>{m.alpa || '-'}</td>
                        </React.Fragment>
                      ))}

                      {/* Total Semester Cells */}
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#15803d', background: '#f0fdf4', padding: '0.35rem' }}>{row.totalHadir}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#0369a1', background: '#f0f9ff', padding: '0.35rem' }}>{row.totalIzin}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#d97706', background: '#fffbeb', padding: '0.35rem' }}>{row.totalSakit}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '0.35rem' }}>{row.totalAlpa}</td>
                      
                      <td style={{ textAlign: 'center', padding: '0.35rem' }}>
                        <span style={{ fontWeight: 800, color: row.rate >= 75 ? '#10b981' : '#f59e0b' }}>
                          {row.rate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Printable Footer Signature Block (Right Aligned to Table Edge) */}
        <div className="only-print" style={{ 
          width: '100%', 
          marginTop: '1.5rem', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'flex-end',
          pageBreakInside: 'avoid', 
          breakInside: 'avoid' 
        }}>
          <div style={{ textAlign: 'center', width: '280px', marginLeft: 'auto', fontSize: '0.85rem', color: '#0f172a' }}>
            <div>Cianjur, {formatIndoDate(new Date())}</div>
            <div style={{ fontWeight: 700, marginTop: '0.15rem' }}>Wali Kelas {selectedKelas !== 'Semua' ? selectedKelas : ''},</div>
            <div style={{ height: '60px' }} /> {/* Signature Space */}
            <div style={{ fontWeight: 800, textDecoration: 'underline', fontSize: '0.9rem' }}>
              {getWaliKelasNama()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
