import React from 'react';
import { Database } from 'lucide-react';

export const BackupUmumPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Database color="#4f46e5" size={28} /> Backup Umum
          </h1>
          <p className="page-subtitle">Halaman untuk melakukan backup data umum sistem</p>
        </div>
      </div>

      <div className="card-modern" style={{ padding: '2rem', textAlign: 'center' }}>
        <Database size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>Fitur Backup Sedang Dalam Pengembangan</h3>
        <p style={{ color: '#64748b' }}>
          Fitur ini akan segera tersedia untuk melakukan backup data umum presensi.
        </p>
      </div>
    </div>
  );
};
