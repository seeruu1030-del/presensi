import React, { useState, useMemo } from 'react';
import { useApp, getTodayDateString, formatLocalDateString } from '../context/AppContext';
import { showWarningAlert } from '../utils/sweetalert';
import { ClipboardEdit, Filter, Calendar, Users, GraduationCap, Search, CheckCircle2 } from 'lucide-react';

export const KelolaPresensiPage = () => {
  const { 
    guruTendikList, 
    siswaList, 
    kelasList, 
    presensiLogs, 
    saveManualPresensi,
    getTapelAktif,
    semesterAktif,
    getSiswaActiveRombel,
    pengaturan
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [targetType, setTargetType] = useState('Siswa'); // 'Siswa' | 'Guru' | 'Tendik'
  const [selectedRombel, setSelectedRombel] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const tapelAktif = getTapelAktif();

  // Combine and Filter Data
  const tableData = useMemo(() => {
    let baseList = [];
    
    if (targetType === 'Siswa') {
      baseList = siswaList.filter(s => s.status === 'Aktif' || !s.status).map(s => {
        const rombel = getSiswaActiveRombel(s, tapelAktif, semesterAktif, kelasList);
        return { ...s, displayRombel: rombel || '-' };
      });

      if (selectedRombel !== 'Semua') {
        baseList = baseList.filter(s => s.displayRombel === selectedRombel);
      }
    } else {
      baseList = guruTendikList.filter(g => 
        (g.kategori === targetType) && 
        (g.status === 'Aktif' || !g.status)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      baseList = baseList.filter(u => (u.nama || '').toLowerCase().includes(q));
    }

    // Sort by name
    baseList.sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { numeric: true }));

    // Map logs to users for the selected date
    return baseList.map(user => {
      const log = presensiLogs.find(l => {
        const isSameTarget = (
          (l.target_id && String(l.target_id) === String(user.id)) ||
          (l.targetId && String(l.targetId) === String(user.id)) ||
          (targetType === 'Siswa' && (l.target_id === user.nisn || l.targetId === user.nisn)) ||
          (targetType !== 'Siswa' && (l.target_id === user.nuptk || l.target_id === user.nip || l.targetId === user.nuptk || l.targetId === user.nip))
        );
        const isSameDate = l.tanggal === selectedDate || formatLocalDateString(l.tanggal) === selectedDate;
        return isSameTarget && isSameDate;
      });

      return {
        user,
        log,
        currentStatus: log ? (log.status || 'Hadir') : 'Belum Presensi',
        currentKeterangan: log ? (log.keterangan || '') : ''
      };
    });
  }, [guruTendikList, siswaList, kelasList, presensiLogs, selectedDate, targetType, selectedRombel, searchQuery, tapelAktif, semesterAktif, getSiswaActiveRombel]);

  const checkIsHoliday = (dateStr) => {
    // 1. Cek Libur Nasional / Tanggal Spesifik
    const activeHolidays = Array.isArray(pengaturan.hari_libur) ? pengaturan.hari_libur : [];
    const foundHoliday = activeHolidays.find(h => {
      if (h.aktif === false || h.aktif === 'false' || h.aktif === 'off' || h.aktif === 'non-aktif') return false;
      const tM = typeof (h.tanggal_mulai || h.tanggalMulai || h.tanggal) === 'string' 
        ? (h.tanggal_mulai || h.tanggalMulai || h.tanggal).split('T')[0] 
        : (h.tanggal_mulai || h.tanggalMulai || h.tanggal);
      const tS = typeof (h.tanggal_selesai || h.tanggalSelesai || tM) === 'string' 
        ? (h.tanggal_selesai || h.tanggalSelesai || tM).split('T')[0] 
        : (h.tanggal_selesai || h.tanggalSelesai || tM);

      if (!tM) return false;
      return dateStr >= tM && dateStr <= tS;
    });

    if (foundHoliday) return foundHoliday;

    // 2. Cek Hari Efektif Mingguan
    const dateObj = new Date(dateStr);
    const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDayIndo = dayNamesIndo[dateObj.getDay()];
    
    let activeJadwal = {
      Senin: { aktif: true }, Selasa: { aktif: true }, Rabu: { aktif: true },
      Kamis: { aktif: true }, Jumat: { aktif: true }, Sabtu: { aktif: true }, Minggu: { aktif: false }
    };
    
    if (pengaturan.jadwal_harian) {
      if (typeof pengaturan.jadwal_harian === 'object') {
        activeJadwal = { ...activeJadwal, ...pengaturan.jadwal_harian };
      } else if (typeof pengaturan.jadwal_harian === 'string') {
        try { activeJadwal = { ...activeJadwal, ...JSON.parse(pengaturan.jadwal_harian) }; } catch(e) {}
      }
    }

    const dayConfig = activeJadwal[currentDayIndo];
    if (!dayConfig || !dayConfig.aktif || dayConfig.aktif === 'false') {
      return { isWeekend: true, hari: currentDayIndo };
    }

    return null;
  };

  const handleStatusChange = async (targetObj, newStatus, currentKeterangan) => {
    if (newStatus === 'Belum Presensi') return;

    const holidayInfo = checkIsHoliday(selectedDate);
    if (holidayInfo) {
      const msg = holidayInfo.isWeekend 
        ? `Hari ${holidayInfo.hari} merupakan hari libur/non-efektif sesuai pengaturan jadwal mingguan.` 
        : `Tanggal ini bertepatan dengan libur: ${holidayInfo.keterangan || 'Libur Nasional'}.`;
      
      showWarningAlert(
        'Terkunci (Hari Libur)',
        `Maaf, Anda tidak dapat mengubah status presensi secara manual. ${msg}`
      );
      return;
    }

    await saveManualPresensi(targetObj, targetType, selectedDate, newStatus, currentKeterangan);
  };

  const handleKeteranganBlur = async (targetObj, currentStatus, newKeterangan, oldKeterangan) => {
    if (currentStatus === 'Belum Presensi') return;
    if (newKeterangan === oldKeterangan) return;

    const holidayInfo = checkIsHoliday(selectedDate);
    if (holidayInfo) {
      const msg = holidayInfo.isWeekend 
        ? `Hari ${holidayInfo.hari} merupakan hari libur/non-efektif sesuai pengaturan jadwal mingguan.` 
        : `Tanggal ini bertepatan dengan libur: ${holidayInfo.keterangan || 'Libur Nasional'}.`;
      
      showWarningAlert(
        'Terkunci (Hari Libur)',
        `Maaf, Anda tidak dapat menambahkan atau mengubah keterangan pada hari libur. ${msg}`
      );
      return;
    }

    await saveManualPresensi(targetObj, targetType, selectedDate, currentStatus, newKeterangan);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ClipboardEdit color="#4f46e5" size={28} /> Kelola Presensi Harian
          </h1>
          <p className="page-subtitle">Kelola dan ubah status kehadiran (Hadir, Izin, Sakit, Alpa) secara manual</p>
        </div>
      </div>

      <div className="card-modern" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="#4f46e5" />
          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Tanggal:</label>
          <input 
            type="date" 
            className="form-control"
            style={{ width: '150px' }}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#4f46e5" />
          <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Pihak:</label>
          <select 
            className="form-control"
            style={{ width: '140px' }}
            value={targetType}
            onChange={e => {
              setTargetType(e.target.value);
              setSelectedRombel('Semua');
            }}
          >
            <option value="Siswa">Siswa</option>
            <option value="Guru">Guru</option>
            <option value="Tendik">Tendik</option>
          </select>
        </div>

        {targetType === 'Siswa' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={18} color="#4f46e5" />
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Rombel/Kelas:</label>
            <select 
              className="form-control"
              style={{ width: '150px' }}
              value={selectedRombel}
              onChange={e => setSelectedRombel(e.target.value)}
            >
              <option value="Semua">Semua Kelas</option>
              {Array.from(new Set(kelasList.filter(k => k.tapel === tapelAktif && k.semester === semesterAktif).map(k => k.nama)))
                .sort((a, b) => a.localeCompare(b, 'id', { numeric: true }))
                .map(nama => (
                <option key={nama} value={nama}>{nama}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <Search size={18} color="#4f46e5" />
          <input 
            type="text" 
            className="form-control"
            style={{ width: '100%' }}
            placeholder={`Cari nama ${targetType.toLowerCase()}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card-modern" style={{ padding: '1.5rem', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
            Daftar {targetType} - {selectedDate}
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            Total: {tableData.length} Data
          </span>
        </div>

        <div className="table-responsive">
          <table className="table-modern" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ width: '50px', textAlign: 'center' }}>NO</th>
                <th>NAMA {targetType.toUpperCase()}</th>
                {targetType === 'Siswa' ? <th style={{ width: '100px' }}>KELAS</th> : <th style={{ width: '150px' }}>JABATAN</th>}
                <th style={{ minWidth: '300px' }}>STATUS PRESENSI</th>
                <th style={{ width: '220px' }}>KETERANGAN / CATATAN</th>
                <th style={{ width: '120px', textAlign: 'center' }}>WAKTU MASUK</th>
              </tr>
            </thead>
            <tbody>
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    Tidak ada data {targetType} yang cocok.
                  </td>
                </tr>
              ) : (
                tableData.map((row, idx) => {
                  const { user, currentStatus, currentKeterangan, log } = row;
                  const isHadir = currentStatus.toLowerCase().includes('hadir') || currentStatus.toLowerCase().includes('terlambat');
                  
                  return (
                    <tr key={user.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>
                        {user.nama}
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                          {targetType === 'Siswa' ? (user.nisn || '-') : (user.nip || user.nuptk || '-')}
                        </div>
                      </td>
                      <td>
                        {targetType === 'Siswa' ? user.displayRombel : (user.jabatan || user.kategori)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', minWidth: 'max-content' }}>
                          {[
                            { value: 'Hadir', label: 'Hadir', lightBg: '#dcfce7', textCol: '#15803d', borderCol: '#86efac', solidBg: '#15803d' },
                            { value: 'Terlambat', label: 'Telat', lightBg: '#fef3c7', textCol: '#b45309', borderCol: '#fde68a', solidBg: '#d97706' },
                            { value: 'Izin', label: 'Izin', lightBg: '#e0f2fe', textCol: '#0369a1', borderCol: '#7dd3fc', solidBg: '#0284c7' },
                            { value: 'Sakit', label: 'Sakit', lightBg: '#fef9c3', textCol: '#d97706', borderCol: '#fde047', solidBg: '#ca8a04' },
                            { value: 'Alpa', label: 'Alpa', lightBg: '#fee2e2', textCol: '#dc2626', borderCol: '#fca5a5', solidBg: '#dc2626' }
                          ].map(opt => {
                            // If log.status is 'Hadir', both 'Hadir' and 'Terlambat' are considered present, but we only select the exact one.
                            const isActive = currentStatus.toLowerCase() === opt.value.toLowerCase();

                            return (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(user, opt.value, currentKeterangan)}
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  borderRadius: '0.375rem',
                                  border: `1px solid ${isActive ? opt.solidBg : opt.borderCol}`,
                                  background: isActive ? opt.solidBg : opt.lightBg,
                                  color: isActive ? '#ffffff' : opt.textCol,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                                title={opt.value}
                                onMouseEnter={(e) => { 
                                  if (!isActive) {
                                    e.target.style.background = opt.solidBg;
                                    e.target.style.color = '#ffffff';
                                  }
                                }}
                                onMouseLeave={(e) => { 
                                  if (!isActive) {
                                    e.target.style.background = opt.lightBg;
                                    e.target.style.color = opt.textCol;
                                  }
                                }}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-control"
                          defaultValue={currentKeterangan}
                          placeholder={currentStatus === 'Belum Presensi' ? "Pilih status dulu" : "Tambahkan keterangan..."}
                          disabled={currentStatus === 'Belum Presensi'}
                          onBlur={(e) => handleKeteranganBlur(user, currentStatus, e.target.value, currentKeterangan)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>
                        {log ? (log.jam_masuk || log.jamMasuk || '-') : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
