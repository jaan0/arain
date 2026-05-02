import React, { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import { formatDate } from '../utils/dateFormatter';

export function FeedSection({ api }) {
  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  
  // Forms
  const [newStock, setNewStock] = useState({ name: 'Broiler Finisher', quantityBori: 10, pricePerBori: 4500, dateAdded: new Date().toISOString().split('T')[0] });
  const [newUsage, setNewUsage] = useState({ date: new Date().toISOString().split('T')[0], feedId: '', boriUsed: 2, cost: 0 });

  const [isNewFeed, setIsNewFeed] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stockRes, usageRes] = await Promise.all([
        api.get('/feed/stock'),
        api.get('/feed/usage')
      ]);
      setStock(stockRes.data);
      setUsage(usageRes.data);
      if (stockRes.data.length > 0 && !newUsage.feedId) {
        setNewUsage(prev => ({ ...prev, feedId: stockRes.data[0]._id, cost: stockRes.data[0].pricePerBori * 2 }));
      }
      if (stockRes.data.length > 0 && !isNewFeed && newStock.name === 'Broiler Finisher') {
        setNewStock(prev => ({ ...prev, name: stockRes.data[0].name }));
      }
    } catch (error) {
      console.error(error);
    }
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
    if(confirm('Delete this feed stock?')) {
      await api.delete(`/feed/stock/${id}`);
      fetchData();
    }
  };

  const handleDeleteUsage = async (id) => {
    if(confirm('Delete this usage log and restore stock?')) {
      await api.delete(`/feed/usage/${id}`);
      fetchData();
    }
  };

  const handleFeedChange = (e) => {
    const feedId = e.target.value;
    const selectedFeed = stock.find(s => s._id === feedId);
    if (selectedFeed) {
      setNewUsage(prev => ({ ...prev, feedId, cost: selectedFeed.pricePerBori * prev.boriUsed }));
    }
  };

  const handleBoriChange = (e) => {
    const boriUsed = parseInt(e.target.value) || 0;
    const selectedFeed = stock.find(s => s._id === newUsage.feedId);
    const cost = selectedFeed ? selectedFeed.pricePerBori * boriUsed : 0;
    setNewUsage(prev => ({ ...prev, boriUsed, cost }));
  };

  return (
    <div>
      <h2 className="overview-section-title">Feed Tab</h2>
      
      <div className="grid-metrics">
        {stock.map(s => (
          <div key={s._id} style={{ position: 'relative' }}>
            <MetricCard 
              title={s.name} 
              value={`${s.quantityBori} Bori`} 
              subtitle={`PKR ${s.pricePerBori} / Bori`} 
              trendValue={s.quantityBori < 5 ? "Low" : null} 
              isPositive={false} 
            />
            <button onClick={() => handleDeleteStock(s._id)} style={{ position: 'absolute', top: 16, right: 16, color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
        {stock.length === 0 && <div className="card text-muted">No feed stock. Add some below.</div>}
      </div>

      <div className="two-column">
        {/* Daily Usage */}
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Daily Usage Log</h3>
          <form onSubmit={handleLogUsage}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="mono" value={newUsage.date} onChange={e => setNewUsage({...newUsage, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Feed Type</label>
                <select value={newUsage.feedId} onChange={handleFeedChange} required>
                  <option value="" disabled>Select Feed</option>
                  {stock.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Bori Used Today</label>
              <input type="number" className="mono" value={newUsage.boriUsed} onChange={handleBoriChange} required />
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--accent-amber-bg)', color: 'var(--accent-amber)', borderRadius: 'var(--radius)', marginTop: '20px', fontSize: '0.9rem', fontWeight: 500 }}>
              Estimated Cost: <span className="mono">PKR {newUsage.cost}</span>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={stock.length === 0}>Log Usage</button>
          </form>

          {/* Recent Usage List */}
          <div style={{ marginTop: '32px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Recent Usage Logs</h4>
            <table style={{ fontSize: '0.85rem' }}>
              <tbody>
                {usage.map(u => (
                  <tr key={u._id}>
                    <td className="mono">{formatDate(u.date)}</td>
                    <td>{u.feedId?.name || 'Unknown (Deleted Feed)'} ({u.boriUsed} Bori)</td>
                    <td className="mono text-red">- PKR {u.cost}</td>
                    <td><button onClick={() => handleDeleteUsage(u._id)} style={{ color: 'var(--accent-red)' }}>x</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Stock */}
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Add Feed Stock</h3>
          <form onSubmit={handleAddStock}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Feed Name</label>
              {isNewFeed || stock.length === 0 ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" required value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} placeholder="Enter new feed type" style={{ flex: 1 }} />
                  {stock.length > 0 && <button type="button" className="btn-outline" onClick={() => { setIsNewFeed(false); setNewStock({...newStock, name: stock[0].name}) }}>Cancel</button>}
                </div>
              ) : (
                <select required value={newStock.name} onChange={e => {
                  if (e.target.value === 'NEW') {
                    setIsNewFeed(true);
                    setNewStock({...newStock, name: ''});
                  } else {
                    setNewStock({...newStock, name: e.target.value});
                  }
                }}>
                  {stock.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  <option value="NEW">+ Add New Feed...</option>
                </select>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity (Bori)</label>
                <input type="number" className="mono" required value={newStock.quantityBori} onChange={e => setNewStock({...newStock, quantityBori: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Price per Bori (PKR)</label>
                <input type="number" className="mono" required value={newStock.pricePerBori} onChange={e => setNewStock({...newStock, pricePerBori: e.target.value})} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Date Added</label>
              <input type="date" className="mono" required value={newStock.dateAdded} onChange={e => setNewStock({...newStock, dateAdded: e.target.value})} />
            </div>
            <button type="submit" className="btn-outline" style={{ width: '100%' }}>Add to Stock</button>
          </form>
        </div>
      </div>
    </div>
  );
}
