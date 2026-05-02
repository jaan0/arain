import React, { useState, useEffect } from 'react';
import { Egg, Plus, Trash2, ShoppingCart, History } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';

export function EggsSection({ api }) {
  const [production, setProduction] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [dealers, setDealers] = useState([]);

  // Forms
  const [newProd, setNewProd] = useState({ date: new Date().toISOString().split('T')[0], paiti: 0, trays: 0, pricePerPaiti: 0 });
  const [newDist, setNewDist] = useState({ date: new Date().toISOString().split('T')[0], dealerId: '', paiti: 0, trays: 0, ratePerPaiti: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, distRes, dealersRes] = await Promise.all([
        api.get('/eggs/production'),
        api.get('/eggs/distribution'),
        api.get('/dealers')
      ]);
      setProduction(prodRes.data);
      setDistribution(distRes.data);
      setDealers(dealersRes.data);
      
      // Set reasonable default rate if available
      if (prodRes.data.length > 0) {
        setNewProd(p => ({ ...p, pricePerPaiti: prodRes.data[0].pricePerPaiti }));
        setNewDist(d => ({ ...d, ratePerPaiti: prodRes.data[0].pricePerPaiti }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveProduction = async (e) => {
    e.preventDefault();
    if (newProd.paiti === 0 && newProd.trays === 0) return alert('Enter quantity');
    try {
      const totalEggs = (newProd.paiti * 360) + (newProd.trays * 30);
      const normalizedPaiti = Math.floor(totalEggs / 360);
      const normalizedTrays = Math.floor((totalEggs % 360) / 30);
      const pricePerTray = newProd.pricePerPaiti / 12;
      const totalValue = (normalizedPaiti * newProd.pricePerPaiti) + (normalizedTrays * pricePerTray);
      await api.post('/eggs/production', { ...newProd, paiti: normalizedPaiti, trays: normalizedTrays, totalEggs, pricePerPaiti: newProd.pricePerPaiti, totalValue });
      setNewProd({ date: new Date().toISOString().split('T')[0], paiti: 0, trays: 0, pricePerPaiti: newProd.pricePerPaiti });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to save production.");
    }
  };

  const handleAddDist = async (e) => {
    e.preventDefault();
    if(!newDist.dealerId) return alert('Select a dealer');
    if(newDist.paiti === 0 && newDist.trays === 0) return alert('Enter quantity');
    const totalTrays = (newDist.paiti * 12) + Number(newDist.trays);
    const totalPaiti = totalTrays / 12;
    const totalAmount = Math.round(totalPaiti * newDist.ratePerPaiti);
    
    try {
      await api.post('/eggs/distribution', { ...newDist, totalAmount });
      setNewDist({ ...newDist, paiti: 0, trays: 0 });
      fetchData();
    } catch (error) {
      alert('Failed to log distribution.');
    }
  };

  const handleDeleteProduction = async (id) => {
    if(confirm('Delete this entry?')) { await api.delete(`/eggs/production/${id}`); fetchData(); }
  };

  const handleDeleteDist = async (id) => {
    if(confirm('Delete distribution?')) { await api.delete(`/eggs/distribution/${id}`); fetchData(); }
  };

  const todayStr = new Date().toDateString();
  const displayProd = production.find(p => new Date(p.date).toDateString() === todayStr) || production[0];
  const todayDist = distribution.filter(d => new Date(d.date).toDateString() === todayStr);
  const totalRevenue = todayDist.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Eggs Management</h2>
      </div>
      
      <div className="grid-metrics">
        <div className="card">
          <div className="metric-label">Today's Yield</div>
          <div className="metric-value">
            {displayProd ? `${displayProd.paiti}P ${displayProd.trays}T` : '0 Paiti'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {displayProd ? `${displayProd.totalEggs} eggs produced` : 'No yield logged'}
          </div>
        </div>
        <div className="card">
          <div className="metric-label">Eggs Sold</div>
          <div className="metric-value text-blue">{todayDist.length} Drops</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            To various dealers
          </div>
        </div>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="metric-label">Egg Revenue Today</div>
          <div className="metric-value text-green">PKR {totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Forms Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Plus size={18} className="text-blue" />
          <h3 style={{ fontSize: '1rem' }}>Log Production</h3>
        </div>
        <form onSubmit={handleSaveProduction}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Paiti</label>
              <input type="number" placeholder="e.g. 14" className="mono" value={newProd.paiti} onChange={e => setNewProd({...newProd, paiti: parseInt(e.target.value) || 0})} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Trays</label>
              <input type="number" placeholder="e.g. 3" className="mono" value={newProd.trays} onChange={e => setNewProd({...newProd, trays: parseInt(e.target.value) || 0})} required />
            </div>
            <div className="form-group" style={{ flex: 1.5 }}>
              <label className="form-label">Price / Paiti</label>
              <input type="number" placeholder="e.g. 5500" className="mono" value={newProd.pricePerPaiti} onChange={e => setNewProd({...newProd, pricePerPaiti: parseInt(e.target.value) || 0})} required />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>Save Today's Yield</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <ShoppingCart size={18} className="text-amber" />
          <h3 style={{ fontSize: '1rem' }}>Log Sale to Dealer</h3>
        </div>
        <form onSubmit={handleAddDist}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Select Dealer</label>
            <select value={newDist.dealerId} onChange={e => setNewDist({...newDist, dealerId: e.target.value})} required style={{ width: '100%' }}>
              <option value="" disabled>Choose dealer...</option>
              {dealers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Paiti</label>
              <input type="number" placeholder="e.g. 2" className="mono" value={newDist.paiti} onChange={e => setNewDist({...newDist, paiti: parseInt(e.target.value)||0})} required style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Trays</label>
              <input type="number" placeholder="e.g. 0" className="mono" value={newDist.trays} onChange={e => setNewDist({...newDist, trays: parseInt(e.target.value)||0})} required style={{ width: '100%' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">Rate / Paiti</label>
            <input type="number" placeholder="e.g. 5500" className="mono" value={newDist.ratePerPaiti} onChange={e => setNewDist({...newDist, ratePerPaiti: parseInt(e.target.value)||0})} required style={{ width: '100%' }} />
          </div>
          <button type="submit" className="btn-outline" style={{ width: '100%', marginTop: '16px' }}>Record Distribution</button>
        </form>
      </div>

      {/* History Tables */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <History size={18} className="text-muted" />
          <h3 style={{ fontSize: '1rem' }}>Today's Distribution</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Dealer</th>
                <th>Quantity</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {todayDist.map(dist => (
                <tr key={dist._id}>
                  <td style={{ fontWeight: 500 }}>{dist.dealerId?.name || 'Unknown'}</td>
                  <td className="mono" style={{ fontSize: '0.8rem' }}>{dist.paiti}P {dist.trays}T</td>
                  <td className="mono text-green">{dist.totalAmount.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleDeleteDist(dist._id)} className="text-red">
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
