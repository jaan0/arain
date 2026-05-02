import { Users, UserPlus, Trash2, Phone, Wallet, ChevronRight } from 'lucide-react';

function Avatar({ url, name, size = 48 }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 'var(--radius-lg)', objectFit: 'cover', flexShrink: 0 }} />;
  return <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.35, borderRadius: 'var(--radius-lg)' }}>{name?.substring(0, 2).toUpperCase()}</div>;
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
    if (confirm('Delete this dealer?')) { await api.delete(`/dealers/${id}`); fetchData(); }
  };
  const handleDeleteLabour = async (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this labour?')) { await api.delete(`/labour/${id}`); fetchData(); }
  };
  const handleAddDealer = async (e) => {
    e.preventDefault(); await api.post('/dealers', newDealer);
    setDealerModalOpen(false); setNewDealer({ name: '', phone: '', balance: 0 }); fetchData();
  };
  const handleAddLabour = async (e) => {
    e.preventDefault(); await api.post('/labour', newLabour);
    setLabourModalOpen(false); setNewLabour({ name: '', phone: '', salary: 0 }); fetchData();
  };

  if (loading) return <div className="p-20 text-muted">Loading Directory...</div>;

  if (selectedProfile) {
    return <ProfilePage profile={selectedProfile} type={selectedType} api={api} onBack={closeProfile} onRefresh={fetchData} />;
  }

  return (
    <div className="fade-in">
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">Directory</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" style={{ padding: '8px 12px', borderRadius: '50%' }} onClick={() => setDealerModalOpen(true)}>
            <UserPlus size={18} />
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-muted)' }}>
          <Users size={16} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Dealers</span>
        </div>
        {dealers.map(d => (
          <div key={d._id} className="card" style={{ marginBottom: '12px', padding: '12px' }} onClick={() => openProfile(d, 'dealer')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar url={d.profilePicUrl} name={d.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={10} /> {d.phone || 'No phone'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={`mono ${(d.balance || 0) > 0 ? 'text-red' : 'text-green'}`} style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  {(d.balance || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>balance</div>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-muted)' }}>
          <Users size={16} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Labour Force</span>
        </div>
        {labour.map(p => (
          <div key={p._id} className="card" style={{ marginBottom: '12px', padding: '12px' }} onClick={() => openProfile(p, 'labour')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar url={p.profilePicUrl} name={p.name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>PKR {p.salary?.toLocaleString()}/mo</div>
              </div>
              {p.loan > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div className="mono text-red" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.loan.toLocaleString()}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>loan</div>
                </div>
              )}
              <ChevronRight size={16} className="text-muted" />
            </div>
          </div>
        ))}
        <button className="btn-outline" style={{ width: '100%', marginTop: '8px' }} onClick={() => setLabourModalOpen(true)}>+ Register Labour</button>
      </div>

      {/* Modals */}
      <Modal isOpen={isDealerModalOpen} onClose={() => setDealerModalOpen(false)} title="New Dealer">
        <form onSubmit={handleAddDealer}>
          <div className="form-group" style={{ marginBottom: '16px' }}><label className="form-label">Name</label><input type="text" required value={newDealer.name} onChange={e => setNewDealer({ ...newDealer, name: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: '16px' }}><label className="form-label">Phone</label><input type="text" value={newDealer.phone} onChange={e => setNewDealer({ ...newDealer, phone: e.target.value })} /></div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create Dealer</button>
        </form>
      </Modal>

      <Modal isOpen={isLabourModalOpen} onClose={() => setLabourModalOpen(false)} title="New Labour">
        <form onSubmit={handleAddLabour}>
          <div className="form-group" style={{ marginBottom: '16px' }}><label className="form-label">Name</label><input type="text" required value={newLabour.name} onChange={e => setNewLabour({ ...newLabour, name: e.target.value })} /></div>
          <div className="form-group" style={{ marginBottom: '16px' }}><label className="form-label">Monthly Salary (PKR)</label><input type="number" className="mono" required value={newLabour.salary} onChange={e => setNewLabour({ ...newLabour, salary: e.target.value })} /></div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Create Profile</button>
        </form>
      </Modal>
    </div>
  );
}
