import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { EggsSection } from './components/EggsSection';
import { FeedSection } from './components/FeedSection';
import { MedicineSection } from './components/MedicineSection';
import { ProfilesSection } from './components/ProfilesSection';
import { SummarySection } from './components/SummarySection';

// API Setup
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true // For sending cookies
});

const LOGIN_ROUTE = import.meta.env.VITE_SECRET_LOGIN_ROUTE || '/admin-login-a8f2';
const PORTAL_ROUTE = import.meta.env.VITE_SECRET_PORTAL_ROUTE || '/portal-x9m3';

// --- Auth Components ---

function Login() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setStatus('Sending OTP...');
    try {
      const res = await api.post('/auth/request-otp', { email });
      localStorage.setItem('pendingAuthEmail', email);
      localStorage.setItem('maskedEmail', res.data.maskedEmail);
      navigate(LOGIN_ROUTE + '/verify');
    } catch (err) {
      setStatus('Failed to send OTP. Ensure email is correct.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Secure Portal Access</h2> 
        <form onSubmit={handleRequestOtp}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Administrator Email</label>
            <input 
              type="email" 
              required 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Send Access Code</button>
        </form>
        {status && <p style={{ marginTop: '16px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>{status}</p>}
      </div>
    </div>
  );
}

function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const email = localStorage.getItem('pendingAuthEmail');
  const masked = localStorage.getItem('maskedEmail');

  if (!email) return <Navigate to={LOGIN_ROUTE} />;

  const handleVerify = async (e) => {
    e.preventDefault();
    setStatus('Verifying...');
    try {
      await api.post('/auth/verify-otp', { email, otp });
      localStorage.removeItem('pendingAuthEmail');
      localStorage.removeItem('maskedEmail');
      navigate(PORTAL_ROUTE);
    } catch (err) {
      setStatus('Invalid or expired OTP.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>Enter Access Code</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Code sent to {masked}
        </p>
        <form onSubmit={handleVerify}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">8-Digit OTP</label>
            <input 
              type="text" 
              required 
              maxLength={8}
              className="mono"
              placeholder="••••••••" 
              style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem' }}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Verify & Login</button>
        </form>
        {status && <p style={{ marginTop: '16px', color: 'var(--accent-red)', textAlign: 'center', fontSize: '0.9rem' }}>{status}</p>}
      </div>
    </div>
  );
}

// --- Portal Layout ---

function PortalLayout() {
  const [activeTab, setActiveTab] = useState('summary');
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      navigate(LOGIN_ROUTE);
    } catch (error) {
      console.error('Logout failed');
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'eggs': return <EggsSection api={api} />;
      case 'feed': return <FeedSection api={api} />;
      case 'medicine': return <MedicineSection api={api} />;
      case 'profiles': return <ProfilesSection api={api} />;
      case 'summary': default: return <SummarySection api={api} />;
    }
  };

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="header-title">Arain Poultry Farm</h1>
          <p className="header-subtitle">Internal Management Portal</p>
        </div>
        <button onClick={handleLogout} className="btn-outline">Logout</button>
      </header>

      <nav className="tabs-nav">
        <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
        <button className={`tab-btn ${activeTab === 'eggs' ? 'active' : ''}`} onClick={() => setActiveTab('eggs')}>Eggs</button>
        <button className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>Feed</button>
        <button className={`tab-btn ${activeTab === 'medicine' ? 'active' : ''}`} onClick={() => setActiveTab('medicine')}>Medicine</button>
        <button className={`tab-btn ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}>Profiles</button>
      </nav>

      <main>
        {renderContent()}
      </main>
    </div>
  );
}

// --- Main App Component ---

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to not found or acts empty, only secret routes work */}
        <Route path="/" element={<div style={{ padding: '40px', textAlign: 'center' }}>Nothing to see here.</div>} />
        
        {/* Secret Login Routes */}
        <Route path={LOGIN_ROUTE} element={<Login />} />
        <Route path={`${LOGIN_ROUTE}/verify`} element={<VerifyOtp />} />

        {/* Secret Portal Route */}
        <Route path={PORTAL_ROUTE} element={<PortalLayout />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
