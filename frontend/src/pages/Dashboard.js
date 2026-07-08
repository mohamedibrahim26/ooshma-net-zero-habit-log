import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const CATEGORY_COLORS = {
  transport: '#3b82f6',
  energy: '#f59e0b',
  food: '#10b981',
  shopping: '#8b5cf6',
  waste: '#ef4444',
};

const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

function StatCard({ label, value, unit, icon, color }) {
  return (
    <div className="stat-card" style={{ borderTopColor: color }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}<span className="stat-unit">{unit}</span></div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activities/dashboard/')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const { totals, comparison, by_category, daily_trend, severity_breakdown } = data;

  const dailyData = daily_trend.map(d => ({
    date: new Date(d.activity_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    kg: parseFloat(d.total.toFixed(2))
  }));

  const categoryData = by_category.map(c => ({
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    value: parseFloat(c.total.toFixed(2)),
    color: CATEGORY_COLORS[c.category] || '#94a3b8',
  }));

  const vsGlobal = comparison.vs_global_percent;
  const betterThanAvg = vsGlobal < 0;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {user?.username} 👋</h1>
          <p className="page-sub">Here's your carbon footprint overview</p>
        </div>
        <Link to="/log" className="btn-primary">+ Log Activity</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Today" value={totals.today_kg} unit=" kg CO₂" icon="☀️" color="var(--green-500)" />
        <StatCard label="This Month" value={totals.month_kg} unit=" kg CO₂" icon="📅" color="var(--amber-500)" />
        <StatCard label="This Year" value={totals.year_kg} unit=" kg CO₂" icon="📆" color="#8b5cf6" />
        <StatCard
          label="vs Global Avg"
          value={`${betterThanAvg ? '' : '+'}${vsGlobal}%`}
          unit=""
          icon={betterThanAvg ? '🌟' : '⚠️'}
          color={betterThanAvg ? 'var(--green-500)' : 'var(--red-500)'}
        />
      </div>

      {/* Global comparison banner */}
      <div className={`compare-banner ${betterThanAvg ? 'good' : 'bad'}`}>
        {betterThanAvg
          ? `✅ This month you're ${Math.abs(vsGlobal)}% below the global average (${comparison.global_monthly_avg_kg} kg/month). Keep it up!`
          : `⚠️ This month you're ${vsGlobal}% above the global average (${comparison.global_monthly_avg_kg} kg/month). Check the Action Center for tips.`
        }
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Daily trend */}
        <div className="chart-card wide">
          <h2 className="chart-title">Daily CO₂ (last 30 days)</h2>
          {dailyData.length === 0
            ? <div className="empty-chart">No activity logged yet. <Link to="/log">Start logging →</Link></div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" kg" />
                  <Tooltip formatter={(v) => [`${v} kg CO₂`, 'Emissions']} />
                  <Area type="monotone" dataKey="kg" stroke="#16a34a" fill="url(#greenGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* By category */}
        <div className="chart-card">
          <h2 className="chart-title">By Category (this month)</h2>
          {categoryData.length === 0
            ? <div className="empty-chart">No data yet.</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} kg CO₂`]} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Severity breakdown */}
        <div className="chart-card">
          <h2 className="chart-title">Activity Severity (this month)</h2>
          {severity_breakdown.length === 0
            ? <div className="empty-chart">No data yet.</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={severity_breakdown.map(s => ({
                  name: s.severity.charAt(0).toUpperCase() + s.severity.slice(1),
                  count: s.count,
                  fill: SEVERITY_COLORS[s.severity] || '#94a3b8'
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {severity_breakdown.map((s, i) => (
                      <Cell key={i} fill={SEVERITY_COLORS[s.severity] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <h2 className="chart-title">Quick Actions</h2>
        <div className="quick-grid">
          <Link to="/log" className="quick-card green">
            <span className="q-icon">✏️</span>
            <span>Log an activity</span>
          </Link>
          <Link to="/actions" className="quick-card blue">
            <span className="q-icon">⚡</span>
            <span>See reduction tips</span>
          </Link>
          <Link to="/history" className="quick-card purple">
            <span className="q-icon">📋</span>
            <span>View history</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
