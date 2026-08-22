import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { showDeleteConfirm, showErrorAlert } from '../utils/sweetalert';
import { 
  Award, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  FileSpreadsheet, 
  Download, 
  UserCheck, 
  Users, 
  CheckCircle2, 
  Clock, 
  FileText,
  Briefcase,
  Check,
  ChevronDown
} from 'lucide-react';

export const TugasGTKPage = () => {
  const { 
    tugasGTKList, 
    addTugasGTK, 
    updateTugasGTK, 
    deleteTugasGTK, 
    guruTendikList, 
    getTapelAktif, 
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Personel Combobox Search State
  const [personelSearch, setPersonelSearch] = useState('');
  const [isPersonelDropdownOpen, setIsPersonelDropdownOpen] = useState(false);

  const tapelAktif = getTapelAktif() || '2025/2026';

  // Form State
  const [formData, setFormData] = useState({
    guruId: '',
    namaPersonel: '',
    kategori: 'Guru',
    namaTugas: '',
    skNomor: '',
    skTanggal: new Date().toISOString().split('T')[0],
    tahunPelajaran: tapelAktif,
    status: 'Aktif',
    keterangan: ''
  });

  // Filtered Personel List for Combobox Dropdown
  const filteredPersonelList = (guruTendikList || []).filter(g => {
    const label = `${g.jabatan || g.kategori || 'Guru'} - ${g.nama}`.toLowerCase();
    const query = personelSearch.toLowerCase();
    return label.includes(query) || (g.nama || '').toLowerCase().includes(query) || (g.jabatan || '').toLowerCase().includes(query);
  });

  const selectedPersonelObj = (guruTendikList || []).find(g => g.id === formData.guruId);
  const selectedPersonelLabel = selectedPersonelObj 
    ? `${selectedPersonelObj.jabatan || selectedPersonelObj.kategori || 'Guru'} - ${selectedPersonelObj.nama}`
    : (formData.namaPersonel ? `[${formData.kategori || 'Guru'}] ${formData.namaPersonel}` : '');

  // Preset Tugas GTK choices for quick click selection
  const TUGAS_PRESETS = [
    'Wakil Kepala Sekolah Bidang Kurikulum',
    'Wakil Kepala Sekolah Bidang Kesiswaan',
    'Wakil Kepala Sekolah Bidang Sarpras',
    'Wakil Kepala Sekolah Bidang Humas',
    'Kepala Perpustakaan Sekolah',
    'Kepala Laboratorium Komputer',
    'Operator Dapodik & SIMPATIKA',
    'Bendahara BOS & Keuangan Sekolah',
    'Pembina Ekstrakulikuler Pramuka',
    'Guru Piket Harian',
    'Tim Pencegahan Penanganan Kekerasan (TPPK)'
  ];

  const handleOpenAdd = () => {
    setEditItem(null);
    const firstPersonel = guruTendikList[0];
    setFormData({
      guruId: firstPersonel ? firstPersonel.id : '',
      namaPersonel: firstPersonel ? firstPersonel.nama : '',
      kategori: firstPersonel ? (firstPersonel.kategori || 'Guru') : 'Guru',
      namaTugas: '',
      skNomor: '',
      skTanggal: new Date().toISOString().split('T')[0],
      tahunPelajaran: tapelAktif,
      status: 'Aktif',
      keterangan: ''
    });
    setPersonelSearch('');
    setIsPersonelDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setFormData({
      guruId: item.guruId || '',
      namaPersonel: item.namaPersonel || '',
      kategori: item.kategori || 'Guru',
      namaTugas: item.namaTugas || '',
      skNomor: item.skNomor || '',
      skTanggal: item.skTanggal || new Date().toISOString().split('T')[0],
      tahunPelajaran: tapelAktif,
      status: item.status || 'Aktif',
      keterangan: item.keterangan || ''
    });
    setPersonelSearch('');
    setIsPersonelDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.namaPersonel || !formData.namaTugas) {
      showErrorAlert('Form Tidak Lengkap', 'Mohon pilih Personel Guru/Tendik dan isi Nama Tugas Tambahan.');
      return;
    }

    const payload = {
      ...formData,
      tahunPelajaran: tapelAktif
    };

    if (editItem) {
      updateTugasGTK(editItem.id, payload);
    } else {
      addTugasGTK(payload);
    }
    setIsModalOpen(false);
  };

  // Group tugasGTKList by Personel (1 Guru dengan beberapa tugas tambahan jadi 1 record data)
  const groupedTugasList = React.useMemo(() => {
    const map = new Map();
    (tugasGTKList || []).forEach(item => {
      const key = item.guruId || item.namaPersonel || item.id;
      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          guruId: item.guruId,
          namaPersonel: item.namaPersonel,
          kategori: item.kategori || 'Guru',
          tahunPelajaran: item.tahunPelajaran || tapelAktif,
          tugasList: []
        });
      }
      map.get(key).tugasList.push(item);
    });
    return Array.from(map.values());
  }, [tugasGTKList, tapelAktif]);

  // Filtered Grouped List
  const filteredGroupedList = groupedTugasList.filter(group => {
    const matchPersonel = (group.namaPersonel || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTugas = group.tugasList.some(t => 
      (t.namaTugas || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.skNomor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchSearch = matchPersonel || matchTugas;

    const matchKategori = filterKategori === 'Semua' || group.kategori === filterKategori;
    const matchStatus = filterStatus === 'Semua' || group.tugasList.some(t => t.status === filterStatus);

    return matchSearch && matchKategori && matchStatus;
  });

  // Calculate Statistics
  const totalTugas = (tugasGTKList || []).length;
  const totalPersonelTugas = groupedTugasList.length;
  const tugasGuruCount = (tugasGTKList || []).filter(t => t.kategori === 'Guru').length;
  const tugasTendikCount = (tugasGTKList || []).filter(t => t.kategori === 'Tendik').length;
  const tugasAktifCount = (tugasGTKList || []).filter(t => t.status === 'Aktif').length;

  // Export to Excel
  const handleExportExcel = () => {
    if (!tugasGTKList || tugasGTKList.length === 0) {
      showErrorAlert('Data Kosong', 'Tidak ada data Tugas GTK untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Nama Personel GTK',
      'Kategori',
      'Daftar Tugas Tambahan GTK',
      'Nomor SK',
      'Tanggal SK',
      'Tahun Pelajaran',
      'Status SK',
      'Keterangan'
    ];

    const rows = filteredGroupedList.map((group, index) => [
      index + 1,
      group.namaPersonel || '',
      group.kategori || 'Guru',
      group.tugasList.map(t => t.namaTugas).join(', '),
      group.tugasList.map(t => t.skNomor || '-').join(', '),
      group.tugasList.map(t => t.skTanggal || '-').join(', '),
      group.tahunPelajaran || '-',
      group.tugasList.map(t => t.status || 'Aktif').join(', '),
      group.tugasList.map(t => t.keterangan || '-').join(', ')
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 12 },
      { wch: 42 },
      { wch: 26 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 35 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tugas_GTK');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Data_Tugas_Tambahan_GTK_${dateStr}.xlsx`);
    showToast(`Berhasil mengekspor ${filteredGroupedList.length} data Personel Tugas GTK ke file Excel!`);
  };

  return (
    <div className="page-container">
      {/* Header Actions */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Award color="#4f46e5" size={28} /> Manajemen Tugas GTK
          </h1>
          <p className="page-subtitle">Kelola penugasan khusus & tugas tambahan Guru dan Tenaga Kependidikan (Wakasek, Kaprog, Pembina, Operator, dll.)</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportExcel}
            style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', fontWeight: 700 }}
            title="Ekspor Data Tugas GTK ke File Excel"
          >
            <Download size={18} />
            <span>Ekspor Excel</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Tambah Tugas GTK</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card-modern" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Personel Penerima Tugas</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{totalPersonelTugas} Personel ({totalTugas} Tugas)</div>
          </div>
        </div>

        <div className="card-modern" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7e22ce' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tugas Guru</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{tugasGuruCount}</div>
          </div>
        </div>

        <div className="card-modern" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369a1' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Tugas Tendik</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{tugasTendikCount}</div>
          </div>
        </div>

        <div className="card-modern" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>SK Aktif</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{tugasAktifCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-modern" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari nama personel, nama tugas, atau nomor SK..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', width: '100%' }}
            />
          </div>

          {/* Filter Kategori */}
          <select 
            className="form-control" 
            style={{ flex: '1 1 140px', maxWidth: '200px' }}
            value={filterKategori}
            onChange={e => setFilterKategori(e.target.value)}
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Guru">Guru</option>
            <option value="Tendik">Tendik</option>
          </select>

          {/* Filter Status */}
          <select 
            className="form-control" 
            style={{ flex: '1 1 140px', maxWidth: '200px' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="Semua">Semua Status SK</option>
            <option value="Aktif">Status: Aktif</option>
            <option value="Selesai">Status: Selesai / Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="table-responsive">
        <table className="table-modern">
          <thead>
            <tr>
              <th>No</th>
              <th>Personel GTK</th>
              <th>Tugas Tambahan</th>
              <th>Nomor & Tanggal SK</th>
              <th>Tapel</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroupedList.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  Tidak ada data Tugas GTK yang sesuai.
                </td>
              </tr>
            ) : (
              filteredGroupedList.map((group, idx) => {
                const foundGuruObj = guruTendikList.find(g => g.id === group.guruId || g.nama === group.namaPersonel);
                const isGuru = group.kategori === 'Guru';
                const idNumber = foundGuruObj 
                  ? ((foundGuruObj.nuptk && foundGuruObj.nuptk.trim()) || (foundGuruObj.nip && foundGuruObj.nip.trim()) || (foundGuruObj.nik && foundGuruObj.nik.trim()) || '-') 
                  : '-';

                return (
                  <tr key={group.groupKey || idx}>
                    <td style={{ fontWeight: 600, color: '#94a3b8', verticalAlign: 'top', paddingTop: '1.1rem' }}>{idx + 1}</td>
                    <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {foundGuruObj && foundGuruObj.foto ? (
                          <img 
                            src={foundGuruObj.foto} 
                            alt={group.namaPersonel} 
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              objectPosition: 'top center',
                              border: '2px solid #e2e8f0',
                              flexShrink: 0
                            }} 
                          />
                        ) : (
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: isGuru ? '#f3e8ff' : '#e0f2fe',
                            color: isGuru ? '#7e22ce' : '#0369a1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {String(group.namaPersonel || '?').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span>{group.namaPersonel}</span>
                            <span className={`badge badge-${group.kategori.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                              {group.kategori}
                            </span>
                            {group.tugasList.length > 1 && (
                              <span style={{ fontSize: '0.68rem', background: '#e0e7ff', color: '#3730a3', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
                                {group.tugasList.length} Tugas
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                            {idNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {group.tugasList.map((tugas, tIdx) => (
                          <div key={tugas.id || tIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <div style={{ 
                              fontWeight: 800, 
                              color: '#312e81', 
                              background: '#eef2ff', 
                              padding: '0.35rem 0.75rem', 
                              borderRadius: '8px',
                              border: '1px solid #c7d2fe',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.85rem'
                            }}>
                              <Award size={13} color="#4f46e5" />
                              <span>{tugas.namaTugas}</span>
                            </div>
                            {tugas.keterangan && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                ({tugas.keterangan})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {group.tugasList.map((tugas, tIdx) => (
                          <div key={tugas.id || tIdx} style={{ minHeight: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                              {tugas.skNomor || '-'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                              Tgl SK: {tugas.skTanggal || '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td style={{ verticalAlign: 'top', paddingTop: '1.1rem' }}>
                      <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                        {group.tahunPelajaran || '-'}
                      </span>
                    </td>

                    <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {group.tugasList.map((tugas, tIdx) => (
                          <div key={tugas.id || tIdx} style={{ minHeight: '30px', display: 'flex', alignItems: 'center' }}>
                            {tugas.status === 'Aktif' ? (
                              <span className="badge badge-hadir" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                                <CheckCircle2 size={12} /> SK Aktif
                              </span>
                            ) : (
                              <span className="badge badge-terlambat" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                                Selesai
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                        {group.tugasList.map((tugas, tIdx) => (
                          <div key={tugas.id || tIdx} style={{ minHeight: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                            <button 
                              className="btn-icon" 
                              title={`Edit ${tugas.namaTugas}`}
                              onClick={() => handleOpenEdit(tugas)}
                            >
                              <Edit size={15} />
                            </button>
                            <button 
                              className="btn-icon" 
                              title={`Hapus ${tugas.namaTugas}`}
                              onClick={() => {
                                showDeleteConfirm({
                                  title: 'Hapus Tugas GTK',
                                  itemName: `${tugas.namaTugas} (${group.namaPersonel})`,
                                  onConfirm: () => deleteTugasGTK(tugas.id)
                                });
                              }}
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsModalOpen(false); setIsPersonelDropdownOpen(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="#4f46e5" />
                <h3 className="modal-title">{editItem ? 'Edit Tugas Tambahan GTK' : 'Tambah Tugas Tambahan GTK Baru'}</h3>
              </div>
              <button className="btn-icon" onClick={() => { setIsModalOpen(false); setIsPersonelDropdownOpen(false); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                
                {/* Personel Selection with Auto-Searching and "Jabatan - Nama" format */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Pilih Guru / Tendik Penerima Tugas *</label>
                  
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', zIndex: 2, pointerEvents: 'none' }} />
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ketik untuk mencari Guru / Tendik (Jabatan - Nama)..." 
                      value={isPersonelDropdownOpen ? personelSearch : selectedPersonelLabel}
                      onFocus={() => {
                        setIsPersonelDropdownOpen(true);
                        setPersonelSearch('');
                      }}
                      onChange={e => {
                        setPersonelSearch(e.target.value);
                        if (!isPersonelDropdownOpen) setIsPersonelDropdownOpen(true);
                      }}
                      style={{
                        paddingLeft: '2.3rem',
                        paddingRight: '2.2rem',
                        fontWeight: isPersonelDropdownOpen ? 500 : 700,
                        color: isPersonelDropdownOpen ? '#0f172a' : '#1e293b',
                        background: isPersonelDropdownOpen ? '#ffffff' : '#f8fafc',
                        cursor: 'pointer'
                      }}
                    />
                    <ChevronDown 
                      size={18} 
                      color="#64748b" 
                      style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        zIndex: 2, 
                        pointerEvents: 'none',
                        transform: isPersonelDropdownOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  </div>

                  {/* Auto Searching Dropdown List */}
                  {isPersonelDropdownOpen && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 999,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        marginTop: '4px'
                      }}
                    >
                      {filteredPersonelList.length === 0 ? (
                        <div style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                          Tidak ditemukan Guru / Tendik yang sesuai dengan "{personelSearch}".
                        </div>
                      ) : (
                        filteredPersonelList.map(g => {
                          const displayLabel = `${g.jabatan || g.kategori || 'Guru'} - ${g.nama}`;
                          const isSelected = formData.guruId === g.id;

                          return (
                            <div
                              key={g.id}
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  guruId: g.id,
                                  namaPersonel: g.nama,
                                  kategori: g.kategori || 'Guru'
                                }));
                                setIsPersonelDropdownOpen(false);
                                setPersonelSearch('');
                              }}
                              style={{
                                padding: '0.65rem 1rem',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                background: isSelected ? '#eef2ff' : 'transparent',
                                color: isSelected ? '#4338ca' : '#1e293b',
                                fontWeight: isSelected ? 700 : 500,
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                            >
                              <span>{displayLabel}</span>
                              {isSelected && <Check size={16} color="#4f46e5" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Notification of existing tasks */}
                  {(() => {
                    const existingTasks = (tugasGTKList || []).filter(t => 
                      (t.guruId === formData.guruId || t.namaPersonel === formData.namaPersonel) && 
                      (!editItem || t.id !== editItem.id)
                    );
                    if (existingTasks.length === 0) return null;
                    return (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.78rem', color: '#1e40af' }}>
                        ℹ️ <strong>{formData.namaPersonel}</strong> saat ini sudah memiliki <strong>{existingTasks.length} tugas</strong> ({existingTasks.map(t => t.namaTugas).join(', ')}). Tugas baru ini akan otomatis digabungkan menjadi 1 record data personel tersebut.
                      </div>
                    );
                  })()}
                </div>

                {/* Nama Tugas Tambahan */}
                <div className="form-group">
                  <label className="form-label">Nama Tugas Tambahan GTK *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Wakil Kepala Sekolah Bidang Kurikulum" 
                    required
                    value={formData.namaTugas}
                    onChange={e => setFormData({ ...formData, namaTugas: e.target.value })}
                  />

                  {/* Preset quick selection buttons */}
                  <div style={{ marginTop: '0.6rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: '0.35rem' }}>
                      PILIHAN CEPAT (KLIK UNTUK MEMILIH):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {TUGAS_PRESETS.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, namaTugas: preset }))}
                          style={{
                            fontSize: '0.72rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            border: formData.namaTugas === preset ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                            background: formData.namaTugas === preset ? '#eef2ff' : '#f8fafc',
                            color: formData.namaTugas === preset ? '#4338ca' : '#475569',
                            fontWeight: formData.namaTugas === preset ? 700 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nomor SK Penugasan</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 800/015/SK-GTK/2025" 
                      value={formData.skNomor}
                      onChange={e => setFormData({ ...formData, skNomor: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tanggal SK</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={formData.skTanggal}
                      onChange={e => setFormData({ ...formData, skTanggal: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Read Only Tahun Pelajaran Aktif */}
                  <div className="form-group">
                    <label className="form-label">Tahun Pelajaran (Tapel)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={tapelAktif}
                      readOnly
                      style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status SK</label>
                    <select 
                      className="form-control"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Selesai">Selesai / Non-Aktif</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan / Rincian Tugas</label>
                  <textarea 
                    className="form-control" 
                    rows="2"
                    placeholder="Catatan tambahan mengenai rincian tugas..."
                    value={formData.keterangan}
                    onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  ></textarea>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setIsPersonelDropdownOpen(false); }}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Tugas GTK</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
