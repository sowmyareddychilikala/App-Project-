import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  Pill, 
  AlertOctagon, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  X,
  FileWarning
} from 'lucide-react';
import { 
  listenCommunityAlerts, 
  saveCommunityAlert, 
  listenSuspiciousMedicines, 
  saveSuspiciousMedicine, 
  listenMedicineRecalls,
  listenUserComplaints
} from '../services/dbService';

export default function CommunitySafetyNetworkPage({ user }) {
  // ONLY TWO MAIN TABS FOR WEB APPLICATION: 'medicines' | 'recalls'
  // (Map feature/tab is completely removed from the web module)
  const [activeTab, setActiveTab] = useState('medicines');
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [alerts, setAlerts] = useState({});
  const [suspiciousMeds, setSuspiciousMeds] = useState({});
  const [recalls, setRecalls] = useState({});
  const [userComplaints, setUserComplaints] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [riskFilter, setRiskFilter] = useState('All'); // All, High, Elevated, Low

  // Quick Report SOS Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Quick Report Form Fields
  const [reportTitle, setReportTitle] = useState('');
  const [targetName, setTargetName] = useState(''); // Medicine or Pharmacy name
  const [reportLocation, setReportLocation] = useState('North District');
  const [riskLevel, setRiskLevel] = useState('High');
  const [description, setDescription] = useState('');

  // Real-time Firebase listeners
  useEffect(() => {
    const unsubAlerts = listenCommunityAlerts((data) => {
      setAlerts(data || {});
      setLoading(false);
    });

    const unsubSuspicious = listenSuspiciousMedicines((data) => {
      setSuspiciousMeds(data || {});
      setLoading(false);
    });

    const unsubRecalls = listenMedicineRecalls((data) => {
      setRecalls(data || {});
      setLoading(false);
    });

    const unsubComplaints = listenUserComplaints(user?.uid, (data) => {
      setUserComplaints(data || {});
      setLoading(false);
    });

    return () => {
      if (typeof unsubAlerts === 'function') unsubAlerts();
      if (typeof unsubSuspicious === 'function') unsubSuspicious();
      if (typeof unsubRecalls === 'function') unsubRecalls();
      if (typeof unsubComplaints === 'function') unsubComplaints();
    };
  }, [user?.uid]);

  // Default Reference Alerts if database snapshot is initial
  const defaultAlerts = [
    {
      id: 'alert_1',
      title: 'Inconsistent Packaging & Seal Defect',
      riskLevel: 'High',
      medicineName: 'Amoxicillin 500mg',
      description: 'Reported batch #AX-2024 showing compromised seals and inconsistent typography in North District pharmacies.',
      location: 'North District',
      timestamp: new Date().toISOString()
    },
    {
      id: 'alert_2',
      title: 'Storage Temperature Violation',
      riskLevel: 'Elevated',
      medicineName: 'Insulin Glargine',
      description: 'Temperature control failure detected during transit to Central Pharmacy. Potential potency degradation.',
      location: 'Central District',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  ];

  const defaultRecalls = [
    {
      id: 'recall_1',
      title: 'Valsartan 80mg Tablets',
      manufacturer: 'GenMed Pharmaceuticals',
      batchNumbers: 'GN-2023-X9, GN-2023-Y1',
      reason: 'Trace Contamination Detected',
      severity: 'Critical',
      actionRequired: 'Stop use immediately and return to any certified pharmacy for immediate replacement.'
    },
    {
      id: 'recall_2',
      title: 'Junior Relief Oral Syrup',
      manufacturer: 'BrightCure Labs',
      batchNumbers: 'BC-552, BC-553',
      reason: 'Packaging Cap Defect',
      severity: 'Elevated',
      actionRequired: 'Inspect child-resistant seal. If loose or damaged, return to dispensing clinic.'
    }
  ];

  // Process data lists
  const alertsList = Object.keys(alerts).length > 0 ? Object.values(alerts) : defaultAlerts;
  const suspiciousList = Object.values(suspiciousMeds || {});
  const recallsList = Object.keys(recalls).length > 0 ? Object.values(recalls) : defaultRecalls;

  const userComplaintsList = Object.values(userComplaints || {}).map(c => ({
    id: c.id || `complaint_${Date.now()}`,
    title: `Pharmacy Safety Complaint: ${c.pharmacyName || c.name || 'Local Pharmacy'}`,
    medicineName: c.pharmacyName || c.name || 'Pharmacy Safety Notice',
    location: c.location || 'Local District',
    riskLevel: 'High',
    description: `${c.issueType || 'Urgent Complaint'}: ${c.details || c.description || 'User complaint filed regarding pharmacy compliance and safety.'}`,
    timestamp: c.createdAt || c.timestamp || new Date().toISOString()
  }));

  // Combine Quick Reports, Pharmacy Complaints & Alerts into the MEDICINES Section List
  const medicinesSectionFeed = [
    ...userComplaintsList,
    ...alertsList,
    ...suspiciousList.map(s => ({
      id: s.id || `susp_${Date.now()}`,
      title: s.suspicion || s.name || 'Suspicious Product Alert',
      medicineName: s.name || s.medicineName || 'Medicine / Pharmacy Safety Notice',
      location: s.location || 'Local Community',
      riskLevel: s.status === 'Urgent' ? 'High' : 'Elevated',
      description: s.suspicion || s.description || 'Reported anomaly requiring safety inspection.',
      timestamp: s.timestamp || new Date().toISOString()
    }))
  ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  // Filters for Medicines Section
  const filteredMedicines = medicinesSectionFeed.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.medicineName && item.medicineName.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q))
    );
    const matchesRisk = riskFilter === 'All' || item.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  // Filters for Recalls Section
  const filteredRecalls = recallsList.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    return !q || (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(q)) ||
      (item.reason && item.reason.toLowerCase().includes(q)) ||
      (item.batchNumbers && item.batchNumbers.toLowerCase().includes(q))
    );
  });

  // Handle Quick Report SOS Submit
  const handleQuickReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportTitle.trim() || !targetName.trim() || !description.trim()) {
      setSubmitError('Please fill in all required fields (Title, Medicine/Pharmacy Name, Description).');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const alertPayload = {
        title: reportTitle.trim(),
        medicineName: targetName.trim(),
        targetName: targetName.trim(),
        location: reportLocation,
        riskLevel: riskLevel,
        description: description.trim(),
        reportedBy: user?.email ? user.email.split('@')[0] : 'Community Reporter',
        timestamp: new Date().toISOString()
      };

      // Genuinely save Quick Report to existing backend database (communityAlerts node)
      const savedAlert = await saveCommunityAlert(alertPayload);
      
      // Also save to suspiciousMedicines node for dual compatibility
      const savedSusp = await saveSuspiciousMedicine({
        name: targetName.trim(),
        suspicion: `${reportTitle.trim()} - ${description.trim()}`,
        location: reportLocation,
        status: riskLevel === 'High' ? 'Urgent' : 'Active',
        timestamp: new Date().toISOString()
      });

      // Immediately update local React state so report renders instantly in MEDICINES section
      if (savedAlert && savedAlert.id) {
        setAlerts(prev => ({ ...(prev || {}), [savedAlert.id]: savedAlert }));
      }
      if (savedSusp && savedSusp.id) {
        setSuspiciousMeds(prev => ({ ...(prev || {}), [savedSusp.id]: savedSusp }));
      }

      setSubmitting(false);
      setSubmitSuccess(true);

      // Clear Form
      setReportTitle('');
      setTargetName('');
      setDescription('');
      setRiskLevel('High');
      setReportLocation('North District');
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit safety quick report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        color: 'white',
        boxShadow: '0 8px 24px rgba(30, 27, 75, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldAlert size={28} color="#a5b4fc" />
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'white' }}>
                Community Safety Network
              </h1>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '640px' }}>
              Surveillance portal for pharmaceutical safety alerts, counterfeit medicine reporting, and official product recalls.
            </p>
          </div>

          {/* Quick Report SOS Action Button */}
          {activeTab === 'medicines' && (
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setSubmitError('');
                setModalVisible(true);
              }}
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '12px 22px',
                borderRadius: 'var(--radius-md)',
                fontWeight: '700',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
              }}
            >
              <Plus size={18} color="white" />
              Quick Report
            </button>
          )}
        </div>
      </div>

      {/* Main Module Tabs Navigation: ONLY TWO TABS (MEDICINES | RECALLS) */}
      <div className="card" style={{ padding: '8px', display: 'flex', gap: '8px', background: 'var(--surface-container-low)' }}>
        <button
          onClick={() => setActiveTab('medicines')}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'medicines' ? '#003d9b' : 'transparent',
            color: activeTab === 'medicines' ? 'white' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Pill size={20} />
          MEDICINES ({medicinesSectionFeed.length})
        </button>

        <button
          onClick={() => setActiveTab('recalls')}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: activeTab === 'recalls' ? '#003d9b' : 'transparent',
            color: activeTab === 'recalls' ? 'white' : 'var(--text-secondary)',
            fontWeight: '700',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <AlertOctagon size={20} />
          RECALLS ({recallsList.length})
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: MEDICINES SECTION                         */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'medicines' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search & Risk Level Filter Controls */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
                <input
                  type="text"
                  placeholder="Search safety network by medicine name, pharmacy, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 42px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--outline-variant)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Risk Filter:</span>
                {['All', 'High', 'Elevated', 'Low'].map(level => (
                  <button
                    key={level}
                    onClick={() => setRiskFilter(level)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: riskFilter === level ? '#003d9b' : 'var(--outline-variant)',
                      background: riskFilter === level ? '#003d9b' : 'transparent',
                      color: riskFilter === level ? 'white' : 'var(--text-secondary)',
                      fontWeight: riskFilter === level ? '700' : '500',
                      fontSize: '0.825rem',
                      cursor: 'pointer'
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Medicines & Quick Reports List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <RefreshCw className="spin" size={24} style={{ marginBottom: '8px' }} />
                <p>Loading safety network reports...</p>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <ShieldAlert size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>No Safety Alerts Logged</h3>
                <p style={{ fontSize: '0.9rem' }}>Use Quick Report to submit safety notices regarding medicines or local pharmacies.</p>
              </div>
            ) : (
              filteredMedicines.map((item) => (
                <div key={item.id} className="card" style={{ padding: '24px', borderLeft: item.riskLevel === 'High' ? '4px solid #dc2626' : '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          background: item.riskLevel === 'High' ? '#fee2e2' : '#fef3c7',
                          color: item.riskLevel === 'High' ? '#991b1b' : '#92400e',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          textTransform: 'uppercase'
                        }}>
                          {item.riskLevel || 'High'} Risk Alert
                        </span>
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(item.timestamp || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)', margin: '4px 0' }}>
                        {item.title}
                      </h3>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#003d9b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Pill size={15} /> {item.medicineName}
                      </div>
                    </div>

                    {item.location && (
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', background: 'var(--surface-container)', padding: '4px 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {item.location}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '0.925rem', color: 'var(--text)', lineHeight: '1.5' }}>
                    {item.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: RECALLS SECTION                           */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'recalls' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search Controls */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
              <input
                type="text"
                placeholder="Search recall alerts by product title, manufacturer, or batch numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--outline-variant)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Recalls List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredRecalls.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <AlertOctagon size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>
                  No medicine recall alerts reported.
                </h3>
                <p style={{ fontSize: '0.9rem' }}>All monitored pharmaceutical batches are verified clean and compliant.</p>
              </div>
            ) : (
              filteredRecalls.map((recall) => (
                <div key={recall.id} className="card" style={{ padding: '24px', borderLeft: '4px solid #b91c1c' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <span style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        textTransform: 'uppercase'
                      }}>
                        {recall.severity || 'Critical'} Recall Alert
                      </span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)', margin: '6px 0 2px 0' }}>
                        {recall.title}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        Manufacturer: <strong style={{ color: 'var(--text)' }}>{recall.manufacturer}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-container-low)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: '700', color: '#b91c1c', marginBottom: '4px' }}>
                      Affected Batch Numbers: {recall.batchNumbers}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                      <strong>Reason for Recall:</strong> {recall.reason}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: '1.5' }}>
                    <strong>Action Required:</strong> {recall.actionRequired}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* QUICK REPORT SOS MODAL FOR COMMUNITY SAFETY NETWORK  */}
      {/* ---------------------------------------------------- */}
      {modalVisible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 15, 45, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            {/* Modal Header */}
            <div style={{ background: '#dc2626', color: 'white', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={22} color="white" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Quick Report - Safety Alert</h3>
              </div>
              <button
                onClick={() => setModalVisible(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {submitSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={54} color="#16a34a" style={{ marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>
                    Quick Report Submitted!
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Your report has been saved permanently and is now active inside the MEDICINES section of the Community Safety Network.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setModalVisible(false);
                    }}
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQuickReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {submitError && (
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                      Report Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Broken Seal / Counterfeit Packaging Anomaly"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                      Medicine or Pharmacy Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin 500mg OR City Care Pharmacy"
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                        District / Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. North District"
                        value={reportLocation}
                        onChange={(e) => setReportLocation(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                        Risk Level
                      </label>
                      <select
                        value={riskLevel}
                        onChange={(e) => setRiskLevel(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                      >
                        <option value="High">High</option>
                        <option value="Elevated">Elevated</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                      Detailed Report Description *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Provide specific details about batch numbers, package appearance, pharmacy address, or observed defects..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setModalVisible(false)}
                      style={{ padding: '10px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline)', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: '#dc2626',
                        color: 'white',
                        fontWeight: '700',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.7 : 1
                      }}
                    >
                      {submitting ? 'Saving Report...' : 'Submit Quick Report'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
