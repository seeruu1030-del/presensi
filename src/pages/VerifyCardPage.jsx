import React from 'react';
import { useApp } from '../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, 
  User, 
  FileText, 
  MapPin, 
  GraduationCap, 
  CheckCircle2, 
  School, 
  Calendar,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

export const VerifyCardPage = ({ cardId, onBackToApp }) => {
  const { guruTendikList, siswaList } = useApp();

  // Clean cardId from URL if passed as full string
  let cleanId = cardId ? String(cardId).trim() : '';
  if (cleanId.includes('/verify/')) {
    cleanId = cleanId.split('/verify/').pop();
  } else if (cleanId.includes('verify=')) {
    cleanId = cleanId.split('verify=').pop();
  }
  cleanId = cleanId.split('?')[0].split('#')[0].replace(/\/$/, '');

  // Search in Siswa & Guru
  const foundSiswa = siswaList.find(s => s.qrCode.toLowerCase() === cleanId.toLowerCase() || s.nisn === cleanId || s.id === cleanId);
  const foundGuru = guruTendikList.find(g => g.qrCode.toLowerCase() === cleanId.toLowerCase() || g.nip === cleanId || g.nuptk === cleanId || g.id === cleanId);

  const targetData = foundSiswa || foundGuru;
  const isSiswa = Boolean(foundSiswa);

  if (!targetData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: 'white'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '2.5rem 2rem',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <AlertTriangle size={36} color="#ef4444" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            ID Card Tidak Ditemukan
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Kode QR <strong>"{cleanId}"</strong> tidak terdaftar dalam database E-Presensi Sekolah.
          </p>

          {onBackToApp && (
            <button 
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1.5rem', borderRadius: '12px' }}
              onClick={onBackToApp}
            >
              <ArrowLeft size={18} />
              <span>Buka Aplikasi E-Presensi</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem 1rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: 'white'
    }}>
      {/* Container Card Verification */}
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>

        {/* Header Branding */}
        <div style={{
          background: isSiswa ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' : 'linear-gradient(135deg, #312e81 0%, #4338ca 100%)',
          padding: '1.5rem 1.25rem',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <School size={20} color="#ffffff" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>
              SISTEM E-PRESENSI SEKOLAH
            </span>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(4px)',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            marginTop: '0.2rem'
          }}>
            <ShieldCheck size={16} color="#4ade80" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              KARTU DIGITAL TERVERIFIKASI
            </span>
          </div>
        </div>

        {/* Profile Body */}
        <div style={{ padding: '1.75rem 1.5rem' }}>
          
          {/* Avatar Photo Circle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-3.2rem', marginBottom: '1.25rem' }}>
            {targetData.foto ? (
              <img 
                src={targetData.foto} 
                alt={targetData.nama} 
                style={{
                  width: '94px',
                  height: '94px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  border: '4px solid #ffffff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                }}
              />
            ) : (
              <div style={{
                width: '94px',
                height: '94px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                border: '4px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem',
                fontWeight: 800,
                color: 'white',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}>
                {targetData.nama ? targetData.nama.charAt(0) : '?'}
              </div>
            )}
          </div>

          {/* Name & Role Tag */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: isSiswa ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)',
              color: isSiswa ? '#6ee7b7' : '#c084fc',
              border: `1px solid ${isSiswa ? 'rgba(16, 185, 129, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
              padding: '0.25rem 0.75rem',
              borderRadius: '12px'
            }}>
              {isSiswa ? 'KARTU PELAJAR SISWA' : `ID CARD GURU & STAF (${targetData.kategori || 'GURU'})`}
            </span>

            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0.6rem 0 0.2rem', color: '#ffffff' }}>
              {targetData.nama}
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>
              {isSiswa ? `Siswa Aktif Kelas ${targetData.kelas}` : (targetData.jabatan || 'Guru Mata Pelajaran')}
            </p>
          </div>

          {/* Details Table Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} /> RINCIAN IDENTITAS RESMI
            </div>

            {/* Field 1: Nama */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Nama Lengkap:</span>
              <strong style={{ color: '#f8fafc', fontWeight: 700 }}>{targetData.nama}</strong>
            </div>

            {/* Field 2: NISN (Siswa) or NUPTK/NIP (Guru) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                {isSiswa ? 'NISN:' : 'NUPTK / NIP:'}
              </span>
              <strong style={{ color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700 }}>
                {isSiswa 
                  ? (targetData.nisn || '-') 
                  : ((targetData.nuptk && targetData.nuptk.trim()) || (targetData.nip && targetData.nip.trim()) || (targetData.nik && targetData.nik.trim()) || '-')}
              </strong>
            </div>

            {/* Field 3: Jenis Kelamin */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>Jenis Kelamin:</span>
              <strong style={{ color: '#f8fafc', fontWeight: 700 }}>
                {targetData.gender === 'L' || targetData.gender === 'Laki-Laki' ? 'Laki-Laki' : 'Perempuan'}
              </strong>
            </div>

            {/* Field 4: Kelas (For Siswa only) */}
            {isSiswa && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Kelas:</span>
                <strong style={{ color: '#f8fafc', fontWeight: 700 }}>{targetData.kelas || '-'}</strong>
              </div>
            )}

            {/* Field 5: Alamat */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', paddingTop: '0.2rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} color="#38bdf8" /> Alamat Tempat Tinggal:
              </span>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.6rem 0.85rem',
                borderRadius: '10px',
                color: '#e2e8f0',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                fontWeight: 500
              }}>
                {targetData.alamat || 'Jl. Merbabu No. 12, RT 01/RW 03'}
              </div>
            </div>
          </div>

          {/* QR Code Mirror Verification */}
          <div style={{
            marginTop: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '0.85rem 1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={14} /> Status Kartu Aktif
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                ID: {targetData.qrCode || targetData.id}
              </div>
            </div>

            <div style={{ background: 'white', padding: '0.25rem', borderRadius: '8px', display: 'flex' }}>
              <QRCodeSVG 
                value={`${window.location.origin}/verify/${targetData.qrCode || targetData.id}`} 
                size={48} 
                level="L"
              />
            </div>
          </div>

          {/* Action Back Button */}
          {onBackToApp && (
            <button 
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
              onClick={onBackToApp}
            >
              <ArrowLeft size={18} />
              <span>Kembali ke Aplikasi Utama</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
