import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { PrintCardModal } from '../components/PrintCardModal';
import { ImportExcelModal } from '../components/ImportExcelModal';
import { showDeleteConfirm, showErrorAlert } from '../utils/sweetalert';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Printer, 
  Edit, 
  Trash2, 
  X, 
  QrCode,
  CheckCircle2,
  AlertCircle,
  Phone,
  FileSpreadsheet,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export const DataGuruPage = ({ isNonAktifView = false }) => {
  const { activeMenu, guruTendikList, addGuruTendik, updateGuruTendik, deleteGuruTendik, bulkAddGuruTendik, showToast } = useApp();

  const isTendikMode = activeMenu === 'data-tendik';
  const isNonAktifMode = isNonAktifView || activeMenu === 'gtk-nonaktif';

  const defaultKategori = isTendikMode ? 'Tendik' : 'Guru';
  const pageTitleText = isNonAktifMode 
    ? 'Data GTK Non-Aktif / Mutasi'
    : (isTendikMode ? 'Data Master Tenaga Kependidikan (Tendik)' : 'Data Master Guru');
  const pageSubtitleText = isNonAktifMode 
    ? 'Daftar Guru & Tenaga Kependidikan yang berstatus Non-Aktif, Mutasi, atau Pensiun'
    : (isTendikMode 
      ? 'Kelola informasi staf tata usaha, pustakawan, laboratorium, dan tenaga kependidikan sekolah'
      : 'Kelola informasi pengajar & guru mata pelajaran sekolah serta cetak ID Card QR Code');
  const addButtonText = isTendikMode ? 'Tambah Staf Tendik' : 'Tambah Guru';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [sortBy, setSortBy] = useState('nama_asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [printCardItem, setPrintCardItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    nuptk: '',
    nip: '',
    nik: '',
    kategori: defaultKategori,
    jabatan: '',
    noHp: '',
    alamat: '',
    foto: '',
    status: isNonAktifMode ? 'Non-Aktif' : 'Aktif',
    alasanNonAktif: '',
    tglNonAktif: new Date().toISOString().slice(0, 10)
  });

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({
      nama: '',
      nuptk: '',
      nip: '',
      nik: '',
      kategori: defaultKategori,
      jabatan: '',
      noHp: '',
      alamat: '',
      foto: '',
      status: isNonAktifMode ? 'Non-Aktif' : 'Aktif',
      alasanNonAktif: '',
      tglNonAktif: new Date().toISOString().slice(0, 10)
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setFormData({
      nama: item.nama || '',
      nuptk: item.nuptk || '',
      nip: item.nip || '',
      nik: item.nik || '',
      kategori: item.kategori || defaultKategori,
      jabatan: item.jabatan || '',
      noHp: item.no_hp || item.noHp || '',
      alamat: item.alamat || '',
      foto: item.foto || '',
      status: item.status || 'Aktif',
      alasanNonAktif: item.alasan_nonaktif || item.alasanNonAktif || '',
      tglNonAktif: item.tgl_nonaktif || item.tglNonAktif || new Date().toISOString().slice(0, 10)
    });
    setIsFormModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 400;
        if (width > height) {
          if (width > max_size) {
            height = Math.round((height * max_size) / width);
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width = Math.round((width * max_size) / height);
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, foto: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanNama = (formData.nama || '').trim();
    const cleanNik = (formData.nik || '').trim();
    const cleanNuptk = (formData.nuptk || '').trim();

    if (!cleanNama || !cleanNik) {
      showErrorAlert('Form Tidak Lengkap', 'Mohon lengkapi Nama dan NIK.');
      return;
    }

    if (cleanNuptk) {
      const dupNuptk = (guruTendikList || []).find(g => 
        g.nuptk && g.nuptk.trim() === cleanNuptk && (!editItem || g.id !== editItem.id)
      );
      if (dupNuptk) {
        showErrorAlert('NUPTK Sudah Terdaftar!', `NUPTK "${cleanNuptk}" sudah digunakan oleh: ${dupNuptk.nama}.`);
        return;
      }
    }

    if (editItem) {
      updateGuruTendik(editItem.id, formData);
    } else {
      addGuruTendik(formData);
    }

    setIsFormModalOpen(false);
  };

  // Filtered List
  const filteredList = (guruTendikList || []).filter(item => {
    const matchSearch = (item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.nuptk || '').includes(searchTerm) ||
                        (item.nip || '').includes(searchTerm) ||
                        (item.jabatan || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchKategori = isNonAktifMode 
      ? true 
      : (isTendikMode ? item.kategori === 'Tendik' : (item.kategori === 'Guru' || !item.kategori));

    const matchStatus = isNonAktifMode 
      ? (item.status === 'Non-Aktif' || item.status === 'Pensiun' || item.status === 'Mutasi' || item.status === 'Non Aktif')
      : (item.status !== 'Non-Aktif' && item.status !== 'Pensiun' && item.status !== 'Mutasi' && item.status !== 'Non Aktif');

    return matchSearch && matchKategori && matchStatus;
  });

  // Sorted List
  const sortedList = [...filteredList].sort((a, b) => {
    if (sortBy === 'nama_asc') {
      return (a.nama || '').trim().localeCompare((b.nama || '').trim(), undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'nama_desc') {
      return (b.nama || '').trim().localeCompare((a.nama || '').trim(), undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'kategori') {
      const kCmp = (a.kategori || '').localeCompare((b.kategori || ''));
      if (kCmp !== 0) return kCmp;
      return (a.nama || '').trim().localeCompare((b.nama || '').trim());
    }
    return 0;
  });

  // Pagination calculation
  const totalItems = sortedList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedList = sortedList.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validCurrentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (validCurrentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = validCurrentPage - 1; i <= validCurrentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleExportExcel = () => {
    if (!guruTendikList || guruTendikList.length === 0) {
      showErrorAlert('Data Kosong', 'Tidak ada data guru atau tendik untuk diekspor.');
      return;
    }

    const dataToExport = sortedList.length > 0 ? sortedList : guruTendikList;

    const headers = [
      'No',
      'NIP',
      'NUPTK',
      'Nama Lengkap',
      'Kategori',
      'Jabatan',
      'Jenis Kelamin',
      'Status',
      'No WhatsApp / HP',
      'Alamat',
      'QR Code ID'
    ];

    const rows = dataToExport.map((item, index) => [
      index + 1,
      { t: 's', v: String(item.nip || '') },
      { t: 's', v: String(item.nuptk || '') },
      item.nama || '',
      item.kategori || (isTendikMode ? 'Tendik' : 'Guru'),
      item.jabatan || '',
      item.gender === 'P' ? 'Perempuan' : 'Laki-Laki',
      item.status || 'Aktif',
      { t: 's', v: String(item.noHp || '') },
      item.alamat || '',
      { t: 's', v: String(item.qrCode || '') }
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 22 },
      { wch: 28 },
      { wch: 12 },
      { wch: 24 },
      { wch: 15 },
      { wch: 10 },
      { wch: 18 },
      { wch: 35 },
      { wch: 24 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Personel');

    const dateStr = new Date().toISOString().slice(0, 10);
    const katSuffix = isTendikMode ? '_Tendik' : '_Guru';
    XLSX.writeFile(wb, `Data${katSuffix}_${dateStr}.xlsx`);
    showToast(`Berhasil mengekspor ${dataToExport.length} data personel ke file Excel (.xlsx)!`);
  };

  return (
    <div className="page-container">
      {/* Header Actions */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserCheck color="#4f46e5" size={28} /> {pageTitleText}
          </h1>
          <p className="page-subtitle">{pageSubtitleText}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportExcel}
            style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', fontWeight: 700 }}
            title="Ekspor Data ke File Excel (.xlsx)"
          >
            <Download size={18} />
            <span>Ekspor Excel</span>
          </button>
          <button className="btn btn-success" onClick={() => setIsImportModalOpen(true)}>
            <FileSpreadsheet size={18} />
            <span>Import Excel</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>{addButtonText}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar with Quick Pagination */}
      <div className="card-modern" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Top Row: Search & Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Cari nama, NIP, atau jabatan..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '2.4rem', width: '100%' }}
            />
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 200px', maxWidth: '300px' }}>
            <ArrowUpDown size={16} color="#64748b" style={{ flexShrink: 0 }} />
            <select 
              className="form-control" 
              style={{ width: '100%' }}
              value={sortBy}
              onChange={e => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="nama_asc">Urut: Nama Personel (A-Z)</option>
              <option value="nama_desc">Urut: Nama Personel (Z-A)</option>
              <option value="kategori">Urut: Kategori (Guru/Tendik)</option>
              <option value="nip_asc">Urut: Nomor NIP (0-9)</option>
            </select>
          </div>
        </div>

        {/* Bottom Row: Pagination & Size Info */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b' }}>
            <span>Per Hal:</span>
            <select 
              className="form-control" 
              style={{ width: '80px', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
            Total: <strong style={{ color: '#4f46e5' }}>{totalItems}</strong> Personel (Hal {validCurrentPage}/{totalPages})
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="table-responsive">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Personel</th>
              <th>NIK</th>
              <th>NIP</th>
              <th>Kategori</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  Tidak ada data Guru atau Tendik yang sesuai.
                </td>
              </tr>
            ) : (
              paginatedList.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.foto ? (
                        <img 
                          src={item.foto} 
                          alt={item.nama} 
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            objectPosition: 'top center',
                            border: '1.5px solid #cbd5e1'
                          }} 
                        />
                      ) : (
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: item.kategori === 'Guru' ? '#f3e8ff' : '#e0f2fe',
                          color: item.kategori === 'Guru' ? '#7e22ce' : '#0369a1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}>
                          {String(item.nama || '?').charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.nama}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.1rem', fontFamily: 'monospace' }}>
                          {item.nuptk || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.nik || '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.nip || '-'}</td>
                  <td>
                    <div>
                      <span className={`badge badge-${item.kategori.toLowerCase()}`}>
                        {item.kategori}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span 
                      className={`badge ${item.status === 'Non-Aktif' || item.status === 'Non Aktif' ? 'badge-alfa' : 'badge-hadir'}`} 
                      style={{ textTransform: 'capitalize' }}
                    >
                      {item.status === 'Non-Aktif' || item.status === 'Non Aktif' ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />} {item.status}
                    </span>
                    {(item.alasan_nonaktif || item.alasanNonAktif) && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem', fontWeight: 600 }}>
                        {item.alasan_nonaktif || item.alasanNonAktif} {item.tgl_nonaktif || item.tglNonAktif ? `(${item.tgl_nonaktif || item.tglNonAktif})` : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <button 
                        className="btn-icon" 
                        title="Cetak ID Card QR"
                        onClick={() => setPrintCardItem(item)}
                        style={{ color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
                      >
                        <Printer size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Edit Data"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Hapus Data"
                        onClick={() => {
                          showDeleteConfirm({
                            title: 'Hapus Data Guru / Tendik',
                            itemName: item.nama,
                            onConfirm: () => deleteGuruTendik(item.id)
                          });
                        }}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalItems > 0 && (
        <div className="card-modern" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          marginTop: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Left: Entries Info */}
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Menampilkan <strong style={{ color: '#0f172a' }}>{startIndex + 1}</strong> - <strong style={{ color: '#0f172a' }}>{Math.min(startIndex + pageSize, totalItems)}</strong> dari <strong style={{ color: '#4f46e5' }}>{totalItems}</strong> personel
          </div>

          {/* Center: Page Size Selector (10, 25, 50, 100) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            <span>Tampilkan:</span>
            <select 
              className="form-control" 
              style={{ width: '90px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>data per halaman</span>
          </div>

          {/* Right: Pagination Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', opacity: validCurrentPage === 1 ? 0.4 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="Halaman Pertama"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', opacity: validCurrentPage === 1 ? 0.4 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((p, idx) => (
              p === '...' ? (
                <span key={`dots-${idx}`} style={{ padding: '0 0.35rem', color: '#94a3b8', fontSize: '0.85rem' }}>...</span>
              ) : (
                <button
                  key={`page-${p}`}
                  className={`btn ${validCurrentPage === p ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    padding: '0.35rem 0.75rem', 
                    fontSize: '0.8rem', 
                    minWidth: '32px',
                    fontWeight: validCurrentPage === p ? 800 : 500
                  }}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              )
            ))}

            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', opacity: validCurrentPage === totalPages ? 0.4 : 1, cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
              disabled={validCurrentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              title="Halaman Selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', opacity: validCurrentPage === totalPages ? 0.4 : 1, cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
              disabled={validCurrentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Halaman Terakhir"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Form Add/Edit */}
      {isFormModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editItem 
                  ? (isTendikMode ? 'Edit Data Tendik' : 'Edit Data Guru') 
                  : (isTendikMode ? 'Tambah Tendik Baru' : 'Tambah Guru Baru')}
              </h3>
              <button className="btn-icon" onClick={() => setIsFormModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Photo Upload at Top */}
                <div className="form-group" style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>Foto Profil ID Card</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem' }}>
                    {formData.foto ? (
                      <img 
                        src={formData.foto} 
                        alt="Preview" 
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'top center', border: '2px solid #4f46e5' }}
                      />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.7rem', fontWeight: 700 }}>
                        Foto
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="form-control" 
                        onChange={handleFileChange}
                        style={{ fontSize: '0.85rem', background: 'white' }}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Pilih berkas foto formal (.jpg, .png, .jpeg). Maksimal 2MB.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Lengkap & Gelar *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Budi Santoso, S.Pd" 
                    required
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Kategori Staf</label>
                    <select 
                      className="form-control"
                      value={formData.kategori}
                      onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                    >
                      <option value="Guru">Guru</option>
                      <option value="Tendik">Tendik</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jabatan *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Guru Matematika" 
                      required
                      value={formData.jabatan}
                      onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jenis Kelamin</label>
                    <select 
                      className="form-control"
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="L">Laki-Laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">NIK *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="320..." 
                      required
                      value={formData.nik}
                      onChange={e => setFormData({ ...formData, nik: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">NIP</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="19850101..." 
                      value={formData.nip}
                      onChange={e => setFormData({ ...formData, nip: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">NUPTK</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="85347636..." 
                      value={formData.nuptk}
                      onChange={e => setFormData({ ...formData, nuptk: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">No. WhatsApp / HP</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="081234567..." 
                      value={formData.noHp}
                      onChange={e => setFormData({ ...formData, noHp: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alamat Tempat Tinggal</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Jl. Pemuda No. 15, Kota..." 
                      value={formData.alamat}
                      onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                    />
                  </div>
                </div>

                {/* Status Keaktifan & Conditional Fields */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: (formData.status === 'Non-Aktif' || formData.status === 'Non Aktif') ? '1rem' : 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>Status Keaktifan Staf *</label>
                    <select 
                      className="form-control"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      style={{ fontWeight: 700, color: (formData.status === 'Non-Aktif' || formData.status === 'Non Aktif') ? '#ef4444' : '#16a34a' }}
                    >
                      <option value="Aktif">Aktif (Masih Bertugas)</option>
                      <option value="Non-Aktif">Non-Aktif (Pensiun / Mutasi / Resign / Dll)</option>
                    </select>
                  </div>

                  {(formData.status === 'Non-Aktif' || formData.status === 'Non Aktif') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#fef2f2', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fecaca' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700, color: '#991b1b' }}>Alasan Non-Aktif *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="e.g. Pensiun / Mutasi / Resign" 
                          required={formData.status === 'Non-Aktif' || formData.status === 'Non Aktif'}
                          value={formData.alasanNonAktif}
                          onChange={e => setFormData({ ...formData, alasanNonAktif: e.target.value })}
                          style={{ background: 'white' }}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontWeight: 700, color: '#991b1b' }}>Tanggal Non-Aktif *</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          required={formData.status === 'Non-Aktif' || formData.status === 'Non Aktif'}
                          value={formData.tglNonAktif}
                          onChange={e => setFormData({ ...formData, tglNonAktif: e.target.value })}
                          style={{ background: 'white' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Print Card */}
      {printCardItem && (
        <PrintCardModal 
          item={printCardItem}
          type={printCardItem.kategori}
          onClose={() => setPrintCardItem(null)}
        />
      )}

      {/* Modal Import Excel */}
      <ImportExcelModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title={`Import Data ${isTendikMode ? 'Tendik (Tenaga Kependidikan)' : 'Guru'} dari File Excel`}
        type="guru"
        defaultKategori={isTendikMode ? 'Tendik' : 'Guru'}
        onImport={(items) => {
          const targetKat = isTendikMode ? 'Tendik' : 'Guru';
          const mapped = items.map(item => ({
            ...item,
            kategori: item.kategori || targetKat
          }));
          bulkAddGuruTendik(mapped, targetKat);
        }}
      />
    </div>
  );
};
