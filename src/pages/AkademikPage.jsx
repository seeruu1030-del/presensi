import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CalendarRange, 
  CheckCircle2, 
  Plus, 
  School, 
  X, 
  FileSpreadsheet, 
  Upload, 
  Trash2, 
  Users, 
  Printer, 
  Phone, 
  QrCode, 
  GraduationCap,
  MapPin,
  Search,
  Lock,
  UserPlus,
  UserMinus,
  ArrowRight,
  CheckSquare,
  Square,
  Check
} from 'lucide-react';
import { ImportExcelModal } from '../components/ImportExcelModal';
import { PrintCardModal } from '../components/PrintCardModal';
import { showDeleteConfirm, showConfirmDialog, showWarningAlert } from '../utils/sweetalert';

export const AkademikPage = ({ isRombelOnly = false }) => {
  const { 
    activeMenu,
    tapelList, 
    setTapelAktif, 
    getTapelAktif,
    addTapel,
    deleteTapel,
    semesterAktif, 
    setSemesterAktif, 
    kelasList, 
    addKelas,
    deleteKelas,
    guruTendikList,
    siswaList,
    deleteSiswa,
    bulkAddSiswa,
    removeSiswaFromKelas,
    bulkRemoveSiswaFromKelas,
    bulkMoveSiswaToKelas,
    getSiswaActiveRombel,
    setActiveMenu,
    showToast 
  } = useApp();

  const isRombelMode = isRombelOnly || activeMenu === 'rombel';

  const currentTapel = getTapelAktif ? getTapelAktif() : '2025/2026';

  const [isAddTapelModalOpen, setIsAddTapelModalOpen] = useState(false);
  const [newTapelYear, setNewTapelYear] = useState('');

  // Modal Tambah Kelas State
  const [isAddKelasModalOpen, setIsAddKelasModalOpen] = useState(false);
  const [newKelasData, setNewKelasData] = useState({ 
    nama: '', 
    tingkat: 'X', 
    waliKelas: '',
    tapel: currentTapel,
    semester: semesterAktif || 'Ganjil'
  });

  // AutoSearching Wali Kelas state
  const [searchWaliQuery, setSearchWaliQuery] = useState('');
  const [isWaliDropdownOpen, setIsWaliDropdownOpen] = useState(false);

  // Semester Genap / Naik Kelas Pindah Semester Modal State
  const [pindahSemesterModal, setPindahSemesterModal] = useState({ isOpen: false, targetKelas: null });
  const [selectedSiswaIds, setSelectedSiswaIds] = useState([]);
  const [searchSiswaPindah, setSearchSiswaPindah] = useState('');
  const [filterRombelAsal, setFilterRombelAsal] = useState('Semua');

  // Helper to check if a class is Tingkat 1 or 10
  const isTingkatAwal = (kls) => {
    if (!kls) return false;
    const nama = String(kls.nama || '').trim();
    const match = nama.match(/^(Kelas\s*)?([0-9]+|[IVXLCDM]+)[\s\-_\/]?/i);
    if (match) {
      const grade = match[2].toUpperCase();
      if (grade === '1' || grade === '10' || grade === 'X' || grade === 'I') {
        return true;
      }
      return false;
    }

    const t = String(kls.tingkat || '').trim().toUpperCase();
    if (t === '1' || t === '10' || t === 'X' || t === 'I') return true;

    return false;
  };

  // Menentukan alur penambahan / pemilihan siswa:
  // 1. Tingkat 1 & 10 dan Semester Ganjil -> Import Excel Siswa Baru
  // 2. Tingkat 1 & 10 dan Semester Genap -> Pindah Semester (pada TP yang sama)
  // 3. Selain Tingkat 1 & 10 dan Semester Ganjil -> Naik Kelas (ke TP berikutnya)
  // 4. Selain Tingkat 1 & 10 dan Semester Genap -> Pindah Semester (pada TP yang sama)
  const getKelasFlowType = (kls) => {
    const isTingkat1or10 = isTingkatAwal(kls);
    const isGanjil = (semesterAktif || 'Ganjil') === 'Ganjil';

    if (isTingkat1or10 && isGanjil) {
      return {
        type: 'IMPORT',
        label: `Import Siswa (${kls.nama})`,
        buttonClass: 'btn btn-primary',
        icon: Upload,
        title: `Import Data Excel Siswa Baru (${kls.nama} • Semester Ganjil)`
      };
    } else if (!isTingkat1or10 && isGanjil) {
      return {
        type: 'NAIK_KELAS',
        label: `Naik Kelas (${kls.nama})`,
        buttonClass: 'btn btn-success',
        icon: UserPlus,
        title: `Pilih Siswa untuk Naik Kelas ke ${kls.nama} (Semester Ganjil)`
      };
    } else {
      return {
        type: 'PINDAH_SEMESTER',
        label: `Pindah Semester (${kls.nama})`,
        buttonClass: 'btn btn-success',
        icon: UserPlus,
        title: `Pilih Siswa untuk Pindah Semester ke ${kls.nama} (Semester Genap)`
      };
    }
  };

  const deriveTingkat = (nama) => {
    const match = String(nama || '').trim().match(/^(Kelas\s*)?([0-9]+|[IVXLCDM]+)[\s\-_\/]?/i);
    if (match) return match[2].toUpperCase();
    return '1';
  };

  const [importKelasModal, setImportKelasModal] = useState({ isOpen: false, targetKelas: '' });
  const [selectedKelasForView, setSelectedKelasForView] = useState(null);
  const [printCardItem, setPrintCardItem] = useState(null);

  const guruOptions = (guruTendikList || []).filter(g => g.kategori === 'Guru' || !g.kategori);

  const filteredWaliList = (guruOptions || []).filter(g => 
    (g.nama || '').toLowerCase().includes(searchWaliQuery.toLowerCase()) ||
    (g.nip || '').includes(searchWaliQuery) ||
    (g.nuptk || '').includes(searchWaliQuery)
  );

  // Helper to check if a guru is already assigned as a wali kelas in active tapel & semester
  const findAssignedKelasForWali = (waliName, excludeKelasId = null) => {
    if (!waliName || !waliName.trim()) return null;
    const cleanName = waliName.trim().toLowerCase();
    return (filteredKelasList || []).find(k => {
      if (excludeKelasId && k.id === excludeKelasId) return false;
      const kVal = (k.waliKelas || k.wali_kelas || '').trim().toLowerCase();
      return kVal && kVal === cleanName;
    });
  };

  // Helper to dynamically resolve updated teacher name for Wali Kelas
  const getWaliKelasDisplay = (kls) => {
    const rawWali = kls?.waliKelas || kls?.wali_kelas;
    if (!rawWali || !rawWali.trim()) return '-';

    const cleanRaw = rawWali.trim().toLowerCase();
    const matchedGuru = (guruTendikList || []).find(g => {
      const gName = (g.nama || '').trim().toLowerCase();
      if (gName === cleanRaw) return true;
      if (gName.startsWith(cleanRaw) || cleanRaw.startsWith(gName)) return true;
      return false;
    });

    return matchedGuru ? matchedGuru.nama : rawWali;
  };

  const handleOpenAddKelas = () => {
    setSearchWaliQuery('');
    setIsWaliDropdownOpen(false);
    setNewKelasData({ 
      nama: '', 
      tingkat: '1', 
      waliKelas: '',
      tapel: currentTapel,
      semester: semesterAktif || 'Ganjil'
    });
    setIsAddKelasModalOpen(true);
  };

  const handleAddKelas = (e) => {
    e.preventDefault();
    if (!newKelasData.nama) return;

    if (newKelasData.waliKelas && newKelasData.waliKelas.trim()) {
      const assignedClass = findAssignedKelasForWali(newKelasData.waliKelas);
      if (assignedClass) {
        showErrorAlert(
          'Wali Kelas Sudah Terdaftar',
          `Guru "${newKelasData.waliKelas}" sudah menjadi Wali Kelas di Kelas "${assignedClass.nama}" (TP ${currentTapel} • Semester ${semesterAktif}). Silakan pilih guru lain.`
        );
        return;
      }
    }

    const derived = deriveTingkat(newKelasData.nama);
    addKelas(newKelasData.nama, derived, newKelasData.waliKelas, currentTapel, semesterAktif || 'Ganjil');
    setIsAddKelasModalOpen(false);
    setSearchWaliQuery('');
    setIsWaliDropdownOpen(false);
    setNewKelasData({ 
      nama: '', 
      tingkat: '1', 
      waliKelas: '',
      tapel: currentTapel,
      semester: semesterAktif || 'Ganjil'
    });
  };

  const handleAddTapelSubmit = (e) => {
    e.preventDefault();
    if (!newTapelYear.trim()) return;
    addTapel(newTapelYear);
    setNewTapelYear('');
    setIsAddTapelModalOpen(false);
  };

  // Filtered Kelas / Rombel List strictly by active Tapel & active Semester, sorted naturally (1-100 / A-Z)
  const filteredKelasList = (kelasList || [])
    .filter(kls => {
      const klsTapel = kls.tapel || currentTapel;
      const klsSem = kls.semester || semesterAktif || 'Ganjil';

      const matchTapel = klsTapel === currentTapel;
      const matchSemester = klsSem === (semesterAktif || 'Ganjil');

      return matchTapel && matchSemester;
    })
    .sort((a, b) => {
      return String(a.nama || '').localeCompare(String(b.nama || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

  // Get current viewed class students strictly matching active Tapel & Semester, sorted alphabetically (A-Z)
  const anggotaSiswa = selectedKelasForView 
    ? (siswaList || [])
        .filter(s => {
          const activeKlsName = getSiswaActiveRombel 
            ? getSiswaActiveRombel(s, currentTapel, semesterAktif, kelasList)
            : ((s.kelas && typeof s.kelas === 'object') ? s.kelas.nama : s.kelas);
          return activeKlsName === selectedKelasForView.nama;
        })
        .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { numeric: true, sensitivity: 'base' }))
    : [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CalendarRange color="#4f46e5" size={28} /> {isRombelMode ? 'Manajemen Rombongan Belajar (Rombel / Kelas)' : 'Manajemen Akademik (Tapel & Semester)'}
          </h1>
          <p className="page-subtitle">
            {isRombelMode 
              ? 'Kelola data rombongan belajar, wali kelas, dan anggota siswa per Tahun Pelajaran dan Semester'
              : 'Pengaturan Tahun Pelajaran (Tapel) dan Semester Aktif sekolah'}
          </p>
        </div>
      </div>

      {/* Tapel & Semester Cards (Only for Tapel & Semester page) */}
      {!isRombelMode && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Card 1: Tahun Pelajaran List (Sebelah Kiri) */}
          <div className="card-modern" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>TAHUN PELAJARAN</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Daftar Tapel</h3>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
                onClick={() => setIsAddTapelModalOpen(true)}
              >
                <Plus size={14} />
                <span>Tambah Tapel</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(!tapelList || tapelList.length === 0) ? (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                  Belum ada data Tahun Pelajaran.
                </div>
              ) : (
                [...tapelList]
                  .sort((a, b) => String(a.tahun || '').localeCompare(String(b.tahun || ''), undefined, { numeric: true, sensitivity: 'base' }))
                  .map(t => (
                  <div key={t.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: t.status === 'Aktif' ? '#eef2ff' : '#f8fafc',
                    border: `1px solid ${t.status === 'Aktif' ? '#c7d2fe' : '#e2e8f0'}`
                  }}>
                    <span style={{ fontWeight: 700, color: t.status === 'Aktif' ? '#3730a3' : '#334155' }}>
                      Tahun Pelajaran {t.tahun}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {t.status === 'Aktif' ? (
                        <span className="badge badge-hadir">
                          <CheckCircle2 size={12} /> Aktif
                        </span>
                      ) : (
                        <>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => setTapelAktif(t.id)}
                          >
                            Aktifkan
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ padding: '4px', color: '#ef4444' }}
                            title="Hapus Tapel"
                            onClick={() => {
                              showDeleteConfirm({
                                title: 'Hapus Tahun Pelajaran',
                                itemName: `Tapel ${t.tahun}`,
                                onConfirm: () => deleteTapel(t.id)
                              });
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: Semester Aktif (Sebelah Kanan) */}
          <div className="card-modern" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>SEMESTER AKTIF</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Semester {semesterAktif}</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 1.25rem' }}>
              Pilih semester yang berjalan untuk mengelompokkan laporan presensi.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className={`btn ${semesterAktif === 'Ganjil' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => {
                  setSemesterAktif('Ganjil');
                  showToast('Semester diganti ke Ganjil');
                }}
              >
                Semester Ganjil
              </button>
              <button 
                className={`btn ${semesterAktif === 'Genap' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => {
                  setSemesterAktif('Genap');
                  showToast('Semester diganti ke Genap');
                }}
              >
                Semester Genap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rombel / Data Kelas List (Only for Rombel / Kelas page) */}
      {isRombelMode && (
        <div className="card-modern" style={{ padding: '1.5rem' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <School size={22} color="#4f46e5" /> Rombongan Belajar (Data Kelas)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Klik nama kelas untuk melihat daftar anggota siswa, atau tombol <strong>Import Siswa</strong> untuk impor Excel</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.82rem', background: '#eef2ff', color: '#3730a3', padding: '0.45rem 0.95rem', borderRadius: '20px', fontWeight: 700, border: '1px solid #c7d2fe' }}>
                Menampilkan {filteredKelasList.length} Rombel (TP {currentTapel} • {semesterAktif})
              </div>
              <button className="btn btn-secondary" onClick={handleOpenAddKelas}>
                <Plus size={16} /> Tambah Kelas
              </button>
            </div>
          </div>

          {/* Table List */}
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kelas (Rombel)</th>
                  <th>Wali Kelas</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi Tambah / Pilih Siswa</th>
                </tr>
              </thead>
              <tbody>
                {filteredKelasList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      Tidak ada Rombel (Kelas) pada Tahun Pelajaran <strong>{currentTapel}</strong> & Semester <strong>{semesterAktif}</strong>.
                    </td>
                  </tr>
                ) : (
                  filteredKelasList.map((kls, idx) => {
                    const countSiswa = (siswaList || []).filter(s => {
                      const activeKlsName = getSiswaActiveRombel 
                        ? getSiswaActiveRombel(s, currentTapel, semesterAktif, kelasList)
                        : ((s.kelas && typeof s.kelas === 'object') ? s.kelas.nama : s.kelas);
                      return activeKlsName === kls.nama;
                    }).length;

                    const isNewClass = isTingkatAwal(kls);

                    return (
                      <tr key={kls.id}>
                        <td style={{ fontWeight: 600, color: '#94a3b8' }}>{idx + 1}</td>
                        <td>
                          <button 
                            className="btn btn-secondary" 
                            style={{ 
                              fontWeight: 800, 
                              color: '#4338ca', 
                              background: '#eef2ff', 
                              border: '1px solid #c7d2fe', 
                              padding: '0.4rem 0.85rem', 
                              gap: '0.5rem', 
                              cursor: 'pointer',
                              borderRadius: '10px',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            onClick={() => setSelectedKelasForView(kls)}
                            title={`Klik untuk Melihat Anggota Siswa Kelas ${kls.nama}`}
                          >
                            <Users size={15} color="#4f46e5" />
                            <span>{kls.nama}</span>
                            <span style={{ 
                              fontSize: '0.72rem', 
                              background: countSiswa > 0 ? '#4f46e5' : '#94a3b8', 
                              color: 'white', 
                              padding: '0.1rem 0.5rem', 
                              borderRadius: '12px', 
                              fontWeight: 700 
                            }}>
                              {countSiswa} Siswa
                            </span>
                          </button>
                        </td>
                        <td style={{ fontWeight: 600, color: '#475569' }}>{getWaliKelasDisplay(kls)}</td>
                        <td><span className="badge badge-hadir">Aktif</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            {(() => {
                              const flow = getKelasFlowType(kls);
                              const FlowIcon = flow.icon;

                              if (flow.type === 'IMPORT') {
                                return (
                                  <button 
                                    className={flow.buttonClass} 
                                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
                                    onClick={() => setImportKelasModal({ isOpen: true, targetKelas: kls.nama })}
                                    title={flow.title}
                                  >
                                    <FlowIcon size={14} />
                                    <span>{flow.label}</span>
                                  </button>
                                );
                              } else {
                                return (
                                  <button 
                                    className={flow.buttonClass} 
                                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', gap: '0.35rem', background: '#059669', borderColor: '#059669' }}
                                    onClick={() => {
                                      setSelectedSiswaIds([]);
                                      setSearchSiswaPindah('');
                                      setFilterRombelAsal('Semua');
                                      setPindahSemesterModal({ isOpen: true, targetKelas: kls, mode: flow.type });
                                    }}
                                    title={flow.title}
                                  >
                                    <FlowIcon size={14} />
                                    <span>{flow.label}</span>
                                  </button>
                                );
                              }
                            })()}
                            <button 
                              className="btn-icon" 
                              title="Hapus Kelas"
                              onClick={() => {
                                showDeleteConfirm({
                                  title: 'Hapus Rombel / Kelas',
                                  itemName: kls.nama,
                                  onConfirm: () => deleteKelas(kls.id)
                                });
                              }}
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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

      {/* Modal Pindah Semester / Naik Kelas */}
      {pindahSemesterModal.isOpen && pindahSemesterModal.targetKelas && (() => {
        const isNaikKelas = pindahSemesterModal.mode === 'NAIK_KELAS';
        const modalTitle = isNaikKelas
          ? `Naik Kelas: Pilih Siswa untuk Kelas ${pindahSemesterModal.targetKelas.nama}`
          : `Pindah Semester: Pilih Siswa untuk Kelas ${pindahSemesterModal.targetKelas.nama}`;
        const modalSubtitle = isNaikKelas
          ? `Pilih siswa dari rombel/tingkat asal pada tahun pelajaran sebelumnya untuk dinaikkan ke kelas ${pindahSemesterModal.targetKelas.nama} (TP ${currentTapel} • Semester ${semesterAktif}).`
          : `Pilih siswa dari rombel asal pada semester ganjil (TP ${currentTapel}) untuk dipindahkan ke kelas ${pindahSemesterModal.targetKelas.nama} (Semester Genap).`;

        return (
          <div className="modal-overlay" onClick={() => setPindahSemesterModal({ isOpen: false, targetKelas: null })}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserPlus color="#059669" size={22} />
                    {modalTitle}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                    {modalSubtitle}
                  </p>
                </div>
                <button className="btn-icon" onClick={() => setPindahSemesterModal({ isOpen: false, targetKelas: null })}>
                  <X size={18} />
                </button>
              </div>

            {/* Filter & Search Controls */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Cari nama atau NISN siswa..."
                  value={searchSiswaPindah}
                  onChange={e => setSearchSiswaPindah(e.target.value)}
                  style={{ paddingLeft: '2.3rem', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 200px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Rombel Asal:</label>
                <select 
                  className="form-control"
                  value={filterRombelAsal}
                  onChange={e => setFilterRombelAsal(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Semua">-- Semua Rombel Asal --</option>
                  <option value="Tanpa Kelas">Tanpa Kelas</option>
                  {(() => {
                    const targetTapel = pindahSemesterModal.targetKelas?.tapel || currentTapel;
                    const namesSet = new Set();
                    (siswaList || []).forEach(s => {
                      const name = (getSiswaActiveRombel ? (isNaikKelas ? (getSiswaActiveRombel(s, `${(targetTapel || '').split('/')[0] - 1}/${(targetTapel || '').split('/')[1] - 1}`, 'Genap', kelasList) || getSiswaActiveRombel(s, `${(targetTapel || '').split('/')[0] - 1}/${(targetTapel || '').split('/')[1] - 1}`, 'Ganjil', kelasList)) : getSiswaActiveRombel(s, targetTapel, 'Ganjil', kelasList)) : null) || ((s.kelas && typeof s.kelas === 'object') ? s.kelas.nama : s.kelas);
                      if (name && name !== '-' && name !== 'Tanpa Kelas' && name.trim()) {
                        namesSet.add(name.trim());
                      }
                    });
                    (kelasList || []).forEach(k => {
                      if (k && k.nama && k.nama.trim()) {
                        namesSet.add(k.nama.trim());
                      }
                    });

                    const uniqueNames = Array.from(namesSet).sort((a, b) => 
                      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
                    );

                    return uniqueNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ));
                  })()}
                </select>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => {
                    const targetTapel = pindahSemesterModal.targetKelas?.tapel || currentTapel;
                    const prevTapel = `${(targetTapel || '').split('/')[0] - 1}/${(targetTapel || '').split('/')[1] - 1}`;
                    const filtered = (siswaList || []).filter(s => {
                      const matchSearch = (s.nama || '').toLowerCase().includes(searchSiswaPindah.toLowerCase()) || (s.nisn || '').includes(searchSiswaPindah);
                      const rAsal = (getSiswaActiveRombel ? (isNaikKelas ? (getSiswaActiveRombel(s, prevTapel, 'Genap', kelasList) || getSiswaActiveRombel(s, prevTapel, 'Ganjil', kelasList)) : getSiswaActiveRombel(s, targetTapel, 'Ganjil', kelasList)) : null) || ((s.kelas && typeof s.kelas === 'object') ? s.kelas.nama : s.kelas || 'Tanpa Kelas');
                      const matchRombel = filterRombelAsal === 'Semua' || rAsal === filterRombelAsal;
                      return matchSearch && matchRombel;
                    });
                    const allIds = filtered.map(s => s.id);
                    setSelectedSiswaIds(Array.from(new Set([...selectedSiswaIds, ...allIds])));
                  }}
                >
                  Pilih Semua
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => setSelectedSiswaIds([])}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Student List Table */}
            <div className="modal-body" style={{ padding: 0, overflowY: 'auto', flex: 1, maxHeight: '400px' }}>
              <table className="table-modern" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th>Nama Siswa</th>
                    <th>NISN</th>
                    <th>L/P</th>
                    <th>Rombel Asal</th>
                    <th style={{ textAlign: 'center' }}>Status Rombel Target</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const targetTapel = pindahSemesterModal.targetKelas?.tapel || currentTapel;
                    const prevTapel = `${(targetTapel || '').split('/')[0] - 1}/${(targetTapel || '').split('/')[1] - 1}`;
                    const filtered = (siswaList || [])
                      .filter(s => {
                        const matchSearch = (s.nama || '').toLowerCase().includes(searchSiswaPindah.toLowerCase()) || (s.nisn || '').includes(searchSiswaPindah);
                        const rAsal = (getSiswaActiveRombel ? (isNaikKelas ? (getSiswaActiveRombel(s, prevTapel, 'Genap', kelasList) || getSiswaActiveRombel(s, prevTapel, 'Ganjil', kelasList)) : getSiswaActiveRombel(s, targetTapel, 'Ganjil', kelasList)) : null) || ((s.kelas && typeof s.kelas === 'object') ? s.kelas.nama : s.kelas || 'Tanpa Kelas');
                        const matchRombel = filterRombelAsal === 'Semua' || rAsal === filterRombelAsal;
                        return matchSearch && matchRombel;
                      })
                      .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { numeric: true, sensitivity: 'base' }));

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                            Tidak ada siswa yang sesuai pencarian atau filter rombel asal.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((s, idx) => {
                      const isSelected = selectedSiswaIds.includes(s.id);
                      const targetKls = pindahSemesterModal.targetKelas;
                      const targetTapel = targetKls?.tapel || currentTapel;
                      const targetSemester = targetKls?.semester || semesterAktif;

                      // Check current active class in targetTapel & targetSemester using getSiswaActiveRombel
                      const activeKlsInTargetPeriod = getSiswaActiveRombel 
                        ? getSiswaActiveRombel(s, targetTapel, targetSemester, kelasList)
                        : null;

                      const isMappedToTarget = Boolean(activeKlsInTargetPeriod && activeKlsInTargetPeriod === targetKls?.nama);
                      const isMappedToOtherClassInTargetPeriod = Boolean(activeKlsInTargetPeriod && activeKlsInTargetPeriod !== targetKls?.nama);

                      // Determine Rombel Asal for previous period
                      let rombelAsalName = 'Tanpa Kelas';
                      if (isNaikKelas) {
                        const parts = (targetTapel || '').split('/').map(Number);
                        let prevTapel = targetTapel;
                        if (parts.length === 2 && !isNaN(parts[0])) {
                          prevTapel = `${parts[0] - 1}/${parts[1] - 1}`;
                        }
                        rombelAsalName = (getSiswaActiveRombel ? (getSiswaActiveRombel(s, prevTapel, 'Genap', kelasList) || getSiswaActiveRombel(s, prevTapel, 'Ganjil', kelasList)) : null) || 'Tanpa Kelas';
                      } else {
                        rombelAsalName = (getSiswaActiveRombel ? getSiswaActiveRombel(s, targetTapel, 'Ganjil', kelasList) : null) || 'Tanpa Kelas';
                      }

                      if (rombelAsalName === 'Tanpa Kelas') {
                        const studentKelasObj = (s.kelas && typeof s.kelas === 'object') ? s.kelas : (kelasList || []).find(k => k.id === s.kelas_id);
                        if (studentKelasObj && studentKelasObj.nama) rombelAsalName = studentKelasObj.nama;
                        else if (typeof s.kelas === 'string' && s.kelas.trim() && s.kelas !== '-') rombelAsalName = s.kelas;
                      }

                      const hasRombelAsal = Boolean(rombelAsalName && rombelAsalName !== '-' && rombelAsalName !== 'Tanpa Kelas');

                      return (
                        <tr 
                          key={s.id} 
                          style={{ 
                            background: isSelected ? '#ecfdf5' : 'transparent',
                            cursor: 'pointer' 
                          }}
                          onClick={() => {
                            if (isMappedToTarget && !isSelected) {
                              showWarningAlert(
                                'Siswa Sudah Terdaftar',
                                `Siswa "${s.nama}" sudah terdaftar di Kelas "${targetKls?.nama}" untuk TP ${targetTapel} • Semester ${targetSemester}.`
                              );
                              return;
                            }
                            if (isSelected) {
                              setSelectedSiswaIds(selectedSiswaIds.filter(id => id !== s.id));
                            } else {
                              setSelectedSiswaIds([...selectedSiswaIds, s.id]);
                            }
                          }}
                        >
                          <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                if (isMappedToTarget && !isSelected) {
                                  showWarningAlert(
                                    'Siswa Sudah Terdaftar',
                                    `Siswa "${s.nama}" sudah terdaftar di Kelas "${targetKls?.nama}" untuk TP ${targetTapel} • Semester ${targetSemester}.`
                                  );
                                  return;
                                }
                                if (e.target.checked) {
                                  setSelectedSiswaIds([...selectedSiswaIds, s.id]);
                                } else {
                                  setSelectedSiswaIds(selectedSiswaIds.filter(id => id !== s.id));
                                }
                              }}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#059669' }}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.nama}</div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.nisn || '-'}</td>
                          <td style={{ fontWeight: 700 }}>{s.gender === 'P' ? 'P' : 'L'}</td>
                          <td>
                            <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 600 }}>
                              {rombelAsalName}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isSelected ? (
                              <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.65rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #86efac', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Check size={12} /> Terpilih → {targetKls.nama}
                              </span>
                            ) : isMappedToTarget ? (
                              <span className="badge badge-hadir" style={{ fontSize: '0.75rem', padding: '0.2rem 0.65rem' }}>
                                Sudah di {targetKls.nama}
                              </span>
                            ) : isMappedToOtherClassInTargetPeriod ? (
                              <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.65rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #bfdbfe' }}>
                                Sudah di Kelas {activeKlsInTargetPeriod}
                              </span>
                            ) : hasRombelAsal ? (
                              <span style={{ fontSize: '0.75rem', background: '#f8fafc', color: '#64748b', padding: '0.2rem 0.65rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                                Belum Dipetakan
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', background: '#f8fafc', color: '#64748b', padding: '0.2rem 0.55rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                Belum Ada Rombel
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                Total Dipilih: <span style={{ color: '#059669', fontSize: '1rem', fontWeight: 800 }}>{selectedSiswaIds.length} Siswa</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPindahSemesterModal({ isOpen: false, targetKelas: null })}>
                  Batal
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  style={{ background: '#059669', borderColor: '#059669', fontWeight: 700, gap: '0.4rem' }}
                  disabled={selectedSiswaIds.length === 0}
                  onClick={async () => {
                    const ok = await bulkMoveSiswaToKelas(selectedSiswaIds, pindahSemesterModal.targetKelas.id, pindahSemesterModal.mode);
                    if (ok) {
                      setPindahSemesterModal({ isOpen: false, targetKelas: null });
                      setSelectedSiswaIds([]);
                    }
                  }}
                >
                  <UserPlus size={16} />
                  <span>{isNaikKelas ? `Naikkan ${selectedSiswaIds.length} Siswa ke Kelas ${pindahSemesterModal.targetKelas.nama}` : `Pindahkan ${selectedSiswaIds.length} Siswa ke Kelas ${pindahSemesterModal.targetKelas.nama}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal Add Kelas */}
      {isAddKelasModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddKelasModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', overflow: 'visible' }}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Kelas / Rombel Baru</h3>
              <button className="btn-icon" onClick={() => setIsAddKelasModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddKelas}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Kelas / Rombel *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 5 A atau X IPA 3" 
                    required
                    value={newKelasData.nama}
                    onChange={e => setNewKelasData({ ...newKelasData, nama: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lock size={14} color="#64748b" /> Tahun Pelajaran *
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      readOnly
                      value={`${currentTapel} (Aktif)`}
                      style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lock size={14} color="#64748b" /> Semester *
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      readOnly
                      value={`Semester ${semesterAktif || 'Ganjil'}`}
                      style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                {/* AutoSearching Wali Kelas Combobox */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Nama Wali Kelas (AutoSearching)</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="Ketik untuk mencari nama atau NIP guru..."
                      value={searchWaliQuery}
                      onChange={e => {
                        setSearchWaliQuery(e.target.value);
                        setNewKelasData({ ...newKelasData, waliKelas: e.target.value });
                        setIsWaliDropdownOpen(true);
                      }}
                      onFocus={() => setIsWaliDropdownOpen(true)}
                      style={{ paddingLeft: '2.3rem', paddingRight: newKelasData.waliKelas ? '2.3rem' : '0.85rem' }}
                    />
                    {newKelasData.waliKelas && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setSearchWaliQuery('');
                          setNewKelasData({ ...newKelasData, waliKelas: '' });
                          setIsWaliDropdownOpen(false);
                        }}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                        title="Hapus pilihan"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Notification banner if selected wali is already assigned */}
                  {(() => {
                    const assigned = findAssignedKelasForWali(newKelasData.waliKelas);
                    if (!assigned) return null;
                    return (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.5rem 0.75rem', 
                        background: '#fff1f2', 
                        border: '1px solid #fecdd3', 
                        borderRadius: '8px', 
                        fontSize: '0.78rem', 
                        color: '#be123c',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600
                      }}>
                        <span>⚠️ <strong>{newKelasData.waliKelas}</strong> sudah menjadi Wali Kelas di <strong>Kelas {assigned.nama}</strong>.</span>
                      </div>
                    );
                  })()}

                  {/* AutoSearching Suggestion Dropdown */}
                  {isWaliDropdownOpen && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: 'white',
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #cbd5e1',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}
                    >
                      {filteredWaliList.length === 0 ? (
                        <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                          Guru tidak ditemukan
                        </div>
                      ) : (
                        filteredWaliList.map(g => {
                          const assignedClass = findAssignedKelasForWali(g.nama);
                          return (
                            <div
                              key={g.id}
                              onClick={() => {
                                setNewKelasData({ ...newKelasData, waliKelas: g.nama });
                                setSearchWaliQuery(g.nama);
                                setIsWaliDropdownOpen(false);
                                if (assignedClass) {
                                  showErrorAlert(
                                    'Wali Kelas Sudah Terdaftar',
                                    `Guru "${g.nama}" sudah menjadi Wali Kelas di Kelas "${assignedClass.nama}" (TP ${currentTapel} • Semester ${semesterAktif}).`
                                  );
                                }
                              }}
                              style={{
                                padding: '0.6rem 1rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: newKelasData.waliKelas === g.nama ? '#eef2ff' : (assignedClass ? '#fffaf0' : 'transparent')
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = assignedClass ? '#fff1f2' : '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = newKelasData.waliKelas === g.nama ? '#eef2ff' : (assignedClass ? '#fffaf0' : 'transparent')}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{g.nama}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                                  NIP: {g.nip || '-'} • NUPTK: {g.nuptk || '-'}
                                </div>
                              </div>
                              {assignedClass ? (
                                <span style={{ 
                                  fontSize: '0.72rem', 
                                  background: '#fef2f2', 
                                  color: '#dc2626', 
                                  border: '1px solid #fecaca',
                                  padding: '0.2rem 0.55rem', 
                                  borderRadius: '8px', 
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}>
                                  Wali Kelas {assignedClass.nama}
                                </span>
                              ) : newKelasData.waliKelas === g.nama ? (
                                <CheckCircle2 size={16} color="#4f46e5" />
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddKelasModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Kelas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View Anggota Siswa Kelas */}
      {selectedKelasForView && (
        <div className="modal-overlay" onClick={() => setSelectedKelasForView(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#eef2ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4f46e5'
                }}>
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Anggota Rombel: Kelas {selectedKelasForView.nama}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Wali Kelas: <strong>{getWaliKelasDisplay(selectedKelasForView)}</strong> • Total: <strong style={{ color: '#4f46e5' }}>{anggotaSiswa.length} Siswa</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {anggotaSiswa.length > 0 && (
                  <button 
                    className="btn" 
                    onClick={() => {
                      showConfirmDialog({
                        title: `Keluarkan Semua Siswa dari Rombel`,
                        text: `Apakah Anda yakin ingin mengeluarkan seluruh ${anggotaSiswa.length} siswa dari Kelas ${selectedKelasForView.nama}? Data siswa tidak dihapus dan statusnya menjadi Tanpa Kelas.`,
                        confirmButtonText: 'Ya, Keluarkan Semua',
                        confirmButtonColor: '#ef4444',
                        icon: 'warning',
                        onConfirm: () => bulkRemoveSiswaFromKelas(anggotaSiswa.map(s => s.id))
                      });
                    }}
                    style={{
                      background: '#fff1f2',
                      color: '#ef4444',
                      borderColor: '#fecaca',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '0.45rem 0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    title="Keluarkan seluruh siswa dari rombel ini secara bersamaan"
                  >
                    <UserMinus size={15} />
                    <span>Keluarkan Semua ({anggotaSiswa.length})</span>
                  </button>
                )}
                <button 
                  className="btn btn-success" 
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  onClick={() => {
                    setImportKelasModal({ isOpen: true, targetKelas: selectedKelasForView.nama });
                  }}
                >
                  <FileSpreadsheet size={15} />
                  <span>Impor Excel</span>
                </button>

                <button className="btn-icon" onClick={() => setSelectedKelasForView(null)}><X size={18} /></button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem 1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
              {anggotaSiswa.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    color: '#94a3b8'
                  }}>
                    <Users size={32} />
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.35rem' }}>
                    Belum Ada Data Siswa di Kelas {selectedKelasForView.nama}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                    Rombel ini masih kosong. Silakan unggah file Excel data siswa untuk mengisi rombel secara instan.
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setImportKelasModal({ isOpen: true, targetKelas: selectedKelasForView.nama })}
                  >
                    <Upload size={16} />
                    <span>Impor Data Siswa ({selectedKelasForView.nama}) Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table-modern" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Foto & Nama Siswa</th>
                        <th>NISN</th>
                        <th>L/P</th>
                        <th>Orang Tua & WA</th>
                        <th>Alamat</th>
                        <th style={{ textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anggotaSiswa.map((siswa, i) => (
                        <tr key={siswa.id}>
                          <td style={{ fontWeight: 600, color: '#94a3b8' }}>{i + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {siswa.foto ? (
                                <img 
                                  src={siswa.foto} 
                                  alt={siswa.nama} 
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    objectPosition: 'top center',
                                    border: '2px solid #e2e8f0'
                                  }} 
                                />
                              ) : (
                                <div style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: '#e0e7ff',
                                  color: '#4338ca',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.85rem'
                                }}>
                                  {String(siswa.nama || '?').charAt(0)}
                                </div>
                              )}
                              <strong style={{ color: '#1e293b' }}>{siswa.nama}</strong>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{siswa.nisn || '-'}</td>
                          <td style={{ fontWeight: 700 }}>{siswa.gender === 'P' ? 'P' : 'L'}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#334155' }}>{siswa.orangTua || siswa.orang_tua || '-'}</div>
                            {(siswa.noHp || siswa.no_hp) && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Phone size={11} /> {siswa.noHp || siswa.no_hp}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{siswa.alamat || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="btn btn-secondary" 
                              title="Keluarkan dari Rombel"
                              onClick={() => {
                                showConfirmDialog({
                                  title: 'Keluarkan Siswa dari Rombel',
                                  text: `Apakah Anda yakin ingin mengeluarkan Siswa "${siswa.nama}" dari Kelas ${selectedKelasForView.nama}? Data siswa tidak dihapus dan statusnya menjadi Tanpa Kelas.`,
                                  confirmButtonText: 'Ya, Keluarkan',
                                  confirmButtonColor: '#ef4444',
                                  icon: 'warning',
                                  onConfirm: () => removeSiswaFromKelas(siswa.id)
                                });
                              }}
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.25rem 0.6rem', 
                                color: '#ef4444', 
                                borderColor: '#fecaca', 
                                background: '#fff1f2', 
                                fontWeight: 700, 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem' 
                              }}
                            >
                              <UserMinus size={14} />
                              <span>Keluarkan</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedKelasForView(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Print Card Single */}
      {printCardItem && (
        <PrintCardModal 
          item={printCardItem}
          type="Siswa"
          onClose={() => setPrintCardItem(null)}
        />
      )}

      {/* Modal Import Excel Siswa per Kelas */}
      {importKelasModal.isOpen && (
        <ImportExcelModal 
          isOpen={true}
          onClose={() => setImportKelasModal({ isOpen: false, targetKelas: '' })}
          title={`Import Data Siswa Excel - Kelas ${importKelasModal.targetKelas}`}
          type="siswa"
          onImport={(parsedItems) => {
            const mapped = parsedItems.map(item => ({
              ...item,
              kelas: item.kelas || importKelasModal.targetKelas
            }));
            bulkAddSiswa(mapped);
          }}
        />
      )}

      {/* Modal Add Tapel */}
      {isAddTapelModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTapelModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Tahun Pelajaran Baru</h3>
              <button className="btn-icon" onClick={() => setIsAddTapelModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddTapelSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tahun Pelajaran (Tapel) *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Contoh: 2026/2027" 
                    required
                    value={newTapelYear}
                    onChange={e => setNewTapelYear(e.target.value)}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>
                    Format penulisan umum: <strong>YYYY/YYYY</strong> (Contoh: 2026/2027)
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddTapelModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Tapel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
