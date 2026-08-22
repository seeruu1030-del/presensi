import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  UserX,
  GraduationCap, 
  CalendarRange, 
  QrCode, 
  Settings, 
  FileText, 
  ClipboardCheck, 
  ChevronRight,
  ChevronDown,
  School,
  CreditCard,
  LogOut,
  Award,
  Briefcase,
  Layers,
  Menu,
  Database,
  ClipboardEdit
} from 'lucide-react';

export const Sidebar = () => {
  const { activeMenu, setActiveMenu, profilSekolah } = useApp();
  const { user, logout } = useAuth();
  
  // State for collapsible parent menus
  const [isGtkOpen, setIsGtkOpen] = useState(false);
  const [isSiswaOpen, setIsSiswaOpen] = useState(false);
  const [isCetakOpen, setIsCetakOpen] = useState(false);
  const [isPengaturanOpen, setIsPengaturanOpen] = useState(false);

  // Auto collapse dropdowns when activeMenu changes to an outside item
  useEffect(() => {
    const isGtkMenu = ['data-guru', 'data-tendik', 'tugas-gtk', 'gtk-nonaktif'].includes(activeMenu);
    const isSiswaMenu = ['data-siswa', 'tugas-siswa', 'siswa-nonaktif'].includes(activeMenu);
    const isCetakMenu = ['cetak-kartu-gtk', 'cetak-kartu-siswa'].includes(activeMenu);
    const isPengaturanMenu = ['pengaturan-presensi', 'pengaturan-backup'].includes(activeMenu);

    if (isGtkMenu) {
      setIsGtkOpen(true);
      setIsSiswaOpen(false);
      setIsCetakOpen(false);
      setIsPengaturanOpen(false);
    } else if (isSiswaMenu) {
      setIsSiswaOpen(true);
      setIsGtkOpen(false);
      setIsCetakOpen(false);
      setIsPengaturanOpen(false);
    } else if (isCetakMenu) {
      setIsCetakOpen(true);
      setIsGtkOpen(false);
      setIsSiswaOpen(false);
      setIsPengaturanOpen(false);
    } else if (isPengaturanMenu) {
      setIsPengaturanOpen(true);
      setIsGtkOpen(false);
      setIsSiswaOpen(false);
      setIsCetakOpen(false);
    } else {
      setIsGtkOpen(false);
      setIsSiswaOpen(false);
      setIsCetakOpen(false);
      setIsPengaturanOpen(false);
    }
  }, [activeMenu]);

  const allMenuItems = [
    {
      group: 'UTAMA',
      roles: ['admin', 'guru', 'tendik', 'siswa'],
      items: [
        { id: 'dashboard', label: user?.role === 'admin' ? 'Dashboard' : 'Profil & Riwayat', icon: LayoutDashboard }
      ]
    },
    {
      group: 'DATA MASTER',
      roles: ['admin'],
      items: [
        { id: 'profil-sekolah', label: 'Profil Sekolah', icon: School },
        { 
          id: 'gtk-parent', 
          label: 'GTK', 
          icon: UserCheck,
          isParent: true,
          isOpen: isGtkOpen,
          toggleOpen: () => setIsGtkOpen(!isGtkOpen),
          subItems: [
            { id: 'data-guru', label: 'Guru', icon: UserCheck },
            { id: 'data-tendik', label: 'Tendik', icon: Users },
            { id: 'tugas-gtk', label: 'Tugas GTK', icon: Award },
            { id: 'gtk-nonaktif', label: 'GTK Non-Aktif', icon: UserX, isDanger: true }
          ]
        },
        {
          id: 'siswa-parent',
          label: 'Peserta Didik',
          icon: GraduationCap,
          isParent: true,
          isOpen: isSiswaOpen,
          toggleOpen: () => setIsSiswaOpen(!isSiswaOpen),
          subItems: [
            { id: 'data-siswa', label: 'Peserta Didik', icon: GraduationCap },
            { id: 'tugas-siswa', label: 'Tugas Peserta Didik', icon: Briefcase },
            { id: 'siswa-nonaktif', label: 'PD Non-Aktif', icon: UserX, isDanger: true }
          ]
        }
      ]
    },
    {
      group: 'AKADEMIK',
      roles: ['admin'],
      items: [
        { id: 'akademik', label: 'Tapel & Semester', icon: CalendarRange },
        { id: 'rombel', label: 'Rombel / Kelas', icon: Layers }
      ]
    },
    {
      group: 'PRESENSI',
      roles: ['admin'],
      items: [
        { id: 'scan-qr', label: 'Scan QR Code', icon: QrCode, highlight: true },
        {
          id: 'cetak-kartu-parent',
          label: 'Cetak Kartu',
          icon: CreditCard,
          isParent: true,
          isOpen: isCetakOpen,
          toggleOpen: () => setIsCetakOpen(!isCetakOpen),
          subItems: [
            { id: 'cetak-kartu-gtk', label: 'GTK', icon: UserCheck },
            { id: 'cetak-kartu-siswa', label: 'Peserta Didik', icon: GraduationCap }
          ]
        },
        { id: 'kelola-presensi', label: 'Kelola Presensi', icon: ClipboardEdit },
        { id: 'rekap-guru', label: 'Rekap Guru & Tendik', icon: FileText },
        { id: 'rekap-siswa', label: 'Rekap Presensi Siswa', icon: ClipboardCheck }
      ]
    },
    {
      group: 'PENGATURAN',
      roles: ['admin'],
      items: [
        {
          id: 'pengaturan-parent',
          label: 'Pengaturan',
          icon: Settings,
          isParent: true,
          isOpen: isPengaturanOpen,
          toggleOpen: () => setIsPengaturanOpen(!isPengaturanOpen),
          subItems: [
            { id: 'pengaturan-presensi', label: 'Pengaturan Presensi', icon: Settings },
            { id: 'pengaturan-backup', label: 'Backup Umum', icon: Database }
          ]
        }
      ]
    }
  ];

  const menuItems = allMenuItems.filter(group => group.roles.includes(user?.role || 'admin'));

  const schoolName = profilSekolah?.namaSekolah || profilSekolah?.nama_sekolah || 'SMK / SMA Negeri';

  return (
    <aside className="app-sidebar" style={sidebarStyles.container}>
      {/* Brand Logo Header */}
      <div style={sidebarStyles.brand}>
        {profilSekolah?.logo ? (
          <img 
            src={profilSekolah.logo} 
            alt="Logo Sekolah" 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '3px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              flexShrink: 0
            }}
          />
        ) : (
          <div style={sidebarStyles.logoIcon}>
            <School size={26} color="#ffffff" />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={sidebarStyles.brandTitle}>E-Presensi</h1>
          <p style={{ ...sidebarStyles.brandSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={schoolName}>
            {schoolName}
          </p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div style={sidebarStyles.navContainer}>
        {menuItems.map((group, idx) => (
          <div key={idx} style={{ marginBottom: '1.5rem' }}>
            <div style={sidebarStyles.groupLabel}>{group.group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {group.items.map(item => {
                const Icon = item.icon;

                // Handle Parent Collapsible Menu (GTK / Peserta Didik)
                if (item.isParent) {
                  const isAnySubActive = item.subItems.some(sub => activeMenu === sub.id);

                  return (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <button
                        onClick={item.toggleOpen}
                        style={{
                          ...sidebarStyles.navItem,
                          ...(isAnySubActive ? sidebarStyles.navItemParentActive : {})
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <Icon 
                            size={20} 
                            color={isAnySubActive ? '#a5b4fc' : '#94a3b8'} 
                          />
                          <span style={{ fontWeight: isAnySubActive ? '700' : '600' }}>{item.label}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {item.isOpen ? <ChevronDown size={16} color="#cbd5e1" /> : <ChevronRight size={16} color="#cbd5e1" />}
                        </div>
                      </button>

                      {/* Sub Items */}
                      {item.isOpen && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.15rem',
                          marginLeft: '1.25rem',
                          paddingLeft: '0.65rem',
                          borderLeft: '2px solid rgba(99, 102, 241, 0.25)',
                          marginTop: '0.1rem'
                        }}>
                          {item.subItems.map(subItem => {
                            const SubIcon = subItem.icon;
                            const isSubActive = activeMenu === subItem.id;
                            const isDanger = subItem.isDanger;

                            return (
                              <button
                                key={subItem.id}
                                onClick={() => setActiveMenu(subItem.id)}
                                style={{
                                  ...sidebarStyles.navItem,
                                  padding: '0.55rem 0.75rem',
                                  fontSize: '0.825rem',
                                  color: isDanger && !isSubActive ? '#f87171' : (isSubActive ? '#ffffff' : '#cbd5e1'),
                                  ...(isSubActive 
                                    ? (isDanger ? sidebarStyles.navItemDangerActive : sidebarStyles.navItemActive)
                                    : {}
                                  )
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <SubIcon 
                                    size={16} 
                                    color={isSubActive ? '#ffffff' : (isDanger ? '#ef4444' : '#94a3b8')} 
                                  />
                                  <span style={{ fontWeight: isSubActive ? '700' : '600' }}>{subItem.label}</span>
                                </div>

                                {isSubActive && <ChevronRight size={14} color="#ffffff" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular Single Item
                const isActive = activeMenu === item.id;
                const isHighlight = item.highlight;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    style={{
                      ...sidebarStyles.navItem,
                      ...(isActive ? sidebarStyles.navItemActive : {}),
                      ...(isHighlight && !isActive ? sidebarStyles.navItemHighlight : {})
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <Icon 
                        size={20} 
                        color={isActive ? '#ffffff' : (isHighlight ? '#a855f7' : '#94a3b8')} 
                      />
                      <span style={{ fontWeight: isActive ? '700' : '500' }}>{item.label}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {item.badge && (
                        <span style={sidebarStyles.badge}>{item.badge}</span>
                      )}
                      {isActive && <ChevronRight size={16} color="#ffffff" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div style={sidebarStyles.footer}>
        <div style={sidebarStyles.footerCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>{user?.role || 'User'}</div>
            <button onClick={logout} style={sidebarStyles.logoutBtn} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name || 'Administrator'}
          </div>
        </div>
      </div>
    </aside>
  );
};

const sidebarStyles = {
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  container: {
    width: '280px',
    minWidth: '280px',
    flexShrink: 0,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
    zIndex: 100
  },
  brand: {
    padding: '1.5rem 1.5rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  logoIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: '#ffffff',
    margin: 0
  },
  brandSub: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: 0
  },
  navContainer: {
    padding: '1.25rem 1rem',
    flex: 1,
    overflowY: 'auto'
  },
  groupLabel: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.08em',
    padding: '0 0.75rem',
    marginBottom: '0.5rem'
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 0.875rem',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#cbd5e1',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left'
  },
  navItemActive: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
  },
  navItemDangerActive: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
  },
  navItemParentActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#ffffff',
    fontWeight: '700'
  },
  navItemHighlight: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    color: '#c084fc',
    border: '1px solid rgba(168, 85, 247, 0.3)'
  },
  badge: {
    fontSize: '0.7rem',
    padding: '0.15rem 0.5rem',
    borderRadius: '20px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#cbd5e1'
  },
  footer: {
    padding: '1rem',
    borderTop: '1px solid rgba(255,255,255,0.08)'
  },
  footerCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  activeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 8px #10b981'
  }
};
