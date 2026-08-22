import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Calendar, QrCode, Sparkles } from 'lucide-react';

export const Header = () => {
  const { getTapelAktif, semesterAktif, setActiveMenu, activeMenu, profilSekolah } = useApp();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getPageTitle = () => {
    switch (activeMenu) {
      case 'dashboard': return 'Dashboard Utama';
      case 'profil-sekolah': return 'Profil Sekolah';
      case 'data-guru': return 'Data Master Guru (Tenaga Pengajar)';
      case 'data-tendik': return 'Data Master Tenaga Kependidikan (Tendik)';
      case 'tugas-gtk': return 'Manajemen Tugas Tambahan GTK';
      case 'data-siswa': return 'Data Master Siswa';
      case 'cetak-kartu': return 'Cetak Kartu Presensi Massal';
      case 'akademik': return 'Manajemen Akademik (Tapel & Semester)';
      case 'scan-qr': return 'Scan QR Code Presensi Realtime';
      case 'pengaturan-presensi': return 'Pengaturan Presensi Sekolah';
      case 'rekap-guru': return 'Rekapitulasi Presensi Guru & Tendik';
      case 'rekap-siswa': return 'Rekapitulasi Presensi Siswa';
      default: return 'Sistem E-Presensi';
    }
  };

  const schoolName = profilSekolah?.namaSekolah || profilSekolah?.nama_sekolah;

  return (
    <header className="app-header no-print" style={headerStyles.header}>
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 style={headerStyles.title}>{getPageTitle()}</h2>
        <div style={headerStyles.breadcrumb}>
          <Sparkles size={14} color="#6366f1" />
          <span>Sistem Informasi Presensi Digital {schoolName ? `• ${schoolName}` : 'Sekolah'}</span>
        </div>
      </div>

      {/* Info Widget & Quick Action */}
      <div style={headerStyles.rightSection}>
        {/* Akademik Badge */}
        <div style={headerStyles.infoBadge}>
          <Calendar size={16} color="#4f46e5" />
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>AKADEMIK AKTIF</div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>
              TP {getTapelAktif()} • Semester {semesterAktif}
            </div>
          </div>
        </div>

        {/* Realtime Clock Widget */}
        <div style={headerStyles.clockBadge}>
          <Clock size={18} color="#10b981" />
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>{formatDate(time)}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
              {formatTime(time)} WIB
            </div>
          </div>
        </div>

        {/* Quick Scan Button */}
        {activeMenu !== 'scan-qr' && (
          <button 
            onClick={() => setActiveMenu('scan-qr')}
            className="btn btn-primary"
            style={{ borderRadius: '12px', padding: '0.625rem 1rem' }}
          >
            <QrCode size={18} />
            <span>Kamera Scan QR</span>
          </button>
        )}
      </div>
    </header>
  );
};

const headerStyles = {
  header: {
    minHeight: '76px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    padding: '1rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 90,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.78rem',
    color: '#64748b',
    marginTop: '0.15rem'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  infoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    backgroundColor: '#f1f5f9',
    padding: '0.5rem 0.85rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  clockBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    backgroundColor: '#ecfdf5',
    padding: '0.5rem 0.85rem',
    borderRadius: '10px',
    border: '1px solid #a7f3d0'
  }
};
