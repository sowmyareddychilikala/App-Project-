import React from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  Search, 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  LogOut,
  Shield
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expiry', label: 'Expiry Management', icon: Pill },
    { id: 'search', label: 'Medicine Search', icon: Search },
    { id: 'community', label: 'Community Safety Feed', icon: Users },
    { id: 'trust', label: 'Clinical Trust', icon: ShieldCheck },
    { id: 'safety', label: 'Community Safety Network', icon: ShieldAlert },
    { id: 'profile', label: 'Profile & Settings', icon: User }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--outline-variant)' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, #003d9b 0%, #001848 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 10px rgba(0, 61, 155, 0.25)'
        }}>
          <Shield size={24} />
        </div>
        <div className="brand-title">
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text)', lineHeight: '1.1', fontWeight: '700' }}>MedVigilance</h2>
          <span style={{ fontSize: '0.725rem', color: 'var(--primary)', fontWeight: '600' }}>MediTrust Platform</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#003d9b' : 'var(--text-secondary)',
                background: isActive ? '#dae2ff' : 'transparent',
                fontWeight: isActive ? '700' : '500',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <Icon size={20} color={isActive ? '#003d9b' : 'var(--outline)'} />
              <span className="nav-text" style={{ fontSize: '0.9rem' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--outline-variant)' }}>
        <div style={{ 
          padding: '12px', 
          borderRadius: 'var(--radius-md)', 
          background: 'var(--surface-container-low)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '0' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.9rem'
            }}>
              {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div className="nav-text" style={{ minWidth: '0' }}>
              <p style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.displayName || user?.email?.split('@')[0] || 'Clinical User'}
              </p>
              <p style={{ fontSize: '0.725rem', color: 'var(--secondary)', fontWeight: '600' }}>Verified Patient</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            title="Sign Out"
            style={{ 
              background: 'transparent', 
              color: 'var(--error)', 
              padding: '6px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

