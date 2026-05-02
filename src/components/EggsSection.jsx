import React, { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import { formatDate } from '../utils/dateFormatter';

export function EggsSection({ api }) {
  const [production, setProduction] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [dealers, setDealers] = useState([]);

  // Forms
  const [newProd, setNewProd] = useState({ date: new Date().toISOString().split('T')[0], paiti: 14, trays: 3, pricePerPaiti: 5500 });
  const [newDist, setNewDist] = useState({ date: new Date().toISOString().split('T')[0], dealerId: '', paiti: 2, trays: 0, ratePerPaiti: 5500 });

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
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveProduction = async (e) => {
    e.preventDefault();
    try {
      const totalEggs = (newProd.paiti * 360) + (newProd.trays * 30);
      const normalizedPaiti = Math.floor(totalEggs / 360);
      const normalizedTrays = Math.floor((totalEggs % 360) / 30);
      const pricePerTray = newProd.pricePerPaiti / 12;
      const totalValue = (normalizedPaiti * newProd.pricePerPaiti) + (normalizedTrays * pricePerTray);
      await api.post('/eggs/production', { ...newProd, paiti: normalizedPaiti, trays: normalizedTrays, totalEggs, pricePerPaiti: newProd.pricePerPaiti, totalValue });
      
      // Clear form to provide feedback that it worked
      setNewProd({ date: new Date().toISOString().split('T')[0], paiti: 0, trays: 0, pricePerPaiti: newProd.pricePerPaiti });
      fetchData();
    } catch (error) {
      if (error.response?.data?.error?.includes('duplicate key') || error.response?.data?.error?.includes('E11000')) {
        alert("A production entry already exists for this exact date! Please choose a different date or delete the existing one first.");
      } else {
        alert("Failed to save production.");
      }
    }
  };

  const handleDeleteProduction = async (id) => {
    if(confirm('Delete this production entry?')) {
      await api.delete(`/eggs/production/${id}`);
      fetchData();
    }
  };

  const handleAddDist = async (e) => {
    e.preventDefault();
    if(!newDist.dealerId) return alert('Select a dealer');
    
    // Normalize paiti and trays
    const totalTrays = (newDist.paiti * 12) + Number(newDist.trays);
    const normalizedPaiti = Math.floor(totalTrays / 12);
    const normalizedTrays = totalTrays % 12;
    
    // Calculate total: full paiti + fractional paiti from remaining trays
    const totalPaiti = normalizedPaiti + (normalizedTrays / 12);
    const totalAmount = Math.round(totalPaiti * newDist.ratePerPaiti);
    const ratePerTray = Math.round(newDist.ratePerPaiti / 12); // store for reference
    
    try {
      await api.post('/eggs/distribution', { 
        ...newDist, 
        paiti: normalizedPaiti, 
        trays: normalizedTrays, 
        totalAmount,
        ratePerPaiti: newDist.ratePerPaiti,
        ratePerTray,
      });
      fetchData();
    } catch (error) {
      alert('Failed to log distribution.');
    }
  };

  const handleDeleteDist = async (id) => {
    if(confirm('Delete distribution entry and reverse dealer balance?')) {
      await api.delete(`/eggs/distribution/${id}`);
      fetchData();
    }
  };

  // Today's production (same calendar day)
  const todayStr = new Date().toDateString();
  const todayProd = production.find(p => new Date(p.date).toDateString() === todayStr);
  // Fall back to latest entry if no entry today
  const latestProd = production.length > 0 ? production[0] : null;
  const displayProd = todayProd || latestProd;

  const todayDist = distribution.filter(d => new Date(d.date).toDateString() === todayStr);

  // Total sold today
  const totalSoldPaiti = todayDist.reduce((acc, curr) => acc + (curr.paiti || 0), 0);
  const totalSoldTraysCount = todayDist.reduce((acc, curr) => acc + curr.trays, 0);
  const netSoldPaiti = totalSoldPaiti + Math.floor(totalSoldTraysCount / 12);
  const netSoldTrays = totalSoldTraysCount % 12;

  const totalRevenue = todayDist.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const prodLabel = todayProd
    ? 'Today\'s Production'
    : latestProd
      ? `Latest (${formatDate(latestProd.date)})`
      : 'No Production';

  return (
    <div>
      <h2 className="overview-section-title">Eggs Tab</h2>
      
      <div className="grid-metrics">
        <MetricCard 
          title={prodLabel}
          value={displayProd ? `${displayProd.paiti} Paiti ${displayProd.trays > 0 ? displayProd.trays + ' Trays' : ''}` : 'No Entry'} 
          subtitle={displayProd ? `${displayProd.totalEggs} eggs total` : ''}
        />
        <MetricCard 
          title="Sold Today" 
          value={todayDist.length > 0 ? `${netSoldPaiti} Paiti ${netSoldTrays > 0 ? netSoldTrays + ' Trays' : ''}` : 'None yet'}
          subtitle={`${todayDist.length} dealer${todayDist.length !== 1 ? 's' : ''}`}
        />
        <MetricCard 
          title="Gross Revenue Today" 
          value={`PKR ${totalRevenue.toLocaleString()}`} 
        />
      </div>

      <div className="two-column">
        {/* Daily Entry Form */}
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Daily Production Entry</h3>
          <form onSubmit={handleSaveProduction}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Date</label>
              <input type="date" className="mono" value={newProd.date} onChange={e => setNewProd({...newProd, date: e.target.value})} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Paiti (پیٹی)</label>
                <input type="number" className="mono" value={newProd.paiti} onChange={e => setNewProd({...newProd, paiti: parseInt(e.target.value) || 0})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Extra Trays (ٹرے)</label>
                <input type="number" className="mono" value={newProd.trays} onChange={e => setNewProd({...newProd, trays: parseInt(e.target.value) || 0})} required />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Price per Paiti (PKR)</label>
              <input type="number" className="mono" value={newProd.pricePerPaiti} onChange={e => setNewProd({...newProd, pricePerPaiti: parseInt(e.target.value) || 0})} required />
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius)', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="form-label">Total Eggs: </span>
                <span className="mono" style={{ fontWeight: 600 }}>{(newProd.paiti * 360) + (newProd.trays * 30)}</span>
              </div>
              <div>
                <span className="form-label">Est. Value: </span>
                <span className="mono text-green" style={{ fontSize: '1.1rem', fontWeight: 700 }}>PKR {((newProd.paiti * newProd.pricePerPaiti) + (newProd.trays * (newProd.pricePerPaiti / 12))).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px' }}>Save Production</button>
          </form>

          {/* Recent Production */}
          <div style={{ marginTop: '32px' }}>
             <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Recent Production</h4>
             <table style={{ fontSize: '0.85rem' }}>
              <tbody>
                {production.slice(0, 5).map(p => (
                  <tr key={p._id}>
                    <td className="mono">{formatDate(p.date)}</td>
                    <td>{p.paiti} Paiti {p.trays > 0 ? `${p.trays} Trays` : ''}</td>
                    <td className="mono">{p.totalEggs} eggs</td>
                    <td className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{p.pricePerPaiti ? `@ PKR ${p.pricePerPaiti.toLocaleString()}/Paiti` : ''}</td>
                    <td className="mono text-green" style={{ fontWeight: 600 }}>{p.totalValue ? `PKR ${Math.round(p.totalValue).toLocaleString()}` : ''}</td>
                    <td><button onClick={() => handleDeleteProduction(p._id)} style={{ color: 'var(--accent-red)' }}>x</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dealer Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Distribute Eggs</h3>
          <form onSubmit={handleAddDist}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Dealer</label>
              <select value={newDist.dealerId} onChange={e => setNewDist({...newDist, dealerId: e.target.value})} required>
                <option value="" disabled>Select Dealer</option>
                {dealers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Paiti</label>
                <input type="number" className="mono" value={newDist.paiti} onChange={e => setNewDist({...newDist, paiti: parseInt(e.target.value)||0})} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Trays</label>
                <input type="number" className="mono" value={newDist.trays} onChange={e => setNewDist({...newDist, trays: parseInt(e.target.value)||0})} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Rate / Paiti (PKR)</label>
                <input type="number" className="mono" value={newDist.ratePerPaiti} onChange={e => setNewDist({...newDist, ratePerPaiti: parseInt(e.target.value)||0})} required />
              </div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius)', marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <span className="form-label">Total Amount (PKR): </span>
              <span className="mono text-green" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {Math.round(((newDist.paiti * 12 + Number(newDist.trays)) / 12) * newDist.ratePerPaiti).toLocaleString()}
              </span>
            </div>
            <button type="submit" className="btn-outline" style={{ width: '100%', marginTop: '16px' }}>+ Log Distribution</button>
          </form>

          <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Today's Distribution</h3>
          <table>
            <thead>
              <tr>
                <th>Dealer</th>
                <th>Quantity</th>
                <th>Total (PKR)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {todayDist.length === 0 && <tr><td colSpan="4" className="text-muted text-center">No distribution today.</td></tr>}
              {todayDist.map(dist => (
                <tr key={dist._id}>
                  <td>{dist.dealerId?.name || 'Unknown'}</td>
                  <td className="mono">{dist.paiti || 0} Paiti {dist.trays > 0 ? `${dist.trays} Trays` : ''}</td>
                  <td className="mono text-green">{dist.totalAmount.toLocaleString()}</td>
                  <td><button onClick={() => handleDeleteDist(dist._id)} style={{ color: 'var(--accent-red)' }}>x</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
