import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Reports.css';

export default function Reports() {
  const { user } = useAuth();
  const [emailStatus, setEmailStatus] = useState('idle'); // idle | sending | sent | error
  const [downloadStatus, setDownloadStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const sendEmail = async () => {
    setEmailStatus('sending');
    setMessage('');
    try {
      const { data } = await api.post('/report/send/');
      setEmailStatus('sent');
      setMessage(data.message);
    } catch (err) {
      setEmailStatus('error');
      setMessage(err.response?.data?.error || 'Failed to send email. Check Gmail settings in .env');
    }
  };

  const downloadPDF = async () => {
    setDownloadStatus('downloading');
    try {
      const response = await api.get('/report/download/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ooshma-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDownloadStatus('done');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch (err) {
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📧 Weekly Reports</h1>
          <p className="page-sub">Get a detailed PDF summary of your carbon footprint</p>
        </div>
      </div>

      {/* Report preview card */}
      <div className="report-preview">
        <div className="report-preview-header">
          <span className="report-icon">📄</span>
          <div>
            <h2>Ooshma Weekly Report</h2>
            <p>A personalized PDF with your footprint summary, goals progress, streak, achievements, and top tips.</p>
          </div>
        </div>

        <div className="report-contents">
          <h3>What's included:</h3>
          <div className="contents-grid">
            {[
              { icon: '📊', label: 'Weekly CO₂ summary & trends' },
              { icon: '🗂️', label: 'Breakdown by category' },
              { icon: '🎯', label: 'Goals progress' },
              { icon: '📋', label: 'This week\'s activities' },
              { icon: '🔥', label: 'Streak & achievements' },
              { icon: '💡', label: 'Tip of the week' },
            ].map(item => (
              <div key={item.label} className="content-item">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="report-actions">
          {/* Download */}
          <button
            className="report-btn download"
            onClick={downloadPDF}
            disabled={downloadStatus === 'downloading'}
          >
            {downloadStatus === 'downloading' ? '⏳ Generating…'
              : downloadStatus === 'done' ? '✅ Downloaded!'
              : downloadStatus === 'error' ? '❌ Failed'
              : '⬇️ Download PDF'}
          </button>

          {/* Email */}
          <button
            className="report-btn email"
            onClick={sendEmail}
            disabled={emailStatus === 'sending' || emailStatus === 'sent'}
          >
            {emailStatus === 'sending' ? '📤 Sending…'
              : emailStatus === 'sent' ? '✅ Sent!'
              : emailStatus === 'error' ? '❌ Failed — retry'
              : `📧 Email to ${user?.email}`}
          </button>
        </div>

        {message && (
          <div className={`report-msg ${emailStatus === 'error' ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Gmail setup notice */}
      <div className="setup-card">
        <h2>⚙️ Email Setup (one-time)</h2>
        <p>To enable email reports, add your Gmail credentials to <code>backend/.env</code>:</p>
        <div className="code-block">
          <pre>{`EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-app-password`}</pre>
        </div>
        <div className="setup-steps">
          <div className="setup-step">
            <span className="step-num">1</span>
            <div>
              <strong>Create a Gmail App Password</strong>
              <p>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">myaccount.google.com/security</a> → 2-Step Verification → App Passwords</p>
            </div>
          </div>
          <div className="setup-step">
            <span className="step-num">2</span>
            <div>
              <strong>Add credentials to .env</strong>
              <p>Open <code>backend/.env</code> and fill in your Gmail and the app password</p>
            </div>
          </div>
          <div className="setup-step">
            <span className="step-num">3</span>
            <div>
              <strong>Restart the backend server</strong>
              <p>Stop the server (Ctrl+C) and run <code>python manage.py runserver</code> again</p>
            </div>
          </div>
        </div>
        <p className="setup-note">📥 You can always use <strong>Download PDF</strong> without any email setup!</p>
      </div>

      {/* Frequency info */}
      <div className="freq-card">
        <h2>📅 Report Schedule</h2>
        <p>Currently reports are generated on-demand. Click the buttons above anytime to get your latest report.</p>
        <div className="freq-tip">
          💡 <strong>Pro tip:</strong> Bookmark this page and download your report every Sunday to track weekly progress!
        </div>
      </div>
    </div>
  );
}
