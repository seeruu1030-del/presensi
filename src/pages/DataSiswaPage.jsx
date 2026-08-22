import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { PrintCardModal } from '../components/PrintCardModal';
import { ImportExcelModal } from '../components/ImportExcelModal';
import { showDeleteConfirm, showErrorAlert } from '../utils/sweetalert';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Printer, 
  Edit, 
  Trash2, 
  X, 
  QrCode,
  Filter,
  Phone,
  Sparkles,
  FileSpreadsheet,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export const DataSiswaPage = ({ isNonAktifView = false }) => {
  const { 
    activeMenu, 
    siswaList, 
    kelasList, 
    addSiswa, 
    updateSiswa, 
    deleteSiswa, 
    bulkAddSiswa, 
    bulkDeleteSiswa, 
    deleteAllSiswa, 
    getSiswaActiveRombel,
    showToast, 
    getTapelAktif, 
    semesterAktif 
  } = useApp();

  const isNonAktifMode = isNonAktifView || activeMenu === 'siswa-nonaktif';

  const pageTitleText = isNonAktifMode 
    ? 'Data Peserta Didik Non-Aktif / Lulus / Mutasi'
    : 'Data Master Peserta Didik';
  const pageSubtitleText = isNonAktifMode 
    ? 'Daftar Peserta Didik yang berstatus Non-Aktif, Lulus / Alumnus, atau Mutasi'
    : 'Kelola informasi identitas & kelas siswa serta cetak Kartu Pelajar ber-QR Code';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [sortBy, setSortBy] = useState('kelas_nama');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState([]);
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [printCardItem, setPrintCardItem] = useState(null);
  
  const handleBulkDelete = () => {
    if (selectedSiswaIds.length === 0) return;
    showDeleteConfirm({
      title: 'Hapus Siswa Terpilih',
      itemName: `${selectedSiswaIds.length} data siswa terpilih`,
      confirmButtonText: 'Ya, Hapus Terpilih',
      onConfirm: async () => {
        const ok = await bulkDeleteSiswa(selectedSiswaIds);
        if (ok) setSelectedSiswaIds([]);
      }
    });
  };

  const handleDeleteAll = () => {
    if (!siswaList || siswaList.length === 0) return;
    showDeleteConfirm({
      title: 'Hapus Semua Data Siswa',
      itemName: `seluruh ${siswaList.length} data siswa`,
      confirmButtonText: 'Ya, Hapus Semua Data',
      onConfirm: async () => {
        const ok = await deleteAllSiswa();
        if (ok) setSelectedSiswaIds([]);
      }
    });
  };

  // Form state
  const [formData, setFormData] = useState({
    nisn: '',
    nama: '',
    kelas: '',
    gender: 'L',
    orangTua: '',
    noHp: '',
    alamat: '',
    foto: '',
    status: isNonAktifMode ? 'Non-Aktif' : 'Aktif'
  });

  // Filter kelas berdasarkan tapel dan semester aktif
  const tapelAktif = getTapelAktif();
  const kelasAktifList = kelasList.filter(kls => {
    const klsTapel = kls.tapel || '';
    const klsSem = kls.semester || semesterAktif || 'Ganjil';
    return klsTapel === tapelAktif && klsSem === (semesterAktif || 'Ganjil');
  });
  // Fallback: jika tidak ada kelas aktif, tampilkan semua kelas (agar tidak kosong)
  const kelasFilterList = kelasAktifList.length > 0 ? kelasAktifList : kelasList;

  const defaultKelas = kelasFilterList.length > 0 ? kelasFilterList[0].nama : 'X IPA 1';

  // Helper untuk menentukan Rombel aktif siswa yang strictly sesuai TP & Semester aktif
  const getActiveRombel = (item) => {
    if (getSiswaActiveRombel) {
      return getSiswaActiveRombel(item, tapelAktif, semesterAktif, kelasList);
    }
    const kls = (item?.kelas && typeof item.kelas === 'object') ? item.kelas : (kelasList || []).find(k => k.id === item?.kelas_id);
    if (kls && (kls.tapel || tapelAktif) === tapelAktif && (kls.semester || semesterAktif || 'Ganjil') === (semesterAktif || 'Ganjil')) {
      return kls.nama;
    }
    return null;
  };

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({
      nisn: '',
      nama: '',
      kelas: defaultKelas,
      gender: 'L',
      orangTua: '',
      noHp: '',
      alamat: '',
      foto: '',
      status: isNonAktifMode ? 'Non-Aktif' : 'Aktif'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    const activeKls = getActiveRombel(item);
    setEditItem(item);
    setFormData({
      nisn: item.nisn || '',
      nama: item.nama || '',
      kelas: activeKls || (item.kelas && typeof item.kelas === 'object' ? item.kelas.nama : item.kelas) || defaultKelas,
      gender: item.gender || 'L',
      orangTua: item.orangTua || item.orang_tua || '',
      noHp: item.noHp || item.no_hp || '',
      alamat: item.alamat || '',
      foto: item.foto || '',
      status: item.status || 'Aktif'
    });
    setIsFormModalOpen(true);
  };

  const handlePhotoUpload = (e) => {
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
    const cleanNisn = (formData.nisn || '').trim();
    const cleanNama = (formData.nama || '').trim();

    if (!cleanNisn || !cleanNama) {
      showErrorAlert('Form Tidak Lengkap', 'Mohon lengkapi NISN dan Nama Siswa.');
      return;
    }

    // Check duplicate NISN
    const duplicate = (siswaList || []).find(s => 
      s.nisn && s.nisn.trim() === cleanNisn && (!editItem || s.id !== editItem.id)
    );

    if (duplicate) {
      showErrorAlert('NISN Sudah Terdaftar!', `NISN "${cleanNisn}" sudah digunakan oleh siswa: ${duplicate.nama} (${duplicate.kelas}).`);
      return;
    }

    if (editItem) {
      updateSiswa(editItem.id, formData);
    } else {
      addSiswa(formData);
    }
    setIsFormModalOpen(false);
  };

  // Filtered List berdasarkan rombel aktif pada TP & Semester aktif
  const filteredList = (siswaList || []).filter(item => {
    const activeKls = getActiveRombel(item);
    const displayKlsName = activeKls || 'Tanpa Kelas';
    
    const matchSearch = String(item.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        String(item.nisn || '').includes(searchTerm) ||
                        displayKlsName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = filterKelas === 'Semua' || activeKls === filterKelas || (filterKelas === 'Tanpa Kelas' && !activeKls);
    
    const statusVal = item.status || 'Aktif';
    const matchStatus = isNonAktifMode 
      ? (statusVal === 'Non-Aktif' || statusVal === 'Lulus' || statusVal === 'Mutasi' || statusVal === 'Non Aktif')
      : (statusVal !== 'Non-Aktif' && statusVal !== 'Lulus' && statusVal !== 'Mutasi' && statusVal !== 'Non Aktif');

    return matchSearch && matchKelas && matchStatus;
  });

  // Sorted List (By default Kelas lalu Nama)
  const sortedList = [...filteredList].sort((a, b) => {
    const klsA = getActiveRombel(a) || 'ZZZ_TanpaKelas';
    const klsB = getActiveRombel(b) || 'ZZZ_TanpaKelas';
    
    if (sortBy === 'kelas_nama') {
      const kCmp = klsA.localeCompare(klsB, undefined, { numeric: true, sensitivity: 'base' });
      if (kCmp !== 0) return kCmp;
      return String(a.nama || '').trim().localeCompare(String(b.nama || '').trim(), undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'nama_asc') {
      return String(a.nama || '').trim().localeCompare(String(b.nama || '').trim(), undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'nama_desc') {
      return String(b.nama || '').trim().localeCompare(String(a.nama || '').trim(), undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'nisn_asc') {
      return String(a.nisn || '').trim().localeCompare(String(b.nisn || '').trim(), undefined, { numeric: true });
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
    if (!siswaList || siswaList.length === 0) {
      showErrorAlert('Data Kosong', 'Tidak ada data siswa untuk diekspor.');
      return;
    }

    const dataToExport = sortedList.length > 0 ? sortedList : siswaList;

    const headers = [
      'No',
      'NISN',
      'Nama Lengkap Siswa',
      'Kelas / Rombel',
      'Jenis Kelamin',
      'Nama Orang Tua / Wali',
      'No WhatsApp Wali',
      'Alamat',
      'QR Code ID'
    ];

    const rows = dataToExport.map((item, index) => [
      index + 1,
      { t: 's', v: String(item.nisn || '') },
      item.nama || '',
      (item.kelas && typeof item.kelas === 'object') ? item.kelas.nama : (item.kelas || ''),
      item.gender === 'P' ? 'Perempuan' : 'Laki-Laki',
      item.orangTua || '',
      { t: 's', v: String(item.noHp || '') },
      item.alamat || '',
      { t: 's', v: String(item.qrCode || '') }
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 28 },
      { wch: 14 },
      { wch: 15 },
      { wch: 24 },
      { wch: 18 },
      { wch: 35 },
      { wch: 24 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');

    const dateStr = new Date().toISOString().slice(0, 10);
    const kelasSuffix = filterKelas !== 'Semua' ? `_${filterKelas.replace(/\s+/g, '_')}` : '';
    XLSX.writeFile(wb, `Data_Siswa${kelasSuffix}_${dateStr}.xlsx`);
    showToast(`Berhasil mengekspor ${dataToExport.length} data siswa ke file Excel (.xlsx)!`);
  };

  return (
    <div className="page-container">
      {/* Header Actions */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <GraduationCap color="#4f46e5" size={28} /> {pageTitleText}
          </h1>
          <p className="page-subtitle">{pageSubtitleText}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {selectedSiswaIds.length > 0 && (
            <>
              <button 
                className="btn" 
                onClick={handleBulkDelete}
                style={{ background: '#ef4444', color: '#fff', fontWeight: 700, borderColor: '#dc2626' }}
                title="Hapus data siswa terpilih"
              >
                <Trash2 size={18} />
                <span>Hapus Terpilih ({selectedSiswaIds.length})</span>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleDeleteAll}
                style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fff1f2', fontWeight: 700 }}
                title="Hapus seluruh data siswa"
              >
                <Trash2 size={18} />
                <span>Hapus Semua Siswa</span>
              </button>
            </>
          )}
          <button 
            className="btn btn-secondary" 
            onClick={handleExportExcel}
            style={{ color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', fontWeight: 700 }}
            title="Ekspor Data Siswa ke File Excel (.xlsx)"
          >
            <Download size={18} />
            <span>Ekspor Excel</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Tambah Siswa Baru</span>
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
              placeholder="Cari nama, NISN, kelas..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '2.4rem', width: '100%' }}
            />
          </div>

          {/* Filter Kelas - berdasarkan tapel & semester aktif */}
          <select 
            className="form-control" 
            style={{ flex: '1 1 150px', maxWidth: '220px' }}
            value={filterKelas}
            onChange={e => {
              setFilterKelas(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="Semua">Semua Kelas</option>
            {kelasFilterList.map(kls => (
              <option key={kls.id} value={kls.nama}>{kls.nama}</option>
            ))}
          </select>

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
              <option value="kelas_nama">Urut: Kelas lalu Nama (A-Z)</option>
              <option value="nama_asc">Urut: Nama Siswa (A-Z)</option>
              <option value="nama_desc">Urut: Nama Siswa (Z-A)</option>
              <option value="nisn_asc">Urut: Nomor NISN (0-9)</option>
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
            Total: <strong style={{ color: '#4f46e5' }}>{totalItems}</strong> Siswa (Hal {validCurrentPage}/{totalPages})
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="table-responsive">
        <table className="table-modern">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox"
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  checked={paginatedList.length > 0 && paginatedList.every(s => selectedSiswaIds.includes(s.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const ids = paginatedList.map(s => s.id);
                      setSelectedSiswaIds(prev => Array.from(new Set([...prev, ...ids])));
                    } else {
                      const ids = paginatedList.map(s => s.id);
                      setSelectedSiswaIds(prev => prev.filter(id => !ids.includes(id)));
                    }
                  }}
                  title="Pilih semua siswa di halaman ini"
                />
              </th>
              <th>Nama Siswa</th>
              <th>NISN</th>
              <th>Kelas / Rombel</th>
              <th>L/P</th>
              <th>Orang Tua & Kontak</th>
              <th style={{ textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  Tidak ada data siswa yang sesuai dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              paginatedList.map((item) => (
                <tr key={item.id} style={{ background: selectedSiswaIds.includes(item.id) ? '#f0fdf4' : 'transparent' }}>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox"
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      checked={selectedSiswaIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSiswaIds(prev => [...prev, item.id]);
                        } else {
                          setSelectedSiswaIds(prev => prev.filter(id => id !== item.id));
                        }
                      }}
                    />
                  </td>
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
                          background: '#e0e7ff',
                          color: '#4338ca',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}>
                          {String(item.nama || '?').charAt(0)}
                        </div>
                      )}
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.nama}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.nisn}</td>
                  <td>
                    {(() => {
                      const activeKls = getActiveRombel(item);
                      if (activeKls) {
                        return <span className="badge badge-siswa">{activeKls}</span>;
                      }
                      return (
                        <span style={{ fontSize: '0.78rem', background: '#f8fafc', color: '#64748b', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                          Tanpa Kelas
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ fontWeight: 700 }}>{item.gender}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{item.orangTua || item.orang_tua || '-'}</div>
                    {(item.noHp || item.no_hp) && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone size={12} /> {item.noHp || item.no_hp}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <button 
                        className="btn-icon" 
                        title="Cetak Kartu QR Pelajar"
                        onClick={() => setPrintCardItem(item)}
                        style={{ color: '#10b981', borderColor: '#a7f3d0', background: '#ecfdf5' }}
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
                            title: 'Hapus Data Siswa',
                            itemName: item.nama,
                            onConfirm: () => deleteSiswa(item.id)
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
            Menampilkan <strong style={{ color: '#0f172a' }}>{startIndex + 1}</strong> - <strong style={{ color: '#0f172a' }}>{Math.min(startIndex + pageSize, totalItems)}</strong> dari <strong style={{ color: '#4f46e5' }}>{totalItems}</strong> siswa
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
              <h3 className="modal-title">{editItem ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
              <button className="btn-icon" onClick={() => setIsFormModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Photo Upload at Top */}
                <div className="form-group" style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>Foto Profil Kartu Pelajar</label>
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
                        onChange={handlePhotoUpload}
                        style={{ fontSize: '0.85rem', background: 'white' }}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Pilih berkas foto siswa (.jpg, .png, .jpeg). Maksimal 2MB.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">NISN Siswa *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="006123450..." 
                      required
                      value={formData.nisn}
                      onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nama Lengkap Siswa *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ahmad Rizky" 
                      required
                      value={formData.nama}
                      onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Kelas / Rombel * <small style={{ color: '#64748b', fontWeight: 400 }}>({tapelAktif} • {semesterAktif})</small></label>
                    <select 
                      className="form-control"
                      value={formData.kelas}
                      onChange={e => setFormData({ ...formData, kelas: e.target.value })}
                    >
                      {kelasFilterList.map(kls => (
                        <option key={kls.id} value={kls.nama}>{kls.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Jenis Kelamin</label>
                    <select 
                      className="form-control"
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="L">Laki-Laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nama Orang Tua / Wali</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Nama Wali" 
                      value={formData.orangTua}
                      onChange={e => setFormData({ ...formData, orangTua: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">No. WhatsApp Wali</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="081234567..." 
                      value={formData.noHp}
                      onChange={e => setFormData({ ...formData, noHp: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Alamat Tempat Tinggal Siswa</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Jl. Merbabu No. 12, Kota..." 
                    value={formData.alamat}
                    onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Siswa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Print Card */}
      {printCardItem && (
        <PrintCardModal 
          item={printCardItem}
          type="Siswa"
          onClose={() => setPrintCardItem(null)}
        />
      )}

      {/* Modal Import Excel */}
      <ImportExcelModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data Siswa dari File Excel"
        type="siswa"
        onImport={bulkAddSiswa}
      />
    </div>
  );
};
