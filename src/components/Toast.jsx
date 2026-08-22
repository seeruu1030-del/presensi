import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  const getIcon = () => {
    switch (type) {
      case 'warning': return <AlertCircle size={20} color="#b45309" />;
      case 'danger': return <AlertCircle size={20} color="#be123c" />;
      case 'info': return <Info size={20} color="#0369a1" />;
      default: return <CheckCircle2 size={20} color="#15803d" />;
    }
  };

  const getBgClass = () => {
    switch (type) {
      case 'warning': return 'badge-terlambat';
      case 'danger': return 'badge-alpa';
      case 'info': return 'badge-izin';
      default: return 'badge-hadir';
    }
  };

  return (
    <div style={toastStyles.container}>
      <div style={{ ...toastStyles.toast, borderLeft: `4px solid ${type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'}` }}>
        {getIcon()}
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{message}</span>
      </div>
    </div>
  );
};

const toastStyles = {
  container: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    zIndex: 9999,
    animation: 'slideUp 0.3s ease-out'
  },
  toast: {
    background: '#ffffff',
    padding: '0.875rem 1.25rem',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    border: '1px solid #e2e8f0'
  }
};
