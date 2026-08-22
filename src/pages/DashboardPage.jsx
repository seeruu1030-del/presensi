import React, { useState } from 'react';
import { useApp, getTodayDateString, formatLocalDateString } from '../context/AppContext';
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  QrCode, 
  TrendingUp, 
  ArrowUpRight,
  Sparkles,
  CalendarCheck
} from 'lucide-react';

export const DashboardPage = () => {
  const { 
    guruTendikList, 
    siswaList, 
    presensiLogs, 
    setActiveMenu,
    pengaturan,
    getTapelAktif,
    semesterAktif
  } = useApp();

  const [dashLogTab, setDashLogTab] = useState('semua');

  const todayStr = getTodayDateString();

  // Helper date check to match local date of today
  const isTodayDate = (dateVal) => {
    if (!dateVal) return false;
    return formatLocalDateString(dateVal) === todayStr;
  };

  // Filter & deduplicate logs for today (newest first, 1 log per person)
  const todayLogs = React.useMemo(() => {
    const rawToday = (presensiLogs || []).filter(l => isTodayDate(l.tanggal));
    
    const sorted = [...rawToday].sort((a, b) => {
      const timeA = a.jamPulang || a.jam_pulang || a.jamMasuk || a.jam_masuk || '00:00:00';
      const timeB = b.jamPulang || b.jam_pulang || b.jamMasuk || b.jam_masuk || '00:00:00';
      const cmp = timeB.localeCompare(timeA);
      if (cmp !== 0) return cmp;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    const seenTargets = new Set();
    const uniqueList = [];
    for (const log of sorted) {
      const tId = String(log.targetId || log.target_id || log.id);
      if (!seenTargets.has(tId)) {
        seenTargets.add(tId);
        uniqueList.push(log);
      }
    }
    return uniqueList;
  }, [presensiLogs, todayStr]);

  // Guru & Tendik stats
  const totalGuruTendik = guruTendikList.length;
  const guruLogsToday = todayLogs.filter(l => (l.targetType || l.target_type) === 'Guru' || (l.targetType || l.target_type) === 'Tendik');
  const guruHadir = guruLogsToday.filter(l => (l.status || '').includes('Hadir')).length;
  const guruTerlambat = guruLogsToday.filter(l => (l.status || '').includes('Terlambat')).length;
  const guruBelumScan = totalGuruTendik - (guruHadir + guruTerlambat);

  // Siswa stats
  const totalSiswa = siswaList.length;
  const siswaLogsToday = todayLogs.filter(l => (l.targetType || l.target_type) === 'Siswa');
  const siswaHadir = siswaLogsToday.filter(l => (l.status || '').includes('Hadir')).length;
  const siswaTerlambat = siswaLogsToday.filter(l => (l.status || '').includes('Terlambat')).length;
  const siswaBelumScan = totalSiswa - (siswaHadir + siswaTerlambat);

  // Overall punctuality rate
  const totalScanned = todayLogs.length;
  const totalHadir = todayLogs.filter(l => (l.status || '').includes('Hadir')).length;
  const punctualityRate = totalScanned > 0 ? Math.round((totalHadir / totalScanned) * 100) : 100;

  const currentTabLogs = dashLogTab === 'guru' 
    ? guruLogsToday 
    : (dashLogTab === 'siswa' ? siswaLogsToday : todayLogs);

  return (
    <div className="page-container">
      {/* Banner Welcome */}
      <div style={dashStyles.banner}>
        <div style={{ flex: 1 }}>
          <span style={dashStyles.bannerBadge}>
            <Sparkles size={14} /> E-Presensi Kiosk Mode Ready
          </span>
          <h2 style={dashStyles.bannerTitle}>Selamat Datang di Sistem Presensi Sekolah</h2>
          <p style={dashStyles.bannerText}>
            Tahun Pelajaran **{getTapelAktif()}** ({semesterAktif}). Pantau ketepatan waktu guru, tendik, dan siswa secara real-time dari panel ini.
          </p>
        </div>
        <button 
          onClick={() => setActiveMenu('scan-qr')}
          className="btn btn-primary"
          style={{ padding: '0.875rem 1.5rem', borderRadius: '14px', fontSize: '0.95rem' }}
        >
          <QrCode size={22} />
          <span>Buka Kamera Scanner QR</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div style={dashStyles.statsGrid}>
        {/* Stat 1: Presensi Guru & Tendik */}
        <div className="card-modern" style={dashStyles.statCard}>
          <div style={dashStyles.statHeader}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>GURU & TENDIK</span>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: '#f3e8ff', color: '#7e22ce' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div style={dashStyles.statValue}>
            {guruHadir + guruTerlambat} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/ {totalGuruTendik}</span>
          </div>
          <div style={dashStyles.statSubGrid}>
            <div style={{ color: '#15803d' }}>
              <strong>{guruHadir}</strong> Hadir
            </div>
            <div style={{ color: '#b45309' }}>
              <strong>{guruTerlambat}</strong> Terlambat
            </div>
            <div style={{ color: '#94a3b8' }}>
              <strong>{guruBelumScan}</strong> Belum Scan
            </div>
          </div>
        </div>

        {/* Stat 2: Presensi Siswa */}
        <div className="card-modern" style={dashStyles.statCard}>
          <div style={dashStyles.statHeader}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>PRESENSI SISWA</span>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca' }}>
              <GraduationCap size={20} />
            </div>
          </div>
          <div style={dashStyles.statValue}>
            {siswaHadir + siswaTerlambat} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>/ {totalSiswa}</span>
          </div>
          <div style={dashStyles.statSubGrid}>
            <div style={{ color: '#15803d' }}>
              <strong>{siswaHadir}</strong> Hadir
            </div>
            <div style={{ color: '#b45309' }}>
              <strong>{siswaTerlambat}</strong> Terlambat
            </div>
            <div style={{ color: '#94a3b8' }}>
              <strong>{siswaBelumScan}</strong> Belum Scan
            </div>
          </div>
        </div>

        {/* Stat 3: Ketepatan Waktu */}
        <div className="card-modern" style={dashStyles.statCard}>
          <div style={dashStyles.statHeader}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>RATING KETEPATAN WAKTU</span>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: '#dcfce7', color: '#15803d' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ ...dashStyles.statValue, color: '#10b981' }}>
            {punctualityRate}%
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem' }}>
            Jam Masuk: <strong>{pengaturan.jamMasuk || pengaturan.jam_masuk}</strong> WIB (Toleransi: {pengaturan.toleransiMenit || pengaturan.toleransi_menit} mnt)
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Scan Stream + Quick Actions */}
      <div style={dashStyles.mainGrid}>
        {/* Left Column: Live Scan Feed with Separate Tabs */}
        <div className="card-modern" style={{ padding: '1.5rem', flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Log Presensi Terkini Hari Ini</h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>Diurutkan dari presensi terbaru paling atas</p>
            </div>

            {/* Segmented Control Tabs: Semua vs Guru vs Siswa */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.3rem', borderRadius: '12px', gap: '0.3rem' }}>
              <button
                type="button"
                onClick={() => setDashLogTab('semua')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '9px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: dashLogTab === 'semua' ? '#ffffff' : 'transparent',
                  color: dashLogTab === 'semua' ? '#0f172a' : '#64748b',
                  boxShadow: dashLogTab === 'semua' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <Users size={15} />
                <span>Semua ({todayLogs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDashLogTab('guru')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '9px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: dashLogTab === 'guru' ? '#ffffff' : 'transparent',
                  color: dashLogTab === 'guru' ? '#7e22ce' : '#64748b',
                  boxShadow: dashLogTab === 'guru' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <UserCheck size={15} />
                <span>Guru ({guruLogsToday.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setDashLogTab('siswa')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '9px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: dashLogTab === 'siswa' ? '#ffffff' : 'transparent',
                  color: dashLogTab === 'siswa' ? '#4338ca' : '#64748b',
                  boxShadow: dashLogTab === 'siswa' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <GraduationCap size={15} />
                <span>Siswa ({siswaLogsToday.length})</span>
              </button>
            </div>
          </div>

          {currentTabLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
              <Clock size={42} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, margin: 0 }}>Belum ada presensi {dashLogTab === 'guru' ? 'Guru & Tendik' : 'Siswa'} yang dicatat hari ini.</p>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>Log akan muncul secara real-time saat QR Code di-scan pada Kiosk.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem', 
              maxHeight: currentTabLogs.length > 10 ? '600px' : 'none', 
              overflowY: currentTabLogs.length > 10 ? 'auto' : 'visible', 
              scrollBehavior: 'smooth',
              paddingRight: '0.35rem' 
            }}>
              {currentTabLogs.map(log => {
                const jMasuk = log.jamMasuk || log.jam_masuk || '';
                const jPulang = log.jamPulang || log.jam_pulang || '';
                const tType = log.targetType || log.target_type || 'Siswa';
                const tId = log.targetId || log.target_id;
                const hasPulang = Boolean(jPulang);

                // Find photo from state
                const userObj = tType === 'Siswa' 
                  ? (siswaList || []).find(s => s.id === tId)
                  : (guruTendikList || []).find(g => g.id === tId);
                const userFoto = log.foto || (userObj ? userObj.foto : null);

                return (
                  <div key={log.id} style={dashStyles.feedRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {userFoto ? (
                        <img 
                          src={userFoto} 
                          alt={log.nama || 'Avatar'}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            objectPosition: 'top center',
                            border: tType === 'Siswa' ? '2px solid #4338ca' : '2px solid #7e22ce',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: tType === 'Siswa' ? '#e0e7ff' : '#f3e8ff',
                          color: tType === 'Siswa' ? '#4338ca' : '#7e22ce',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          flexShrink: 0
                        }}>
                          {String(log.nama || '?').charAt(0)}
                        </div>
                      )}

                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{log.nama || 'Tidak Diketahui'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {tType} • {log.detailInfo || '-'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        {['Sakit', 'Izin', 'Alpa'].includes(log.status) ? (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, fontStyle: 'italic', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.keterangan}>
                            {log.keterangan || '-'}
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                              {jMasuk ? `${jMasuk} WIB` : '-'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: hasPulang ? '#059669' : '#94a3b8', fontWeight: hasPulang ? 700 : 500 }}>
                              {hasPulang ? `Pulang: ${jPulang} WIB` : 'Belum Pulang'}
                            </div>
                          </>
                        )}
                      </div>

                      {hasPulang ? (
                        <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                          HADIR (PULANG)
                        </span>
                      ) : (
                        <span className={`badge badge-${(log.status || 'hadir').toLowerCase()}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', textTransform: 'uppercase' }}>
                          {log.status || 'Hadir'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quick Navigation Cards */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Action 1: Data Master Link */}
          <div 
            className="card-modern" 
            onClick={() => setActiveMenu('data-guru')}
            style={dashStyles.actionBox}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1' }}>
                <UserCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Kelola Data Guru & Tendik</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{totalGuruTendik} Personel terdaftar</div>
              </div>
            </div>
            <ArrowUpRight size={18} color="#94a3b8" />
          </div>

          {/* Action 2: Data Siswa Link */}
          <div 
            className="card-modern" 
            onClick={() => setActiveMenu('data-siswa')}
            style={dashStyles.actionBox}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '12px', background: '#e0e7ff', color: '#4338ca' }}>
                <GraduationCap size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Kelola Data Siswa</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{totalSiswa} Siswa terdaftar</div>
              </div>
            </div>
            <ArrowUpRight size={18} color="#94a3b8" />
          </div>

          {/* Action 3: Rekap Presensi Siswa Link */}
          <div 
            className="card-modern" 
            onClick={() => setActiveMenu('rekap-siswa')}
            style={dashStyles.actionBox}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '12px', background: '#dcfce7', color: '#15803d' }}>
                <CalendarCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>Laporan Rekapitulasi Siswa</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Lihat rekap per kelas & cetak PDF</div>
              </div>
            </div>
            <ArrowUpRight size={18} color="#94a3b8" />
          </div>
        </div>
      </div>

      {/* Grafik Presensi per Minggu (Guru, Tendik & Siswa) */}
      <WeeklyAttendanceChart 
        presensiLogs={presensiLogs}
        totalGuruTendik={totalGuruTendik}
        totalSiswa={totalSiswa}
      />
    </div>
  );
};

// Component Grafik Analytics Presensi Mingguan
const WeeklyAttendanceChart = ({ presensiLogs }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [hoveredDay, setHoveredDay] = useState(null);

  // Compute current week days (Senin - Minggu)
  const getWeeklyData = () => {
    const days = [];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMon = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(diffToMon + i);
      const dateStr = getTodayDateString(d);
      const dayName = dayNames[d.getDay()];
      const isToday = dateStr === getTodayDateString();

      // Filter logs for this date
      const logsThisDay = (presensiLogs || []).filter(l => {
        if (!l.tanggal) return false;
        return formatLocalDateString(l.tanggal) === dateStr;
      });

      const guruLogs = logsThisDay.filter(l => (l.targetType || l.target_type) === 'Guru' || (l.targetType || l.target_type) === 'Tendik');
      const siswaLogs = logsThisDay.filter(l => (l.targetType || l.target_type) === 'Siswa');
      const totalHadir = logsThisDay.filter(l => (l.status || '').includes('Hadir')).length;
      const totalScanned = logsThisDay.length;
      const punctuality = totalScanned > 0 ? Math.round((totalHadir / totalScanned) * 100) : 100;

      days.push({
        dateStr,
        dayName,
        shortDay: dayName.substring(0, 3),
        isToday,
        guruCount: guruLogs.length,
        siswaCount: siswaLogs.length,
        totalCount: totalScanned,
        punctuality
      });
    }
    return days;
  };

  const weeklyData = getWeeklyData();
  const maxVal = Math.max(10, ...weeklyData.map(d => Math.max(d.guruCount, d.siswaCount)));

  return (
    <div className="card-modern" style={{ padding: '1.75rem', marginTop: '1.75rem' }}>
      {/* Header & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca' }}>
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Grafik Presensi per Minggu</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>
            Perbandingan kehadiran Guru/Tendik dan Siswa dari Senin hingga Minggu
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7e22ce' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, #7e22ce, #a855f7)' }} />
              <span>Guru & Tendik</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4338ca' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'linear-gradient(135deg, #4338ca, #6366f1)' }} />
              <span>Siswa</span>
            </div>
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px', gap: '0.2rem' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeFilter === 'all' ? '#ffffff' : 'transparent',
                color: activeFilter === 'all' ? '#0f172a' : '#64748b',
                boxShadow: activeFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('guru')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeFilter === 'guru' ? '#ffffff' : 'transparent',
                color: activeFilter === 'guru' ? '#7e22ce' : '#64748b',
                boxShadow: activeFilter === 'guru' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Guru & Tendik
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('siswa')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeFilter === 'siswa' ? '#ffffff' : 'transparent',
                color: activeFilter === 'siswa' ? '#4338ca' : '#64748b',
                boxShadow: activeFilter === 'siswa' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Siswa
            </button>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart Layout */}
      <div style={{ position: 'relative', width: '100%', height: '240px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem 1rem 0.5rem' }}>
        {/* Horizontal Grid Lines */}
        <div style={{ position: 'absolute', top: '1.5rem', bottom: '2.5rem', left: '3rem', right: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
          {[100, 75, 50, 25, 0].map(val => (
            <div key={val} style={{ borderBottom: '1px dashed #e2e8f0', width: '100%', height: 0, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '-2.5rem', top: '-7px', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                {Math.round((val / 100) * maxVal)}
              </span>
            </div>
          ))}
        </div>

        {/* Bars Grid */}
        <div style={{ position: 'absolute', top: '1.5rem', bottom: '2.5rem', left: '3rem', right: '1rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
          {weeklyData.map((item, idx) => {
            const hGuruPercent = (item.guruCount / maxVal) * 100;
            const hSiswaPercent = (item.siswaCount / maxVal) * 100;

            return (
              <div 
                key={idx}
                onMouseEnter={() => setHoveredDay(item)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '6px',
                  position: 'relative',
                  padding: '0 0.5rem',
                  cursor: 'pointer'
                }}
              >
                {/* Tooltip on Hover */}
                {hoveredDay && hoveredDay.dateStr === item.dateStr && (
                  <div style={{
                    position: 'absolute',
                    bottom: '108%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.74rem',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                    zIndex: 30,
                    pointerEvents: 'none'
                  }}>
                    <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '0.2rem' }}>{item.dayName} ({item.dateStr})</div>
                    <div>🟣 Guru/Tendik: <strong>{item.guruCount}</strong> Hadir</div>
                    <div>🔵 Siswa: <strong>{item.siswaCount}</strong> Hadir</div>
                    <div>⚡ Ketepatan Waktu: <strong>{item.punctuality}%</strong></div>
                  </div>
                )}

                {/* Guru & Tendik Bar */}
                {(activeFilter === 'all' || activeFilter === 'guru') && (
                  <div style={{
                    width: activeFilter === 'all' ? '20px' : '36px',
                    height: `${Math.max(4, hGuruPercent)}%`,
                    background: 'linear-gradient(180deg, #a855f7 0%, #7e22ce 100%)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 6px rgba(126, 34, 204, 0.2)',
                    position: 'relative'
                  }}>
                    {item.guruCount > 0 && (
                      <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.68rem', fontWeight: 800, color: '#7e22ce' }}>
                        {item.guruCount}
                      </span>
                    )}
                  </div>
                )}

                {/* Siswa Bar */}
                {(activeFilter === 'all' || activeFilter === 'siswa') && (
                  <div style={{
                    width: activeFilter === 'all' ? '20px' : '36px',
                    height: `${Math.max(4, hSiswaPercent)}%`,
                    background: 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 6px rgba(67, 56, 202, 0.2)',
                    position: 'relative'
                  }}>
                    {item.siswaCount > 0 && (
                      <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.68rem', fontWeight: 800, color: '#4338ca' }}>
                        {item.siswaCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Day Labels at Bottom */}
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '3rem', right: '1rem', display: 'flex', justifyContent: 'space-around' }}>
          {weeklyData.map((item, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: item.isToday ? 800 : 600,
                color: item.isToday ? '#4338ca' : '#64748b',
                padding: item.isToday ? '0.2rem 0.6rem' : '0',
                background: item.isToday ? '#e0e7ff' : 'transparent',
                borderRadius: '8px'
              }}>
                {item.dayName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const dashStyles = {
  banner: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    borderRadius: '16px',
    padding: '2rem',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.75rem',
    boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
    flexWrap: 'wrap',
    gap: '1.5rem',
    border: 'none'
  },
  bannerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: 700,
    marginBottom: '0.75rem'
  },
  bannerTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.01em',
    color: '#ffffff'
  },
  bannerText: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: '0.4rem',
    maxWidth: '650px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.75rem'
  },
  statCard: {
    padding: '1.25rem 1.5rem'
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#0f172a',
    marginTop: '0.5rem'
  },
  statSubGrid: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    marginTop: '1rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #f1f5f9'
  },
  mainGrid: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap'
  },
  feedRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9'
  },
  actionBox: {
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};
