import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import './ActionCenter.css';

const IMPACT_TIPS = [
  {
    category: 'Diet',
    icon: '🥗',
    color: '#10b981',
    tips: [
      { action: 'Go meat-free one day per week', saving: 400, difficulty: 'easy' },
      { action: 'Replace beef with chicken or legumes', saving: 600, difficulty: 'easy' },
      { action: 'Buy local and seasonal produce', saving: 200, difficulty: 'easy' },
      { action: 'Reduce food waste by meal planning', saving: 300, difficulty: 'easy' },
    ]
  },
  {
    category: 'Transport',
    icon: '🚗',
    color: '#3b82f6',
    tips: [
      { action: 'Walk or cycle for journeys under 5km', saving: 300, difficulty: 'easy' },
      { action: 'Use public transport instead of car', saving: 1400, difficulty: 'medium' },
      { action: 'Work from home 2 days per week', saving: 600, difficulty: 'easy' },
      { action: 'Carpool for regular commutes', saving: 900, difficulty: 'medium' },
    ]
  },
  {
    category: 'Home Energy',
    icon: '⚡',
    color: '#f59e0b',
    tips: [
      { action: 'Switch to a renewable energy tariff', saving: 500, difficulty: 'easy' },
      { action: 'Lower thermostat by 1°C', saving: 130, difficulty: 'easy' },
      { action: 'Use LED bulbs throughout your home', saving: 80, difficulty: 'easy' },
      { action: 'Insulate your home (loft + walls)', saving: 600, difficulty: 'hard' },
    ]
  },
  {
    category: 'Shopping',
    icon: '🛍️',
    color: '#8b5cf6',
    tips: [
      { action: 'Buy secondhand / refurbished electronics', saving: 150, difficulty: 'easy' },
      { action: 'Choose quality items that last longer', saving: 200, difficulty: 'easy' },
      { action: 'Repair instead of replace', saving: 150, difficulty: 'medium' },
      { action: 'Avoid fast fashion — buy less, better', saving: 300, difficulty: 'medium' },
    ]
  },
];

const DIFFICULTY_COLORS = {
  easy: { bg: '#dcfce7', color: '#166534' },
  medium: { bg: '#fef9c3', color: '#854d0e' },
  hard: { bg: '#fee2e2', color: '#991b1b' },
};

export default function ActionCenter() {
  const [criticalActivities, setCriticalActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activitySuggestions, setActivitySuggestions] = useState(null);
  const [loadingSugg, setLoadingSugg] = useState(false);

  useEffect(() => {
    api.get('/activities/?severity=critical&days=30')
      .then(r => setCriticalActivities(r.data.results || r.data))
      .catch(console.error);
  }, []);

  const loadSuggestions = async (activity) => {
    setSelectedActivity(activity);
    setLoadingSugg(true);
    try {
      const { data } = await api.get(`/activities/${activity.id}/suggestions/`);
      setActivitySuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSugg(false);
    }
  };

  return (
    <div className="action-page">
      <div className="page-header">
        <h1 className="page-title">Action Center</h1>
        <p className="page-sub">Personalized tips to reduce and neutralize your footprint</p>
      </div>

      {/* Critical alerts */}
      {criticalActivities.length > 0 && (
        <div className="alert-section">
          <div className="alert-header">
            <span className="alert-icon">🚨</span>
            <div>
              <h2>High-Impact Activities (last 30 days)</h2>
              <p>These activities had a critical environmental impact. Click to see counter-steps.</p>
            </div>
          </div>
          <div className="alert-list">
            {criticalActivities.map(act => (
              <div
                key={act.id}
                className={`alert-item ${selectedActivity?.id === act.id ? 'selected' : ''}`}
                onClick={() => loadSuggestions(act)}
              >
                <div className="alert-item-info">
                  <span className="alert-cat">{act.category}</span>
                  <span className="alert-type">{act.activity_type.replace(/_/g, ' ')}</span>
                </div>
                <div className="alert-item-right">
                  <span className="alert-co2">{act.kg_co2} kg CO₂</span>
                  <span className="alert-date">{new Date(act.activity_date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Suggestion detail */}
          {selectedActivity && (
            <div className="sugg-panel">
              {loadingSugg ? (
                <div className="loading-screen"><div className="spinner" /></div>
              ) : activitySuggestions && (
                <>
                  <h3>Counter-steps for: {selectedActivity.activity_type.replace(/_/g, ' ')}</h3>

                  {activitySuggestions.suggestions.counter_steps.length > 0 && (
                    <div className="counter-grid">
                      {activitySuggestions.suggestions.counter_steps.map((step, i) => (
                        <div key={i} className="counter-card">
                          <div className="counter-card-title">{step.action}</div>
                          <p>{step.description}</p>
                          <div className="neutralization-bar">
                            <div
                              className="neutralization-fill"
                              style={{ width: `${step.impact_neutralization * 100}%` }}
                            />
                          </div>
                          <span className="neutral-pct">{Math.round(step.impact_neutralization * 100)}% neutralization</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="offset-summary">
                    <div className="offset-item">
                      🌳 Plant <strong>{activitySuggestions.suggestions.trees_to_plant} trees</strong>
                    </div>
                    <div className="offset-item">
                      💵 Buy carbon offsets: <strong>~${activitySuggestions.suggestions.offset_cost_usd}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* General tips */}
      <div className="tips-section-main">
        <h2 className="section-title">🌱 High-Impact Habits</h2>
        <p className="section-sub">Small changes with the biggest annual savings</p>
        <div className="tips-grid">
          {IMPACT_TIPS.map(cat => (
            <div key={cat.category} className="tips-category-card">
              <div className="tips-cat-header" style={{ borderLeftColor: cat.color }}>
                <span>{cat.icon}</span>
                <span>{cat.category}</span>
              </div>
              <div className="tips-list">
                {cat.tips.map((tip, i) => (
                  <div key={i} className="tips-row">
                    <div className="tips-row-left">
                      <span
                        className="diff-badge"
                        style={{
                          background: DIFFICULTY_COLORS[tip.difficulty]?.bg,
                          color: DIFFICULTY_COLORS[tip.difficulty]?.color,
                        }}
                      >
                        {tip.difficulty}
                      </span>
                      <span className="tips-action">{tip.action}</span>
                    </div>
                    <span className="tips-saving" style={{ color: cat.color }}>
                      −{tip.saving} kg/yr
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon offsetting info */}
      <div className="offset-info-card">
        <h2>💡 About Carbon Offsetting</h2>
        <p>
          Carbon offsetting lets you compensate for unavoidable emissions by funding projects that
          reduce CO₂ elsewhere — like reforestation, renewable energy, or methane capture.
        </p>
        <div className="offset-schemes">
          <div className="scheme">
            <strong>🏅 Gold Standard</strong>
            <p>Highest quality offsets. ~$15–20/tonne CO₂. goldstandard.org</p>
          </div>
          <div className="scheme">
            <strong>✅ Verra VCS</strong>
            <p>Widely used voluntary standard. ~$10–15/tonne. verra.org</p>
          </div>
          <div className="scheme">
            <strong>🌳 Tree Planting</strong>
            <p>One tree absorbs ~20 kg CO₂/year. Results take years — best as supplement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
