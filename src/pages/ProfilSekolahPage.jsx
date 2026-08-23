import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { School, Building, Phone, Mail, Globe, Save, Image as ImageIcon, Trash2, MapPin, Compass, Navigation, ExternalLink, Move } from 'lucide-react';
import { showSuccessAlert, showErrorAlert } from '../utils/sweetalert';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const parseGoogleMapsEmbed = (input) => {
  if (!input || typeof input !== 'string') return { embedUrl: '', latitude: '', longitude: '' };
  
  let cleanUrl = input.trim();
  
  // Extract src attribute if full <iframe ...> tag was pasted
  const iframeSrcMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    cleanUrl = iframeSrcMatch[1];
  }

  let latitude = '';
  let longitude = '';

  // Pattern A: Google Maps Embed PB format -> !2d<LONG>!3d<LAT>
  const pbMatch = cleanUrl.match(/!2d(-?\d+(?:\.\d+)?)(?:!3d|-)*(-?\d+(?:\.\d+)?)/);
  if (pbMatch) {
    longitude = pbMatch[1];
    latitude = pbMatch[2];
  }

  // Pattern B: @latitude,longitude format (e.g. google.com/maps/@-6.82145,107.14789,17z)
  if (!latitude || !longitude) {
    const atMatch = cleanUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      latitude = atMatch[1];
      longitude = atMatch[2];
    }
  }

  // Pattern C: q=lat,long or ll=lat,long
  if (!latitude || !longitude) {
    const qMatch = cleanUrl.match(/(?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      latitude = qMatch[1];
      longitude = qMatch[2];
    }
  }

  return {
    embedUrl: cleanUrl,
    latitude,
    longitude
  };
};

const InteractiveDraggableMap = ({ lat, lng, onPositionChange }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [mapType, setMapType] = useState('satellite'); // 'streets' | 'satellite'

  const parsedLat = parseFloat(lat) || -6.821539;
  const parsedLng = parseFloat(lng) || 107.168539;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [parsedLat, parsedLng],
      zoom: 17,
      zoomControl: true
    });
    mapInstanceRef.current = map;

    const streetTile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 21,
      maxNativeZoom: 19,
      attribution: '&copy; OpenStreetMap'
    });

    // Menggunakan Google Maps Hybrid (Satellite + Labels) agar resolusi zoom tinggi tersedia (terutama di Indonesia)
    const satelliteTile = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 21,
      maxNativeZoom: 20,
      attribution: '&copy; Google Maps'
    });

    if (mapType === 'satellite') {
      satelliteTile.addTo(map);
    } else {
      streetTile.addTo(map);
    }

    // Custom Draggable Red Pin Icon
    const redPinIcon = L.divIcon({
      className: 'custom-interactive-red-pin',
      html: `
        <div style="position: relative; width: 36px; height: 42px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); cursor: grab;">
          <svg width="36" height="42" viewBox="0 0 24 28" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 14-9 14s-9-7-9-14a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3.5" fill="#ffffff"></circle>
          </svg>
        </div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42]
    });

    const marker = L.marker([parsedLat, parsedLng], {
      icon: redPinIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onPositionChange(position.lat.toFixed(6), position.lng.toFixed(6));
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      onPositionChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapType]);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - parsedLat) > 0.00001 || Math.abs(currentPos.lng - parsedLng) > 0.00001) {
        markerRef.current.setLatLng([parsedLat, parsedLng]);
        mapInstanceRef.current.panTo([parsedLat, parsedLng]);
      }
    }
  }, [parsedLat, parsedLng]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '14px', overflow: 'hidden', border: '2px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
      {/* Map Type Toggle Control Overlay */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000, 
        background: 'rgba(255,255,255,0.92)', 
        backdropFilter: 'blur(4px)', 
        padding: '0.35rem 0.6rem', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        gap: '0.35rem'
      }}>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          style={{
            border: 'none',
            background: mapType === 'satellite' ? '#4f46e5' : '#e2e8f0',
            color: mapType === 'satellite' ? '#ffffff' : '#334155',
            fontWeight: 700,
            fontSize: '0.74rem',
            padding: '0.25rem 0.55rem',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🛰️ Satelit
        </button>
        <button
          type="button"
          onClick={() => setMapType('streets')}
          style={{
            border: 'none',
            background: mapType === 'streets' ? '#4f46e5' : '#e2e8f0',
            color: mapType === 'streets' ? '#ffffff' : '#334155',
            fontWeight: 700,
            fontSize: '0.74rem',
            padding: '0.25rem 0.55rem',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🗺️ Peta Jalan
        </button>
      </div>

      {/* Interactive Guide Banner */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.88)',
        color: '#ffffff',
        padding: '0.4rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <Move size={14} color="#f87171" /> <span>Geser titik merah atau klik peta untuk menggeser lokasi</span>
      </div>

      <div ref={mapContainerRef} style={{ width: '100%', height: '320px', background: '#e2e8f0' }} />
    </div>
  );
};

export const ProfilSekolahPage = () => {
  const { profilSekolah, saveProfilSekolah, setProfilSekolah } = useApp();
  const [activeTab, setActiveTab] = useState('logo'); // State tab

  const [formData, setFormData] = useState({
    namaSekolah: profilSekolah?.namaSekolah || profilSekolah?.nama_sekolah || '',
    npsn: profilSekolah?.npsn || '',
    alamat: profilSekolah?.alamat || '',
    kepalaSekolah: profilSekolah?.kepalaSekolah || profilSekolah?.kepala_sekolah || '',
    nipKepalaSekolah: profilSekolah?.nipKepalaSekolah || profilSekolah?.nip_kepala_sekolah || '',
    noTelp: profilSekolah?.noTelp || profilSekolah?.no_telp || '',
    email: profilSekolah?.email || '',
    website: profilSekolah?.website || '',
    logo: profilSekolah?.logo || '',
    mapsEmbed: profilSekolah?.mapsEmbed || profilSekolah?.maps_embed || '',
    latitude: profilSekolah?.latitude || '',
    longitude: profilSekolah?.longitude || '',
    radius: profilSekolah?.radius || 0
  });

  useEffect(() => {
    if (profilSekolah && Object.keys(profilSekolah).length > 0) {
      setFormData({
        namaSekolah: profilSekolah.namaSekolah || profilSekolah.nama_sekolah || '',
        npsn: profilSekolah.npsn || '',
        alamat: profilSekolah.alamat || '',
        kepalaSekolah: profilSekolah.kepalaSekolah || profilSekolah.kepala_sekolah || '',
        nipKepalaSekolah: profilSekolah.nipKepalaSekolah || profilSekolah.nip_kepala_sekolah || '',
        noTelp: profilSekolah.noTelp || profilSekolah.no_telp || '',
        email: profilSekolah.email || '',
        website: profilSekolah.website || '',
        logo: profilSekolah.logo || '',
        mapsEmbed: profilSekolah.mapsEmbed || profilSekolah.maps_embed || '',
        latitude: profilSekolah.latitude || '',
        longitude: profilSekolah.longitude || '',
        radius: profilSekolah.radius || 0
      });
    }
  }, [profilSekolah]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['png', 'jpg', 'jpeg'];
    const fileNameParts = file.name.split('.');
    const fileExt = fileNameParts.length > 1 ? fileNameParts.pop().toLowerCase() : '';

    if (!allowedExtensions.includes(fileExt)) {
      showErrorAlert(
        'Format Berkas Tidak Sesuai',
        'Hanya berkas gambar dengan ekstensi .png, .jpg, atau .jpeg yang diperbolehkan.'
      );
      e.target.value = '';
      return;
    }

    const MAX_SIZE_BYTES = 200 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const fileSizeKB = (file.size / 1024).toFixed(1);
      showErrorAlert(
        'Ukuran Berkas Melebihi Batas',
        `Ukuran berkas logo Anda (${fileSizeKB} KB) melebihi batas maksimal 200 KB.`
      );
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, logo: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleEmbedChange = (e) => {
    const rawVal = e.target.value;
    const parsed = parseGoogleMapsEmbed(rawVal);

    setFormData(prev => ({
      ...prev,
      mapsEmbed: rawVal,
      latitude: parsed.latitude || prev.latitude,
      longitude: parsed.longitude || prev.longitude
    }));
  };

  const handleInteractivePositionChange = (newLat, newLng) => {
    setFormData(prev => ({
      ...prev,
      latitude: newLat,
      longitude: newLng,
      mapsEmbed: `https://maps.google.com/maps?q=${newLat},${newLng}&z=16&output=embed`
    }));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showErrorAlert('Geolocation Tidak Didukung', 'Browser Anda tidak mendukung deteksi lokasi GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setFormData(prev => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lng),
          mapsEmbed: `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`
        }));
        showSuccessAlert('Lokasi Ditemukan', `Titik Koordinat GPS: Lat ${lat}, Lng ${lng}`);
      },
      (err) => {
        showErrorAlert('Gagal Mengambil GPS', err.message || 'Pastikan akses izin lokasi diizinkan pada browser Anda.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalLat = formData.latitude;
    let finalLng = formData.longitude;
    if ((!finalLat || !finalLng) && formData.mapsEmbed) {
      const parsed = parseGoogleMapsEmbed(formData.mapsEmbed);
      if (parsed.latitude) finalLat = parsed.latitude;
      if (parsed.longitude) finalLng = parsed.longitude;
    }

    const payload = {
      ...formData,
      latitude: finalLat,
      longitude: finalLng,
      radius: formData.radius ? Number(formData.radius) : 0
    };

    if (saveProfilSekolah) {
      await saveProfilSekolah(payload);
    } else {
      setProfilSekolah(payload);
      showSuccessAlert('Berhasil Simpan', 'Profil Sekolah & Lokasi Google Maps berhasil diperbarui.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <School color="#4f46e5" size={28} /> Profil Sekolah
          </h1>
          <p className="page-subtitle">Kelola informasi identitas, logo resmi, detail kontak, dan titik lokasi peta sekolah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '2px' }}>
          <button type="button" onClick={() => setActiveTab('logo')} style={{ padding: '0.75rem 1.25rem', background: activeTab === 'logo' ? '#4f46e5' : 'transparent', color: activeTab === 'logo' ? 'white' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-4px', borderBottom: activeTab === 'logo' ? '3px solid #3730a3' : '3px solid transparent', whiteSpace: 'nowrap' }}>
            <ImageIcon size={18} />
            Logo Sekolah
          </button>
          <button type="button" onClick={() => setActiveTab('identitas')} style={{ padding: '0.75rem 1.25rem', background: activeTab === 'identitas' ? '#4f46e5' : 'transparent', color: activeTab === 'identitas' ? 'white' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-4px', borderBottom: activeTab === 'identitas' ? '3px solid #3730a3' : '3px solid transparent', whiteSpace: 'nowrap' }}>
            <Building size={18} />
            Identitas Utama
          </button>
          <button type="button" onClick={() => setActiveTab('kontak')} style={{ padding: '0.75rem 1.25rem', background: activeTab === 'kontak' ? '#4f46e5' : 'transparent', color: activeTab === 'kontak' ? 'white' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-4px', borderBottom: activeTab === 'kontak' ? '3px solid #3730a3' : '3px solid transparent', whiteSpace: 'nowrap' }}>
            <Phone size={18} />
            Info Kontak
          </button>
          <button type="button" onClick={() => setActiveTab('lokasi')} style={{ padding: '0.75rem 1.25rem', background: activeTab === 'lokasi' ? '#4f46e5' : 'transparent', color: activeTab === 'lokasi' ? 'white' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '-4px', borderBottom: activeTab === 'lokasi' ? '3px solid #3730a3' : '3px solid transparent', whiteSpace: 'nowrap' }}>
            <MapPin size={18} />
            Lokasi & Peta
          </button>
        </div>

        {/* Logo Sekolah Upload Section */}
        {activeTab === 'logo' && (
        <div className="card-modern" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <ImageIcon size={20} color="#4f46e5" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Logo Resmi Sekolah</h3>
          </div>

          <div style={{ marginBottom: '2rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>
              Format berkas yang didukung: <strong style={{ color: '#4f46e5' }}>.PNG, .JPG, .JPEG</strong> | Ukuran maksimal: <strong style={{ color: '#ef4444' }}>200 KB</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              {/* Logo Preview Box */}
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '16px',
                border: '2px solid #e2e8f0',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                flexShrink: 0
              }}>
                {formData.logo ? (
                  <img 
                    src={formData.logo} 
                    alt="Logo Sekolah" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '0.5rem' }}>
                    <School size={32} strokeWidth={1.5} />
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>Tanpa Logo</div>
                  </div>
                )}
              </div>

              {/* Upload Input & Actions */}
              <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <input 
                  type="file" 
                  accept=".png, .jpg, .jpeg"
                  onChange={handleLogoUpload}
                  className="form-control"
                  style={{ background: '#ffffff', fontSize: '0.85rem' }}
                />
                
                {formData.logo && (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                    style={{ alignSelf: 'flex-start', fontSize: '0.78rem', color: '#ef4444', borderColor: '#fca5a5', padding: '0.35rem 0.75rem' }}
                  >
                    <Trash2 size={14} /> Hapus Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Identitas Utama Sekolah */}
        {activeTab === 'identitas' && (
        <div className="card-modern" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <Building size={20} color="#4f46e5" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Identitas Utama Sekolah</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Nama Sekolah *</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.namaSekolah}
                onChange={e => setFormData({ ...formData, namaSekolah: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">NPSN *</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.npsn}
                onChange={e => setFormData({ ...formData, npsn: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Alamat Lengkap *</label>
            <textarea 
              className="form-control" 
              rows="3"
              value={formData.alamat}
              onChange={e => setFormData({ ...formData, alamat: e.target.value })}
              required
            ></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nama Kepala Sekolah</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.kepalaSekolah}
                onChange={e => setFormData({ ...formData, kepalaSekolah: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">NIP Kepala Sekolah</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.nipKepalaSekolah}
                onChange={e => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
              />
            </div>
          </div>
        </div>
        )}

        {/* Informasi Kontak */}
        {activeTab === 'kontak' && (
        <div className="card-modern" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <Phone size={20} color="#4f46e5" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Informasi Kontak</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} color="#64748b" /> No. Telepon
                </span>
              </label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.noTelp}
                onChange={e => setFormData({ ...formData, noTelp: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} color="#64748b" /> Email Sekolah
                </span>
              </label>
              <input 
                type="email" 
                className="form-control" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={14} color="#64748b" /> Website
              </span>
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.sekolah.sch.id"
            />
          </div>
        </div>
        )}

        {/* SECTION: Google Maps & Titik Koordinat GPS */}
        {activeTab === 'lokasi' && (
        <div className="card-modern" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MapPin size={20} color="#4f46e5" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Lokasi & Peta Google Maps</h3>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGetCurrentLocation}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', color: '#4f46e5', borderColor: '#c7d2fe', background: '#e0e7ff', fontWeight: 700 }}
              title="Deteksi dan masukkan titik koordinat GPS lokasi Anda saat ini"
            >
              <Navigation size={14} /> Ambil Lokasi GPS Saat Ini
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>
              Kode Embed / Link Google Maps
            </label>
            <textarea 
              className="form-control" 
              rows="3"
              value={formData.mapsEmbed}
              onChange={handleEmbedChange}
              placeholder='Tempelkan kode HTML <iframe src="https://www.google.com/maps/embed?..."></iframe> atau URL Google Maps di sini...'
              style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
            />
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.35rem' }}>
              💡 <strong>Tips:</strong> Anda bisa menempelkan link Google Maps di atas, atau <strong>langsung menggeser titik pin merah pada peta interaktif di bawah ini</strong> untuk menentukan koordinat presisi.
            </div>
          </div>

          {/* Display Extracted Latitude & Longitude Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginTop: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Compass size={14} color="#059669" /> Titik Lintang (Latitude)
                </span>
              </label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.latitude}
                onChange={e => handleInteractivePositionChange(e.target.value, formData.longitude)}
                placeholder="e.g. -6.82145"
                style={{ background: '#ffffff', fontWeight: 700, color: '#059669' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Compass size={14} color="#0284c7" /> Titik Bujur (Longitude)
                </span>
              </label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.longitude}
                onChange={e => handleInteractivePositionChange(formData.latitude, e.target.value)}
                placeholder="e.g. 107.14789"
                style={{ background: '#ffffff', fontWeight: 700, color: '#0284c7' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1e293b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} color="#ea580c" /> Radius Presensi (Meter)
                </span>
              </label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.radius}
                onChange={e => setFormData({ ...formData, radius: e.target.value })}
                placeholder="e.g. 5"
                min="0"
                style={{ background: '#ffffff', fontWeight: 700, color: '#ea580c' }}
              />
            </div>
          </div>

          {/* Interactive Map Picker with Draggable Red Marker Pin */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ fontWeight: 700, margin: 0, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                Peta Interaktif (Titik Merah Dapat Digeser):
              </label>
              {formData.latitude && formData.longitude && (
                <a 
                  href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                >
                  Buka Google Maps Baru <ExternalLink size={12} />
                </a>
              )}
            </div>

            <InteractiveDraggableMap 
              lat={formData.latitude}
              lng={formData.longitude}
              onPositionChange={handleInteractivePositionChange}
            />
          </div>
        </div>
        )}

        {/* Save Floating Bar / Bottom Action */}
        <div className="card-modern" style={{ padding: '1.25rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#1e1b4b', color: 'white' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>Simpan Seluruh Profil Sekolah</div>
            <div style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>Perubahan informasi, logo, kontak, dan titik lokasi peta akan langsung aktif</div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem', fontWeight: 800, background: '#4f46e5' }}>
            <Save size={18} />
            <span>Simpan Profil Sekolah</span>
          </button>
        </div>
      </form>
    </div>
  );
};

