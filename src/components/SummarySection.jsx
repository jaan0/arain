import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, TrendingUp, Receipt, DollarSign, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatDate } from '../utils/dateFormatter';

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

export function SummarySection({ api }) {
  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(todayStr);
  const [newMisc, setNewMisc] = useState({ date: todayStr, description: '', amount: 0 });

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/summary?start=${startDate}&end=${endDate}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogMisc = async (e) => {
    e.preventDefault();
    await api.post('/summary/misc', newMisc);
    setNewMisc({ date: todayStr, description: '', amount: 0 });
    fetchData();
  };

  const handleDeleteMisc = async (id) => {
    if (confirm('Delete this expense?')) {
      await api.delete(`/summary/misc/${id}`);
      fetchData();
    }
  };

  if (!data) return <div className="p-20 text-muted">Loading Dashboard...</div>;

  const { metrics, chartData, misc } = data;

  return (
    <div className="fade-in">
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h2 className="section-title">Dashboard</h2>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0' }}>
          <div className="card" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Calendar size={14} className="text-muted" />
            <input type="date" className="mono" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', padding: 0, fontSize: '0.8rem', background: 'transparent', outline: 'none' }} />
          </div>
          <div className="card" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Calendar size={14} className="text-muted" />
            <input type="date" className="mono" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', padding: 0, fontSize: '0.8rem', background: 'transparent', outline: 'none' }} />
          </div>
        </div>
      </div>

      <div className="grid-metrics">
        <div className="card">
          <div className="metric-label">Net Profit</div>
          <div className={`metric-value ${metrics.netProfit >= 0 ? 'text-green' : 'text-red'}`}>
            PKR {metrics.netProfit.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="metric-label">Egg Revenue</div>
          <div className="metric-value text-blue">PKR {metrics.totalEggRevenue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="metric-label">Total Costs</div>
          <div className="metric-value text-amber">PKR {(metrics.totalFeedCost + metrics.totalMedCost + metrics.totalSalaries + metrics.totalMisc).toLocaleString()}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px', padding: '20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
          <TrendingUp size={18} className="text-blue" />
          <h3 style={{ fontSize: '1rem' }}>Performance</h3>
        </div>
        <div style={{ width: '100%', height: 180 }}>
          {chartData.length === 0 ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No trend data</div>
          ) : (
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                  formatter={v => [`PKR ${v.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Receipt size={18} className="text-amber" />
          <h3 style={{ fontSize: '1rem' }}>Log Expense</h3>
        </div>
        <form onSubmit={handleLogMisc}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <input type="text" placeholder="Description" value={newMisc.description} onChange={e => setNewMisc({ ...newMisc, description: e.target.value })} required style={{ width: '100%' }} />
          </div>
          <div className="form-row">
            <input type="number" placeholder="Amount" className="mono" value={newMisc.amount} onChange={e => setNewMisc({ ...newMisc, amount: parseInt(e.target.value) || 0 })} required style={{ flex: 1 }} />
            <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>Log</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={18} className="text-muted" />
          <h3 style={{ fontSize: '1rem' }}>Recent Expenses</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {misc.map(m => (
                <tr key={m._id}>
                  <td className="mono" style={{ fontSize: '0.7rem' }}>{formatDate(m.date)}</td>
                  <td>{m.description}</td>
                  <td className="mono text-red" style={{ textAlign: 'right' }}>-{m.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
