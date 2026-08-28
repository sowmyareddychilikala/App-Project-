import React, { useState } from 'react';
import { 
  Search, 
  Pill, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { searchMedicines } from '../services/medicineService';

export default function MedicineInformationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [selectedMed, setSelectedMed] = useState(null);
  const [detailTab, setDetailTab] = useState('overview'); // overview, dosage, precautions

  const categories = ['ALL', 'Pain Relief', 'Antibiotics', 'Allergy', 'Diabetes', 'Cardiovascular'];
  const results = searchMedicines(searchQuery, category);

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>Clinical Medicine Information Portal</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
          Verified pharmaceutical knowledge database, dosage tables, safety precautions, and drug warnings
        </p>
      </div>

      {/* Search & Category Filter Header */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={20} color="var(--slate-400)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            className="form-input"
            style={{ paddingLeft: '48px', fontSize: '1rem', height: '48px' }}
            placeholder="Search medicine by brand name, generic name, or condition (e.g. Paracetamol, Strep throat)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`btn ${category === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.825rem', borderRadius: 'var(--radius-full)' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Data Separation Notice */}
      <div style={{ padding: '10px 16px', background: 'var(--secondary-light)', border: '1px solid var(--secondary)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '0.825rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Info size={16} />
        <span>Searching medicine information is strictly informational. It will not alter or add to your medication schedule.</span>
      </div>

      {/* Results Grid */}
      <div className="grid-cols-3">
        {results.map((med) => (
          <div 
            key={med.id} 
            className="card"
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            onClick={() => {
              setSelectedMed(med);
              setDetailTab('overview');
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--slate-900)' }}>{med.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{med.genericName}</p>
                </div>
                <span className={`badge ${med.tag === 'IN STOCK' ? 'badge-success' : 'badge-primary'}`}>
                  {med.tag}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '14px', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {med.desc}
              </p>

              <div style={{ background: 'var(--slate-50)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--slate-700)', marginBottom: '14px' }}>
                <strong>Strength:</strong> {med.strength} • <strong>Category:</strong> {med.category}
              </div>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', padding: '8px', fontSize: '0.825rem' }}>
              View Clinical Overview
            </button>
          </div>
        ))}
      </div>

      {/* MEDICINE DETAIL MODAL */}
      {selectedMed && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '750px' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-lg)' }}>
                  <Pill size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem' }}>{selectedMed.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>{selectedMed.genericName} • {selectedMed.manufacturer}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMed(null)} style={{ background: 'none', color: 'var(--slate-500)' }}>
                <XCircle size={24} />
              </button>
            </div>

            {/* Navigation Tabs in Modal */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--slate-200)', marginBottom: '18px', paddingBottom: '8px' }}>
              <button 
                onClick={() => setDetailTab('overview')}
                className={`btn ${detailTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.825rem' }}
              >
                Overview & Indications
              </button>
              <button 
                onClick={() => setDetailTab('dosage')}
                className={`btn ${detailTab === 'dosage' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.825rem' }}
              >
                Usage & Dosage
              </button>
              <button 
                onClick={() => setDetailTab('precautions')}
                className={`btn ${detailTab === 'precautions' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.825rem' }}
              >
                Precautions & Warnings
              </button>
            </div>

            {/* TAB CONTENT */}
            {detailTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '4px', color: 'var(--slate-800)' }}>Purpose & Description</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>{selectedMed.purpose}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '4px', color: 'var(--slate-800)' }}>Indications & Conditions Treated</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>{selectedMed.conditions}</p>
                </div>
                <div style={{ background: 'var(--slate-50)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>Storage Requirements</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--slate-600)' }}>{selectedMed.storage}</p>
                </div>
              </div>
            )}

            {detailTab === 'dosage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '6px' }}>Recommended Dosage Guidelines</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>{selectedMed.usage}</p>
                </div>

                <div style={{ background: 'var(--slate-50)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Dosing by Age Group</h4>
                  {selectedMed.dosageTable.map((row, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--slate-200)', fontSize: '0.825rem' }}>
                      <strong>{row.group}</strong>
                      <span style={{ color: 'var(--slate-600)' }}>{row.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailTab === 'precautions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedMed.criticalWarnings?.map((warn, idx) => (
                  <div key={idx} style={{ background: 'var(--danger-bg)', borderLeft: '4px solid var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ color: '#991b1b', fontSize: '0.9rem' }}>⚠️ {warn.title}</h4>
                    <p style={{ fontSize: '0.825rem', color: '#7f1d1d', marginTop: '2px' }}>{warn.desc}</p>
                  </div>
                ))}

                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>Side Effects Profile</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                    <strong>Common:</strong> {selectedMed.sideEffectsCommon?.join(', ')}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '4px' }}>
                    <strong>Serious:</strong> {selectedMed.sideEffectsSerious?.join(', ')}
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--slate-200)' }}>
              <button onClick={() => setSelectedMed(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
