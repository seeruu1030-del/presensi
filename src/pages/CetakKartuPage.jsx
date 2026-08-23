import React, { useState } from 'react';
import { useApp, CARD_BG_PRESETS } from '../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, CreditCard, School, Filter, Users, UserCheck, Palette, Upload, RotateCcw, Sparkles, Check, X, Layers } from 'lucide-react';

export const CetakKartuPage = ({ initialSelectedType = 'siswa', initialSelectedIds = [] }) => {
  const { 
    guruTendikList, 
    siswaList, 
    kelasList, 
    bgCardGuru, 
    setBgCardGuru, 
    bgCardSiswa, 
    setBgCardSiswa,
    profilSekolah,
    showToast,
    getTapelAktif,
    semesterAktif,
    getSiswaActiveRombel
  } = useApp();

  const tapelAktif = getTapelAktif();
  const kelasAktifList = kelasList.filter(kls => {
    const klsTapel = kls.tapel || '';
    const klsSem = kls.semester || semesterAktif || 'Ganjil';
    return klsTapel === tapelAktif && klsSem === (semesterAktif || 'Ganjil');
  });
  const kelasFilterList = kelasAktifList.length > 0 ? kelasAktifList : kelasList;

  const [activeTab, setActiveTab] = useState(initialSelectedType); // 'guru' | 'siswa'
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');
  
  // Sync tab with route parameter if changed
  React.useEffect(() => {
    setActiveTab(initialSelectedType);
  }, [initialSelectedType]);

  // Theme Background Modal State
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeModalTab, setThemeModalTab] = useState(initialSelectedType); // 'guru' | 'siswa'
  const [customInputBg, setCustomInputBg] = useState('');

  // Helper: ambil nama kelas dari siswa sesuai active tapel & semester
  const getKelasNama = (s) => {
    if (getSiswaActiveRombel) {
      const activeRombel = getSiswaActiveRombel(s, tapelAktif, semesterAktif, kelasList);
      if (activeRombel) return activeRombel;
    }
    if (s.kelas && typeof s.kelas === 'object') return s.kelas.nama || '';
    return String(s.kelas || '');
  };

  // Helper: hitung jumlah siswa aktif per kelas
  const countSiswaInKelas = (klsNama) => {
    return (siswaList || []).filter(s => getKelasNama(s) === klsNama).length;
  };

  // Helper: tampilkan nama Wali Kelas
  const getWaliKelasDisplay = (kls) => {
    if (!kls || !kls.wali_kelas) return 'Belum Diatur';
    const found = (guruTendikList || []).find(g => 
      g.id === kls.wali_kelas || 
      g.nama === kls.wali_kelas ||
      g.nama.toLowerCase() === String(kls.wali_kelas).toLowerCase()
    );
    return found ? found.nama : kls.wali_kelas;
  };

  // GTK Counts
  const guruCount = (guruTendikList || []).filter(g => (g.kategori || 'Guru') === 'Guru').length;
  const tendikCount = (guruTendikList || []).filter(g => g.kategori === 'Tendik').length;
  const gtkTotal = (guruTendikList || []).length;

  // Current list based on active tab and filters (sorted alphabetically A-Z)
  const currentList = activeTab === 'guru'
    ? (guruTendikList || [])
        .filter(g => filterKategori === 'Semua' || (g.kategori || 'Guru') === filterKategori)
        .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { numeric: true, sensitivity: 'base' }))
    : (siswaList || [])
        .filter(s => filterKelas === 'Semua' || getKelasNama(s) === filterKelas)
        .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { numeric: true, sensitivity: 'base' }));

  const handlePrint = () => {
    window.print();
  };

  // Upload Custom Image Background Handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Ukuran berkas terlalu besar. Maksimal 3MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const bgValue = `url("${uploadEvent.target.result}") center/cover no-repeat`;
      if (themeModalTab === 'guru') {
        setBgCardGuru(bgValue);
        showToast('Background ID Card Guru & Staf diperbarui dengan gambar kustom!');
      } else {
        setBgCardSiswa(bgValue);
        showToast('Background Kartu Pelajar Siswa diperbarui dengan gambar kustom!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply Custom Color / Gradient / URL Text
  const handleApplyCustomInput = () => {
    if (!customInputBg.trim()) return;
    let bgVal = customInputBg.trim();
    if (bgVal.startsWith('http://') || bgVal.startsWith('https://')) {
      bgVal = `url("${bgVal}") center/cover no-repeat`;
    }
    if (themeModalTab === 'guru') {
      setBgCardGuru(bgVal);
      showToast('Background ID Card Guru berhasil diperbarui!');
    } else {
      setBgCardSiswa(bgVal);
      showToast('Background Kartu Siswa berhasil diperbarui!');
    }
    setCustomInputBg('');
  };

  // Reset to Default
  const handleResetDefault = () => {
    if (themeModalTab === 'guru') {
      setBgCardGuru('linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)');
      showToast('Background Guru dikembalikan ke warna standar Midnight.');
    } else {
      setBgCardSiswa('linear-gradient(135deg, #064e3b 0%, #047857 60%, #10b981 100%)');
      showToast('Background Siswa dikembalikan ke warna standar Emerald.');
    }
  };

  // Cards to render (all filtered items in active tab/class)
  const selectedCardsData = currentList;

  const isGuruTab = activeTab === 'guru';
  const pageTitle = isGuruTab ? 'Cetak ID Card GTK' : 'Cetak Kartu Pelajar Peserta Didik';
  const pageSubtitle = isGuruTab 
    ? 'Pilih kategori Guru & Tenaga Kependidikan untuk dicetak ID Card dengan QR Code dalam lembar kertas A4'
    : 'Pilih rombel/kelas untuk mencetak kartu pelajar peserta didik dalam lembar kertas A4';

  return (
    <div className="page-container">
      {/* Header Actions */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">
            <CreditCard color="#4f46e5" size={28} /> {pageTitle}
          </h1>
          <p className="page-subtitle">{pageSubtitle}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Button Theme Background Picker */}
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setThemeModalTab(activeTab);
              setShowThemeModal(true);
            }}
            style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #cbd5e1' }}
          >
            <Palette size={18} color="#4f46e5" />
            <span>Ganti Background Kartu</span>
          </button>

          <button 
            className="btn btn-primary" 
            onClick={handlePrint}
            disabled={selectedCardsData.length === 0}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}
          >
            <Printer size={18} />
            <span>Cetak {selectedCardsData.length} Kartu</span>
          </button>
        </div>
      </div>

      {/* Tab Selection Bar */}
      <div className="card-modern no-print" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Sub Filter Controls for GTK */}
          {isGuruTab && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${filterKategori === 'Semua' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterKategori('Semua')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderRadius: '8px' }}
              >
                Semua GTK ({gtkTotal})
              </button>
              <button
                type="button"
                className={`btn ${filterKategori === 'Guru' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterKategori('Guru')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderRadius: '8px', gap: '0.35rem' }}
              >
                <UserCheck size={15} /> Guru ({guruCount})
              </button>
              <button
                type="button"
                className={`btn ${filterKategori === 'Tendik' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterKategori('Tendik')}
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', borderRadius: '8px', gap: '0.35rem' }}
              >
                <Users size={15} /> Tendik ({tendikCount})
              </button>
            </div>
          )}

          {/* Sub Filter Controls for Peserta Didik */}
          {!isGuruTab && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Filter size={18} color="#4f46e5" />
              <select 
                className="form-control"
                style={{ width: '220px', fontSize: '0.85rem' }}
                value={filterKelas}
                onChange={e => setFilterKelas(e.target.value)}
              >
                <option value="Semua">-- Semua Kelas --</option>
                {kelasFilterList.map(kls => (
                  <option key={kls.id} value={kls.nama}>Kelas {kls.nama}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Class List Table for Peserta Didik */}
      {!isGuruTab && (
        <div className="card-modern no-print" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <School size={20} color="#059669" /> Daftar Rombongan Belajar (Kelas)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                Pilih nama kelas pada tabel di bawah untuk menampilkan preview kartu pelajar per kelas (TP {tapelAktif} • Semester {semesterAktif}).
              </p>
            </div>

            {filterKelas !== 'Semua' && (
              <button 
                className="btn btn-secondary"
                onClick={() => setFilterKelas('Semua')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Tampilkan Semua Kelas ({siswaList.length} Siswa)
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table-modern" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                  <th>Kelas (Rombel)</th>
                  <th>Wali Kelas</th>
                  <th style={{ textAlign: 'center' }}>Jumlah Siswa</th>
                </tr>
              </thead>
              <tbody>
                {kelasFilterList.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Belum ada data kelas untuk TP {tapelAktif} ({semesterAktif}).
                    </td>
                  </tr>
                ) : (
                  kelasFilterList.map((kls, idx) => {
                    const sCount = countSiswaInKelas(kls.nama);
                    const isCurrentFilter = filterKelas === kls.nama;

                    return (
                      <tr key={kls.id} style={{ background: isCurrentFilter ? '#ecfdf5' : 'transparent' }}>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                        <td>
                          <button 
                            type="button"
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                            onClick={() => setFilterKelas(kls.nama)}
                          >
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Layers size={14} /> Kelas {kls.nama}
                            </span>
                          </button>
                        </td>
                        <td style={{ fontWeight: 600, color: '#334155' }}>
                          {getWaliKelasDisplay(kls)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.65rem', borderRadius: '12px', fontWeight: 700 }}>
                            {sCount} Siswa
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Area Container */}
      <div className="printable-area">
        {/* Active Selection Title Header in Normal View */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem', background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard color={isGuruTab ? '#4f46e5' : '#059669'} size={20} />
            {isGuruTab 
              ? `Preview ID Card GTK - ${filterKategori === 'Semua' ? 'Semua Guru & Tendik' : filterKategori} (${selectedCardsData.length} Kartu)`
              : `Preview Kartu Pelajar - ${filterKelas === 'Semua' ? 'Semua Kelas' : `Kelas ${filterKelas}`} (${selectedCardsData.length} Kartu)`
            }
          </h3>

          {!isGuruTab && (
            <button 
              className="btn btn-success" 
              onClick={handlePrint}
              disabled={selectedCardsData.length === 0}
              style={{ background: '#059669', borderColor: '#059669', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: 700, gap: '0.4rem' }}
            >
              <Printer size={16} />
              <span>Cetak {selectedCardsData.length} Kartu {filterKelas !== 'Semua' ? `Kelas ${filterKelas}` : ''}</span>
            </button>
          )}
        </div>

        {/* Selected Cards Grid */}
        {selectedCardsData.length === 0 ? (
          <div className="card-modern no-print" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
            <CreditCard size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p>Tidak ada kartu yang sesuai filter.</p>
            <p style={{ fontSize: '0.8rem' }}>Silakan pilih kelas/kategori di atas.</p>
          </div>
        ) : (
          <div className="mass-print-grid">
            {selectedCardsData.map(item => {
              const isGuru = activeTab === 'guru';
              const cardBg = isGuru ? bgCardGuru : bgCardSiswa;
              return (
                <div 
                  key={item.id}
                  className="mass-card-item"
                  style={{
                    width: '5.5cm',
                    height: '8.5cm',
                    borderRadius: '12px',
                    background: cardBg,
                    color: 'white',
                    padding: '0.5cm 0.35cm',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                  }}
                >
                  {/* Watermark circle */}
                  <div style={{
                    position: 'absolute',
                    right: '-30px',
                    top: '-30px',
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    pointerEvents: 'none'
                  }} />

                  {/* Circular Profile Photo Avatar */}
                  <div style={{ position: 'relative', marginBottom: '0.45cm' }}>
                    {item.foto ? (
                      <img 
                        src={item.foto} 
                        alt={item.nama} 
                        style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          objectPosition: 'top center',
                          border: '3px solid rgba(255,255,255,0.95)',
                          boxShadow: '0 6px 14px rgba(0,0,0,0.3)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        border: '3px solid rgba(255,255,255,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'white'
                      }}>
                        {item.nama ? item.nama.charAt(0) : '?'}
                      </div>
                    )}
                  </div>

                  {/* Body Info: Identity & QR Code */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2cm', width: '100%' }}>
                    {/* Information */}
                    <div style={{ width: '100%', padding: '0 0.1cm', color: '#0f172a' }}>
                      <h4 style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: '800', 
                        margin: 0, 
                        whiteSpace: 'normal', 
                        wordBreak: 'break-word', 
                        lineHeight: '1.2' 
                      }}>
                        {item.nama}
                      </h4>
                      <div style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.04em', marginTop: '0.08rem' }}>
                        {isGuru ? ((item.nip && item.nip.trim()) || (item.nuptk && item.nuptk.trim()) || (item.nik && item.nik.trim()) || '-') : (item.nisn || '-')}
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div style={{ 
                      background: 'white', 
                      padding: '0.25rem', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                      marginTop: '0.1cm'
                    }}>
                      <QRCodeSVG 
                        value={`${window.location.origin}/verify/${item.qr_code || item.id}`} 
                        size={86}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Theme Background Customizer Modal */}
      {showThemeModal && (
        <div className="modal-overlay" onClick={() => setShowThemeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Palette size={20} color="#4f46e5" />
                <h3 className="modal-title">Desain & Background ID Card</h3>
              </div>
              <button className="btn-icon" onClick={() => setShowThemeModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Target Tab Selection */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
                <button
                  className={`btn ${themeModalTab === 'guru' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setThemeModalTab('guru')}
                  style={{ flex: 1, border: 'none', borderRadius: '8px' }}
                >
                  <CreditCard size={15} /> Background Guru & Staf
                </button>
                <button
                  className={`btn ${themeModalTab === 'siswa' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setThemeModalTab('siswa')}
                  style={{ flex: 1, border: 'none', borderRadius: '8px' }}
                >
                  <Users size={15} /> Background Siswa
                </button>
              </div>

              {/* Active Theme Preview Badge */}
              <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: '12px', background: themeModalTab === 'guru' ? bgCardGuru : bgCardSiswa, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Tampilan Background Aktif</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{themeModalTab === 'guru' ? 'Kartu Guru & Tendik' : 'Kartu Pelajar Siswa'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
                  Active Preview
                </div>
              </div>

              {/* Preset Theme Swatches */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                  <Sparkles size={16} color="#4f46e5" />
                  <span>Pilihan Tema Warna Gradient (Presets):</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {CARD_BG_PRESETS.map(preset => {
                    const activeGrad = themeModalTab === 'guru' ? preset.guruGradient : preset.siswaGradient;
                    const currentBg = themeModalTab === 'guru' ? bgCardGuru : bgCardSiswa;
                    const isSelected = currentBg === activeGrad;

                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          if (themeModalTab === 'guru') {
                            setBgCardGuru(preset.guruGradient);
                            showToast(`Tema ${preset.label} diterapkan ke Kartu Guru.`);
                          } else {
                            setBgCardSiswa(preset.siswaGradient);
                            showToast(`Tema ${preset.label} diterapkan ke Kartu Siswa.`);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                          background: '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: activeGrad, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          {isSelected && <Check size={16} />}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#1e1b4b' : '#475569' }}>
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Custom Image Background */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                  <Upload size={16} color="#4f46e5" />
                  <span>Unggah Gambar Background Kustom:</span>
                </label>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  Unggah berkas foto/gambar pola sekolah (.png, .jpg, max 3MB) untuk dijadikan latar kartu.
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="form-control"
                  style={{ background: 'white' }}
                />
              </div>

              {/* Custom CSS Color / Gradient String */}
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Warna Solid / Kode CSS Gradient Kustom:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Contoh: #1e3a8a atau linear-gradient(to right, #1e3a8a, #3b82f6)"
                    value={customInputBg}
                    onChange={e => setCustomInputBg(e.target.value)}
                  />
                  <button className="btn btn-secondary" onClick={handleApplyCustomInput}>
                    Terapkan
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={handleResetDefault}>
                <RotateCcw size={15} />
                <span>Reset Default</span>
              </button>

              <button className="btn btn-primary" onClick={() => setShowThemeModal(false)}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
