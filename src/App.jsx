import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataGuruPage } from './pages/DataGuruPage';
import { DataSiswaPage } from './pages/DataSiswaPage';
import { AkademikPage } from './pages/AkademikPage';
import { ScanQRPage } from './pages/ScanQRPage';
import { PengaturanPage } from './pages/PengaturanPage';
import { BackupUmumPage } from './pages/BackupUmumPage';
import { RekapGuruPage } from './pages/RekapGuruPage';
import { RekapSiswaPage } from './pages/RekapSiswaPage';
import { CetakKartuPage } from './pages/CetakKartuPage';
import { KelolaPresensiPage } from './pages/KelolaPresensiPage';
import { VerifyCardPage } from './pages/VerifyCardPage';
import { ProfilSekolahPage } from './pages/ProfilSekolahPage';
import { TugasGTKPage } from './pages/TugasGTKPage';
import { TugasSiswaPage } from './pages/TugasSiswaPage';

const AppContent = () => {
  const { activeMenu } = useApp();
  const { user, isLoading } = useAuth();
  const [verifyId, setVerifyId] = useState(null);

  useEffect(() => {
    const checkVerifyUrl = () => {
      const pathname = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;

      if (pathname.includes('/verify/')) {
        setVerifyId(pathname.split('/verify/')[1]);
      } else if (pathname.includes('/card/')) {
        setVerifyId(pathname.split('/card/')[1]);
      } else if (search.includes('verify=')) {
        const match = search.match(/verify=([^&]+)/);
        if (match) setVerifyId(match[1]);
      } else if (hash.includes('/verify/')) {
        setVerifyId(hash.split('/verify/')[1]);
      } else {
        setVerifyId(null);
      }
    };

    checkVerifyUrl();
    window.addEventListener('popstate', checkVerifyUrl);
    return () => window.removeEventListener('popstate', checkVerifyUrl);
  }, []);

  if (verifyId) {
    return (
      <VerifyCardPage 
        cardId={verifyId} 
        onBackToApp={() => {
          window.history.pushState({}, '', '/');
          setVerifyId(null);
        }} 
      />
    );
  }

  // If app is still verifying token, show loading (optional, AuthContext handles it mostly)
  if (isLoading) return null;

  // Route Guard: If not logged in, show Login Page
  if (!user) {
    return (
      <>
        <LoginPage />
        <Toast />
      </>
    );
  }

  const renderCurrentPage = () => {
    // If not admin, restrict to Profile & Riwayat (using existing pages or creating simple ones)
    // We'll adjust this once we create ProfilePage and RiwayatPage, for now, restrict views.
    if (user.role !== 'admin') {
      if (activeMenu === 'dashboard') return <DashboardPage />;
      // Fallback
      return <DashboardPage />;
    }

    switch (activeMenu) {
      case 'dashboard':
        return <DashboardPage />;
      case 'profil-sekolah':
        return <ProfilSekolahPage />;
      case 'data-guru':
        return <DataGuruPage />;
      case 'data-tendik':
        return <DataGuruPage />;
      case 'tugas-gtk':
        return <TugasGTKPage />;
      case 'gtk-nonaktif':
        return <DataGuruPage isNonAktifView={true} />;
      case 'data-siswa':
        return <DataSiswaPage />;
      case 'tugas-siswa':
        return <TugasSiswaPage />;
      case 'siswa-nonaktif':
        return <DataSiswaPage isNonAktifView={true} />;
      case 'cetak-kartu':
      case 'cetak-kartu-gtk':
        return <CetakKartuPage initialSelectedType="guru" />;
      case 'cetak-kartu-siswa':
        return <CetakKartuPage initialSelectedType="siswa" />;
      case 'akademik':
        return <AkademikPage />;
      case 'rombel':
        return <AkademikPage isRombelOnly={true} />;
      case 'scan-qr':
        return <ScanQRPage />;
      case 'pengaturan-presensi':
        return <PengaturanPage />;
      case 'pengaturan-backup':
        return <BackupUmumPage />;
      case 'rekap-guru':
        return <RekapGuruPage />;
      case 'rekap-siswa':
        return <RekapSiswaPage />;
      case 'kelola-presensi':
        return <KelolaPresensiPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main style={{ flex: 1 }}>
          {renderCurrentPage()}
        </main>
      </div>
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
