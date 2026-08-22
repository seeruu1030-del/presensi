import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { showDeleteConfirm, showErrorAlert } from '../utils/sweetalert';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Download, 
  GraduationCap, 
  CheckCircle2, 
  Check,
  ChevronDown,
  Award
} from 'lucide-react';

export const TugasSiswaPage = () => {
  const { 
    tugasSiswaList, 
    addTugasSiswa, 
    updateTugasSiswa, 
    deleteTugasSiswa, 
    siswaList, 
    kelasList,
    getTapelAktif, 
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form State & Class Selection State
  const [selectedKelas, setSelectedKelas] = useState('');
  const [siswaSearch, setSiswaSearch] = useState('');
  const [isSiswaDropdownOpen, setIsSiswaDropdownOpen] = useState(false);

  const tapelAktif = getTapelAktif() || '2025/2026';

  // Extract unique class list
  const uniqueClassNames = Array.from(new Set([
    ...(kelasList || []).map(k => typeof k === 'object' ? k.nama : k),
    ...(siswaList || []).map(s => (s.kelas && typeof s.kelas === 'object') ? s.kelas.nama : (s.kelas || ''))
  ].filter(Boolean))).sort();

  const [formData, setFormData] = useState({
    siswaId: '',
    namaSiswa: '',
    kelas: '',
    namaTugas: '',
    skNomor: '',
    skTanggal: new Date().toISOString().split('T')[0],
    tahunPelajaran: tapelAktif,
    status: 'Aktif',
    keterangan: ''
  });

  // Students in selected class
  const studentsInSelectedKelas = (siswaList || []).filter(s => {
    if (!selectedKelas) return false;
    const klsNama = (s.kelas && typeof s.kelas === 'object') ? s.kelas.nama : (s.kelas || '');
    return klsNama === selectedKelas;
  });

  // Filtered Siswa List for Combobox Dropdown
  const filteredSiswaList = studentsInSelectedKelas.filter(s => {
    const label = `${s.nama} ${s.nisn || ''}`.toLowerCase();
    const query = siswaSearch.toLowerCase();
    return label.includes(query);
  });

  const selectedSiswaObj = (siswaList || []).find(s => s.id === formData.siswaId);
  const selectedSiswaLabel = selectedSiswaObj 
    ? `${selectedSiswaObj.nama} (NISN: ${selectedSiswaObj.nisn || '-'})`
    : (formData.namaSiswa ? formData.namaSiswa : '');

  // Preset Tugas Peserta Didik choices
  const TUGAS_PRESETS = [
    'Ketua Kelas',
    'Wakil Ketua Kelas',
    'Sekretaris Kelas',
    'Bendahara Kelas',
    'Ketua OSIS',
    'Wakil Ketua OSIS',
    'Pengurus OSIS & MPK',
    'Ketua Ekstrakurikuler Pramuka',
    'Ketua Ekstrakurikuler Paskibra',
    'Tim Piket Kebersihan Sekolah'
  ];

  const handleOpenAdd = () => {
    setEditItem(null);
    setSelectedKelas('');
    setFormData({
      siswaId: '',
      namaSiswa: '',
      kelas: '',
      namaTugas: '',
      skNomor: '',
      skTanggal: new Date().toISOString().split('T')[0],
      tahunPelajaran: tapelAktif,
      status: 'Aktif',
      keterangan: ''
    });
    setSiswaSearch('');
    setIsSiswaDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setSelectedKelas(item.kelas || '');
    setFormData({
      siswaId: item.siswaId || '',
      namaSiswa: item.namaSiswa || '',
      kelas: item.kelas || '',
      namaTugas: item.namaTugas || '',
      skNomor: item.skNomor || '',
      skTanggal: item.skTanggal || new Date().toISOString().split('T')[0],
      tahunPelajaran: tapelAktif,
      status: item.status || 'Aktif',
      keterangan: item.keterangan || ''
    });
    setSiswaSearch('');
    setIsSiswaDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleKelasChange = (kls) => {
    setSelectedKelas(kls);
    setFormData(prev => ({
      ...prev,
      kelas: kls,
      siswaId: '',
      namaSiswa: ''
    }));
    setSiswaSearch('');
    setIsSiswaDropdownOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.namaSiswa || !formData.namaTugas) {
      showErrorAlert('Form Tidak Lengkap', 'Mohon pilih Kelas, Peserta Didik, dan isi Nama Tugas.');
      return;
    }

    const payload = {
      ...formData,
      tahunPelajaran: tapelAktif
    };

    if (editItem) {
      if (updateTugasSiswa) updateTugasSiswa(editItem.id, payload);
    } else {
      if (addTugasSiswa) addTugasSiswa(payload);
    }
    setIsModalOpen(false);
  };

  // Group tugasSiswaList by Siswa (1 Siswa dengan beberapa tugas tambahan jadi 1 record data)
  const groupedTugasSiswaList = React.useMemo(() => {
    const map = new Map();
    (tugasSiswaList || []).forEach(item => {
      const key = item.siswaId || item.namaSiswa || item.id;
      if (!map.has(key)) {
        map.set(key, {
          groupKey: key,
          siswaId: item.siswaId,
          namaSiswa: item.namaSiswa,
          kelas: item.kelas || '',
          tahunPelajaran: item.tahunPelajaran || tapelAktif,
          tugasList: []
        });
      }
      map.get(key).tugasList.push(item);
    });
    return Array.from(map.values());
  }, [tugasSiswaList, tapelAktif]);

  // Filtered List
  const filteredGroupedSiswaList = groupedTugasSiswaList.filter(group => {
    const matchStudent = (group.namaSiswa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (group.kelas || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTugas = group.tugasList.some(t => 
      (t.namaTugas || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.skNomor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.keterangan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchSearch = matchStudent || matchTugas;
    const matchStatus = filterStatus === 'Semua' || group.tugasList.some(t => t.status === filterStatus);
    return matchSearch && matchStatus;
  });

  const totalTugas = (tugasSiswaList || []).length;
  const totalSiswaPenerimaTugas = groupedTugasSiswaList.length;
  const tugasAktifCount = (tugasSiswaList || []).filter(t => t.status === 'Aktif').length;

  // Export to Excel
  const handleExportExcel = () => {
    if (!tugasSiswaList || tugasSiswaList.length === 0) {
      showErrorAlert('Data Kosong', 'Tidak ada data Tugas Peserta Didik untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Nama Peserta Didik',
      'Kelas',
      'Daftar Tugas / Jabatan',
      'Nomor SK',
      'Tanggal SK',
      'Tahun Pelajaran',
      'Status SK',
      'Keterangan'
    ];

    const rows = filteredGroupedSiswaList.map((group, index) => [
      index + 1,
      group.namaSiswa || '',
      group.kelas || '-',
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
      { wch: 40 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 30 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tugas_Peserta_Didik');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Data_Tugas_Peserta_Didik_${dateStr}.xlsx`);
    showToast(`Berhasil mengekspor ${filteredGroupedSiswaList.length} data Peserta Didik ke file Excel!`);
  };

  return (
    <div className="page-container">
      {/* Header Actions */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Briefcase color="#4f46e5" size={28} /> Tugas Peserta Didik
          </h1>
          <p className="page-subtitle">Kelola penugasan khusus & jabatan peserta didik (Ketua Kelas, Pengurus OSIS, MPK, Pembina Ekstrakulikuler, dll.)</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportExcel}
            style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', fontWeight: 700 }}
            title="Ekspor Data Tugas Peserta Didik ke File Excel"
          >
            <Download size={18} />
            <span>Ekspor Excel</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Tambah Tugas Siswa</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="card-modern" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Peserta Didik Bertugas</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{totalSiswaPenerimaTugas} Siswa ({totalTugas} Tugas)</div>
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
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari nama peserta didik, tugas, atau nomor SK..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.4rem', width: '100%' }}
            />
          </div>

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
              <th>Peserta Didik</th>
              <th>Tugas / Jabatan</th>
              <th>Nomor & Tanggal SK</th>
              <th>Tapel</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroupedSiswaList.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  Tidak ada data Tugas Peserta Didik yang sesuai.
                </td>
              </tr>
            ) : (
              filteredGroupedSiswaList.map((group, idx) => {
                const foundSiswaObj = siswaList.find(s => s.id === group.siswaId || s.nama === group.namaSiswa);
                const nisn = foundSiswaObj ? foundSiswaObj.nisn : '-';

                return (
                  <tr key={group.groupKey || idx}>
                    <td style={{ fontWeight: 600, color: '#94a3b8', verticalAlign: 'top', paddingTop: '1.1rem' }}>{idx + 1}</td>
                    <td style={{ verticalAlign: 'top', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {foundSiswaObj && foundSiswaObj.foto ? (
                          <img 
                            src={foundSiswaObj.foto} 
                            alt={group.namaSiswa} 
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
                            background: '#e0e7ff',
                            color: '#4338ca',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {String(group.namaSiswa || '?').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span>{group.namaSiswa}</span>
                            <span className="badge badge-siswa" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                              {group.kelas || '-'}
                            </span>
                            {group.tugasList.length > 1 && (
                              <span style={{ fontSize: '0.68rem', background: '#e0e7ff', color: '#3730a3', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
                                {group.tugasList.length} Tugas
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                            NISN: {nisn}
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
                              <Briefcase size={13} color="#4f46e5" />
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
                                  title: 'Hapus Tugas Peserta Didik',
                                  itemName: `${tugas.namaTugas} (${group.namaSiswa})`,
                                  onConfirm: () => deleteTugasSiswa && deleteTugasSiswa(tugas.id)
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
        <div className="modal-overlay" onClick={() => { setIsModalOpen(false); setIsSiswaDropdownOpen(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={20} color="#4f46e5" />
                <h3 className="modal-title">{editItem ? 'Edit Tugas Peserta Didik' : 'Tambah Tugas Peserta Didik Baru'}</h3>
              </div>
              <button className="btn-icon" onClick={() => { setIsModalOpen(false); setIsSiswaDropdownOpen(false); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                
                {/* 1. Pilih Kelas Selection */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Pilih Kelas *</label>
                  <select 
                    className="form-control"
                    value={selectedKelas}
                    onChange={e => handleKelasChange(e.target.value)}
                    required
                    style={{ fontWeight: 600, color: selectedKelas ? '#0f172a' : '#64748b' }}
                  >
                    <option value="">-- Pilih Kelas Terlebih Dahulu --</option>
                    {uniqueClassNames.map((kls, kIdx) => (
                      <option key={kIdx} value={kls}>
                        Kelas {kls}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Pilih Peserta Didik Selection with Auto-Searching */}
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Pilih Peserta Didik Penerima Tugas *</label>
                  
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', zIndex: 2, pointerEvents: 'none' }} />
                    <input 
                      type="text" 
                      className="form-control" 
                      disabled={!selectedKelas}
                      placeholder={selectedKelas ? `Ketik untuk mencari nama siswa di Kelas ${selectedKelas}...` : "Pilih Kelas terlebih dahulu di atas..."}
                      value={isSiswaDropdownOpen ? siswaSearch : selectedSiswaLabel}
                      onFocus={() => {
                        if (!selectedKelas) return;
                        setIsSiswaDropdownOpen(true);
                        setSiswaSearch('');
                      }}
                      onChange={e => {
                        if (!selectedKelas) return;
                        setSiswaSearch(e.target.value);
                        if (!isSiswaDropdownOpen) setIsSiswaDropdownOpen(true);
                      }}
                      style={{
                        paddingLeft: '2.3rem',
                        paddingRight: '2.2rem',
                        fontWeight: isSiswaDropdownOpen ? 500 : 700,
                        color: isSiswaDropdownOpen ? '#0f172a' : '#1e293b',
                        background: !selectedKelas ? '#f1f5f9' : (isSiswaDropdownOpen ? '#ffffff' : '#f8fafc'),
                        cursor: !selectedKelas ? 'not-allowed' : 'pointer'
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
                        transform: isSiswaDropdownOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  </div>

                  {/* Auto Searching Dropdown List */}
                  {isSiswaDropdownOpen && selectedKelas && (
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
                      {filteredSiswaList.length === 0 ? (
                        <div style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                          {studentsInSelectedKelas.length === 0 
                            ? `Belum ada data siswa yang terdaftar di Kelas ${selectedKelas}.`
                            : `Tidak ditemukan siswa di Kelas ${selectedKelas} yang sesuai dengan "${siswaSearch}".`}
                        </div>
                      ) : (
                        filteredSiswaList.map(s => {
                          const displayLabel = `${s.nama} - (NISN: ${s.nisn || '-'})`;
                          const isSelected = formData.siswaId === s.id;

                          return (
                            <div
                              key={s.id}
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  siswaId: s.id,
                                  namaSiswa: s.nama,
                                  kelas: selectedKelas
                                }));
                                setIsSiswaDropdownOpen(false);
                                setSiswaSearch('');
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
                </div>

                {/* Nama Tugas Tambahan */}
                <div className="form-group">
                  <label className="form-label">Nama Tugas / Jabatan Peserta Didik *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Ketua Kelas 10-A / Ketua OSIS" 
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
                      placeholder="e.g. 421.5/028/SK-OSIS/2025" 
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
                    placeholder="Catatan rincian tugas peserta didik..."
                    value={formData.keterangan}
                    onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  ></textarea>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setIsSiswaDropdownOpen(false); }}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Tugas Siswa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
