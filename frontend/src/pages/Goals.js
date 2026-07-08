import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import './Goals.css';

const STATUS_CONFIG = {
  on_track: { label: 'On Track', color: '#16a34a', bg: '#f0fdf4' },
  warning:  { label: 'Warning',  color: '#d97706', bg: '#fffbeb' },
  exceeded: { label: 'Exceeded', color: '#dc2626', bg: '#fef2f2' },
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', target_kg: '', period: 'monthly', start_date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const fetchGoals = () => {
    setLoading(true);
    api.get('/goals/').then(r => setGoals(r.data.results || r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/goals/', form);
      setShowForm(false);
      setForm({ title: '', target_kg: '', period: 'monthly', start_date: new Date().toISOString().split('T')[0] });
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save goal.');
    } finally { setSaving(false); }
  };

  const deleteGoal = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    await api.delete(`/goals/${id}/`);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const toggleActive = async (goal) => {
    await api.patch(`/goals/${goal.id}/`, { is_active: !goal.is_active });
    fetchGoals();
  };

  const set = f => e => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="goals-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 Carbon Goals</h1>
          <p className="page-sub">Set targets and track your progress</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New Goal'}
        </button>
      </div>

      {showForm && (
        <div className="goal-form-card">
          <h2>Create a New Goal</h2>
          <form onSubmit={handleSubmit} className="goal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Goal Title</label>
                <input value={form.title} onChange={set('title')} placeholder="e.g. Keep under 300kg this month" required />
              </div>
              <div className="form-group">
                <label>Target (kg CO₂)</label>
                <input type="number" min="1" value={form.target_kg} onChange={set('target_kg')} placeholder="e.g. 300" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Period</label>
                <select value={form.period} onChange={set('period')}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={form.start_date} onChange={set('start_date')} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : '🎯 Create Goal'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <p>No goals yet. Set your first carbon target!</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Create a goal</button>
        </div>
      ) : (
        <div className="goals-list">
          {goals.map(goal => {
            const st = STATUS_CONFIG[goal.status] || STATUS_CONFIG.on_track;
            const pct = Math.min(goal.progress_percent, 100);
            return (
              <div key={goal.id} className={`goal-card ${!goal.is_active ? 'inactive' : ''}`}>
                <div className="goal-card-header">
                  <div>
                    <h3 className="goal-title">{goal.title}</h3>
                    <span className="goal-period">{goal.period} goal · started {new Date(goal.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="goal-actions">
                    <span className="status-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    <button className="icon-btn" onClick={() => toggleActive(goal)} title={goal.is_active ? 'Pause' : 'Activate'}>
                      {goal.is_active ? '⏸' : '▶️'}
                    </button>
                    <button className="icon-btn danger" onClick={() => deleteGoal(goal.id)}>🗑</button>
                  </div>
                </div>

                <div className="goal-stats">
                  <div className="goal-stat">
                    <span className="goal-stat-value">{goal.current_kg} kg</span>
                    <span className="goal-stat-label">Current</span>
                  </div>
                  <div className="goal-stat">
                    <span className="goal-stat-value">{goal.target_kg} kg</span>
                    <span className="goal-stat-label">Target</span>
                  </div>
                  <div className="goal-stat">
                    <span className="goal-stat-value" style={{ color: goal.remaining_kg > 0 ? '#16a34a' : '#dc2626' }}>
                      {goal.remaining_kg} kg
                    </span>
                    <span className="goal-stat-label">Remaining</span>
                  </div>
                </div>

                <div className="progress-wrap">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#22c55e'
                      }}
                    />
                  </div>
                  <span className="progress-pct">{goal.progress_percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="goals-tips">
        <h2>💡 Setting Effective Goals</h2>
        <div className="tips-row-grid">
          <div className="tip-box">🎯 <strong>Monthly:</strong> Try targeting 10% below global avg (360 kg/month)</div>
          <div className="tip-box">📉 <strong>Yearly:</strong> Aim for &lt;2,000 kg/year (Paris Agreement target)</div>
          <div className="tip-box">🏆 <strong>Stretch:</strong> Under 150 kg/month puts you in the top 10% globally</div>
        </div>
      </div>
    </div>
  );
}
