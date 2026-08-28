import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  PlusCircle, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  XCircle, 
  Info, 
  ShieldAlert,
  Search,
  Edit3
} from 'lucide-react';
import { getUserMedications, listenUserMedications, saveUserMedication, deleteUserMedication } from '../services/dbService';

export default function ExpiryManagementPage({ user }) {
  const [subTab, setSubTab] = useState('all'); // all, upcoming, expired
  const [medications, setMedications] = useState({});
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New med form state
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once Daily');
  const [time, setTime] = useState('08:00 AM');
  const [expiryDate, setExpiryDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medicineType, setMedicineType] = useState('Tablet');

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const unsubscribe = listenUserMedications(user.uid, (data) => {
      setMedications(data || {});
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddMedication = async (e) => {
    e.preventDefault();
    if (!medName) return;

    console.log('[Expiry Management] Save started');
    console.log('[Expiry Management] Authenticated UID:', user?.uid);

    const medId = editMode && selectedMed?.id ? selectedMed.id : undefined;

    const newMed = {
      ...(medId ? { id: medId } : {}),
      name: medName,
      medicineName: medName,
      dosage,
      frequency,
      time,
      medicineType,
      type: medicineType,
      expiryDate: expiryDate || '2026-12-31',
      expDate: expiryDate || '2026-12-31',
      instructions: instructions || 'Take after food with full glass of water.',
      createdAt: selectedMed?.createdAt || new Date().toISOString()
    };

    setAddModalOpen(false);
    setEditMode(false);
    setSelectedMed(null);
    resetForm();

    try {
      const saved = await saveUserMedication(user?.uid, newMed);
      if (saved && saved.id) {
        setMedications(prev => ({
          ...(prev || {}),
          [saved.id]: saved
        }));
      }
    } catch (err) {
      console.error('[Expiry Management] Save failed:', err);
    }
  };

  const resetForm = () => {
    setMedName('');
    setDosage('');
    setFrequency('Once Daily');
    setTime('08:00 AM');
    setExpiryDate('');
    setInstructions('');
    setMedicineType('Tablet');
  };

  const openEditModal = (med, e) => {
    if (e) e.stopPropagation();
    setMedName(med.medicineName || med.name || '');
    setDosage(med.dosage || med.strength || '');
    setFrequency(med.frequency || 'Once Daily');
    setTime(med.time || '08:00 AM');
    setExpiryDate(med.expiryDate || med.expDate || '');
    setInstructions(med.instructions || med.notes || '');
    setMedicineType(med.medicineType || med.type || 'Tablet');
    setSelectedMed(med);
    setEditMode(true);
    setAddModalOpen(true);
  };

  const handleDeleteMed = async (medId) => {
    if (window.confirm('Are you sure you want to remove this medication record?')) {
      setMedications(prev => {
        const next = { ...prev };
        delete next[medId];
        return next;
      });
      setSelectedMed(null);
      await deleteUserMedication(user?.uid, medId);
      const updated = await getUserMedications(user?.uid);
      setMedications(updated);
    }
  };

  const medList = Object.values(medications || {});

  // Calculate Expiry Status
  const getExpiryStatus = (expDateStr) => {
    if (!expDateStr) return { status: 'NORMAL', label: 'Valid', color: 'badge-success' };
    const exp = new Date(expDateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'EXPIRED', label: 'EXPIRED', color: 'badge-danger' };
    } else if (diffDays <= 30) {
      return { status: 'UPCOMING', label: `Expires in ${diffDays} days`, color: 'badge-warning' };
    }
    return { status: 'NORMAL', label: 'Valid', color: 'badge-success' };
  };

  const filteredMeds = medList.filter(med => {
    const name = (med.medicineName || med.name || '').toLowerCase();
    const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
    const expiryInfo = getExpiryStatus(med.expiryDate || med.expDate);

    if (subTab === 'upcoming') return matchesSearch && expiryInfo.status === 'UPCOMING';
    if (subTab === 'expired') return matchesSearch && expiryInfo.status === 'EXPIRED';
    return matchesSearch;
  });

  const upcomingCount = medList.filter(m => getExpiryStatus(m.expiryDate || m.expDate).status === 'UPCOMING').length;
  const expiredCount = medList.filter(m => getExpiryStatus(m.expiryDate || m.expDate).status === 'EXPIRED').length;

  return (
    <div>
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>Medicine Expiry Management</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
            Track prescription shelf-life, active doses, and disposal guidelines
          </p>
        </div>

        <button onClick={() => { resetForm(); setEditMode(false); setSelectedMed(null); setAddModalOpen(true); }} className="btn btn-primary">
          <PlusCircle size={18} /> Add Manually
        </button>
      </div>

      {/* Summary Stat Row */}
      <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
            <Pill size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: '500' }}>Total Medicines</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>{medList.length}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--warning-bg)', color: '#92400e' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: '500' }}>Upcoming Expiry</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>{upcomingCount}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: '#991b1b' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: '500' }}>Expired Inventory</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>{expiredCount}</h3>
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setSubTab('all')}
            className={`btn ${subTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            All Medicines ({medList.length})
          </button>
          <button 
            onClick={() => setSubTab('upcoming')}
            className={`btn ${subTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <AlertTriangle size={16} color={subTab === 'upcoming' ? 'white' : '#f59e0b'} /> 
            Upcoming ({upcomingCount})
          </button>
          <button 
            onClick={() => setSubTab('expired')}
            className={`btn ${subTab === 'expired' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <ShieldAlert size={16} color={subTab === 'expired' ? 'white' : '#ef4444'} /> 
            Expired ({expiredCount})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', paddingRight: '12px' }}
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--slate-500)' }}>
          <Pill size={36} color="var(--primary)" style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>Loading medications from Firebase...</p>
        </div>
      )}

      {/* Medicines Grid */}
      {!loading && filteredMeds.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Pill size={48} color="var(--slate-300)" style={{ marginBottom: '12px' }} />
          <h3 style={{ color: 'var(--slate-700)', marginBottom: '4px' }}>No medications found</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
            {subTab === 'all' ? 'Log your first medication reminder using the button above.' : `No medications match the ${subTab} filter.`}
          </p>
          {subTab === 'all' && (
            <button onClick={() => { resetForm(); setAddModalOpen(true); }} className="btn btn-primary" style={{ marginTop: '16px' }}>
              <PlusCircle size={16} /> Add First Medicine
            </button>
          )}
        </div>
      ) : (
        !loading && (
          <div className="grid-cols-3">
            {filteredMeds.map((med) => {
              const expInfo = getExpiryStatus(med.expiryDate || med.expDate);
              return (
                <div 
                  key={med.id} 
                  className="card"
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: expInfo.status === 'EXPIRED' ? '4px solid #ef4444' : expInfo.status === 'UPCOMING' ? '4px solid #f59e0b' : '4px solid #10b981'
                  }}
                  onClick={() => setSelectedMed(med)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        background: expInfo.status === 'EXPIRED' ? 'var(--danger-bg)' : expInfo.status === 'UPCOMING' ? 'var(--warning-bg)' : 'var(--primary-light)',
                        color: expInfo.status === 'EXPIRED' ? '#991b1b' : expInfo.status === 'UPCOMING' ? '#92400e' : 'var(--primary-dark)'
                      }}>
                        <Pill size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem' }}>{med.medicineName || med.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{med.medicineType || med.type || 'Tablet'} • {med.dosage || med.strength || 'Prescription'}</p>
                      </div>
                    </div>
                    <span className={`badge ${expInfo.color}`}>{expInfo.label}</span>
                  </div>

                  <div style={{ fontSize: '0.825rem', color: 'var(--slate-600)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="var(--slate-400)" />
                      <span>Time: <strong>{med.time || '08:00 AM'}</strong> ({med.frequency || 'Daily'})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--slate-400)" />
                      <span>Expiry: <strong>{med.expiryDate || med.expDate || 'N/A'}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--slate-100)' }}>
                    <span style={{ fontSize: '0.775rem', color: 'var(--primary-dark)', fontWeight: '600' }}>View Details</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={(e) => openEditModal(med, e)}
                        style={{ background: 'none', color: 'var(--primary)', padding: '4px' }}
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMed(med.id);
                        }}
                        style={{ background: 'none', color: 'var(--slate-400)', padding: '4px' }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ADD / EDIT MEDICATION MODAL */}
      {addModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editMode ? <Edit3 color="var(--primary)" /> : <PlusCircle color="var(--primary)" />}
                {editMode ? 'Edit Expiry Record' : 'Add Expiry Record'}
              </h3>
              <button onClick={() => { setAddModalOpen(false); setEditMode(false); setSelectedMed(null); resetForm(); }} style={{ background: 'none', color: 'var(--slate-500)' }}>
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleAddMedication}>
              <div className="form-group">
                <label className="form-label">Medicine Name *</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  placeholder="e.g. Paracetamol, Metformin"
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Dosage / Strength</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. 500mg, 1 tablet"
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Medicine Type</label>
                  <select 
                    className="form-input"
                    value={medicineType}
                    onChange={e => setMedicineType(e.target.value)}
                  >
                    <option>Tablet</option>
                    <option>Capsule</option>
                    <option>Syrup</option>
                    <option>Injection</option>
                    <option>Cream/Ointment</option>
                    <option>Drops</option>
                    <option>Inhaler</option>
                  </select>
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select 
                    className="form-input"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                  >
                    <option>Once Daily</option>
                    <option>Twice Daily</option>
                    <option>Three Times Daily</option>
                    <option>Four Times Daily</option>
                    <option>As Needed (PRN)</option>
                    <option>Weekly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dose Schedule Time</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="08:00 AM"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expiration Date</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Special Instructions</label>
                <textarea 
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Take with food, avoid alcohol"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setAddModalOpen(false); setEditMode(false); setSelectedMed(null); resetForm(); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Update Medication' : 'Save Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEDICINE DETAIL MODAL */}
      {selectedMed && !addModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-md)' }}>
                  <Pill size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>{selectedMed.medicineName || selectedMed.name}</h3>
                  <span className="badge badge-primary">{selectedMed.dosage || 'Prescription'}</span>
                </div>
              </div>
              <button onClick={() => setSelectedMed(null)} style={{ background: 'none', color: 'var(--slate-500)' }}>
                <XCircle size={24} />
              </button>
            </div>

            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--slate-500)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Type</p>
                  <p style={{ fontSize: '0.9rem' }}>{selectedMed.medicineType || selectedMed.type || 'Tablet'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--slate-500)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Frequency</p>
                  <p style={{ fontSize: '0.9rem' }}>{selectedMed.frequency || 'Daily'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--slate-500)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Dose Time</p>
                  <p style={{ fontSize: '0.9rem' }}>{selectedMed.time || '08:00 AM'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--slate-500)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Expiry Date</p>
                  <p style={{ fontSize: '0.9rem', color: getExpiryStatus(selectedMed.expiryDate || selectedMed.expDate).status === 'EXPIRED' ? '#ef4444' : 'inherit' }}>
                    {selectedMed.expiryDate || selectedMed.expDate || 'N/A'}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--slate-200)' }}>
                <p style={{ fontSize: '0.775rem', color: 'var(--slate-500)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '2px' }}>Instructions</p>
                <p style={{ fontSize: '0.875rem' }}>{selectedMed.instructions || selectedMed.notes || 'Take as directed by healthcare provider.'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <button 
                onClick={() => handleDeleteMed(selectedMed.id)} 
                className="btn btn-danger"
              >
                <Trash2 size={16} /> Delete Medication
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => openEditModal(selectedMed)} className="btn btn-secondary">
                  <Edit3 size={16} /> Edit
                </button>
                <button onClick={() => setSelectedMed(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
