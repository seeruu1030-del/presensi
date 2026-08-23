import React, { useState, useEffect, useRef } from 'react';
import { useApp, getTodayDateString, formatLocalDateString } from '../context/AppContext';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import { 
  QrCode, 
  Camera, 
  Keyboard, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  UserCheck, 
  GraduationCap,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';

export const ScanQRPage = () => {
  const { processQRScan, pengaturan, guruTendikList, siswaList, presensiLogs, profilSekolah } = useApp();

  const [scanResult, setScanResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(pengaturan.voiceNotification ?? true);
  const [cameraActive, setCameraActive] = useState(true);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const manualInputRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastScanCodeRef = useRef('');
  const lastScanTimeRef = useRef(0);

  // Audio Speech Synthesis Helper (Indonesian Voice)
  const speakVoice = (text) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Beep Sound Synthesizer
  const playBeep = (freq = 880, type = 'sine', duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => osc.stop(), duration * 1000);
    } catch (e) {}
  };

  // Helper untuk menghitung jarak GPS
  const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  // Setup GPS Geolocation
  useEffect(() => {
    if (profilSekolah?.radius > 0 && profilSekolah?.latitude && profilSekolah?.longitude) {
      if (!navigator.geolocation) {
        setLocationError('Browser tidak mendukung akses GPS.');
        return;
      }
      
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDeviceLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          setLocationError(null);
        },
        (err) => {
          setLocationError('Gagal mendapatkan lokasi. Harap izinkan akses lokasi (GPS) pada browser.');
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [profilSekolah]);

  // Handle Scan Logic with Camera Lock & Debounce
  const handleScanSuccess = async (decodedText) => {
    if (!decodedText) return;
    const now = Date.now();

    // Lock camera scans: ignore duplicate frames of the same QR code within 4 seconds, or if a scan is currently processing
    if (
      isProcessingRef.current || 
      (lastScanCodeRef.current === decodedText && now - lastScanTimeRef.current < 4000)
    ) {
      return;
    }

    // Validasi Jarak / Radius GPS
    if (profilSekolah?.radius > 0 && profilSekolah?.latitude && profilSekolah?.longitude) {
      
      // Coba cari nama user dari decodedText
      let userName = '';
      if (decodedText) {
        let code = decodedText.trim();
        if (code.includes('/verify/')) {
          code = code.split('/verify/').pop();
        }
        const foundGT = guruTendikList.find(g => 
          (g.qr_code || '').toLowerCase() === code.toLowerCase() || 
          g.nuptk === code || g.nip === code || g.nik === code
        );
        if (foundGT) {
          userName = foundGT.nama;
        } else {
          const foundSiswa = siswaList.find(s => 
            (s.qr_code || '').toLowerCase() === code.toLowerCase() ||
            s.nisn === code || s.nis === code
          );
          if (foundSiswa) {
            userName = foundSiswa.nama;
          }
        }
      }

      const warningVoice = userName 
        ? `Lokasi presensi ${userName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} diluar jangkauan`
        : 'Lokasi presensi diluar jangkauan';

      if (locationError) {
        setScanResult({
          success: false,
          message: `Gagal Scan: ${locationError}`,
          voiceMessage: 'Gagal scan. Akses lokasi tidak diizinkan.'
        });
        playBeep(300, 'sawtooth', 0.3);
        speakVoice('Gagal scan. Akses lokasi tidak diizinkan.');
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => setScanResult(null), 5000);
        return;
      }
      
      if (!deviceLocation) {
        setScanResult({
          success: false,
          message: warningVoice,
          voiceMessage: warningVoice
        });
        playBeep(300, 'sawtooth', 0.3);
        speakVoice(warningVoice);
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => setScanResult(null), 5000);
        return;
      }

      const distance = getDistanceFromLatLonInM(
        deviceLocation.latitude,
        deviceLocation.longitude,
        parseFloat(profilSekolah.latitude),
        parseFloat(profilSekolah.longitude)
      );

      if (distance > profilSekolah.radius) {

        setScanResult({
          success: false,
          message: `Scan Ditolak: Anda berada di luar jangkauan radius sekolah. (Jarak Anda: ${Math.round(distance)}m, Maksimal: ${profilSekolah.radius}m)`,
          voiceMessage: warningVoice
        });
        playBeep(300, 'sawtooth', 0.3);
        speakVoice(warningVoice);
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => setScanResult(null), 5000);
        return;
      }
    }

    isProcessingRef.current = true;
    lastScanCodeRef.current = decodedText;
    lastScanTimeRef.current = now;

    try {
      const res = await processQRScan(decodedText);
      setScanResult(res);

      if (res.success) {
        playBeep(900, 'sine', 0.15);
        // Trigger confetti celebration
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.5 }
        });
      } else {
        playBeep(300, 'sawtooth', 0.3);
      }

      if (res.voiceMessage || res.message) {
        speakVoice(res.voiceMessage || res.message);
      }

      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      // Auto clear result banner after 5 seconds
      scanTimeoutRef.current = setTimeout(() => {
        setScanResult(null);
      }, 5000);
    } finally {
      // Cooldown 1.5s before allowing next scan
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    }
  };

  // Setup Live HTML5 QR Scanner
  useEffect(() => {
    let isMounted = true;
    let scannerInstance = null;

    if (cameraActive) {
      const initScanner = () => {
        if (!isMounted) return;
        try {
          // Cleanup any existing DOM elements in reader just in case
          const readerElem = document.getElementById("reader");
          if (readerElem) readerElem.innerHTML = "";

          scannerInstance = new Html5QrcodeScanner(
            "reader",
            { 
              fps: 30, 
              formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdgeSize * 0.7);
                return { width: qrboxSize, height: qrboxSize };
              },
              showTorchButtonIfSupported: true,
              rememberLastUsedCamera: true
            },
            /* verbose= */ false
          );

          scannerInstance.render(
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            (error) => {
              // scan errors ignored for continuous scanning
            }
          );
        } catch (err) {
          console.error("Error starting Html5QrcodeScanner:", err);
        }
      };

      // Delay slightly to ensure React has painted the DOM element
      const timer = setTimeout(initScanner, 150);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (scannerInstance) {
          try {
            scannerInstance.clear().catch(e => console.warn("Scanner clear failed:", e));
          } catch (e) {
            console.warn(e);
          }
        }
      };
    }
  }, [cameraActive]);

  // Focus manual input for USB barcode scanner
  useEffect(() => {
    if (manualInputRef.current) {
      manualInputRef.current.focus();
    }
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode) return;
    handleScanSuccess(manualCode);
    setManualCode('');
  };

  const todayStr = getTodayDateString();

  // Deduplicate todayLogs so each student/teacher appears EXACTLY 1 TIME in the list
  const todayLogs = React.useMemo(() => {
    const rawToday = (presensiLogs || []).filter(l => formatLocalDateString(l.tanggal) === todayStr);

    const sorted = [...rawToday].sort((a, b) => {
      const timeA = a.jamPulang || a.jam_pulang || a.jamMasuk || a.jam_masuk || '00:00:00';
      const timeB = b.jamPulang || b.jam_pulang || b.jamMasuk || b.jam_masuk || '00:00:00';
      const cmp = timeB.localeCompare(timeA);
      if (cmp !== 0) return cmp;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    const seenTargets = new Set();
    const uniqueList = [];
    for (const log of sorted) {
      const tId = String(log.targetId || log.target_id || log.id);
      if (!seenTargets.has(tId)) {
        seenTargets.add(tId);
        uniqueList.push(log);
      }
    }
    return uniqueList;
  }, [presensiLogs, todayStr]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <QrCode color="#4f46e5" size={28} /> Kiosk Scan QR Presensi
          </h1>
          <p className="page-subtitle">Pindai QR Code Kartu Guru / Siswa via Kamera Webcam atau Scanner Barcode USB</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Audio Toggle */}
          <button 
            className={`btn ${audioEnabled ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{audioEnabled ? 'Suara Aktif' : 'Suara Mute'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Scanner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Column: Live Camera Reader */}
        <div className="card-modern" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={20} color="#4f46e5" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Kamera Scanner Live</h3>
            </div>
            <span className="badge badge-hadir">
              <span className="active-dot" /> Ready Scan
            </span>
          </div>

          <div 
            id="reader" 
            style={{ 
              width: '100%', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              border: '2px dashed #cbd5e1',
              backgroundColor: '#f8fafc'
            }}
          />

          <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginTop: '1rem' }}>
            Arahkan QR Code pada kartu ke area kotak kamera.
          </p>
        </div>

        {/* Right Column: Daftar Berhasil Scan Presensi Hari Ini */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card-modern" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={22} color="#10b981" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Daftar Berhasil Scan Hari Ini</h4>
              </div>
              <span className="badge badge-hadir" style={{ fontSize: '0.75rem' }}>
                {todayLogs.length} LOG
              </span>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Riwayat presensi masuk & pulang siswa & staf yang baru saja berhasil melakukan scan pada kiosk:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, maxHeight: '480px', overflowY: 'auto', paddingRight: '0.35rem' }}>
              {todayLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Clock size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem', margin: 0, fontWeight: 600 }}>Belum ada data scan presensi hari ini.</p>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>Arahkan QR Code ke kamera di sebelah kiri.</p>
                </div>
              ) : (
                todayLogs.map(log => {
                    const jMasuk = log.jamMasuk || log.jam_masuk || '';
                    const jPulang = log.jamPulang || log.jam_pulang || '';
                    const tType = log.targetType || log.target_type || 'Siswa';
                    const tId = log.targetId || log.target_id;
                    const hasPulang = Boolean(jPulang);

                    // Find photo from state if available
                    const userObj = tType === 'Siswa' 
                      ? (siswaList || []).find(s => s.id === tId)
                      : (guruTendikList || []).find(g => g.id === tId);
                    const userFoto = log.foto || (userObj ? userObj.foto : null);

                    return (
                      <div key={log.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0.95rem',
                        borderRadius: '12px',
                        background: hasPulang ? '#f0fdf4' : '#f8fafc',
                        border: hasPulang ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {userFoto ? (
                            <img 
                              src={userFoto} 
                              alt={log.nama || 'Avatar'}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                objectPosition: 'top center',
                                border: tType === 'Siswa' ? '2px solid #4338ca' : '2px solid #7e22ce',
                                flexShrink: 0
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: tType === 'Siswa' ? '#e0e7ff' : '#f3e8ff',
                              color: tType === 'Siswa' ? '#4338ca' : '#7e22ce',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              flexShrink: 0
                            }}>
                              {log.nama ? log.nama.charAt(0) : '?'}
                            </div>
                          )}

                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{log.nama || 'Tanpa Nama'}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              {tType === 'Siswa' ? <GraduationCap size={12} color="#4338ca" /> : <UserCheck size={12} color="#7e22ce" />}
                              <span>{tType} • {log.detailInfo || '-'}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                          {hasPulang ? (
                            <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}>
                              HADIR (PULANG)
                            </span>
                          ) : (
                            <span className={`badge badge-${(log.status || 'hadir').toLowerCase().includes('terlambat') ? 'terlambat' : 'hadir'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}>
                              {log.status || 'Hadir'}
                            </span>
                          )}
                          
                          <span style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', fontWeight: 700 }}>
                            {hasPulang ? (
                              <span>M: {jMasuk} | P: {jPulang}</span>
                            ) : (
                              <span>{jMasuk || jPulang || '-'} WIB</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up Card Result Modal / Overlay (Centered) */}
      {scanResult && (
        <div style={scanStyles.popupOverlay} onClick={() => setScanResult(null)}>
          <div 
            onClick={e => e.stopPropagation()} 
            style={{
              ...scanStyles.popupCard,
              borderTop: `6px solid ${scanResult.success ? (scanResult.status?.includes('Terlambat') ? '#f59e0b' : '#10b981') : '#ef4444'}`
            }}
          >
            {/* Header Result Status & Waktu Scan */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {scanResult.success ? (
                  <CheckCircle2 size={24} color={scanResult.status?.includes('Terlambat') ? '#f59e0b' : '#10b981'} />
                ) : (
                  <AlertCircle size={24} color="#ef4444" />
                )}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {scanResult.success ? `PRESENSI ${scanResult.mode || 'BERHASIL'}` : 'NOTIFIKASI PRESENSI'}
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                    {scanResult.timeStr ? `Waktu Scan: ${scanResult.timeStr} WIB` : 'Informasi QR Code'}
                  </span>
                </div>
              </div>
              {scanResult.success && scanResult.status && (
                <span className={`badge ${scanResult.status.includes('Terlambat') ? 'badge-terlambat' : 'badge-hadir'}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                  {scanResult.mode === 'PULANG' ? 'PULANG' : (scanResult.status.includes('Terlambat') ? 'TERLAMBAT' : 'TEPAT WAKTU')}
                </span>
              )}
            </div>

            {/* Top Section: Foto Profile / Avatar Paling Atas */}
            {scanResult.user && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.25rem' }}>
                {scanResult.user.foto ? (
                  <img 
                    src={scanResult.user.foto} 
                    alt={scanResult.user.nama} 
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition: 'top center',
                      border: scanResult.success ? '4px solid #10b981' : '4px solid #ef4444',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                      marginBottom: '0.75rem'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    background: scanResult.success ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                    marginBottom: '0.75rem'
                  }}>
                    {scanResult.user.nama ? scanResult.user.nama.charAt(0) : '?'}
                  </div>
                )}

                <span style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: scanResult.targetType === 'Siswa' ? '#4338ca' : '#7e22ce', 
                  background: scanResult.targetType === 'Siswa' ? '#e0e7ff' : '#f3e8ff', 
                  padding: '0.2rem 0.65rem', 
                  borderRadius: '20px',
                  marginBottom: '0.4rem'
                }}>
                  {scanResult.targetType === 'Siswa' ? 'DATA SISWA' : `DATA GURU / TENDIK (${scanResult.user.kategori || 'GURU'})`}
                </span>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0.15rem', lineHeight: 1.3 }}>
                  {scanResult.user.nama}
                </h2>
                
                <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                  {scanResult.targetType === 'Siswa' ? `Kelas ${(scanResult.user.kelas && typeof scanResult.user.kelas === 'object') ? scanResult.user.kelas.nama : (scanResult.user.kelas || '-')}` : (scanResult.user.jabatan || 'Guru')}
                </div>
              </div>
            )}

            {/* Middle Section: Main Message Alert Banner */}
            <div style={{
              padding: '1rem 1.1rem',
              borderRadius: '16px',
              marginBottom: '1.25rem',
              fontWeight: 700,
              fontSize: '0.96rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              backgroundColor: scanResult.success 
                ? (scanResult.mode === 'PULANG' ? '#f0fdf4' : '#ecfdf5')
                : '#fef2f2',
              color: scanResult.success 
                ? (scanResult.mode === 'PULANG' ? '#15803d' : '#047857')
                : '#b91c1c',
              border: scanResult.success 
                ? (scanResult.mode === 'PULANG' ? '1.5px solid #bbf7d0' : '1.5px solid #a7f3d0')
                : '1.5px solid #fecaca',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <span style={{ fontSize: '1.75rem' }}>
                {scanResult.success ? (scanResult.mode === 'PULANG' ? '🏠' : '👋') : '⚠️'}
              </span>
              <span style={{ lineHeight: 1.4 }}>{scanResult.message}</span>
            </div>

            {/* Bottom Section: Tutup Button */}
            <div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.75rem 1.5rem', fontWeight: 800, width: '100%', borderRadius: '14px', fontSize: '0.95rem' }} 
                onClick={() => setScanResult(null)}
              >
                Tutup (OK)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const scanStyles = {
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
    animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    pointerEvents: 'auto'
  },
  popupCard: {
    background: 'white',
    borderRadius: '24px',
    padding: '1.35rem',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    pointerEvents: 'auto',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  resultDetailBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    marginTop: '1rem'
  }
};
