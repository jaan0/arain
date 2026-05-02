import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Save, FileText, Plus, Trash2, History, Check, Undo, Phone, MapPin, ExternalLink, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils/dateFormatter';

function Avatar({ url, name, size = 80 }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 'var(--radius-lg)', objectFit: 'cover', flexShrink: 0 }} />;
  return <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.35, borderRadius: 'var(--radius-lg)' }}>{name?.substring(0, 2).toUpperCase()}</div>;
}

export function ProfilePage({ profile, type, api, onBack, onRefresh }) {
  const [data, setData] = useState(profile);
  const [ledger, setLedger] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [editForm, setEditForm] = useState({ name: profile.name, phone: profile.phone || '', salary: profile.salary || 0, loan: profile.loan || 0 });
  const [newEntry, setNewEntry] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: 0, type: type === 'dealer' ? 'CREDIT_GIVEN' : 'LOAN_GIVEN' });
  const [loanAmount, setLoanAmount] = useState(0);

  const picRef = useRef();
  const docRef = useRef();
  const endpoint = type === 'dealer' ? `/dealers/${data._id}` : `/labour/${data._id}`;

  useEffect(() => { fetchLedger(); if (type === 'dealer') fetchDistributions(); }, []);

  const fetchDistributions = async () => {
    try {
      const res = await api.get(`/eggs/distribution?dealerId=${data._id}`);
      setDistributions(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await api.get(`${endpoint}/ledger`);
      setLedger(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingLedger(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put(endpoint, editForm);
      setData(res.data);
      onRefresh();
    } catch { alert('Save failed.'); }
    finally { setSaving(false); }
  };

  const handleUploadPic = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingPic(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post('/upload/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const updated = await api.put(endpoint, { ...editForm, profilePicUrl: res.data.url });
      setData(updated.data);
      onRefresh();
    } catch { alert('Upload failed.'); }
    finally { setUploadingPic(false); }
  };

  const handleUploadDoc = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await api.post('/upload/document', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const docs = [...(data.documents || []), res.data.url];
      const updated = await api.put(endpoint, { ...editForm, documents: docs });
      setData(updated.data);
      onRefresh();
    } catch { alert('Upload failed.'); }
    finally { setUploadingDoc(false); }
  };

  const handleAddLedgerEntry = async (e) => {
    e.preventDefault();
    try {
      await api.post(`${endpoint}/ledger`, newEntry);
      setNewEntry({ date: new Date().toISOString().split('T')[0], description: '', amount: 0, type: type === 'dealer' ? 'CREDIT_GIVEN' : 'LOAN_GIVEN' });
      fetchLedger();
      onRefresh();
    } catch { alert('Failed.'); }
  };

  const handleMarkPaid = async (distId) => {
    try {
      await api.patch(`/eggs/distribution/${distId}/pay`);
      fetchDistributions();
      onRefresh();
    } catch { alert('Failed.'); }
  };

  const handleDownloadInvoice = async () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text('ARAIN POULTRY FARM', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Statement for ${data.name}`, 105, 30, { align: 'center' });
      const rows = distributions.map(d => [formatDate(d.date), 'Egg Delivery', d.paid ? 'PAID' : 'PENDING', `PKR ${d.totalAmount?.toLocaleString()}`]);
      autoTable(doc, {
        startY: 40,
        head: [['Date', 'Type', 'Status', 'Amount']],
        body: rows,
        theme: 'striped'
      });
      doc.save(`Invoice_${data.name}.pdf`);
    } catch (err) { alert('PDF Error'); }
  };

  return (
    <div className="fade-in">
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <button onClick={onBack} className="btn-outline" style={{ border: 'none', padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="section-title">Profile Details</h2>
        <div style={{ flex: 1 }}></div>
        <button onClick={handleDownloadInvoice} className="btn-primary" style={{ padding: '8px 12px' }}>
          <Download size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Profile Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <Avatar url={data.profilePicUrl} name={data.name} size={80} />
            <button onClick={() => picRef.current.click()} disabled={uploadingPic} 
              style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--blue)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={12} />
            </button>
            <input type="file" ref={picRef} style={{ display: 'none' }} accept="image/*" onChange={handleUploadPic} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{data.name}</h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <Phone size={12} /> {data.phone || 'No phone set'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-metrics">
          <div className="card">
            <div className="metric-label">{type === 'dealer' ? 'Net Balance' : 'Outstanding Loan'}</div>
            <div className={`metric-value ${(data.balance || data.loan) > 0 ? 'text-red' : 'text-green'}`}>
              PKR {(data.balance || data.loan || 0).toLocaleString()}
            </div>
          </div>
          {type === 'labour' && (
            <div className="card">
              <div className="metric-label">Monthly Salary</div>
              <div className="metric-value">PKR {data.salary?.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Save size={18} className="text-blue" />
            <h3 style={{ fontSize: '1rem' }}>Manage Profile</h3>
          </div>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="form-label">Full Name</label>
            <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Phone</label>
              <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            {type === 'labour' && (
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Salary (PKR)</label>
                <input type="number" className="mono" value={editForm.salary} onChange={e => setEditForm({ ...editForm, salary: Number(e.target.value) })} />
              </div>
            )}
          </div>
          <button onClick={saveProfile} className="btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={saving}>
            {saving ? 'Updating...' : 'Save Changes'}
          </button>
        </div>

        {/* Ledger Entries */}
        {type === 'dealer' && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Plus size={18} className="text-blue" />
              <h3 style={{ fontSize: '1rem' }}>Add Transaction</h3>
            </div>
            <form onSubmit={handleAddLedgerEntry}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <select value={newEntry.type} onChange={e => setNewEntry({ ...newEntry, type: e.target.value })} style={{ width: '100%' }}>
                  <option value="CREDIT_GIVEN">Manual Credit (Egg Sale)</option>
                  <option value="PAYMENT_RECEIVED">Payment Received (Cash/Bank)</option>
                </select>
              </div>
              <div className="form-row">
                <input type="text" placeholder="Description" value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} required style={{ flex: 2 }} />
                <input type="number" placeholder="Amount" className="mono" value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: Number(e.target.value) })} required style={{ flex: 1 }} />
              </div>
              <button type="submit" className="btn-outline" style={{ width: '100%', marginTop: '12px' }}>Add Entry</button>
            </form>
          </div>
        )}

        {/* History Table */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <History size={18} className="text-muted" />
            <h3 style={{ fontSize: '1rem' }}>Transaction History</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {distributions.map(d => (
                  <tr key={d._id}>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>{formatDate(d.date)}</td>
                    <td>Egg Delivery</td>
                    <td className="mono text-red" style={{ textAlign: 'right' }}>-{d.totalAmount?.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      {!d.paid && (
                        <button onClick={() => handleMarkPaid(d._id)} className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                          <Check size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {ledger.map(entry => (
                  <tr key={entry._id}>
                    <td className="mono" style={{ fontSize: '0.75rem' }}>{formatDate(entry.date)}</td>
                    <td>{entry.description}</td>
                    <td className={`mono ${entry.type === 'PAYMENT_RECEIVED' ? 'text-green' : 'text-red'}`} style={{ textAlign: 'right' }}>
                      {entry.type === 'PAYMENT_RECEIVED' ? '+' : '-'}{entry.amount?.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
