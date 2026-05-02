import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../utils/dateFormatter';

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ url, name, size = 56 }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />;
  return <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>{name?.substring(0, 2).toUpperCase()}</div>;
}

// ─── Full Profile Page (replaces tab content) ─────────────────────────────────
export function ProfilePage({ profile, type, api, onBack, onRefresh }) {
  const [data, setData] = useState(profile);
  const [ledger, setLedger] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Edit state
  const [editForm, setEditForm] = useState({ name: profile.name, phone: profile.phone || '', salary: profile.salary || 0, loan: profile.loan || 0 });

  // New ledger entry
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
      alert('Saved!');
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
    } catch { alert('Photo upload failed.'); }
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
    } catch { alert('Document upload failed.'); }
    finally { setUploadingDoc(false); }
  };

  const handleRemoveDoc = async (idx) => {
    const docs = data.documents.filter((_, i) => i !== idx);
    const updated = await api.put(endpoint, { ...editForm, documents: docs });
    setData(updated.data);
    onRefresh();
  };

  const handleAddLedgerEntry = async (e) => {
    e.preventDefault();
    try {
      await api.post(`${endpoint}/ledger`, newEntry);
      setNewEntry({ date: new Date().toISOString().split('T')[0], description: '', amount: 0, type: type === 'dealer' ? 'CREDIT_GIVEN' : 'LOAN_GIVEN' });
      fetchLedger();
      // Refresh profile to update balance
      const res = await api.get(type === 'dealer' ? '/dealers' : '/labour');
      const updated = res.data.find(p => p._id === data._id);
      if (updated) setData(updated);
      onRefresh();
    } catch { alert('Failed to add entry.'); }
  };

  const handleAddLoan = async () => {
    if (!loanAmount || loanAmount <= 0) return alert('Enter a valid amount');
    await api.put(endpoint, { ...editForm, loan: (data.loan || 0) + Number(loanAmount) });
    const res = await api.get('/labour');
    const updated = res.data.find(p => p._id === data._id);
    if (updated) { setData(updated); setEditForm(prev => ({ ...prev, loan: updated.loan })); }
    setLoanAmount(0);
    onRefresh();
  };

  const handleRepayLoan = async () => {
    if (!loanAmount || loanAmount <= 0) return alert('Enter a valid amount');
    const newLoan = Math.max(0, (data.loan || 0) - Number(loanAmount));
    await api.put(endpoint, { ...editForm, loan: newLoan });
    const res = await api.get('/labour');
    const updated = res.data.find(p => p._id === data._id);
    if (updated) { setData(updated); setEditForm(prev => ({ ...prev, loan: updated.loan })); }
    setLoanAmount(0);
    onRefresh();
  };

  const handleDeleteLedger = async (ledgerId) => {
    if (!confirm('Delete this entry? The balance will be reversed.')) return;
    try {
      await api.delete(`${endpoint}/ledger/${ledgerId}`);
      // Refresh ledger list AND dealer balance from server
      fetchLedger();
      const res = await api.get(type === 'dealer' ? '/dealers' : '/labour');
      const updated = res.data.find(p => p._id === data._id);
      if (updated) setData(updated);
      onRefresh();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleMarkPaid = async (distId) => {
    try {
      await api.patch(`/eggs/distribution/${distId}/pay`);
      // Refresh dealer balance
      const res = await api.get('/dealers');
      const updated = res.data.find(p => p._id === data._id);
      if (updated) setData(updated);
      fetchDistributions();
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark as paid');
    }
  };

  const handleUndoPaid = async (distId) => {
    try {
      await api.patch(`/eggs/distribution/${distId}/unpay`);
      const res = await api.get('/dealers');
      const updated = res.data.find(p => p._id === data._id);
      if (updated) setData(updated);
      fetchDistributions();
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to undo');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('ARAIN POULTRY FARM', 105, 22, null, null, 'center');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Ledger Statement', 105, 31, null, null, 'center');
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 36, 190, 36);

      doc.setFontSize(10);
      doc.text('To: ' + data.name, 20, 44);
      if (data.phone) doc.text('Phone: ' + data.phone, 20, 50);
      doc.text('Date: ' + formatDate(new Date()), 150, 44);
      doc.text(
        `Balance: PKR ${Math.abs(data.balance || 0).toLocaleString()} ${(data.balance || 0) >= 0 ? '(Dealer owes us)' : '(We owe dealer)'}`,
        20, 56
      );

      // Build rows: egg deliveries first, then manual ledger
      const rows = [];

      // Egg distributions
      distributions.forEach(d => {
        rows.push([
          formatDate(d.date),
          `${d.paiti || 0} Paiti ${d.trays > 0 ? d.trays + ' Trays' : ''} (Eggs Delivered)`,
          'Eggs Delivered',
          `PKR ${d.totalAmount?.toLocaleString()}`,
          d.paid ? 'PAID' : 'PENDING',
        ]);
      });

      // Manual ledger entries
      ledger.forEach(e => {
        rows.push([
          formatDate(e.date),
          e.description,
          e.type === 'CREDIT_GIVEN' ? 'Credit Given' : 'Payment Received',
          `${e.type === 'CREDIT_GIVEN' ? '- ' : '+ '} PKR ${e.amount?.toLocaleString()}`,
          '—',
        ]);
      });

      autoTable(doc, {
        startY: 62,
        head: [['Date', 'Description', 'Type', 'Amount', 'Status']],
        body: rows.length > 0 ? rows : [['No records', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { textColor: [80, 80, 80], fontSize: 8.5 },
        columnStyles: {
          3: { halign: 'right', font: 'courier' },
          4: { halign: 'center', fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [248, 248, 248] },
      });

      const finalY = doc.lastAutoTable?.finalY || 150;
      doc.setFontSize(9);
      doc.setTextColor(160);
      doc.text('Arain Poultry Farm — Internal Record', 105, finalY + 16, null, null, 'center');

      doc.save(`Statement_${data.name.replace(/\s/g, '_')}_${formatDate(new Date()).replace(/\//g, '-')}.pdf`);
    } catch (err) {
      console.error('Invoice error:', err);
      alert('Failed to generate invoice: ' + err.message);
    }
  };

  const labelMap = {
    dealer: { CREDIT_GIVEN: '💸 Credit Given', PAYMENT_RECEIVED: '✅ Payment Received' },
  };

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
        ← Back to Profiles
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* ─── Left: Profile Card ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Photo + Name */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
              <Avatar url={data.profilePicUrl} name={data.name} size={88} />
              <button type="button" onClick={() => picRef.current.click()} disabled={uploadingPic}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', border: '2px solid var(--bg)', background: 'var(--text-main)', color: 'var(--bg)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {uploadingPic ? '…' : '📷'}
              </button>
            </div>
            <input type="file" ref={picRef} style={{ display: 'none' }} accept="image/*" onChange={handleUploadPic} />
            <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>{data.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{type === 'dealer' ? 'Dealer' : 'Labour'}</p>
          </div>

          {/* Edit Info */}
          <div className="card">
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>Edit Info</h4>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Name</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Phone</label>
              <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            {type === 'labour' && (
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Monthly Salary (PKR)</label>
                <input type="number" className="mono" value={editForm.salary} onChange={e => setEditForm({ ...editForm, salary: Number(e.target.value) })} />
              </div>
            )}
            <button onClick={saveProfile} className="btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* Loan (Labour only) */}
          {type === 'labour' && (
            <div className="card">
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '12px' }}>Loan Tracker</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Outstanding:</span>
                <span className={`mono ${(data.loan || 0) > 0 ? 'text-red' : 'text-green'}`} style={{ fontWeight: 700, fontSize: '1.1rem' }}>PKR {(data.loan || 0).toLocaleString()}</span>
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Amount (PKR)</label>
                <input type="number" className="mono" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={handleAddLoan} className="btn-outline" style={{ flex: 1, fontSize: '0.82rem', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>+ Loan Given</button>
                <button type="button" onClick={handleRepayLoan} className="btn-outline" style={{ flex: 1, fontSize: '0.82rem' }}>- Repaid</button>
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: 0 }}>Documents</h4>
              <button type="button" onClick={() => docRef.current.click()} disabled={uploadingDoc} style={{ fontSize: '0.78rem', color: 'var(--text-main)', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px 10px', cursor: 'pointer' }}>
                {uploadingDoc ? 'Uploading…' : '+ Upload'}
              </button>
            </div>
            <input type="file" ref={docRef} style={{ display: 'none' }} accept="image/*,.pdf" onChange={handleUploadDoc} />
            {(!data.documents || data.documents.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '12px 0' }}>No documents attached.</p>
            ) : data.documents.map((doc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px', background: 'var(--bg)', borderRadius: '4px', fontSize: '0.8rem' }}>
                <a href={doc} target="_blank" rel="noreferrer" style={{ flex: 1, color: 'var(--text-main)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📎 Document {idx + 1}
                </a>
                <button onClick={() => handleRemoveDoc(idx)} style={{ color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', flexShrink: 0 }}>Remove</button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right: Ledger ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Balance / Stats */}
          {type === 'dealer' && (
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>CURRENT BALANCE</div>
                <div className={`mono ${(data.balance || 0) > 0 ? 'text-red' : 'text-green'}`} style={{ fontSize: '2rem', fontWeight: 700 }}>
                  PKR {(data.balance || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(data.balance || 0) > 0 ? 'Dealer owes us' : (data.balance || 0) < 0 ? 'We owe dealer' : 'Settled'}</div>
              </div>
              <button onClick={handleDownloadInvoice} className="btn-primary">Download Invoice PDF</button>
            </div>
          )}

          {/* Add Ledger Entry */}
          {type === 'dealer' && (
            <div className="card">
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>Add Ledger Entry</h4>
              <form onSubmit={handleAddLedgerEntry}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Date</label>
                    <input type="date" className="mono" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Type</label>
                    <select value={newEntry.type} onChange={e => setNewEntry({ ...newEntry, type: e.target.value })}>
                      <option value="CREDIT_GIVEN">💸 Credit Given (eggs sold)</option>
                      <option value="PAYMENT_RECEIVED">✅ Payment Received</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Description</label>
                    <input type="text" value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} required placeholder="e.g. 3 Paiti eggs, or Cash payment" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Amount (PKR)</label>
                    <input type="number" className="mono" value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: Number(e.target.value) })} required />
                  </div>
                </div>
                <button type="submit" className="btn-outline" style={{ marginTop: '8px' }}>Add Entry</button>
              </form>
            </div>
          )}

          {/* Egg Deliveries (Dealer only) */}
          {type === 'dealer' && (
            <div className="card">
              <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>Egg Deliveries</h4>
              {distributions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0', fontSize: '0.88rem' }}>No deliveries logged for this dealer yet.</p>
              ) : (
                <table style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Quantity</th>
                      <th>Rate/Paiti</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributions.map(d => (
                      <tr key={d._id} style={{ opacity: d.paid ? 0.6 : 1 }}>
                        <td className="mono">{formatDate(d.date)}</td>
                        <td>{d.paiti || 0} Paiti {d.trays > 0 ? `${d.trays} Trays` : ''}</td>
                        <td className="mono">PKR {(d.ratePerPaiti || d.ratePerTray * 12 || 0).toLocaleString()}/Paiti</td>
                        <td className="mono text-red" style={{ textAlign: 'right', fontWeight: 600, textDecoration: d.paid ? 'line-through' : 'none' }}>PKR {d.totalAmount?.toLocaleString()}</td>
                        <td>
                          {d.paid ? (
                            <button onClick={() => handleUndoPaid(d._id)} style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ Paid — Undo</button>
                          ) : (
                            <button onClick={() => handleMarkPaid(d._id)} style={{ fontSize: '0.75rem', padding: '3px 10px', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Mark Paid</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Ledger Log */}
          <div className="card">
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {type === 'dealer' ? 'Transaction History' : 'Loan History (Manual Log)'}
            </h4>

            {loadingLedger ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading…</p>
            ) : ledger.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: '0.9rem' }}>No entries yet.</p>
            ) : (
              <table style={{ fontSize: '0.88rem' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map(entry => (
                    <tr key={entry._id}>
                      <td className="mono">{formatDate(entry.date)}</td>
                      <td>{entry.description}</td>
                      <td>
                        {type === 'dealer' ? (
                          <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '20px', background: entry.type === 'PAYMENT_RECEIVED' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)', color: entry.type === 'PAYMENT_RECEIVED' ? 'var(--text-green, #16a34a)' : 'var(--accent-red)' }}>
                            {entry.type === 'CREDIT_GIVEN' ? 'Credit Given' : 'Payment Received'}
                          </span>
                        ) : entry.type}
                      </td>
                      <td className={`mono ${entry.type === 'PAYMENT_RECEIVED' ? 'text-green' : 'text-red'}`} style={{ textAlign: 'right', fontWeight: 600 }}>
                        {entry.type === 'PAYMENT_RECEIVED' ? '+' : '-'} PKR {entry.amount?.toLocaleString()}
                      </td>
                      <td>
                        <button onClick={() => handleDeleteLedger(entry._id)} style={{ color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
