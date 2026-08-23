import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { School } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PrintCardModal = ({ item, type, onClose }) => {
  const { bgCardGuru, bgCardSiswa, profilSekolah } = useApp();

  useEffect(() => {
    if (item) {
      // Auto trigger print immediately
      const timer = setTimeout(() => {
        window.print();
      }, 150);

      const handleAfterPrint = () => {
        onClose();
      };

      window.addEventListener('afterprint', handleAfterPrint);

      // Fallback timer to clean up state if browser print finishes or is closed
      const fallbackTimer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(fallbackTimer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [item, onClose]);

  if (!item) return null;

  const isGuru = type === 'Guru' || type === 'Tendik' || item.kategori === 'Guru' || item.kategori === 'Tendik';
  const cardBg = isGuru ? bgCardGuru : bgCardSiswa;
  const idNumber = isGuru 
    ? ((item.nip && item.nip.trim()) || (item.nuptk && item.nuptk.trim()) || (item.nik && item.nik.trim()) || '-') 
    : (item.nisn || '-');

  const content = (
    <div className="single-card-print-root">
      <div 
        className="mass-card-item"
        style={{
          width: '5.5cm',
          height: '8.5cm',
          borderRadius: '12px',
          background: cardBg,
          color: 'white',
          padding: '0.4cm 0.35cm 0.35cm',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}
      >
        {/* Background Watermark/Pattern */}
        <div style={{
          position: 'absolute',
          right: '-30px',
          top: '-30px',
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
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

        {/* Identity & QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2cm', width: '100%' }}>
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
              {idNumber}
            </div>
          </div>

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
              value={`${window.location.origin}/verify/${item.qrCode || item.id}`} 
              size={86}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

