import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api/axios';
import './FoodScanner.css';

const SEVERITY_COLORS = {
  low:      { bg: '#f0fdf4', color: '#166534', label: 'Low CO₂' },
  medium:   { bg: '#fffbeb', color: '#854d0e', label: 'Medium CO₂' },
  high:     { bg: '#fff7ed', color: '#9a3412', label: 'High CO₂' },
  critical: { bg: '#fef2f2', color: '#991b1b', label: 'High Impact' },
};

// ─── ZXing (live camera) ──────────────────────────────────────────────────────

let zxingPromise = null;
function loadZXing() {
  if (zxingPromise) return zxingPromise;
  zxingPromise = new Promise((resolve, reject) => {
    if (window.ZXing) { resolve(window.ZXing); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@zxing/library@0.20.0/umd/index.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.ZXing);
    script.onerror = () => { zxingPromise = null; reject(new Error('ZXing load failed')); };
    document.head.appendChild(script);
  });
  return zxingPromise;
}

// ─── Quagga2 (still-image barcode decoding — far more reliable for photos) ───

let quaggaPromise = null;
function loadQuagga() {
  if (quaggaPromise) return quaggaPromise;
  quaggaPromise = new Promise((resolve, reject) => {
    if (window.Quagga) { resolve(window.Quagga); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@ericblade/quagga2/dist/quagga.min.js';
    script.onload = () => resolve(window.Quagga);
    script.onerror = () => { quaggaPromise = null; reject(new Error('Quagga load failed')); };
    document.head.appendChild(script);
  });
  return quaggaPromise;
}

function quaggaDecodeFile(Quagga, imgUrl) {
  return new Promise((resolve, reject) => {
    Quagga.decodeSingle({
      decoder: {
        readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'code_128_reader', 'code_39_reader'],
        multiple: false,
      },
      locate: true,
      numOfWorkers: 0,       // run on main thread — avoids Worker issues
      inputStream: { size: 1200 },  // resize longest edge to 1200px max
      src: imgUrl,
    }, (result) => {
      if (result?.codeResult?.code) {
        resolve(result.codeResult.code);
      } else {
        reject(new Error('not found'));
      }
    });
  });
}

// ─── Camera Modal ─────────────────────────────────────────────────────────────

function CameraModal({ onClose, onBarcode, onFallback }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | scanning | error
  const [errorType, setErrorType] = useState('');

  const stopScanner = useCallback(() => {
    try { readerRef.current?.reset(); } catch (_) {}
  }, []);

  const handleClose = useCallback(() => {
    stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const ZXing = await loadZXing();
        if (cancelled) return;

        // Ask for camera permission first
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(stream => stream.getTracks().forEach(t => t.stop()));

        if (cancelled) return;

        const hints = new Map();
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
        const reader = new ZXing.BrowserMultiFormatReader(hints);
        readerRef.current = reader;

        setStatus('scanning');

        await reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
          if (cancelled) return;
          if (result) {
            stopScanner();
            onBarcode(result.getText());
          }
          // err here is just "no barcode in frame yet" — ignore it
        });
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        if (err.name === 'NotAllowedError') setErrorType('permission');
        else if (err.message?.includes('getUserMedia')) setErrorType('unavailable');
        else setErrorType('unavailable');
      }
    }

    start();
    return () => { cancelled = true; stopScanner(); };
  }, [onBarcode, stopScanner]);

  return (
    <div className="cam-overlay" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="cam-modal">
        <div className="cam-header">
          <span className="cam-title">📷 Scan Barcode</span>
          <button className="cam-close" onClick={handleClose}>✕</button>
        </div>

        {/* Video viewport — always render so ref is available */}
        <div className={`cam-body ${status === 'error' ? 'hidden' : ''}`}>
          <div className="cam-viewport">
            <video ref={videoRef} className="cam-video" playsInline muted />
            {status === 'scanning' && (
              <div className="cam-crosshair">
                <div className="cam-corners" />
                <div className="cam-scan-line" />
              </div>
            )}
            {status === 'loading' && (
              <div className="cam-loading">
                <div className="spinner" style={{ width: 32, height: 32 }} />
                <p>Starting camera…</p>
              </div>
            )}
          </div>
          {status === 'scanning' && <p className="cam-hint">Point camera at a barcode</p>}
        </div>

        {status === 'error' && (
          <div className="cam-error-body">
            <div className="cam-error-icon">{errorType === 'permission' ? '🚫' : '📷'}</div>
            <p>{errorType === 'permission' ? 'Camera permission denied.' : 'Camera unavailable.'}</p>
            <p className="cam-error-sub">
              {errorType === 'permission'
                ? 'Allow camera access in your browser settings, then try again.'
                : 'Try uploading a photo of the barcode instead.'}
            </p>
            <button className="cam-fallback-btn" onClick={() => { handleClose(); onFallback(); }}>
              📁 Upload a photo instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }) {
  const sev = SEVERITY_COLORS[product.severity] || SEVERITY_COLORS.medium;
  return (
    <div className="product-card">
      {product.image && <img src={product.image} alt={product.name} className="product-img" />}
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        {product.brand && <div className="product-brand">{product.brand}</div>}
        <div className="product-badges">
          {product.nutriscore && <span className={`nutri-badge nutri-${product.nutriscore.toLowerCase()}`}>Nutri-Score {product.nutriscore}</span>}
          {product.ecoscore && <span className="eco-badge">Eco {product.ecoscore}</span>}
          <span className="sev-badge" style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
        </div>
        <div className="co2-row">
          <div className="co2-stat">
            <span className="co2-value" style={{ color: sev.color }}>{product.co2_per_kg}</span>
            <span className="co2-unit">kg CO₂/kg</span>
          </div>
          <div className="co2-stat">
            <span className="co2-value">{product.co2_per_100g}</span>
            <span className="co2-unit">kg CO₂/100g</span>
          </div>
        </div>
        <div className="product-tip">💡 {product.tip}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EXAMPLE_SEARCHES = ['beef', 'oat milk', 'chicken', 'cheese', 'rice', 'coffee', 'tofu', 'salmon'];

export default function FoodScanner() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const fileInputRef = useRef(null);
  const addMenuRef = useRef(null);

  // Close the + menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Pre-load both libraries silently on mount
  useEffect(() => {
    loadZXing().catch(() => {});
    loadQuagga().catch(() => {});
  }, []);

  const doSearch = async ({ q, barcode }) => {
    setLoading(true);
    setError('');
    setResults([]);
    setSearched(true);
    setShowCamera(false);
    try {
      const param = barcode ? `barcode=${encodeURIComponent(barcode)}` : `q=${encodeURIComponent(q)}`;
      const { data } = await api.get(`/food-scan/?${param}`);
      setResults(data.results || []);
      if (barcode && (!data.results || data.results.length === 0)) {
        setError(`Barcode ${barcode} not found. Try searching by product name.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    doSearch({ q: query });
  };

  const handleBarcode = (code) => {
    setShowCamera(false);
    setQuery(`Barcode: ${code}`);
    doSearch({ barcode: code });
  };

  // Upload photo → decode barcode via Quagga2 (reliable for EAN/UPC in photos)
  const handleFileCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    setSearched(true);
    setResults([]);

    let imgUrl = null;
    try {
      const Quagga = await loadQuagga();
      imgUrl = URL.createObjectURL(file);

      const code = await quaggaDecodeFile(Quagga, imgUrl);
      URL.revokeObjectURL(imgUrl);

      setQuery(`Barcode: ${code}`);
      doSearch({ barcode: code });

    } catch (err) {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
      const notFound = err?.message === 'not found';
      setError(notFound
        ? 'No barcode detected. Try a clearer, closer photo with just the barcode visible.'
        : `Could not read the photo (${err?.message}). Try searching by product name.`);
      setLoading(false);
    }
    e.target.value = '';
  };

  return (
    <div className="scanner-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔍 Food Carbon Scanner</h1>
          <p className="page-sub">Search by name, scan a barcode, or upload a photo</p>
        </div>
      </div>

      <div className="scanner-card">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-row">
            <input
              className="search-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search a food product (e.g. beef, oat milk, chicken…)"
            />
            {/* + button with dropdown */}
            <div className="add-menu-wrap" ref={addMenuRef}>
              <button
                type="button"
                className={`add-btn ${showAddMenu ? 'open' : ''}`}
                onClick={() => setShowAddMenu(v => !v)}
                title="Scan or upload barcode"
              >
                +
              </button>
              {showAddMenu && (
                <div className="add-dropdown">
                  <button className="add-option" onClick={() => { setShowAddMenu(false); setShowCamera(true); }}>
                    <span className="add-option-icon">📷</span>
                    <div>
                      <div className="add-option-label">Camera</div>
                      <div className="add-option-sub">Scan barcode live</div>
                    </div>
                  </button>
                  <button className="add-option" onClick={() => { setShowAddMenu(false); fileInputRef.current?.click(); }}>
                    <span className="add-option-icon">🖼️</span>
                    <div>
                      <div className="add-option-label">Upload Photo</div>
                      <div className="add-option-sub">Pick image from device</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button type="submit" className="search-btn" disabled={loading || !query.trim()}>
              {loading ? '…' : '🔍 Search'}
            </button>
          </div>
        </form>

        <div className="example-searches">
          <span className="example-label">Try:</span>
          {EXAMPLE_SEARCHES.map(ex => (
            <button key={ex} className="example-chip" onClick={() => { setQuery(ex); doSearch({ q: ex }); }}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden file input for photo fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileCapture}
      />

      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onBarcode={handleBarcode}
          onFallback={() => fileInputRef.current?.click()}
        />
      )}

      {error && <div className="scanner-error">⚠️ {error}</div>}
      {loading && <div className="loading-screen"><div className="spinner" /></div>}

      {!loading && searched && results.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No products found. Try a different search term.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="results-section">
          <h2 className="results-title">Found {results.length} product{results.length > 1 ? 's' : ''}</h2>
          <div className="products-grid">
            {results.map((product, i) => <ProductCard key={i} product={product} />)}
          </div>
        </div>
      )}

      <div className="scanner-info">
        <h2>📊 CO₂ Food Reference Guide</h2>
        <div className="ref-grid">
          {[
            { food: '🥩 Beef', co2: '27 kg/kg', level: 'critical' },
            { food: '🐑 Lamb', co2: '39 kg/kg', level: 'critical' },
            { food: '🧀 Cheese', co2: '13.5 kg/kg', level: 'high' },
            { food: '🍗 Chicken', co2: '6.9 kg/kg', level: 'medium' },
            { food: '🐟 Fish', co2: '6.1 kg/kg', level: 'medium' },
            { food: '☕ Coffee', co2: '17 kg/kg', level: 'high' },
            { food: '🍚 Rice', co2: '2.7 kg/kg', level: 'low' },
            { food: '🥦 Vegetables', co2: '2.0 kg/kg', level: 'low' },
            { food: '🫘 Legumes', co2: '0.9 kg/kg', level: 'low' },
            { food: '🍎 Fruits', co2: '1.1 kg/kg', level: 'low' },
          ].map(item => (
            <div key={item.food} className="ref-item" style={{ borderLeftColor: SEVERITY_COLORS[item.level]?.color }}>
              <span className="ref-food">{item.food}</span>
              <span className="ref-co2" style={{ color: SEVERITY_COLORS[item.level]?.color }}>{item.co2}</span>
            </div>
          ))}
        </div>
        <p className="scanner-note">Data sourced from EPA, IPCC AR6, and Our World in Data. Product CO₂ estimates via Open Food Facts.</p>
      </div>
    </div>
  );
}
