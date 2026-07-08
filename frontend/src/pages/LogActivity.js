import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './LogActivity.css';

const UNITS = {
  transport: 'km',
  energy: 'kWh',
  food: 'kg',
  shopping: 'units',
  waste: 'kg',
};

const CATEGORY_LABELS = {
  transport: '🚗 Transport',
  energy: '⚡ Energy',
  food: '🥗 Food',
  shopping: '🛍️ Shopping',
  waste: '🗑️ Waste',
};

const TYPE_LABELS = {
  // transport
  car_petrol: 'Petrol Car', car_diesel: 'Diesel Car', car_electric: 'Electric Car',
  motorcycle: 'Motorcycle', bus: 'Bus', train: 'Train', metro_subway: 'Metro/Subway',
  flight_short: 'Short Flight (<3h)', flight_long: 'Long Flight (>3h)',
  bicycle: 'Bicycle', walking: 'Walking',
  // energy
  electricity_grid: 'Grid Electricity', natural_gas: 'Natural Gas',
  heating_oil: 'Heating Oil', lpg: 'LPG', solar: 'Solar', wood_burning: 'Wood Burning',
  // food
  beef: 'Beef', lamb: 'Lamb', pork: 'Pork', chicken: 'Chicken', fish: 'Fish',
  dairy_milk: 'Dairy Milk (per litre)', cheese: 'Cheese', eggs: 'Eggs (per dozen)',
  rice: 'Rice', vegetables: 'Vegetables', fruits: 'Fruits', legumes: 'Legumes',
  tofu: 'Tofu', bread: 'Bread', coffee: 'Coffee',
  // shopping
  new_smartphone: 'New Smartphone', new_laptop: 'New Laptop', new_tv: 'New TV',
  new_clothing: 'New Clothing (garment)', new_car: 'New Car',
  online_delivery: 'Online Delivery (parcel)', new_furniture: 'New Furniture',
  // waste
  landfill: 'Landfill', recycled: 'Recycled', composted: 'Composted', incinerated: 'Incinerated',
};

const SEVERITY_CONFIG = {
  low: { label: 'Low Impact', color: '#22c55e', bg: '#f0fdf4', icon: '✅' },
  medium: { label: 'Moderate Impact', color: '#f59e0b', bg: '#fffbeb', icon: '🟡' },
  high: { label: 'High Impact', color: '#f97316', bg: '#fff7ed', icon: '🔶' },
  critical: { label: 'Critical Impact', color: '#ef4444', bg: '#fef2f2', icon: '🚨' },
};

export default function LogActivity() {
  const navigate = useNavigate();
  const [factors, setFactors] = useState(null);
  const [form, setForm] = useState({
    category: 'transport',
    activity_type: '',
    quantity: '',
    unit: 'km',
    notes: '',
    activity_date: new Date().toISOString().split('T')[0],
  });
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/activities/emission_factors/').then(r => setFactors(r.data));
  }, []);

  const set = (field) => (e) => {
    const value = e.target.value;
    const next = { ...form, [field]: value };
    if (field === 'category') {
      next.activity_type = '';
      next.unit = UNITS[value] || 'units';
      next.preview = null;
    }
    setForm(next);
    setPreview(null);
  };

  const handlePreview = async () => {
    if (!form.category || !form.activity_type || !form.quantity) return;
    setPreviewLoading(true);
    try {
      const { data } = await api.post('/activities/calculate/', {
        category: form.category,
        activity_type: form.activity_type,
        quantity: parseFloat(form.quantity),
      });
      setPreview(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Calculation failed.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/activities/', {
        category: form.category,
        activity_type: form.activity_type,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        notes: form.notes,
        activity_date: form.activity_date,
      });
      setSaved(true);
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const types = factors ? factors[form.category] || [] : [];
  const sev = preview ? SEVERITY_CONFIG[preview.severity] : null;

  return (
    <div className="log-page">
      <div className="log-header">
        <h1 className="page-title">Log Activity</h1>
        <p className="page-sub">Calculate your CO₂ footprint for any activity</p>
      </div>

      <div className="log-grid">
        {/* Form */}
        <div className="log-card">
          <div className="form-group">
            <label>Category</label>
            <div className="category-pills">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`pill ${form.category === key ? 'active' : ''}`}
                  onClick={() => set('category')({ target: { value: key } })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Activity Type</label>
              <select value={form.activity_type} onChange={set('activity_type')} disabled={!types.length}>
                <option value="">Select type…</option>
                {types.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity ({form.unit})</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                onChange={set('quantity')}
                placeholder={`Amount in ${form.unit}`}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.activity_date} onChange={set('activity_date')} />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <input value={form.notes} onChange={set('notes')} placeholder="Any context…" />
            </div>
          </div>

          <button
            className="calc-btn"
            onClick={handlePreview}
            disabled={!form.activity_type || !form.quantity || previewLoading}
          >
            {previewLoading ? 'Calculating…' : '🔍 Calculate Impact'}
          </button>
        </div>

        {/* Preview */}
        {preview && sev && (
          <div className="preview-card" style={{ borderColor: sev.color, background: sev.bg }}>
            <div className="sev-header">
              <span className="sev-icon">{sev.icon}</span>
              <div>
                <div className="sev-label" style={{ color: sev.color }}>{sev.label}</div>
                <div className="sev-co2">{preview.kg_co2} kg CO₂e</div>
              </div>
            </div>

            <div className="equivalents">
              <h3>That's equivalent to…</h3>
              <ul>
                <li>🚗 {preview.equivalents.km_driven_petrol} km driven in a petrol car</li>
                <li>📱 {preview.equivalents.smartphones_charged} smartphones charged</li>
                <li>🌳 {preview.equivalents.trees_months_to_absorb} months for a tree to absorb</li>
                <li>🥩 {preview.equivalents.beef_kg_equivalent} kg of beef produced</li>
              </ul>
            </div>

            {preview.suggestions.reduction_tips.length > 0 && (
              <div className="tips-section">
                <h3>Quick wins to reduce this</h3>
                {preview.suggestions.reduction_tips.slice(0, 3).map((tip, i) => (
                  <div key={i} className="tip-item">
                    <span className="tip-diff">{tip.difficulty}</span>
                    <span>{tip.action}</span>
                    <span className="tip-saving">−{tip.saving_kg_per_year} kg/yr</span>
                  </div>
                ))}
              </div>
            )}

            {preview.suggestions.counter_steps.length > 0 && (
              <div className="counter-section">
                <h3>⚡ Counter-steps to neutralize</h3>
                {preview.suggestions.counter_steps.map((step, i) => (
                  <div key={i} className="counter-item">
                    <strong>{step.action}</strong>
                    <p>{step.description}</p>
                  </div>
                ))}
                <div className="offset-box">
                  🌳 Plant <strong>{preview.suggestions.trees_to_plant} trees</strong> OR
                  💵 Buy offsets: <strong>~${preview.suggestions.offset_cost_usd}</strong>
                </div>
              </div>
            )}

            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saving || saved}
            >
              {saved ? '✅ Saved!' : saving ? 'Saving…' : '💾 Save to my log'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
