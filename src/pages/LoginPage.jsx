import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import './LoginPage.css';

export const LoginPage = () => {
  const { login } = useAuth();
  const [role, setRole] = useState('admin'); // 'admin', 'guru', 'siswa'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password, role);
    if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="brand-header">
          <ShieldCheck size={42} className="brand-icon" />
          <h1>PresensiPro</h1>
        </div>
        <div className="hero-text">
          <h2>Sistem Kehadiran<br/>Digital Modern.</h2>
          <p>Akses cepat, transparan, dan mudah untuk mengelola presensi harian di sekolah Anda.</p>
        </div>
        <div className="decorative-circles">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h3>Selamat Datang</h3>
            <p>Silakan masuk ke akun Anda</p>
          </div>

          <div className="role-selector">
            <button 
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
            <button 
              className={`role-btn ${role === 'guru' ? 'active' : ''}`}
              onClick={() => setRole('guru')}
            >
              Guru & Staf
            </button>
            <button 
              className={`role-btn ${role === 'siswa' ? 'active' : ''}`}
              onClick={() => setRole('siswa')}
            >
              Siswa
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="input-group">
              <label>
                {role === 'admin' ? 'Username' : role === 'guru' ? 'NIP / NUPTK / NIK' : 'NISN'}
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder={`Masukkan ${role === 'admin' ? 'username' : role === 'guru' ? 'NIP/NUPTK/NIK' : 'NISN'} Anda`}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Masukkan password Anda"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin-anim" /> Memproses...
                </>
              ) : (
                <>
                  Masuk Sekarang <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Lupa password? Silakan hubungi Administrator sekolah Anda.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
