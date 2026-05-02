import { Wheat, Plus, Trash2, History, AlertCircle } from 'lucide-react';

export function FeedSection({ api }) {
  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  
  // Forms
  const [newStock, setNewStock] = useState({ name: 'Broiler Finisher', quantityBori: 10, pricePerBori: 4500, dateAdded: new Date().toISOString().split('T')[0] });
  const [newUsage, setNewUsage] = useState({ date: new Date().toISOString().split('T')[0], feedId: '', boriUsed: 2, cost: 0 });

  const [isNewFeed, setIsNewFeed] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [stockRes, usageRes] = await Promise.all([api.get('/feed/stock'), api.get('/feed/usage')]);
      setStock(stockRes.data);
      setUsage(usageRes.data);
      if (stockRes.data.length > 0 && !newUsage.feedId) {
        setNewUsage(prev => ({ ...prev, feedId: stockRes.data[0]._id, cost: stockRes.data[0].pricePerBori * 2 }));
      }
    } catch (error) { console.error(error); }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    await api.post('/feed/stock', newStock);
    setIsNewFeed(false);
    fetchData();
  };

  const handleLogUsage = async (e) => {
    e.preventDefault();
    await api.post('/feed/usage', newUsage);
    fetchData();
  };

  const handleDeleteStock = async (id) => {
    if(confirm('Delete this feed stock?')) { await api.delete(`/feed/stock/${id}`); fetchData(); }
  };

  const handleDeleteUsage = async (id) => {
    if(confirm('Delete log?')) { await api.delete(`/feed/usage/${id}`); fetchData(); }
  };

  const handleFeedChange = (e) => {
    const feedId = e.target.value;
    const selectedFeed = stock.find(s => s._id === feedId);
    if (selectedFeed) setNewUsage(prev => ({ ...prev, feedId, cost: selectedFeed.pricePerBori * prev.boriUsed }));
  };

  const handleBoriChange = (e) => {
    const boriUsed = parseInt(e.target.value) || 0;
    const selectedFeed = stock.find(s => s._id === newUsage.feedId);
    setNewUsage(prev => ({ ...prev, boriUsed, cost: selectedFeed ? selectedFeed.pricePerBori * boriUsed : 0 }));
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Feed Stock</h2>
      </div>
      
      <div className="grid-metrics">
        {stock.map(s => (
          <div key={s._id} className="card" style={{ position: 'relative' }}>
            <div className="metric-label">{s.name}</div>
            <div className={`metric-value ${s.quantityBori < 5 ? 'text-red' : ''}`}>
              {s.quantityBori} Bori
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              PKR {s.pricePerBori}/Bori {s.quantityBori < 5 && <><AlertCircle size={10} /> Low</>}
            </div>
            <button onClick={() => handleDeleteStock(s._id)} style={{ position: 'absolute', top: 12, right: 12, color: 'var(--text-muted)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {stock.length === 0 && <div className="card text-muted">No feed stock.</div>}
      </div>

      {/* Usage Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Wheat size={18} className="text-amber" />
          <h3 style={{ fontSize: '1rem' }}>Log Daily Usage</h3>
        </div>
        <form onSubmit={handleLogUsage}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <select value={newUsage.feedId} onChange={handleFeedChange} required style={{ width: '100%' }}>
              <option value="" disabled>Select Feed Type</option>
              {stock.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <input type="number" placeholder="Bori Used" className="mono" value={newUsage.boriUsed} onChange={handleBoriChange} required style={{ width: '100%' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={stock.length === 0} style={{ height: '42px' }}>
              Log Feed
            </button>
          </div>
          {newUsage.cost > 0 && (
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Est. Cost: <span className="mono text-red">PKR {newUsage.cost.toLocaleString()}</span>
            </div>
          )}
        </form>
      </div>

      {/* Add Stock Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Plus size={18} className="text-blue" />
          <h3 style={{ fontSize: '1rem' }}>Purchase New Stock</h3>
        </div>
        <form onSubmit={handleAddStock}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            {isNewFeed || stock.length === 0 ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" required value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} placeholder="New Feed Name" style={{ flex: 1 }} />
                {stock.length > 0 && <button type="button" onClick={() => setIsNewFeed(false)} className="btn-outline">×</button>}
              </div>
            ) : (
              <select required value={newStock.name} onChange={e => e.target.value === 'NEW' ? setIsNewFeed(true) : setNewStock({...newStock, name: e.target.value})} style={{ width: '100%' }}>
                {stock.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                <option value="NEW">+ Add New Type...</option>
              </select>
            )}
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <input type="number" placeholder="Qty (Bori)" className="mono" required value={newStock.quantityBori} onChange={e => setNewStock({...newStock, quantityBori: e.target.value})} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <input type="number" placeholder="Price/Bori" className="mono" required value={newStock.pricePerBori} onChange={e => setNewStock({...newStock, pricePerBori: e.target.value})} style={{ width: '100%' }} />
            </div>
          </div>
          <button type="submit" className="btn-outline" style={{ width: '100%', marginTop: '16px' }}>Confirm Purchase</button>
        </form>
      </div>

      {/* History */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <History size={18} className="text-muted" />
          <h3 style={{ fontSize: '1rem' }}>Usage History</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Feed</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usage.map(u => (
                <tr key={u._id}>
                  <td className="mono" style={{ fontSize: '0.75rem' }}>{formatDate(u.date)}</td>
                  <td>{u.feedId?.name || 'Deleted'} ({u.boriUsed} B)</td>
                  <td className="mono text-red">-{u.cost.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleDeleteUsage(u._id)} className="text-red">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
