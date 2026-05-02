import React, { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import { formatDate } from '../utils/dateFormatter';

export function MedicineSection({ api }) {
  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  
  // Forms
  const [newStock, setNewStock] = useState({ name: 'Newcastle Vaccine', quantity: 15, pricePerUnit: 800, dateAdded: new Date().toISOString().split('T')[0] });
  const [newUsage, setNewUsage] = useState({ date: new Date().toISOString().split('T')[0], medicineId: '', unitsUsed: 1, cost: 0 });

  const [isNewMedicine, setIsNewMedicine] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stockRes, usageRes] = await Promise.all([
        api.get('/medicine/stock'),
        api.get('/medicine/usage')
      ]);
      setStock(stockRes.data);
      setUsage(usageRes.data);
      if (stockRes.data.length > 0 && !newUsage.medicineId) {
        setNewUsage(prev => ({ ...prev, medicineId: stockRes.data[0]._id, cost: stockRes.data[0].pricePerUnit * 1 }));
      }
      if (stockRes.data.length > 0 && !isNewMedicine && newStock.name === 'Newcastle Vaccine') {
        // Default to first stock item name if we haven't typed anything
        setNewStock(prev => ({ ...prev, name: stockRes.data[0].name }));
      }
    } catch (error) {
      console.error(error);
    }
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
    if(confirm('Delete this medicine stock?')) {
      await api.delete(`/medicine/stock/${id}`);
      fetchData();
    }
  };

  const handleDeleteUsage = async (id) => {
    if(confirm('Delete this usage log and restore stock?')) {
      await api.delete(`/medicine/usage/${id}`);
      fetchData();
    }
  };

  const handleMedicineChange = (e) => {
    const medicineId = e.target.value;
    const selected = stock.find(s => s._id === medicineId);
    if (selected) {
      setNewUsage(prev => ({ ...prev, medicineId, cost: selected.pricePerUnit * prev.unitsUsed }));
    }
  };

  const handleUnitsChange = (e) => {
    const unitsUsed = parseInt(e.target.value) || 0;
    const selected = stock.find(s => s._id === newUsage.medicineId);
    const cost = selected ? selected.pricePerUnit * unitsUsed : 0;
    setNewUsage(prev => ({ ...prev, unitsUsed, cost }));
  };

  return (
    <div>
      <h2 className="overview-section-title">Medicine Tab</h2>
      
      <div className="grid-metrics">
        {stock.map(s => (
          <div key={s._id} style={{ position: 'relative' }}>
            <MetricCard 
              title={s.name} 
              value={`${s.quantity} Units`} 
              subtitle={`PKR ${s.pricePerUnit} / Unit`} 
              trendValue={s.quantity < 5 ? "Low" : null} 
              isPositive={false} 
            />
            <button onClick={() => handleDeleteStock(s._id)} style={{ position: 'absolute', top: 16, right: 16, color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
          </div>
        ))}
        {stock.length === 0 && <div className="card text-muted">No medicine stock. Add some below.</div>}
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
                <label className="form-label">Medicine</label>
                <select value={newUsage.medicineId} onChange={handleMedicineChange} required>
                  <option value="" disabled>Select Medicine</option>
                  {stock.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Units Used Today</label>
              <input type="number" className="mono" value={newUsage.unitsUsed} onChange={handleUnitsChange} required />
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
                    <td>{u.medicineId?.name || 'Unknown (Deleted Medicine)'} ({u.unitsUsed} Units)</td>
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
          <h3 style={{ marginBottom: '20px' }}>Add Medicine Stock</h3>
          <form onSubmit={handleAddStock}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Medicine Name</label>
              {isNewMedicine || stock.length === 0 ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" required value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} placeholder="Enter new medicine" style={{ flex: 1 }} />
                  {stock.length > 0 && <button type="button" className="btn-outline" onClick={() => { setIsNewMedicine(false); setNewStock({...newStock, name: stock[0].name}) }}>Cancel</button>}
                </div>
              ) : (
                <select required value={newStock.name} onChange={e => {
                  if (e.target.value === 'NEW') {
                    setIsNewMedicine(true);
                    setNewStock({...newStock, name: ''});
                  } else {
                    setNewStock({...newStock, name: e.target.value});
                  }
                }}>
                  {stock.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                  <option value="NEW">+ Add New Medicine...</option>
                </select>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="mono" required value={newStock.quantity} onChange={e => setNewStock({...newStock, quantity: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Price per Unit (PKR)</label>
                <input type="number" className="mono" required value={newStock.pricePerUnit} onChange={e => setNewStock({...newStock, pricePerUnit: e.target.value})} />
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
