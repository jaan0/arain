import React, { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, History, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/dateFormatter';

export function MedicineSection({ api }) {
  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  
  // Forms
  const [newStock, setNewStock] = useState({ name: 'Newcastle Vaccine', quantity: 15, pricePerUnit: 800, dateAdded: new Date().toISOString().split('T')[0] });
  const [newUsage, setNewUsage] = useState({ date: new Date().toISOString().split('T')[0], medicineId: '', unitsUsed: 1, cost: 0 });

  const [isNewMedicine, setIsNewMedicine] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [stockRes, usageRes] = await Promise.all([api.get('/medicine/stock'), api.get('/medicine/usage')]);
      setStock(stockRes.data);
      setUsage(usageRes.data);
      if (stockRes.data.length > 0 && !newUsage.medicineId) {
        setNewUsage(prev => ({ ...prev, medicineId: stockRes.data[0]._id, cost: stockRes.data[0].pricePerUnit * 1 }));
      }
    } catch (error) { console.error(error); }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    await api.post('/medicine/stock', newStock);
    setIsNewMedicine(false);
    fetchData();
  };

  const handleLogUsage = async (e) => {
    e.preventDefault();
    await api.post('/medicine/usage', newUsage);
    fetchData();
  };

  const handleDeleteStock = async (id) => {
    if(confirm('Delete this medicine stock?')) { await api.delete(`/medicine/stock/${id}`); fetchData(); }
  };

  const handleDeleteUsage = async (id) => {
    if(confirm('Delete log?')) { await api.delete(`/medicine/usage/${id}`); fetchData(); }
  };

  const handleMedicineChange = (e) => {
    const medicineId = e.target.value;
    const selected = stock.find(s => s._id === medicineId);
    if (selected) setNewUsage(prev => ({ ...prev, medicineId, cost: selected.pricePerUnit * prev.unitsUsed }));
  };

  const handleUnitsChange = (e) => {
    const unitsUsed = parseInt(e.target.value) || 0;
    const selected = stock.find(s => s._id === newUsage.medicineId);
    setNewUsage(prev => ({ ...prev, unitsUsed, cost: selected ? selected.pricePerUnit * unitsUsed : 0 }));
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <h2 className="section-title">Medicine Stock</h2>
      </div>
      
      <div className="grid-metrics">
        {stock.map(s => (
          <div key={s._id} className="card" style={{ position: 'relative' }}>
            <div className="metric-label">{s.name}</div>
            <div className={`metric-value ${s.quantity < 5 ? 'text-red' : ''}`}>
              {s.quantity} Units
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              PKR {s.pricePerUnit}/Unit {s.quantity < 5 && <><AlertCircle size={10} /> Low</>}
            </div>
            <button onClick={() => handleDeleteStock(s._id)} style={{ position: 'absolute', top: 12, right: 12, color: 'var(--text-muted)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {stock.length === 0 && <div className="card text-muted">No medicines in stock.</div>}
      </div>

      {/* Usage Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Pill size={18} className="text-blue" />
          <h3 style={{ fontSize: '1rem' }}>Log Treatment</h3>
        </div>
        <form onSubmit={handleLogUsage}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <select value={newUsage.medicineId} onChange={handleMedicineChange} required style={{ width: '100%' }}>
              <option value="" disabled>Select Medicine</option>
              {stock.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <input type="number" placeholder="Units Used" className="mono" value={newUsage.unitsUsed} onChange={handleUnitsChange} required style={{ width: '100%' }} />
            </div>
            <button type="submit" className="btn-primary" disabled={stock.length === 0} style={{ height: '42px' }}>
              Log Dose
            </button>
          </div>
          {newUsage.cost > 0 && (
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Est. Cost: <span className="mono text-red">PKR {newUsage.cost.toLocaleString()}</span>
            </div>
          )}
        </form>
      </div>

      {/* Purchase Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Plus size={18} className="text-green" />
          <h3 style={{ fontSize: '1rem' }}>Add New Stock</h3>
        </div>
        <form onSubmit={handleAddStock}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            {isNewMedicine || stock.length === 0 ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" required value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} placeholder="Medicine Name" style={{ flex: 1 }} />
                {stock.length > 0 && <button type="button" onClick={() => setIsNewMedicine(false)} className="btn-outline">×</button>}
              </div>
            ) : (
              <select required value={newStock.name} onChange={e => e.target.value === 'NEW' ? setIsNewMedicine(true) : setNewStock({...newStock, name: e.target.value})} style={{ width: '100%' }}>
                {stock.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                <option value="NEW">+ Add New...</option>
              </select>
            )}
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <input type="number" placeholder="Units" className="mono" required value={newStock.quantity} onChange={e => setNewStock({...newStock, quantity: e.target.value})} style={{ width: '100%' }} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <input type="number" placeholder="Price/Unit" className="mono" required value={newStock.pricePerUnit} onChange={e => setNewStock({...newStock, pricePerUnit: e.target.value})} style={{ width: '100%' }} />
            </div>
          </div>
          <button type="submit" className="btn-outline" style={{ width: '100%', marginTop: '16px' }}>Add Stock</button>
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
                <th>Medicine</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usage.map(u => (
                <tr key={u._id}>
                  <td className="mono" style={{ fontSize: '0.75rem' }}>{formatDate(u.date)}</td>
                  <td>{u.medicineId?.name || 'Deleted'} ({u.unitsUsed} U)</td>
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
