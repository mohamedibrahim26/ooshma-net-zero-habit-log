import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import './History.css';

const SEVERITY_CONFIG = {
  low: { label: 'Low', bg: '#dcfce7', color: '#166534' },
  medium: { label: 'Medium', bg: '#fef9c3', color: '#854d0e' },
  high: { label: 'High', bg: '#ffedd5', color: '#9a3412' },
  critical: { label: 'Critical', bg: '#fee2e2', color: '#991b1b' },
};

const CATEGORY_ICONS = {
  transport: '🚗', energy: '⚡', food: '🥗', shopping: '🛍️', waste: '🗑️',
};

export default function History() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', severity: '', days: '30' });
  const navigate = useNavigate();

  const fetchActivities = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.days) params.append('days', filters.days);

    api.get(`/activities/?${params}`)
      .then(r => setActivities(r.data.results || r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchActivities(); }, [filters]);

  const deleteActivity = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    await api.delete(`/activities/${id}/`);
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const totalCo2 = activities.reduce((sum, a) => sum + a.kg_co2, 0);

  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  return (
    <div className="history-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity History</h1>
          <p className="page-sub">
            {activities.length} activities · {totalCo2.toFixed(1)} kg CO₂ total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select value={filters.category} onChange={setFilter('category')}>
          <option value="">All categories</option>
          {['transport', 'energy', 'food', 'shopping', 'waste'].map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select value={filters.severity} onChange={setFilter('severity')}>
          <option value="">All severities</option>
          {['low', 'medium', 'high', 'critical'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select value={filters.days} onChange={setFilter('days')}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
          <option value="">All time</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No activities found. <button onClick={() => navigate('/log')}>Log your first activity →</button></p>
        </div>
      ) : (
        <div className="activity-list">
          {activities.map(act => {
            const sev = SEVERITY_CONFIG[act.severity] || SEVERITY_CONFIG.low;
            return (
              <div key={act.id} className="activity-row">
                <div className="act-icon">{CATEGORY_ICONS[act.category] || '📌'}</div>
                <div className="act-info">
                  <div className="act-type">{act.activity_type.replace(/_/g, ' ')}</div>
                  <div className="act-meta">
                    <span className="act-cat">{act.category}</span>
                    <span>·</span>
                    <span>{act.quantity} {act.unit}</span>
                    {act.notes && <><span>·</span><span className="act-notes">{act.notes}</span></>}
                  </div>
                </div>
                <div className="act-right">
                  <div className="act-co2">{act.kg_co2} kg</div>
                  <div className="act-date">{new Date(act.activity_date).toLocaleDateString()}</div>
                  <span
                    className="sev-badge"
                    style={{ background: sev.bg, color: sev.color }}
                  >
                    {sev.label}
                  </span>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => deleteActivity(act.id)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
