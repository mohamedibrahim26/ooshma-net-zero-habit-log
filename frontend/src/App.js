import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogActivity from './pages/LogActivity';
import ActionCenter from './pages/ActionCenter';
import History from './pages/History';
import Goals from './pages/Goals';
import Achievements from './pages/Achievements';
import ChatAssistant from './pages/ChatAssistant';
import FoodScanner from './pages/FoodScanner';
import Reports from './pages/Reports';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return !user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index             element={<Dashboard />} />
            <Route path="log"        element={<LogActivity />} />
            <Route path="actions"    element={<ActionCenter />} />
            <Route path="history"    element={<History />} />
            <Route path="goals"      element={<Goals />} />
            <Route path="streaks"    element={<Achievements />} />
            <Route path="chat"       element={<ChatAssistant />} />
            <Route path="scanner"    element={<FoodScanner />} />
            <Route path="report"     element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
