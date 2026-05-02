import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ProfilePage } from './ProfilePage';

function Avatar({ url, name, size = 52 }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />;
  return <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>{name?.substring(0, 2).toUpperCase()}</div>;
}

export function ProfilesSection({ api }) {
  const [dealers, setDealers] = useState([]);
  const [labour, setLabour] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isDealerModalOpen, setDealerModalOpen] = useState(false);
  const [isLabourModalOpen, setLabourModalOpen] = useState(false);
  const [newDealer, setNewDealer] = useState({ name: '', phone: '', balance: 0 });
  const [newLabour, setNewLabour] = useState({ name: '', phone: '', salary: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [dr, lr] = await Promise.all([api.get('/dealers'), api.get('/labour')]);
      setDealers(dr.data);
      setLabour(lr.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openProfile = (profile, type) => { setSelectedProfile(profile); setSelectedType(type); };
  const closeProfile = () => { setSelectedProfile(null); setSelectedType(null); fetchData(); };

  const handleDeleteDealer = async (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this dealer and all records?')) { await api.delete(`/dealers/${id}`); fetchData(); }
  };
  const handleDeleteLabour = async (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this labour profile?')) { await api.delete(`/labour/${id}`); fetchData(); }
  };
  const handleAddDealer = async (e) => {
    e.preventDefault(); await api.post('/dealers', newDealer);
    setDealerModalOpen(false); setNewDealer({ name: '', phone: '', balance: 0 }); fetchData();
  };
  const handleAddLabour = async (e) => {
    e.preventDefault(); await api.post('/labour', newLabour);
    setLabourModalOpen(false); setNewLabour({ name: '', phone: '', salary: 0 }); fetchData();
  };

  if (loading) return <div>Loading profiles...</div>;

  // ─── If a profile is selected, show full page ───────────────────────────────
  if (selectedProfile) {
    return (
      <ProfilePage
        profile={selectedProfile}
        type={selectedType}
        api={api}
        onBack={closeProfile}
        onRefresh={fetchData}
      />
    );
  }

  // ─── Profile List ────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="overview-section-title" style={{ marginTop: 0 }}>Profiles</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-outline" onClick={() => setDealerModalOpen(true)}>+ Add Dealer</button>
          <button className="btn-outline" onClick={() => setLabourModalOpen(true)}>+ Add Labour</button>
        </div>
      </div>

      <div className="two-column">
        {/* Dealers */}
        <div>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dealers ({dealers.length})</h3>
          {dealers.length === 0 && <div className="card text-muted" style={{ textAlign: 'center' }}>No dealers yet.</div>}
          {dealers.map(d => (
            <div key={d._id} className="card" style={{ marginBottom: '12px', cursor: 'pointer' }}
              onClick={() => openProfile(d, 'dealer')}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-main)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar url={d.profilePicUrl} name={d.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{d.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{d.phone || 'No phone'} · {d.documents?.length || 0} docs</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={`mono ${(d.balance || 0) > 0 ? 'text-red' : 'text-green'}`} style={{ fontWeight: 700 }}>PKR {(d.balance || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>balance</div>
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                <button onClick={e => handleDeleteDealer(d._id, e)} style={{ fontSize: '0.78rem', color: 'var(--accent-red)', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 12px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Labour */}
        <div>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Labour ({labour.length})</h3>
          {labour.length === 0 && <div className="card text-muted" style={{ textAlign: 'center' }}>No labour yet.</div>}
          {labour.map(p => (
            <div key={p._id} className="card" style={{ marginBottom: '12px', cursor: 'pointer' }}
              onClick={() => openProfile(p, 'labour')}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-main)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Avatar url={p.profilePicUrl} name={p.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>PKR {p.salary?.toLocaleString()}/mo · {p.phone || 'No phone'}</div>
                </div>
                {(p.loan || 0) > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono text-red" style={{ fontWeight: 700 }}>PKR {p.loan.toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>loan</div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                <button onClick={e => handleDeleteLabour(p._id, e)} style={{ fontSize: '0.78rem', color: 'var(--accent-red)', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 12px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isDealerModalOpen} onClose={() => setDealerModalOpen(false)} title="Add New Dealer">
        <form onSubmit={handleAddDealer}>
          <div className="form-group" style={{ marginBottom: '16px' }}><label className="form-label">Name</label><input type="text" required value={newDealer.name} onChange={e => setNewDealer({ ...newDealer, name: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: '16px' }}><label className="form-label">Phone</label><input type="text" value={newDealer.phone} onChange={e => setNewDealer({ ...newDealer, phone: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: '24px' }}><label className="form-label">Starting Balance (PKR)</label><input type="number" className="mono" value={newDealer.balance} onChange={e => setNewDealer({ ...newDealer, balance: e.target.value })} /></div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add Dealer</button>
        </form>
      </Modal>

      <Modal isOpen={isLabourModalOpen} onClose={() => setLabourModalOpen(false)} title="Add New Labour">
        <form onSubmit={handleAddLabour}>
          <div className="form-group" style={{ marginBottom: '16px' }}><label className="form-label">Name</label><input type="text" required value={newLabour.name} onChange={e => setNewLabour({ ...newLabour, name: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: '16px' }}><label className="form-label">Phone</label><input type="text" value={newLabour.phone} onChange={e => setNewLabour({ ...newLabour, phone: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: '24px' }}><label className="form-label">Monthly Salary (PKR)</label><input type="number" className="mono" required value={newLabour.salary} onChange={e => setNewLabour({ ...newLabour, salary: e.target.value })} /></div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add Labour</button>
        </form>
      </Modal>
    </div>
  );
}
