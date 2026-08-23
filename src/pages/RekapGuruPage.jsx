import React, { useState } from 'react';
import * as XLSX from 'xlsx-js-style';
import { useApp, DEFAULT_JADWAL_HARIAN } from '../context/AppContext';
import { FileText, Printer, Filter, Calendar, FileSpreadsheet, Layers } from 'lucide-react';

export const RekapGuruPage = () => {
  const { 
    guruTendikList, 
    presensiLogs, 
    getTapelAktif, 
    semesterAktif, 
    showToast, 
    profilSekolah,
    pengaturan 
  } = useApp();

  const tapelAktif = getTapelAktif();

  const [filterKategori, setFilterKategori] = useState('Semua');
  const [jenisRekap, setJenisRekap] = useState('Bulanan'); // 'Bulanan' | 'Semester'
  const [selectedSemester, setSelectedSemester] = useState(semesterAktif || 'Ganjil');
  const [selectedBulan, setSelectedBulan] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // Filter Guru/Tendik list
  const filteredStaff = guruTendikList.filter(g => 
    (filterKategori === 'Semua' || g.kategori === filterKategori) &&
    (g.status === 'Aktif' || !g.status) // Assuming we only show active staff, or maybe don't filter if not set
  ).sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { numeric: true, sensitivity: 'base' }));

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

  const getBulanNamaIndo = (monthStr) => {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
  };

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

  const monthlyMatrixData = filteredStaff.map(staff => {
    const staffLogsMap = {};
    (presensiLogs || []).forEach(l => {
      const tId = String(l.target_id || l.targetId || '');
      const sId = String(staff.id || '');

      if (tId && tId === sId && l.tanggal) {
        const dStr = extractDateStr(l.tanggal);
        if (dStr && dStr.startsWith(selectedBulan)) {
          staffLogsMap[dStr] = l;
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

      const log = staffLogsMap[info.dayDateStr];
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
      ...staff,
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

  const semesterMatrixData = filteredStaff.map(staff => {
    const monthlyStats = semesterMonths.map(mInfo => {
      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alpa = 0;

      (presensiLogs || []).forEach(l => {
        const tId = String(l.target_id || l.targetId || '');
        const sId = String(staff.id || '');

        if (tId && tId === sId && l.tanggal) {
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
      ...staff,
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
      [{ v: 'REKAPITULASI PRESENSI GURU & TENDIK', t: 's', s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } } }],
      [{ v: profilSekolah?.namaSekolah || profilSekolah?.nama_sekolah || 'MIN 1 CIANJUR', t: 's', s: { font: { bold: true, sz: 12 }, alignment: { horizontal: 'center' } } }],
      [{ v: `Kategori: ${filterKategori} | ${jenisRekap === 'Bulanan' ? `Periode: ${getBulanNamaIndo(selectedBulan)}` : `Semester ${selectedSemester}`} (TP ${tapelAktif})`, t: 's', s: { alignment: { horizontal: 'center' } } }],
      []
    ];

    const createFooterRows = (totalCols) => {
      const sigColStart = totalCols - 4 > 0 ? totalCols - 4 : 0;
      return [
        [],
        Array(sigColStart).fill('').concat([{ v: `Cianjur, ${formatIndoDate(new Date())}`, t: 's', s: { alignment: { horizontal: 'left' } } }]),
        Array(sigColStart).fill('').concat([{ v: `Kepala Madrasah,`, t: 's', s: { alignment: { horizontal: 'left' } } }]),
        [],
        [],
        [],
        Array(sigColStart).fill('').concat([{ v: profilSekolah?.namaKepsek || profilSekolah?.nama_kepsek || '.......................', t: 's', s: { font: { bold: true, underline: true }, alignment: { horizontal: 'left' } } }]),
      ];
    };

    if (jenisRekap === 'Bulanan') {
      if (!monthlyMatrixData || monthlyMatrixData.length === 0) {
        showToast('Tidak ada data rekapitulasi untuk diekspor.', 'error');
        return;
      }

      const headers1 = [
        'No',
        'NIK/NUPTK/NIP',
        'Nama Personel',
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
        { t: 's', v: String((row.nip && row.nip.trim()) || (row.nuptk && row.nuptk.trim()) || (row.nik && row.nik.trim()) || '-') },
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
          if (!cell.s.alignment) {
            cell.s.alignment = { vertical: 'center' };
            if (cellRef.c === 0 || cellRef.c === 1 || cellRef.c >= 3) {
              cell.s.alignment.horizontal = 'center';
            }
          }
        }
      }

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
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Bulanan');

      const katSuffix = filterKategori !== 'Semua' ? `_${filterKategori}` : '';
      XLSX.writeFile(wb, `Rekap_Bulanan_GuruTendik${katSuffix}_${selectedBulan}.xlsx`);
      showToast(`Berhasil mengekspor rekap bulanan ke file Excel!`);

    } else {
      // Semester Export
      if (!semesterMatrixData || semesterMatrixData.length === 0) {
        showToast('Tidak ada data rekapitulasi semester untuk diekspor.', 'error');
        return;
      }

      // Row 1 Header for 6 Months
      const headers1 = [
        'No',
        'NIK/NUPTK/NIP',
        'Nama Personel',
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
        { t: 's', v: String((row.nip && row.nip.trim()) || (row.nuptk && row.nuptk.trim()) || (row.nik && row.nik.trim()) || '-') },
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
          if (cellRef.c === 0 || cellRef.c === 1 || cellRef.c >= 3) {
            cell.s.alignment.horizontal = 'center';
          }
        }
      }

      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalColsSemester - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: totalColsSemester - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: totalColsSemester - 1 } },
        { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
        { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
        { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }
      ];

      // Add colSpan merges for each month
      let startCol = 3;
      for (let i = 0; i < semesterMonths.length; i++) {
        merges.push({ s: { r: 4, c: startCol }, e: { r: 4, c: startCol + 3 } });
        startCol += 4;
      }

      // Total Semester colSpan
      merges.push({ s: { r: 4, c: startCol }, e: { r: 4, c: startCol + 3 } });
      // Rate rowSpan
      merges.push({ s: { r: 4, c: startCol + 4 }, e: { r: 5, c: startCol + 4 } });

      ws['!merges'] = merges;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Semester');

      const katSuffix = filterKategori !== 'Semua' ? `_${filterKategori}` : '';
      XLSX.writeFile(wb, `Rekap_Semester_GuruTendik${katSuffix}_${selectedSemester}.xlsx`);
      showToast(`Berhasil mengekspor rekap semester ke file Excel!`);
    }
  };

  return (
    <div className="page-container">
      {/* Header Actions */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">
            <FileText color="#4f46e5" size={28} /> Rekapitulasi Presensi Guru & Tendik
          </h1>
          <p className="page-subtitle">Laporan ringkasan kehadiran pengajar & staf sekolah per periode</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportExcel}
            style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', fontWeight: 700 }}
            title="Ekspor Rekapitulasi ke File Excel (.xlsx)"
          >
            <FileSpreadsheet size={18} />
            <span>Export Excel</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-modern no-print" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="#4f46e5" />
          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Jenis Rekap:</label>
          <select 
            className="form-control"
            style={{ width: '130px' }}
            value={jenisRekap}
            onChange={e => setJenisRekap(e.target.value)}
          >
            <option value="Bulanan">Bulanan</option>
            <option value="Semester">Semester</option>
          </select>
        </div>

        {jenisRekap === 'Bulanan' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#4f46e5" />
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Periode Bulan:</label>
            <input 
              type="month" 
              className="form-control"
              style={{ width: '170px' }}
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
              style={{ width: '120px' }}
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#4f46e5" />
          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Kategori:</label>
          <select 
            className="form-control"
            style={{ width: '180px' }}
            value={filterKategori}
            onChange={e => setFilterKategori(e.target.value)}
          >
            <option value="Semua">Semua Personel</option>
            <option value="Guru">Guru / Pengajar</option>
            <option value="Tendik">Tenaga Kependidikan</option>
          </select>
        </div>
        
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
        <div className="only-print" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          {profilSekolah?.logo && (
            <div style={{ position: 'absolute', left: '12%', top: '50%', transform: 'translateY(-50%)' }}>
              <img src={profilSekolah.logo} alt="Logo Sekolah" style={{ height: '55px', width: 'auto' }} />
            </div>
          )}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>REKAPITULASI PRESENSI GURU & TENDIK</h2>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.2rem 0 0', textTransform: 'uppercase', color: '#0f172a' }}>
              {profilSekolah?.namaSekolah || profilSekolah?.nama_sekolah || 'MIN 1 CIANJUR'}
            </h3>
            <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              Kategori: {filterKategori} | {jenisRekap === 'Bulanan' ? `Periode: ${getBulanNamaIndo(selectedBulan)}` : `Semester ${selectedSemester}`} (TP {tapelAktif})
            </p>
          </div>
        </div>

        {/* VIEW 1: MONTHLY MATRIX TABLE */}
        {jenisRekap === 'Bulanan' ? (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table-modern" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
              <thead>
                {/* Row 1: Group Headers */}
                <tr style={{ background: '#f1f5f9' }}>
                  <th rowSpan={2} style={{ width: '35px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NO</th>
                  <th rowSpan={2} style={{ minWidth: '130px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NAMA PERSONEL</th>
                  <th rowSpan={2} style={{ minWidth: '100px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NIK/NUPTK/NIP</th>
                  
                  {/* TANGGAL Header Group */}
                  <th 
                    colSpan={daysInMonth} 
                    style={{ 
                      textAlign: 'center', 
                      background: '#f8fafc', 
                      color: '#475569', 
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      letterSpacing: '0.1em',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    TANGGAL
                  </th>
                  
                  {/* JUMLAH REKAP Header Group */}
                  <th 
                    colSpan={4} 
                    style={{ 
                      textAlign: 'center', 
                      background: '#f8fafc', 
                      color: '#475569', 
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      letterSpacing: '0.05em',
                      padding: '0.4rem 0',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    JUMLAH
                  </th>

                  <th rowSpan={2} style={{ width: '40px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>%</th>
                </tr>
                {/* Row 2: Sub Headers (Dates & Counts) */}
                <tr style={{ background: '#f8fafc' }}>
                  {daysArray.map(d => (
                    <th key={d} style={{ width: '20px', minWidth: '20px', maxWidth: '20px', textAlign: 'center', padding: '0.25rem 0', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
                      {d}
                    </th>
                  ))}
                  <th style={{ width: '25px', textAlign: 'center', color: '#15803d', fontWeight: 800 }}>H</th>
                  <th style={{ width: '25px', textAlign: 'center', color: '#0369a1', fontWeight: 800 }}>I</th>
                  <th style={{ width: '25px', textAlign: 'center', color: '#d97706', fontWeight: 800 }}>S</th>
                  <th style={{ width: '25px', textAlign: 'center', color: '#dc2626', fontWeight: 800 }}>A</th>
                </tr>
              </thead>
              <tbody>
                {monthlyMatrixData.length === 0 ? (
                  <tr>
                    <td colSpan={3 + daysInMonth + 5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Tidak ada data staf untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  monthlyMatrixData.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 600, color: '#1e293b', textAlign: 'center', padding: '0.35rem 0.5rem', fontSize: '0.72rem' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: '#1e293b', padding: '0.35rem 0.5rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{row.nama}</td>
                      <td style={{ fontFamily: 'monospace', color: '#475569', fontSize: '0.72rem', padding: '0.35rem 0.5rem', whiteSpace: 'nowrap', textAlign: 'center' }}>{(row.nip && row.nip.trim()) || (row.nuptk && row.nuptk.trim()) || (row.nik && row.nik.trim()) || '-'}</td>
                      
                      {row.dailyStatus.map((st, dIdx) => {
                        const isHol = st.isHoliday;
                        let bg = 'transparent';
                        let color = '#475569';
                        
                        if (isHol) {
                          if (idx !== 0) return null;

                          return (
                            <td 
                              key={dIdx} 
                              rowSpan={monthlyMatrixData.length}
                              title={`${dIdx + 1} ${getBulanNamaIndo(selectedBulan)}: ${st.title}`}
                              style={{ 
                                textAlign: 'center', 
                                padding: 0,
                                background: '#ffe4e6',
                                verticalAlign: 'middle',
                                borderLeft: '1px solid #fecdd3',
                                borderRight: '1px solid #fecdd3',
                                overflow: 'hidden',
                                width: '20px',
                                minWidth: '20px',
                                maxWidth: '20px'
                              }}
                            >
                              <div style={{ 
                                writingMode: 'vertical-rl', 
                                transform: 'rotate(180deg)',
                                whiteSpace: 'nowrap',
                                color: '#be123c',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                letterSpacing: '0.05em',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {st.title}
                              </div>
                            </td>
                          );
                        }

                        if (st.code === 'H') {
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
                          color = '#d97706';
                        } else if (st.code === 'A') {
                          bg = '#fee2e2';
                          color = '#dc2626';
                        }
                        
                        const text = st.code === '-' ? '-' : st.code;

                        return (
                          <td 
                            key={dIdx} 
                            title={`${dIdx + 1} ${getBulanNamaIndo(selectedBulan)}: ${st.title}`}
                            style={{ 
                              width: '20px',
                              minWidth: '20px',
                              maxWidth: '20px',
                              textAlign: 'center', 
                              padding: '0.25rem 0',
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
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#15803d', background: '#f0fdf4', padding: '0.35rem', fontSize: '0.75rem' }}>{row.hadirCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#0369a1', background: '#f0f9ff', padding: '0.35rem', fontSize: '0.75rem' }}>{row.izinCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#d97706', background: '#fffbeb', padding: '0.35rem', fontSize: '0.75rem' }}>{row.sakitCount}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '0.35rem', fontSize: '0.75rem' }}>{row.alpaCount}</td>
                      <td style={{ textAlign: 'center', padding: '0.35rem', fontSize: '0.75rem' }}>
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
                  <th rowSpan={2} style={{ minWidth: '130px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NAMA PERSONEL</th>
                  <th rowSpan={2} style={{ minWidth: '100px', textAlign: 'center', verticalAlign: 'middle', background: '#f1f5f9', color: '#1e293b', fontWeight: 800 }}>NIK/NUPTK/NIP</th>
                  
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
                    JUMLAH
                  </th>

                  <th rowSpan={2} style={{ width: '40px', textAlign: 'center', verticalAlign: 'middle', background: '#e0e7ff', color: '#3730a3', fontWeight: 800 }}>%</th>
                </tr>
                {/* Row 2: Sub Headers (H I S A for each month) */}
                <tr style={{ background: '#f8fafc' }}>
                  {semesterMonths.map(m => (
                    <React.Fragment key={`sub-${m.key}`}>
                      <th style={{ width: '25px', textAlign: 'center', color: '#15803d', fontWeight: 800 }}>H</th>
                      <th style={{ width: '25px', textAlign: 'center', color: '#0369a1', fontWeight: 800 }}>I</th>
                      <th style={{ width: '25px', textAlign: 'center', color: '#d97706', fontWeight: 800 }}>S</th>
                      <th style={{ width: '25px', textAlign: 'center', color: '#dc2626', fontWeight: 800 }}>A</th>
                    </React.Fragment>
                  ))}
                  {/* Totals Sub Headers */}
                  <th style={{ width: '25px', textAlign: 'center', color: '#15803d', fontWeight: 800, background: '#f0fdf4' }}>H</th>
                  <th style={{ width: '25px', textAlign: 'center', color: '#0369a1', fontWeight: 800, background: '#f0f9ff' }}>I</th>
                  <th style={{ width: '25px', textAlign: 'center', color: '#d97706', fontWeight: 800, background: '#fffbeb' }}>S</th>
                  <th style={{ width: '25px', textAlign: 'center', color: '#dc2626', fontWeight: 800, background: '#fef2f2' }}>A</th>
                </tr>
              </thead>
              <tbody>
                {semesterMatrixData.length === 0 ? (
                  <tr>
                    <td colSpan={3 + (semesterMonths.length * 4) + 5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Tidak ada data staf untuk semester ini.
                    </td>
                  </tr>
                ) : (
                  semesterMatrixData.map((row, idx) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 600, color: '#94a3b8', textAlign: 'center', padding: '0.35rem 0.5rem' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: '#1e293b', padding: '0.35rem 0.5rem' }}>{row.nama}</td>
                      <td style={{ fontFamily: 'monospace', color: '#475569', fontSize: '0.7rem', padding: '0.35rem 0.5rem', whiteSpace: 'nowrap', textAlign: 'center' }}>{(row.nip && row.nip.trim()) || (row.nuptk && row.nuptk.trim()) || (row.nik && row.nik.trim()) || '-'}</td>
                      
                      {row.monthlyStats.map(m => (
                        <React.Fragment key={m.monthKey}>
                          <td style={{ textAlign: 'center', fontWeight: m.hadir > 0 ? 800 : 400, color: m.hadir > 0 ? '#15803d' : '#cbd5e1' }}>{m.hadir}</td>
                          <td style={{ textAlign: 'center', fontWeight: m.izin > 0 ? 800 : 400, color: m.izin > 0 ? '#0369a1' : '#cbd5e1' }}>{m.izin}</td>
                          <td style={{ textAlign: 'center', fontWeight: m.sakit > 0 ? 800 : 400, color: m.sakit > 0 ? '#d97706' : '#cbd5e1' }}>{m.sakit}</td>
                          <td style={{ textAlign: 'center', fontWeight: m.alpa > 0 ? 800 : 400, color: m.alpa > 0 ? '#dc2626' : '#cbd5e1' }}>{m.alpa}</td>
                        </React.Fragment>
                      ))}

                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#15803d', background: '#f0fdf4', padding: '0.35rem' }}>{row.totalHadir}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#0369a1', background: '#f0f9ff', padding: '0.35rem' }}>{row.totalIzin}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#d97706', background: '#fffbeb', padding: '0.35rem' }}>{row.totalSakit}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '0.35rem' }}>{row.totalAlpa}</td>
                      <td style={{ textAlign: 'center', background: '#e0e7ff', padding: '0.35rem' }}>
                        <span style={{ fontWeight: 800, color: row.rate >= 75 ? '#3730a3' : '#b45309' }}>
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
            <div style={{ fontWeight: 700, marginTop: '0.15rem' }}>Kepala Sekolah / Madrasah,</div>
            <div style={{ height: '60px' }} /> {/* Signature Space */}
            <div style={{ fontWeight: 800, textDecoration: 'underline', fontSize: '0.9rem' }}>
              {profilSekolah?.kepalaSekolah || profilSekolah?.kepala_sekolah || '_________________________'}
            </div>
            { (profilSekolah?.nipKepalaSekolah || profilSekolah?.nip_kepala_sekolah) && (
              <div style={{ marginTop: '0.2rem' }}>
                NIP. {profilSekolah?.nipKepalaSekolah || profilSekolah?.nip_kepala_sekolah}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
