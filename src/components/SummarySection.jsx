import React, { useState, useEffect } from 'react';
import { MetricCard } from './MetricCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '../utils/dateFormatter';

const today = new Date();
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
const todayStr = today.toISOString().split('T')[0];

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

  if (!data) return <div>Loading...</div>;

  const { metrics, chartData, misc } = data;

  return (
    <div>
      {/* Header + Date Range */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="overview-section-title" style={{ marginTop: 0 }}>Summary Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
          <label className="form-label" style={{ margin: 0 }}>From</label>
          <input type="date" className="mono" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '6px 10px' }} />
          <label className="form-label" style={{ margin: 0 }}>To</label>
          <input type="date" className="mono" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '6px 10px' }} />
          <button className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => { setStartDate(firstOfMonth); setEndDate(todayStr); }}>
            This Month
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-metrics">
        <MetricCard
          title="Net Profit"
          value={`PKR ${metrics.netProfit.toLocaleString()}`}
          isPositive={metrics.netProfit >= 0}
          subtitle={metrics.netProfit >= 0 ? 'Profitable' : 'Loss'}
        />
        <MetricCard title="Egg Revenue" value={`PKR ${metrics.totalEggRevenue.toLocaleString()}`} />
        <MetricCard title="Feed Cost" value={`PKR ${metrics.totalFeedCost.toLocaleString()}`} isPositive={false} />
        <MetricCard title="Medicine Cost" value={`PKR ${metrics.totalMedCost.toLocaleString()}`} isPositive={false} />
        <MetricCard title="Labour Salaries" value={`PKR ${metrics.totalSalaries.toLocaleString()}`} isPositive={false} />
        <MetricCard title="Misc Expenses" value={`PKR ${metrics.totalMisc.toLocaleString()}`} isPositive={false} />
      </div>

      {/* Chart */}
      <div className="card" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '24px' }}>Revenue by Day</h3>
        <div style={{ width: '100%', height: 260 }}>
          {chartData.length === 0 ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No revenue data for the selected period.
            </div>
          ) : (
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--text-main)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--text-main)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }} dx={-10}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                  itemStyle={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}
                  formatter={v => [`PKR ${v.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--text-main)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two Column: Misc Form + Recent List */}
      <div className="two-column">
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Log Miscellaneous Expense</h3>
          <form onSubmit={handleLogMisc}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Description</label>
              <input type="text" value={newMisc.description} onChange={e => setNewMisc({ ...newMisc, description: e.target.value })} required placeholder="e.g. Generator repair, Fuel" />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Amount (PKR)</label>
                <input type="number" className="mono" value={newMisc.amount} onChange={e => setNewMisc({ ...newMisc, amount: parseInt(e.target.value) || 0 })} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Date</label>
                <input type="date" className="mono" value={newMisc.date} onChange={e => setNewMisc({ ...newMisc, date: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn-outline" style={{ width: '100%', marginTop: '16px' }}>Log Expense</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Recent Misc Expenses</h3>
          {misc.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No expenses logged yet.</p>
          ) : (
            <table style={{ fontSize: '0.85rem' }}>
              <tbody>
                {misc.map(m => (
                  <tr key={m._id}>
                    <td className="mono">{formatDate(m.date)}</td>
                    <td>{m.description}</td>
                    <td className="mono text-red">- PKR {m.amount.toLocaleString()}</td>
                    <td><button onClick={() => handleDeleteMisc(m._id)} style={{ color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
