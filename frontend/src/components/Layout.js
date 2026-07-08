import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    links: [
      { to: '/', label: 'Dashboard', icon: '📊', color: '#3b82f6', end: true },
    ],
  },
  {
    label: 'TRACK',
    links: [
      { to: '/log',     label: 'Log Activity', icon: '✏️',  color: '#f97316' },
      { to: '/goals',   label: 'Goals',        icon: '🎯',  color: '#ef4444' },
      { to: '/history', label: 'History',      icon: '📋',  color: '#8b5cf6' },
    ],
  },
  {
    label: 'INSIGHTS',
    links: [
      { to: '/streaks', label: 'Achievements', icon: '🏆', color: '#f59e0b' },
      { to: '/report',  label: 'Reports',      icon: '📈', color: '#06b6d4' },
    ],
  },
  {
    label: 'TOOLS',
    links: [
      { to: '/chat',    label: 'AI Assistant',  icon: '🤖', color: '#a855f7' },
      { to: '/scanner', label: 'Food Scanner',  icon: '🔍', color: '#10b981' },
      { to: '/actions', label: 'Action Center', icon: '⚡', color: '#eab308' },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Find the active page label for topbar
  const allLinks = NAV_SECTIONS.flatMap(s => s.links);
  const active = allLinks.find(l =>
    l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)
  );

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>

        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo-wrap">
            <div className="logo-badge">🌿</div>
            <div className="logo-text">
              <span className="logo-name">Ooshma</span>
              <span className="logo-tagline">Net-Zero Habit Log</span>
            </div>
          </div>
          <button className="collapse-btn desktop-only" onClick={() => setCollapsed(v => !v)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? '›' : '‹'}
          </button>
          <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="nav-section">
              {section.links.map(({ to, label, icon, color, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                  style={{ '--link-color': color }}
                  data-label={label}
                >

                  <span className="nav-icon-wrap" style={{ background: color + '22' }}>
                    <span className="nav-icon">{icon}</span>
                  </span>
                  <span className="nav-label">{label}</span>
                  <span className="nav-arrow">›</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar-wrap">
              <div className="avatar">{user?.username?.[0]?.toUpperCase() || '?'}</div>
              <span className="avatar-dot" />
            </div>
            <div className="user-info">
              <div className="user-name">{user?.username}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span>⎋</span> Sign out
          </button>
        </div>

        {/* Decorative leaf watermark */}
        <div className="sidebar-watermark" aria-hidden="true">🌿</div>
      </aside>

      <div className={`main-wrapper ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
          <div className="topbar-left">
            <span className="topbar-logo">🌿 Ooshma</span>
            {active && <span className="topbar-page">{active.label}</span>}
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}
    </div>
  );
}
