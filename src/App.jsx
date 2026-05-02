import React, { useState, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { EggsSection } from './components/EggsSection';
import { FeedSection } from './components/FeedSection';
import { MedicineSection } from './components/MedicineSection';
import { ProfilesSection } from './components/ProfilesSection';
import { SummarySection } from './components/SummarySection';
import { 
  LayoutDashboard, 
  Egg, 
  Wheat, 
  Pill, 
  Users, 
  LogOut,
  Bird,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

// API Setup
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true 
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
    setStatus('Requesting access...');
    try {
      const res = await api.post('/auth/request-otp', { email });
      localStorage.setItem('pendingAuthEmail', email);
      localStorage.setItem('maskedEmail', res.data.maskedEmail);
      navigate(LOGIN_ROUTE + '/verify');
    } catch (err) {
      setStatus('Access denied. Check credentials.');
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ background: 'var(--blue-glass)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldCheck size={32} className="text-blue" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Secure Management Access</p>
        </div>
        <form onSubmit={handleRequestOtp}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Email Address</label>
            <input type="email" required placeholder="admin@arainfarm.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', height: '48px' }}>Send Access Key</button>
        </form>
        {status && <p style={{ marginTop: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>{status}</p>}
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
    setStatus('Verifying identity...');
    try {
      await api.post('/auth/verify-otp', { email, otp });
      localStorage.removeItem('pendingAuthEmail');
      localStorage.removeItem('maskedEmail');
      navigate(PORTAL_ROUTE);
    } catch (err) {
      setStatus('Invalid verification code.');
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ background: 'var(--blue-glass)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Smartphone size={32} className="text-blue" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Verify Code</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sent to {masked}</p>
        </div>
        <form onSubmit={handleVerify}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">8-Digit Secret Code</label>
            <input type="text" required maxLength={8} className="mono" placeholder="••••••••" style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem' }} value={otp} onChange={(e) => setOtp(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', height: '48px' }}>Authorize Device</button>
        </form>
        {status && <p style={{ marginTop: '20px', color: 'var(--accent-red)', textAlign: 'center', fontSize: '0.85rem' }}>{status}</p>}
      </div>
    </div>
  );
}

// --- Portal Layout ---

function PortalLayout() {
  const [activeTab, setActiveTab] = useState('summary');
  const navigate = useNavigate();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      try {
        await api.post('/auth/logout');
        navigate(LOGIN_ROUTE);
      } catch (error) {
        console.error('Logout failed');
      }
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'eggs': return <EggsSection api={api} />;
      case 'feed': return <FeedSection api={api} />;
      case 'medicine': return <MedicineSection api={api} />;
      case 'profiles': return <ProfilesSection api={api} />;
      default: return <SummarySection api={api} />;
    }
  };

  const navItems = [
    { id: 'summary', label: 'Home', icon: LayoutDashboard },
    { id: 'eggs', label: 'Eggs', icon: Egg },
    { id: 'feed', label: 'Feed', icon: Wheat },
    { id: 'medicine', label: 'Meds', icon: Pill },
    { id: 'profiles', label: 'People', icon: Users },
  ];

  return (
    <div className="app-container">
      <header className="app-bar">
        <div className="app-bar-brand">
          <Bird size={24} className="text-blue" />
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Arain Poultry</h1>
        </div>
        <button onClick={handleLogout} className="btn-icon text-muted">
          <LogOut size={20} />
        </button>
      </header>

      <main className="app-content">
        {renderContent()}
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
            <item.icon size={22} className="nav-item-icon" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// --- Main App Component ---

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Secure System Active.</div>} />
        <Route path={LOGIN_ROUTE} element={<Login />} />
        <Route path={`${LOGIN_ROUTE}/verify`} element={<VerifyOtp />} />
        <Route path={PORTAL_ROUTE} element={<PortalLayout />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
