import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import './Achievements.css';

const ALL_ACHIEVEMENTS = [
  { type: 'first_log',       label: '🌱 First Step',        desc: 'Log your first activity',         xp: 10  },
  { type: 'streak_3',        label: '🔥 3-Day Streak',      desc: 'Log for 3 consecutive days',      xp: 30  },
  { type: 'streak_7',        label: '⚡ Week Warrior',       desc: 'Log for 7 consecutive days',      xp: 70  },
  { type: 'streak_30',       label: '🏆 Month Master',      desc: 'Log for 30 consecutive days',     xp: 300 },
  { type: 'low_impact_week', label: '🌿 Green Week',        desc: 'All activities low impact for 7 days', xp: 50 },
  { type: 'logged_10',       label: '📋 Consistent Logger', desc: 'Log 10 total activities',         xp: 50  },
  { type: 'logged_50',       label: '💪 Carbon Conscious',  desc: 'Log 50 total activities',         xp: 200 },
  { type: 'goal_achieved',   label: '🎯 Goal Crusher',      desc: 'Complete a carbon goal',          xp: 100 },
  { type: 'food_scanner',    label: '🔍 Food Detective',    desc: 'Use the food scanner',            xp: 20  },
  { type: 'report_sent',     label: '📧 Report Sender',     desc: 'Send your first weekly report',   xp: 30  },
];

export default function Achievements() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/streak/').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const { streak, achievements } = data;
  const unlockedTypes = new Set(achievements.map(a => a.achievement_type));
  const totalXP = ALL_ACHIEVEMENTS.filter(a => unlockedTypes.has(a.type)).reduce((s, a) => s + a.xp, 0);
  const maxXP = ALL_ACHIEVEMENTS.reduce((s, a) => s + a.xp, 0);

  return (
    <div className="ach-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Streaks & Achievements</h1>
          <p className="page-sub">Keep logging daily to earn rewards</p>
        </div>
      </div>

      {/* Streak cards */}
      <div className="streak-cards">
        <div className="streak-card fire">
          <div className="streak-icon">🔥</div>
          <div className="streak-value">{streak.current_streak}</div>
          <div className="streak-label">Current Streak</div>
          <div className="streak-sub">days in a row</div>
        </div>
        <div className="streak-card gold">
          <div className="streak-icon">🏅</div>
          <div className="streak-value">{streak.longest_streak}</div>
          <div className="streak-label">Longest Streak</div>
          <div className="streak-sub">personal best</div>
        </div>
        <div className="streak-card green">
          <div className="streak-icon">📅</div>
          <div className="streak-value">{streak.total_days_logged}</div>
          <div className="streak-label">Total Days</div>
          <div className="streak-sub">logged overall</div>
        </div>
        <div className="streak-card purple">
          <div className="streak-icon">⭐</div>
          <div className="streak-value">{totalXP}</div>
          <div className="streak-label">XP Earned</div>
          <div className="streak-sub">out of {maxXP} total</div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="xp-card">
        <div className="xp-header">
          <span>Overall Progress</span>
          <span>{unlockedTypes.size} / {ALL_ACHIEVEMENTS.length} achievements</span>
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${(unlockedTypes.size / ALL_ACHIEVEMENTS.length) * 100}%` }} />
        </div>
      </div>

      {/* Achievements grid */}
      <div className="ach-grid">
        {ALL_ACHIEVEMENTS.map(ach => {
          const unlocked = unlockedTypes.has(ach.type);
          const detail = achievements.find(a => a.achievement_type === ach.type);
          return (
            <div key={ach.type} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="ach-emoji">{ach.label.split(' ')[0]}</div>
              <div className="ach-name">{ach.label.slice(ach.label.indexOf(' ') + 1)}</div>
              <div className="ach-desc">{ach.desc}</div>
              <div className="ach-footer">
                <span className="ach-xp">+{ach.xp} XP</span>
                {unlocked
                  ? <span className="ach-date">✅ {new Date(detail.unlocked_at).toLocaleDateString()}</span>
                  : <span className="ach-locked">🔒 Locked</span>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Streak tips */}
      <div className="streak-tips">
        <h2>🔥 How to keep your streak</h2>
        <div className="streak-tip-grid">
          <div className="st-box">📅 Log at least one activity every day</div>
          <div className="st-box">⏰ Set a daily reminder (morning or evening)</div>
          <div className="st-box">🚗 Even small things count — a bus ride, a meal</div>
          <div className="st-box">🌱 Consistency beats perfection</div>
        </div>
      </div>
    </div>
  );
}
