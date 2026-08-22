import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Download, X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import { useApp } from '../context/AppContext';

export const ImportExcelModal = ({ isOpen, onClose, title, type, defaultKategori = 'Guru', onImport }) => {
  const { siswaList, guruTendikList } = useApp();
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isGuru = type === 'guru';

  // Build existing ID map for fast lookup
  const existingSet = new Set();
  if (isGuru) {
    (guruTendikList || []).forEach(g => {
      if (g.nip) existingSet.add(String(g.nip).trim());
      if (g.nuptk) existingSet.add(String(g.nuptk).trim());
    });
  } else {
    (siswaList || []).forEach(s => {
      if (s.nisn) existingSet.add(String(s.nisn).trim());
    });
  }

  // Handle File Upload & Parse via XLSX
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          setErrorMsg('File Excel kosong atau format tidak sesuai.');
          setParsedData([]);
          return;
        }

        // Map column names flexibly (case insensitive, trim)
        const seenInFile = new Set();
        const mapped = json.map(row => {
          const findVal = (keys) => {
            for (let k of Object.keys(row)) {
              if (keys.includes(k.toLowerCase().trim())) return row[k];
            }
            return '';
          };

          if (isGuru) {
            const rawNip = String(findVal(['nip', 'no_induk', 'id'])).trim();
            const rawNuptk = String(findVal(['nuptk', 'no_nuptk'])).trim();
            const idToCheck = rawNip || rawNuptk;
            const isDup = Boolean(idToCheck && (existingSet.has(idToCheck) || seenInFile.has(idToCheck)));
            if (idToCheck) seenInFile.add(idToCheck);

            const rawKat = findVal(['kategori', 'peran', 'role', 'jenis']);
            const kat = rawKat ? rawKat : defaultKategori;

            return {
              nik: String(findVal(['nik', 'no_nik', 'no nik', 'ktp'])).trim(),
              nip: rawNip,
              nuptk: rawNuptk,
              nama: findVal(['nama', 'nama_lengkap', 'nama guru', 'nama staff']),
              kategori: kat,
              jabatan: findVal(['jabatan', 'tugas', 'mata_pelajaran', 'mapel']),
              gender: String(findVal(['jenis kelamin', 'jenis_kelamin', 'gender', 'jk', 'l/p'])).toUpperCase().startsWith('P') ? 'P' : 'L',
              noHp: String(findVal(['no wa', 'no_wa', 'no hp', 'nohp', 'telepon', 'whatsapp', 'hp'])).trim(),
              alamat: findVal(['alamat', 'alamat rumah', 'alamat tempat tinggal']),
              isDuplicate: isDup
            };
          } else {
            const rawNisn = String(findVal(['nisn', 'nis', 'no_induk', 'id'])).trim();
            const isDup = Boolean(rawNisn && (existingSet.has(rawNisn) || seenInFile.has(rawNisn)));
            if (rawNisn) seenInFile.add(rawNisn);

            return {
              nisn: rawNisn,
              nama: findVal(['nama', 'nama_lengkap', 'nama siswa', 'nama murid']),
              gender: String(findVal(['jenis kelamin', 'jenis_kelamin', 'gender', 'jk', 'l/p'])).toUpperCase().startsWith('P') ? 'P' : 'L',
              orangTua: findVal(['nama ortu', 'nama_ortu', 'orang tua', 'orangtua', 'wali']),
              noHp: String(findVal(['no wa ortu', 'no_wa_ortu', 'no wa', 'no hp', 'nohp', 'telepon', 'whatsapp', 'hp'])).trim(),
              alamat: findVal(['alamat', 'alamat rumah', 'alamat tempat tinggal']),
              isDuplicate: isDup
            };
          }
        });

        setParsedData(mapped);

        // Check if any duplicates found right after upload
        const duplicates = mapped.filter(m => m.isDuplicate);
        if (duplicates.length > 0) {
          Swal.fire({
            icon: 'warning',
            title: `Peringatan: ${duplicates.length} Data ${isGuru ? 'NIP/NUPTK' : 'NISN'} Sudah Terdaftar!`,
            html: `Ditemukan data yang <strong>sudah ada di database</strong>:<br/><br/>
            <div style="text-align: left; max-height: 140px; overflow-y: auto; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.85rem; color: #92400e;">
              ${duplicates.map((d, idx) => `<div>${idx + 1}. <b>${d.nisn || d.nip || d.nuptk}</b> - ${d.nama || 'Tanpa Nama'} <span style="color: #dc2626; font-size: 0.75rem;">(Sudah Ada)</span></div>`).join('')}
            </div>
            <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.75rem;">
              Baris duplikat ditandai dengan warna merah pada tabel pratinjau di bawah.
            </p>`,
            confirmButtonColor: '#4f46e5',
            confirmButtonText: 'Saya Mengerti'
          });
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal membaca file Excel. Pastikan format file .xlsx / .csv valid.');
        setParsedData([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Download Template Excel (Native Blob Download)
  const handleDownloadTemplate = () => {
    let headers = [];
    let sampleRows = [];

    if (isGuru) {
      headers = ['No', 'NIK', 'NIP', 'NUPTK', 'Nama', 'Kategori', 'Jabatan', 'Jenis Kelamin', 'No WA', 'Alamat'];
      if (defaultKategori === 'Tendik') {
        sampleRows = [
          [1, '3201234567890001', '199005202016011002', '9042768670200001', 'Hendra Wijaya, S.E', 'Tendik', 'Kepala Tata Usaha', 'Laki-Laki', '081122334457', 'Jl. Sudirman No. 42, Surabaya'],
          [2, '3201234567890002', '199208102018022005', '7548766668200004', 'Rina Melati, A.Md', 'Tendik', 'Pustakawan', 'Perempuan', '081122334458', 'Jl. Merdeka No. 10, Jakarta'],
          [3, '3201234567890003', '199503122020011003', '4542768670200009', 'Agus Prasetyo', 'Tendik', 'Staf Administrasi', 'Laki-Laki', '081122334459', 'Jl. Pemuda No. 05, Semarang']
        ];
      } else {
        sampleRows = [
          [1, '3201234567890001', '198501012010011001', '8534763665200002', 'Budi Santoso, S.Pd', 'Guru', 'Guru Matematika', 'Laki-Laki', '081122334455', 'Jl. Pemuda No. 15, Jakarta Pusat'],
          [2, '3201234567890002', '198803152014022003', '3547766668200003', 'Siti Aminah, S.Kom', 'Guru', 'Guru Informatika', 'Perempuan', '081122334456', 'Jl. Gatot Subroto No. 88, Bandung'],
          [3, '3201234567890003', '199005202016011002', '9042768670200001', 'Hendra Wijaya, S.E', 'Tendik', 'Kepala Tata Usaha', 'Laki-Laki', '081122334457', 'Jl. Sudirman No. 42, Surabaya']
        ];
      }
    } else {
      headers = ['No', 'NISN', 'Nama', 'Jenis Kelamin', 'Nama Ortu', 'No WA Ortu', 'Alamat'];
      sampleRows = [
        [1, '0061234501', 'Ahmad Rizky', 'Laki-Laki', 'Hardi S.', '081234567890', 'Jl. Merbabu No. 12, RT 01/RW 03, Jakarta'],
        [2, '0061234502', 'Annisa Rahmawati', 'Perempuan', 'Bambang U.', '081234567891', 'Jl. Mawar Indah No. 25, Bandung'],
        [3, '0061234503', 'Bayu Pratama', 'Laki-Laki', 'Suryo K.', '081234567892', 'Jl. Kenanga No. 04, Bogor']
      ];
    }

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 5, 15) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Import");

    const fileName = `Template_Import_${isGuru ? (defaultKategori === 'Tendik' ? 'Tendik' : 'Guru') : 'Siswa'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;

    const duplicateRows = parsedData.filter(r => r.isDuplicate);
    const newRows = parsedData.filter(r => !r.isDuplicate);

    // If ALL records are duplicates
    if (newRows.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Impor Dibatalkan: Semua Data Duplikat!',
        html: `Seluruh <strong>${duplicateRows.length} data</strong> ${isGuru ? 'NIP/NUPTK' : 'NISN'} sudah terdaftar di database.<br/><br/>
        <div style="text-align: left; max-height: 140px; overflow-y: auto; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.85rem; color: #991b1b;">
          ${duplicateRows.map((d, idx) => `<div>${idx + 1}. <b>${d.nisn || d.nip || d.nuptk}</b> - ${d.nama || 'Tanpa Nama'}</div>`).join('')}
        </div>
        <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.75rem;">
          Tidak ada data baru yang dapat diimpor.
        </p>`,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Tutup'
      });
      return;
    }

    // If SOME are duplicates
    if (duplicateRows.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: `Konfirmasi Impor Data (${duplicateRows.length} Duplikat)`,
        html: `Ditemukan <strong>${duplicateRows.length} data</strong> dengan ${isGuru ? 'NIP/NUPTK' : 'NISN'} yang sudah ada di database.<br/><br/>
        <div style="text-align: left; max-height: 120px; overflow-y: auto; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.82rem; color: #92400e; margin-bottom: 0.75rem;">
          <strong>Data yang akan dilewati (skip):</strong><br/>
          ${duplicateRows.map(d => `• <b>${d.nisn || d.nip || d.nuptk}</b> - ${d.nama || 'Tanpa Nama'}`).join('<br/>')}
        </div>
        Apakah Anda ingin <strong>melewati ${duplicateRows.length} data duplikat</strong> dan mengimpor <strong>${newRows.length} data baru</strong>?`,
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#64748b',
        confirmButtonText: `Ya, Impor ${newRows.length} Data Baru`,
        cancelButtonText: 'Batal',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          onImport(newRows);
          onClose();
          setParsedData([]);
          setFileName('');
        }
      });
      return;
    }

    // If NO duplicates, import all
    onImport(parsedData);
    onClose();
    setParsedData([]);
    setFileName('');
  };

  const duplicateCount = parsedData.filter(r => r.isDuplicate).length;
  const newCount = parsedData.length - duplicateCount;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={22} color="#10b981" />
            <h3 className="modal-title">{title}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Top Instructions & Download Template */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Format Kolom Excel</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                {isGuru 
                  ? 'Kolom: No, NIK, NIP, NUPTK, Nama, Kategori, Jabatan, Jenis Kelamin, No WA, Alamat' 
                  : 'Kolom: No, NISN, Nama, Jenis Kelamin, Nama Ortu, No WA Ortu, Alamat'}
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleDownloadTemplate} style={{ fontSize: '0.82rem', padding: '0.5rem 1rem', fontWeight: 700 }}>
              <Download size={15} /> Download Template Excel
            </button>
          </div>

          {/* File Drag & Drop Box */}
          <div style={{
            border: '2px dashed #4f46e5',
            borderRadius: '16px',
            backgroundColor: '#eef2ff',
            padding: '1.75rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%'
              }}
            />
            <Upload size={34} color="#4f46e5" style={{ marginBottom: '0.4rem' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
              {fileName ? `File terpilih: ${fileName}` : 'Klik atau Tarik File Excel (.xlsx / .xls / .csv) ke sini'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
              Sistem akan otomatis mendeteksi dan mengecek duplikasi NISN/NIP terhadap database.
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: '#be123c', fontSize: '0.85rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {/* Duplicate Summary Banner */}
          {parsedData.length > 0 && duplicateCount > 0 && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#991b1b',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#dc2626" />
                <span>
                  Ditemukan <strong>{duplicateCount} data duplikat</strong> ({isGuru ? 'NIP' : 'NISN'} sudah terdaftar).
                </span>
              </div>
              <span style={{ fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                {newCount} Data Baru Siap Impor
              </span>
            </div>
          )}

          {/* Table Preview */}
          {parsedData.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                  <CheckCircle2 size={14} color="#10b981" style={{ display: 'inline', marginRight: '4px' }} />
                  Pratinjau Data ({parsedData.length} baris)
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Baris berlatar merah = NISN Duplikat
                </span>
              </div>

              <div className="table-responsive" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                <table className="table-modern" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Status</th>
                      <th>{isGuru ? 'NIP / NUPTK' : 'NISN'}</th>
                      <th>Nama Lengkap</th>
                      <th>Jenis Kelamin</th>
                      <th>{isGuru ? 'Jabatan' : 'Orang Tua & WA'}</th>
                      <th>Alamat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => (
                      <tr 
                        key={i}
                        style={{ 
                          backgroundColor: row.isDuplicate ? '#fef2f2' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <td>{i + 1}</td>
                        <td>
                          {row.isDuplicate ? (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}>
                              <AlertTriangle size={11} /> Sudah Ada
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: '#dcfce7',
                              color: '#16a34a',
                              border: '1px solid #86efac',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px'
                            }}>
                              ✓ Baru
                            </span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: row.isDuplicate ? 800 : 500, color: row.isDuplicate ? '#dc2626' : 'inherit' }}>
                          {isGuru ? (row.nuptk || row.nip || '-') : (row.nisn || '-')}
                        </td>
                        <td style={{ fontWeight: 700 }}>{row.nama}</td>
                        <td>{row.gender === 'P' ? 'Perempuan' : 'Laki-Laki'}</td>
                        <td>{isGuru ? `${row.kategori || 'Guru'} (${row.jabatan || '-'})` : `${row.orangTua || '-'} (${row.noHp || '-'})`}</td>
                        <td style={{ fontSize: '0.78rem' }}>{row.alamat || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button 
            className="btn btn-success" 
            disabled={parsedData.length === 0}
            onClick={handleConfirmImport}
          >
            {parsedData.length > 0 
              ? (duplicateCount > 0 ? `Lanjutkan Impor (${newCount} Data Baru)` : `Impor ${parsedData.length} Data Sekarang`)
              : 'Impor Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
