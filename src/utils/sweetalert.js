import Swal from 'sweetalert2';

export const showSuccessAlert = (title = 'Berhasil!', message = 'Data berhasil disimpan.') => {
  Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    timer: 2000,
    showConfirmButton: false,
    timerProgressBar: true,
    background: '#ffffff',
    color: '#0f172a',
    iconColor: '#10b981',
    customClass: {
      popup: 'swal2-rounded-popup'
    }
  });
};

export const showErrorAlert = (title = 'Gagal!', message = 'Terjadi kesalahan.') => {
  Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonColor: '#4f46e5',
    confirmButtonText: 'Tutup'
  });
};

export const showWarningAlert = (title = 'Perhatian!', message = 'Peringatan.') => {
  Swal.fire({
    icon: 'warning',
    title: title,
    text: message,
    confirmButtonColor: '#4f46e5',
    confirmButtonText: 'Tutup'
  });
};

export const showDeleteConfirm = ({ title = 'Konfirmasi Hapus Data', itemName = 'item ini', onConfirm }) => {
  Swal.fire({
    title: title,
    text: `Apakah Anda yakin ingin menghapus data "${itemName}"? Data yang sudah dihapus tidak dapat dikembalikan!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Hapus Data!',
    cancelButtonText: 'Batal',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
    }
  });
};

export const showConfirmDialog = ({ 
  title = 'Konfirmasi Aksi', 
  text = 'Apakah Anda yakin?', 
  icon = 'question', 
  confirmButtonText = 'Ya, Lanjutkan', 
  confirmButtonColor = '#ef4444',
  onConfirm 
}) => {
  Swal.fire({
    title: title,
    text: text,
    icon: icon,
    showCancelButton: true,
    confirmButtonColor: confirmButtonColor,
    cancelButtonColor: '#64748b',
    confirmButtonText: confirmButtonText,
    cancelButtonText: 'Batal',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
    }
  });
};
