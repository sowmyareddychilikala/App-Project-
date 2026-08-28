import React from 'react';
import { Search, ShieldCheck } from 'lucide-react';

export default function Header({ activeTab, onSearchClick }) {
  const titles = {
    dashboard: 'Dashboard Overview',
    expiry: 'Medicine Expiry Management',
    search: 'Clinical Medicine Information',
    community: 'Community Safety Feed',
    trust: 'Clinical Trust & Pharmacy Verification',
    safety: 'Community Safety Network',
    profile: 'User Profile & Settings'
  };

  return (
    <header className="top-header">
      <div>
        <h1 style={{ fontSize: '1.25rem', color: 'var(--slate-900)' }}>
          {titles[activeTab] || 'Dashboard'}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Quick Search Shortcut */}
        <button 
          onClick={onSearchClick}
          className="btn btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.825rem' }}
        >
          <Search size={16} />
          <span>Quick Med Search</span>
        </button>

        {/* Clinical Safety Badge */}
        <div className="badge badge-success" style={{ display: 'flex', gap: '6px' }}>
          <ShieldCheck size={14} />
          <span>System Verified</span>
        </div>
      </div>
    </header>
  );
}
