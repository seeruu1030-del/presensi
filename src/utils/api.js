export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (res) => {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Terjadi kesalahan pada server');
  }
  if (json && json.error) {
    throw new Error(json.error);
  }
  return json;
};

export const api = {
  // Profil Sekolah
  getProfilSekolah: () => fetch(`${API_URL}/profil-sekolah`).then(handleResponse),
  saveProfilSekolah: (data) => fetch(`${API_URL}/profil-sekolah`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Pengaturan
  getPengaturan: () => fetch(`${API_URL}/pengaturan`).then(handleResponse),
  savePengaturan: (data) => fetch(`${API_URL}/pengaturan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Guru Tendik
  getGuruTendik: () => fetch(`${API_URL}/guru-tendik`).then(handleResponse),
  addGuruTendik: (data) => fetch(`${API_URL}/guru-tendik`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateGuruTendik: (id, data) => fetch(`${API_URL}/guru-tendik/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteGuruTendik: (id) => fetch(`${API_URL}/guru-tendik/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Siswa
  getSiswa: () => fetch(`${API_URL}/siswa`).then(handleResponse),
  addSiswa: (data) => fetch(`${API_URL}/siswa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updateSiswa: (id, data) => fetch(`${API_URL}/siswa/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteSiswa: (id) => fetch(`${API_URL}/siswa/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Kelas
  getKelas: () => fetch(`${API_URL}/kelas`).then(handleResponse),
  addKelas: (data) => fetch(`${API_URL}/kelas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteKelas: (id) => fetch(`${API_URL}/kelas/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Presensi Logs
  getPresensi: () => fetch(`${API_URL}/presensi`).then(handleResponse),
  addPresensi: (data) => fetch(`${API_URL}/presensi/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  updatePresensi: (id, data) => fetch(`${API_URL}/presensi/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse),
  deleteAllPresensi: () => fetch(`${API_URL}/presensi/all`, {
    method: 'DELETE'
  }).then(handleResponse),

  // WhatsApp
  getWhatsAppStatus: () => fetch(`${API_URL}/whatsapp/status`).then(handleResponse),
  logoutWhatsApp: () => fetch(`${API_URL}/whatsapp/logout`, { method: 'POST' }).then(handleResponse)
};
