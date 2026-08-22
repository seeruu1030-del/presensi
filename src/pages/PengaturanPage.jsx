import React, { useState, useEffect } from 'react';
import { useApp, DEFAULT_JADWAL_HARIAN } from '../context/AppContext';
import { Settings, Clock, Volume2, Save, Calendar, Plus, Trash2, CalendarOff, CheckCircle2, XCircle, Search, ChevronLeft, ChevronRight, MessageCircle, LogOut, RefreshCw, Smartphone } from 'lucide-react';
import { showSuccessAlert, showErrorAlert } from '../utils/sweetalert';
import { api } from '../utils/api';

export const PengaturanPage = () => {
  const { pengaturan, savePengaturan, showToast } = useApp();

  const [formData, setFormData] = useState({
    jam_masuk: '07:00',
    jam_pulang: '15:00',
    toleransi_menit: 15,
    voice_notification: true,
    jadwal_harian: { ...DEFAULT_JADWAL_HARIAN },
    hari_libur: []
  });

  // Local state for adding new holiday date range, searching & pagination
  const [newLiburMulai, setNewLiburMulai] = useState('');
  const [newLiburSelesai, setNewLiburSelesai] = useState('');
  const [newLiburKet, setNewLiburKet] = useState('');
  const [liburSearch, setLiburSearch] = useState('');
  const [liburPage, setLiburPage] = useState(1);
  const LIBUR_PER_PAGE = 3;

  const [activeTab, setActiveTab] = useState('jadwal'); // State untuk tab

  // WhatsApp Integration State
  const [waStatus, setWaStatus] = useState('DISCONNECTED');
  const [waQrCode, setWaQrCode] = useState(null);
  const [isWaLoading, setIsWaLoading] = useState(false);

  const fetchWaStatus = async () => {
    try {
      const res = await api.getWhatsAppStatus();
      setWaStatus(res.status);
      setWaQrCode(res.qrDataURL);
    } catch(err) {
      console.log('Error fetching WA status', err);
    }
  };

  useEffect(() => {
    fetchWaStatus();
    const interval = setInterval(() => {
      if (waStatus !== 'CONNECTED') {
        fetchWaStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [waStatus]);

  const handleWaLogout = async () => {
    setIsWaLoading(true);
    try {
      await api.logoutWhatsApp();
      showSuccessAlert('Terputus', 'Perangkat WhatsApp berhasil diputuskan. Silakan scan ulang jika ingin menyambung.');
      fetchWaStatus();
    } catch(err) {
      showErrorAlert('Gagal Logout', 'Gagal memutuskan WhatsApp.');
    } finally {
      setIsWaLoading(false);
    }
  };

  const filteredHolidays = (formData.hari_libur || []).filter(item => {
    const q = liburSearch.toLowerCase().trim();
    if (!q) return true;
    const tM = item.tanggal_mulai || item.tanggalMulai || item.tanggal || '';
    const tS = item.tanggal_selesai || item.tanggalSelesai || tM;
    const dateRangeStr = `${tM} ${tS}`.toLowerCase();
    const ketStr = (item.keterangan || '').toLowerCase();
    return dateRangeStr.includes(q) || ketStr.includes(q);
  });

  const totalLiburPages = Math.ceil(filteredHolidays.length / LIBUR_PER_PAGE) || 1;
  const currentLiburPage = Math.min(liburPage, totalLiburPages);
  const startLiburIdx = (currentLiburPage - 1) * LIBUR_PER_PAGE;
  const paginatedHolidays = filteredHolidays.slice(startLiburIdx, startLiburIdx + LIBUR_PER_PAGE);

  // Sync state from context when loaded
  useEffect(() => {
    if (pengaturan) {
      setFormData({
        jam_masuk: pengaturan.jam_masuk || '07:00',
        jam_pulang: pengaturan.jam_pulang || '15:00',
        toleransi_menit: pengaturan.toleransi_menit ?? 15,
        voice_notification: pengaturan.voice_notification ?? true,
        hari_efektif_bulanan: pengaturan.hari_efektif_bulanan ?? 20,
        hari_efektif_semester: pengaturan.hari_efektif_semester ?? 110,
        jadwal_harian: pengaturan.jadwal_harian ? { ...DEFAULT_JADWAL_HARIAN, ...pengaturan.jadwal_harian } : { ...DEFAULT_JADWAL_HARIAN },
        hari_libur: Array.isArray(pengaturan.hari_libur) ? [...pengaturan.hari_libur] : [],
        wa_provider: pengaturan.wa_provider || 'Lokal',
        wa_domain: pengaturan.wa_domain || '',
        wa_token: pengaturan.wa_token || ''
      });
    }
  }, [pengaturan]);

  const handleJadwalChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      jadwal_harian: {
        ...prev.jadwal_harian,
        [day]: {
          ...prev.jadwal_harian[day],
          [field]: value
        }
      }
    }));
  };

  const handleApplyDefaultTimes = () => {
    const stdMasuk = formData.jam_masuk || '07:00';
    const stdPulang = formData.jam_pulang || '15:00';

    setFormData(prev => {
      const updated = { ...prev.jadwal_harian };
      Object.keys(updated).forEach(day => {
        if (updated[day].aktif) {
          updated[day] = {
            ...updated[day],
            jamMasuk: stdMasuk,
            jamPulang: stdPulang
          };
        }
      });
      return { ...prev, jadwal_harian: updated };
    });
    showToast('Jam standar diterapkan ke semua hari efektif yang aktif!');
  };

  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!newLiburMulai) {
      showErrorAlert('Form Belum Lengkap', 'Silakan pilih tanggal mulai libur terlebih dahulu.');
      return;
    }

    const tMulai = newLiburMulai;
    const tSelesai = newLiburSelesai || newLiburMulai;

    if (tSelesai < tMulai) {
      showErrorAlert('Tanggal Tidak Valid', 'Tanggal selesai libur tidak boleh lebih awal dari tanggal mulai.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      tanggal_mulai: tMulai,
      tanggal_selesai: tSelesai,
      tanggal: tMulai, // for backward compatibility
      keterangan: newLiburKet.trim() || 'Hari Libur Sekolah',
      aktif: true
    };

    setFormData(prev => ({
      ...prev,
      hari_libur: [...prev.hari_libur, newItem].sort((a, b) => {
        const aM = a.tanggal_mulai || a.tanggal || '';
        const bM = b.tanggal_mulai || b.tanggal || '';
        return aM.localeCompare(bM);
      })
    }));

    setNewLiburMulai('');
    setNewLiburSelesai('');
    setNewLiburKet('');
    showToast(`Berhasil menambah tanggal libur: ${tMulai} ${tMulai !== tSelesai ? `s.d ${tSelesai}` : ''}`);
  };

  const handleToggleHolidayStatus = (id) => {
    setFormData(prev => {
      const updated = prev.hari_libur.map(h => {
        const hId = h.id || h.tanggal;
        if (hId === id) {
          const currentAktif = h.aktif !== false;
          return { ...h, aktif: !currentAktif };
        }
        return h;
      });
      return { ...prev, hari_libur: updated };
    });
    showToast('Status libur diperbarui! Klik Simpan Pengaturan di bawah.');
  };

  const handleDeleteHoliday = (id) => {
    setFormData(prev => ({
      ...prev,
      hari_libur: prev.hari_libur.filter(h => h.id !== id && h.tanggal !== id)
    }));
    showToast('Hari libur berhasil dihapus dari daftar.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await savePengaturan(formData);
  };

  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Settings color="#4f46e5" size={28} /> Pengaturan Presensi Sekolah
          </h1>
          <p className="page-subtitle">Kelola jam masuk/pulang fleksibel per hari, hari efektif, hari libur sekolah, dan notifikasi scanner</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '2px' }}>
          <button type="button" onClick={() => setActiveTab('jadwal')} style={{ padding: '0.75rem 1.25rem', background: activeTab === 'jadwal' ? '#4f46e5' : 'transparent', color: activeTab === 'jadwal' ? 'white' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-4px', borderBottom: activeTab === 'jadwal' ? '3px solid #3730a3' : '3px solid transparent', whiteSpace: 'nowrap' }}>
            <Clock size={18} />
            Jadwal Harian
          </button>
          <button type="button" onClick={() => setActiveTab('libur')} style={{ padding: '0.75rem 1.25rem', background: activeTab === 'libur' ? '#e11d48' : 'transparent', color: activeTab === 'libur' ? 'white' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-4px', borderBottom: activeTab === 'libur' ? '3px solid #be123c' : '3px solid transparent', whiteSpace: 'nowrap' }}>
            <CalendarOff size={18} />
            Hari Libur
          </button>
          <button type="button" onClick={() => setActiveTab('audio')} style={{ padding: '0.75rem 1.25rem', background: activeTab === 'audio' ? '#4f46e5' : 'transparent', color: activeTab === 'audio' ? 'white' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-4px', borderBottom: activeTab === 'audio' ? '3px solid #3730a3' : '3px solid transparent', whiteSpace: 'nowrap' }}>
            <Volume2 size={18} />
            Notifikasi Audio
          </button>
          <button type="button" onClick={() => setActiveTab('wa')} style={{ padding: '0.75rem 1.25rem', background: activeTab === 'wa' ? '#166534' : 'transparent', color: activeTab === 'wa' ? 'white' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-4px', borderBottom: activeTab === 'wa' ? '3px solid #14532d' : '3px solid transparent', whiteSpace: 'nowrap' }}>
            <MessageCircle size={18} />
            WhatsApp
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Card 1: Hari Efektif & Waktu Masuk/Pulang Fleksibel per Hari */}
          {activeTab === 'jadwal' && (
          <div className="card-modern" style={{ padding: '1.75rem', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={22} color="#4f46e5" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Jadwal Hari Efektif & Waktu Fleksibel Harian</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                    Tentukan hari apa saja yang aktif presensi serta jam masuk/pulang khusus tiap hari (misal: Jumat pulang 14:00)
                  </p>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                onClick={handleApplyDefaultTimes}
                title="Terapkan Jam Masuk/Pulang Standar ke Semua Hari Aktif"
              >
                <span>Samakan ke Jam Standar</span>
              </button>
            </div>

            {/* Default Standard Time Row */}
            <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Jam Masuk Standar:</label>
                <input 
                  type="time" 
                  className="form-control"
                  style={{ width: '120px', padding: '0.35rem 0.6rem' }}
                  value={formData.jam_masuk}
                  onChange={e => setFormData({ ...formData, jam_masuk: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Jam Pulang Standar:</label>
                <input 
                  type="time" 
                  className="form-control"
                  style={{ width: '120px', padding: '0.35rem 0.6rem' }}
                  value={formData.jam_pulang}
                  onChange={e => setFormData({ ...formData, jam_pulang: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Toleransi Terlambat:</label>
                <input 
                  type="number" 
                  className="form-control"
                  style={{ width: '80px', padding: '0.35rem 0.6rem' }}
                  value={formData.toleransi_menit}
                  onChange={e => setFormData({ ...formData, toleransi_menit: e.target.value })}
                  min="0"
                  max="120"
                />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Menit</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Jumlah Hari Efektif / Semester:</label>
                <input 
                  type="number" 
                  className="form-control"
                  style={{ width: '90px', padding: '0.35rem 0.6rem' }}
                  value={formData.hari_efektif_semester ?? 110}
                  onChange={e => setFormData({ ...formData, hari_efektif_semester: parseInt(e.target.value, 10) || 0 })}
                  min="1"
                />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Hari</span>
              </div>
            </div>

            {/* Table Days Schedule */}
            <div className="table-responsive">
              <table className="table-modern" style={{ fontSize: '0.88rem' }}>
                <thead>
                  <tr>
                    <th>Hari</th>
                    <th>Status Presensi</th>
                    <th>Jam Masuk</th>
                    <th>Jam Pulang (Batas Awal Checkout)</th>
                    <th>Keterangan Info</th>
                  </tr>
                </thead>
                <tbody>
                  {daysOrder.map(day => {
                    const dayConfig = formData.jadwal_harian[day] || { aktif: false, jamMasuk: '07:00', jamPulang: '15:00' };
                    return (
                      <tr key={day} style={{ background: dayConfig.aktif ? 'white' : '#f8fafc', opacity: dayConfig.aktif ? 1 : 0.65 }}>
                        <td style={{ fontWeight: 800, color: dayConfig.aktif ? '#1e293b' : '#94a3b8', width: '120px' }}>
                          {day}
                        </td>
                        <td style={{ width: '180px' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700 }}>
                            <input 
                              type="checkbox" 
                              checked={dayConfig.aktif}
                              onChange={e => handleJadwalChange(day, 'aktif', e.target.checked)}
                              style={{ width: '18px', height: '18px', accentColor: '#4f46e5' }}
                            />
                            {dayConfig.aktif ? (
                              <span className="badge badge-hadir" style={{ fontSize: '0.78rem' }}>
                                <CheckCircle2 size={12} /> Hari Efektif
                              </span>
                            ) : (
                              <span className="badge badge-alpa" style={{ fontSize: '0.78rem' }}>
                                <XCircle size={12} /> Libur / Non-Efektif
                              </span>
                            )}
                          </label>
                        </td>
                        <td style={{ width: '150px' }}>
                          <input 
                            type="time" 
                            className="form-control"
                            value={dayConfig.jamMasuk || '07:00'}
                            disabled={!dayConfig.aktif}
                            onChange={e => handleJadwalChange(day, 'jamMasuk', e.target.value)}
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                          />
                        </td>
                        <td style={{ width: '180px' }}>
                          <input 
                            type="time" 
                            className="form-control"
                            value={dayConfig.jamPulang || '15:00'}
                            disabled={!dayConfig.aktif}
                            onChange={e => handleJadwalChange(day, 'jamPulang', e.target.value)}
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                          />
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {dayConfig.aktif ? (
                            <span>Scan masuk hingga <strong>{
                              (() => {
                                const [h, m] = (dayConfig.jamMasuk || '07:00').split(':').map(Number);
                                const totalM = h * 60 + m + parseInt(formData.toleransi_menit || 0, 10);
                                const nh = String(Math.floor(totalM / 60)).padStart(2, '0');
                                const nm = String(totalM % 60).padStart(2, '0');
                                return `${nh}:${nm}`;
                              })()
                            } WIB</strong> (Tepat Waktu)</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>Presensi ditutup secara otomatis pada hari {day}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Card 2: Kelola Hari Libur Spesifik / Tanggal Merah */}
          {activeTab === 'libur' && (
          <div className="card-modern" style={{ padding: '1.75rem', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <CalendarOff size={22} color="#ef4444" />
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Kelola Hari Libur Sekolah / Tanggal Merah</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Tambahkan tanggal libur khusus (misal: Hari Kemerdekaan, Cuti Bersama, dll). Pada tanggal libur yang aktif, presensi tidak dapat di-scan.
                </p>
              </div>
            </div>

            {/* 2-Grid Container: Grid 1 (Form Input) & Grid 2 (Daftar Libur dengan Search & Paging) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* Grid 1: Form Input Hari Libur */}
              <div style={{ background: '#fff5f5', border: '1px solid #fecdd3', padding: '1.25rem', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #fecdd3', paddingBottom: '0.5rem' }}>
                  <Plus size={18} color="#e11d48" />
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#9f1239', margin: 0 }}>Tambah Hari Libur Baru</h4>
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Tanggal Mulai Libur *</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={newLiburMulai}
                    onChange={e => {
                      setNewLiburMulai(e.target.value);
                      if (!newLiburSelesai) setNewLiburSelesai(e.target.value);
                    }}
                    style={{ fontSize: '0.88rem' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Tanggal Selesai Libur</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={newLiburSelesai}
                    onChange={e => setNewLiburSelesai(e.target.value)}
                    placeholder="Opsional (Isi jika > 1 hari)"
                    style={{ fontSize: '0.88rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem', display: 'block' }}>
                    *Kosongkan jika hanya libur 1 hari
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Keterangan Libur (e.g. Cuti Bersama / Idul Fitri)</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Contoh: Libur Nasional / Cuti Bersama"
                    value={newLiburKet}
                    onChange={e => setNewLiburKet(e.target.value)}
                    style={{ fontSize: '0.88rem' }}
                  />
                </div>

                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddHoliday}
                  style={{ width: '100%', padding: '0.75rem', background: '#e11d48', borderColor: '#be123c', fontWeight: 800, fontSize: '0.9rem', borderRadius: '10px' }}
                >
                  <Plus size={18} />
                  <span>Tambah Libur</span>
                </button>
              </div>

              {/* Grid 2: Tabel Daftar Hari Libur (Pencarian & Pagination) */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '14px' }}>
                {/* Search Bar Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    Daftar Tanggal Merah / Libur Terdaftar ({filteredHolidays.length} Hari)
                  </h4>

                  {/* Search Input Box */}
                  <div style={{ position: 'relative', width: '230px' }}>
                    <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Cari tanggal / keterangan..."
                      value={liburSearch}
                      onChange={e => {
                        setLiburSearch(e.target.value);
                        setLiburPage(1);
                      }}
                      style={{ paddingLeft: '2.2rem', fontSize: '0.8rem', height: '36px', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                {filteredHolidays.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    {liburSearch ? `Tidak ada hari libur yang cocok dengan kata kunci "${liburSearch}".` : 'Belum ada tanggal libur khusus yang ditambahkan.'}
                  </div>
                ) : (
                  <>
                    <div className="table-responsive" style={{ minHeight: '220px' }}>
                      <table className="table-modern" style={{ fontSize: '0.84rem' }}>
                        <thead>
                          <tr>
                            <th>No</th>
                            <th>Tanggal Libur</th>
                            <th>Keterangan / Alasan Libur</th>
                            <th>Status Libur</th>
                            <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedHolidays.map((item, idx) => {
                            const isAktif = item.aktif !== false;
                            const itemId = item.id || item.tanggal;
                            const rowNo = startLiburIdx + idx + 1;
                            const tM = item.tanggal_mulai || item.tanggalMulai || item.tanggal || '';
                            const tS = item.tanggal_selesai || item.tanggalSelesai || tM;
                            const isRange = tM && tS && tM !== tS;

                            return (
                              <tr key={itemId || idx} style={{ opacity: isAktif ? 1 : 0.75, background: isAktif ? 'transparent' : '#f8fafc' }}>
                                <td style={{ fontWeight: 600, color: '#94a3b8' }}>{rowNo}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: isAktif ? '#be123c' : '#64748b', fontFamily: 'monospace' }}>
                                    <Calendar size={14} color={isAktif ? '#e11d48' : '#94a3b8'} />
                                    <span style={{ textDecoration: isAktif ? 'none' : 'line-through' }}>
                                      {isRange ? `${tM} s.d ${tS}` : tM}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ fontWeight: 600, color: isAktif ? '#334155' : '#64748b' }}>
                                  {item.keterangan || 'Hari Libur Sekolah'}
                                </td>
                                <td>
                                  {isAktif ? (
                                    <span className="badge" style={{ background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                                      <CalendarOff size={11} style={{ marginRight: '3px' }} /> Libur Aktif (Presensi Off)
                                    </span>
                                  ) : (
                                    <span className="badge" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                                      Non-Aktif (Presensi Berlaku)
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                                    <button 
                                      type="button" 
                                      title={isAktif ? "Libur Aktif (Presensi Ditutup) - Klik untuk Non-Aktifkan agar Presensi Berlaku" : "Libur Non-Aktif (Presensi Berlaku) - Klik untuk Aktifkan Hari Libur"}
                                      onClick={() => handleToggleHolidayStatus(itemId)}
                                      style={{ 
                                        color: isAktif ? '#15803d' : '#64748b',
                                        background: isAktif ? '#dcfce7' : '#f1f5f9',
                                        border: isAktif ? '1px solid #86efac' : '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        padding: '0.3rem 0.55rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {isAktif ? <CheckCircle2 size={14} color="#16a34a" /> : <XCircle size={14} color="#64748b" />}
                                      <span>{isAktif ? 'Aktif' : 'Off'}</span>
                                    </button>

                                    <button 
                                      type="button" 
                                      className="btn-icon" 
                                      title="Hapus Tanggal Libur Ini"
                                      onClick={() => handleDeleteHoliday(itemId)}
                                      style={{ color: '#ef4444', padding: '0.3rem', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fff5f5' }}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#64748b' }}>
                      <div>
                        Menampilkan <strong>{startLiburIdx + 1}</strong> - <strong>{Math.min(startLiburIdx + LIBUR_PER_PAGE, filteredHolidays.length)}</strong> dari <strong>{filteredHolidays.length}</strong> libur
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          type="button"
                          disabled={currentLiburPage <= 1}
                          onClick={() => setLiburPage(prev => Math.max(1, prev - 1))}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: currentLiburPage <= 1 ? '#f8fafc' : '#ffffff',
                            color: currentLiburPage <= 1 ? '#cbd5e1' : '#334155',
                            cursor: currentLiburPage <= 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontWeight: 700
                          }}
                        >
                          <ChevronLeft size={14} />
                          <span>Prev</span>
                        </button>

                        <span style={{ padding: '0 0.5rem', fontWeight: 800, color: '#0f172a' }}>
                          {currentLiburPage} / {totalLiburPages}
                        </span>

                        <button
                          type="button"
                          disabled={currentLiburPage >= totalLiburPages}
                          onClick={() => setLiburPage(prev => Math.min(totalLiburPages, prev + 1))}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: currentLiburPage >= totalLiburPages ? '#f8fafc' : '#ffffff',
                            color: currentLiburPage >= totalLiburPages ? '#cbd5e1' : '#334155',
                            cursor: currentLiburPage >= totalLiburPages ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontWeight: 700
                          }}
                        >
                          <span>Next</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Card 3: Notifikasi Suara Scanner */}
          {activeTab === 'audio' && (
          <div className="card-modern" style={{ padding: '1.75rem', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <Volume2 size={22} color="#4f46e5" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Notifikasi Audio & Suara Scanner</h3>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.92rem', fontWeight: 700 }}>
                <input 
                  type="checkbox" 
                  checked={formData.voice_notification}
                  onChange={e => setFormData({ ...formData, voice_notification: e.target.checked })}
                  style={{ width: '20px', height: '20px', accentColor: '#4f46e5' }}
                />
                <span>Aktifkan Suara Notifikasi Bahasa Indonesia pada Kiosk Scanner</span>
              </label>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '2.25rem', display: 'block', marginTop: '0.25rem' }}>
                Sistem akan mengucapkan nama, status presensi ("Presensi Berhasil: Hadir"), atau peringatan libur ("Presensi Ditutup: Hari ini libur") secara otomatis.
              </span>
            </div>
          </div>
          )}

          {/* Card 4: WhatsApp Integration */}
          {activeTab === 'wa' && (
          <div className="card-modern" style={{ padding: '1.75rem', gridColumn: '1 / -1', margin: 0, background: 'linear-gradient(to right bottom, #ffffff, #f0fdf4)', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid #bbf7d0', paddingBottom: '0.75rem' }}>
              <div style={{ padding: '8px', background: '#25D366', borderRadius: '12px', color: 'white' }}>
                <MessageCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534' }}>Integrasi Notifikasi WhatsApp (WA)</h3>
                <p style={{ fontSize: '0.8rem', color: '#15803d', margin: 0 }}>Pilih metode pengiriman pesan WhatsApp untuk presensi otomatis.</p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 800, fontSize: '0.9rem', color: '#166534', display: 'block', marginBottom: '0.5rem' }}>Pilih Vendor/Provider API:</label>
              <select 
                className="form-control" 
                value={formData.wa_provider} 
                onChange={(e) => setFormData({...formData, wa_provider: e.target.value})}
                style={{ maxWidth: '300px', border: '1px solid #86efac', background: '#dcfce7', color: '#166534' }}
              >
                <option value="Lokal">Mode Lokal / Gratis (Scan QR Code)</option>
                <option value="Wablas">Wablas (API Berbayar)</option>
              </select>
            </div>
            
            {formData.wa_provider === 'Wablas' ? (
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '1rem' }}>Konfigurasi Wablas API</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Domain Server Wablas</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Contoh: https://solo.wablas.com"
                      value={formData.wa_domain}
                      onChange={(e) => setFormData({...formData, wa_domain: e.target.value})}
                    />
                    <small style={{ color: '#64748b' }}>Masukkan URL domain server Wablas akun Anda, tanpa slash (/) di akhir.</small>
                  </div>
                  <div className="form-group">
                    <label>API Token / Authorization Token</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Masukkan Token rahasia"
                      value={formData.wa_token}
                      onChange={(e) => setFormData({...formData, wa_token: e.target.value})}
                    />
                    <small style={{ color: '#64748b' }}>Token ini bersifat rahasia. Dapatkan dari dashboard Wablas Anda.</small>
                  </div>
                </div>
                
                <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '8px', color: '#1e3a8a', marginTop: '1rem', fontSize: '0.85rem' }}>
                  <strong>Catatan:</strong> Saat menggunakan Wablas, sistem tidak perlu menscan QR code. Pastikan klik tombol <strong>"Simpan Perubahan Pengaturan"</strong> di paling bawah layar setelah mengisi form ini.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>Status Koneksi: 
                    <span style={{ 
                      marginLeft: '10px', 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.85rem', 
                      background: waStatus === 'CONNECTED' ? '#22c55e' : (waStatus === 'QR_READY' ? '#eab308' : '#ef4444'),
                      color: 'white' 
                    }}>
                      {waStatus === 'CONNECTED' ? 'TERHUBUNG' : (waStatus === 'QR_READY' ? 'MENUNGGU SCAN' : 'TERPUTUS')}
                    </span>
                  </h4>
                  
                  {waStatus === 'CONNECTED' ? (
                    <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '12px', color: '#166534', marginTop: '1rem' }}>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        <strong>🎉 Bagus!</strong> Perangkat WhatsApp Anda telah berhasil ditautkan.
                        Setiap kali siswa, guru, atau staf sukses melakukan presensi masuk/pulang, sistem akan langsung mengirimkan laporan notifikasi ke HP yang bersangkutan secara otomatis di latar belakang.
                      </p>
                      <button 
                        type="button" 
                        onClick={handleWaLogout}
                        disabled={isWaLoading}
                        className="btn" 
                        style={{ background: '#ef4444', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: 'none' }}
                      >
                        {isWaLoading ? <RefreshCw size={18} className="spin" /> : <LogOut size={18} />}
                        Putuskan (Logout WhatsApp)
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '1rem' }}>
                      <p style={{ marginBottom: '0.5rem' }}>Untuk menautkan perangkat:</p>
                      <ol style={{ paddingLeft: '1.2rem', marginBottom: '1rem' }}>
                        <li>Buka aplikasi WhatsApp di HP Sekolah/Admin Anda.</li>
                        <li>Ketuk ikon tiga titik vertikal (Android) atau Pengaturan (iPhone).</li>
                        <li>Pilih <strong>Tautkan Perangkat</strong> atau <em>Linked Devices</em>.</li>
                        <li>Arahkan kamera HP untuk menscan kode QR di sebelah kanan.</li>
                      </ol>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        <Smartphone size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/>
                        Pastikan HP selalu aktif dan terhubung ke internet agar pesan dapat terkirim.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* QR Code Area */}
                <div style={{ width: '250px', height: '250px', background: 'white', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '1rem', position: 'relative' }}>
                  {waStatus === 'CONNECTED' ? (
                    <div style={{ textAlign: 'center', color: '#22c55e' }}>
                      <CheckCircle2 size={64} style={{ margin: '0 auto 1rem' }} />
                      <h4 style={{ fontWeight: 800 }}>SIAP MENGIRIM!</h4>
                    </div>
                  ) : waQrCode ? (
                    <>
                      <img src={waQrCode} alt="WhatsApp QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(255,255,255,0.9)', textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #e2e8f0' }}>
                        Scan untuk menautkan
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem' }} />
                      <p style={{ fontSize: '0.85rem' }}>Sedang menyiapkan QR Code...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Save Floating Bar / Bottom Action */}
        <div className="card-modern" style={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#1e1b4b', color: 'white' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Simpan Seluruh Pengaturan Sekolah</div>
            <div style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>Perubahan jam masuk/pulang per hari dan daftar hari libur akan langsung aktif secara otomatis</div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', fontWeight: 800, background: '#4f46e5' }}>
            <Save size={18} />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
