import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Clock, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  FileText,
  User,
  Settings as SettingsIcon,
  X,
  Edit2,
  Trash2,
  Check,
  Shield,
  Info,
  LogOut,
  Moon,
  Sun,
  Lock,
  ExternalLink
} from 'lucide-react';
import { 
  listenUserProfile,
  listenUserMedications, 
  saveUserMedication,
  toggleMedicationTakenState, 
  deleteUserMedication,
  updateUserProfileFields,
  updateUserPreferences,
  getLocalUserProfile,
  getLocalMedications
} from '../services/dbService';

const getLiveSuggestions = (query) => {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const catalog = [
    'Lisinopril 10mg',
    'Amoxicillin 500mg',
    'Metformin 500mg',
    'Atorvastatin 20mg',
    'Omeprazole 20mg',
    'Albuterol Inhaler',
    'Ibuprofen 400mg',
    'Paracetamol 500mg',
    'Gabapentin 300mg',
    'Amlodipine 5mg'
  ];
  return catalog.filter(item => item.toLowerCase().includes(q)).slice(0, 4);
};

export default function DashboardPage({ user, setActiveTab: setParentActiveTab, onLogout }) {
  // 3 Sub Tabs: 'dashboard', 'profile', 'settings' (Notifications removed to match mobile)
  const [activeSubTab, setActiveSubTab] = useState('dashboard');

  // Shared state
  const [profile, setProfile] = useState(null);
  const [medications, setMedications] = useState({});

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Add / Edit Medication Modal states
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [editingMedId, setEditingMedId] = useState(null);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedType, setNewMedType] = useState('Tablet');
  const [newMedTime, setNewMedTime] = useState('09:00 AM');
  const [newMedFrequency, setNewMedFrequency] = useState('Once daily');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedStartDate, setNewMedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newMedEndDate, setNewMedEndDate] = useState('2099-12-31');

  // Profile Edit Modal states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editBloodType, setEditBloodType] = useState('');
  const [editAllergies, setEditAllergies] = useState('');

  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  useEffect(() => {
    const activeUid = user?.uid || 'guest_user';

    // 0ms instant cached load
    getLocalUserProfile(activeUid).then(cachedProf => {
      if (cachedProf) {
        setProfile(cachedProf);
        setEditName(cachedProf.fullName || '');
        setEditDob(cachedProf.dob || '');
        setEditBloodType(cachedProf.bloodType || '');
        setEditAllergies(Array.isArray(cachedProf.allergies) ? cachedProf.allergies.join(', ') : (cachedProf.allergies || ''));
        if (cachedProf.preferences) {
          if (typeof cachedProf.preferences.notificationsEnabled === 'boolean') setNotificationsEnabled(cachedProf.preferences.notificationsEnabled);
          if (typeof cachedProf.preferences.darkMode === 'boolean') setIsDarkMode(cachedProf.preferences.darkMode);
        }
      }
    });

    getLocalMedications(activeUid).then(cachedMeds => {
      if (cachedMeds) setMedications(cachedMeds);
    });

    // Real-time Firebase listeners
    const unsubProfile = listenUserProfile(activeUid, (data) => {
      if (data && Object.keys(data).length > 0) {
        setProfile(data);
        setEditName(data.fullName || '');
        setEditDob(data.dob || '');
        setEditBloodType(data.bloodType || '');
        setEditAllergies(Array.isArray(data.allergies) ? data.allergies.join(', ') : (data.allergies || ''));
        if (data.preferences) {
          if (typeof data.preferences.notificationsEnabled === 'boolean') setNotificationsEnabled(data.preferences.notificationsEnabled);
          if (typeof data.preferences.darkMode === 'boolean') setIsDarkMode(data.preferences.darkMode);
        }
      }
    });

    const unsubMeds = listenUserMedications(activeUid, (data) => {
      setMedications(data || {});
    });

    return () => {
      if (typeof unsubProfile === 'function') unsubProfile();
      if (typeof unsubMeds === 'function') unsubMeds();
    };
  }, [user]);

  // Handle Search Input & Suggestions
  const handleQueryChange = (text) => {
    setSearchQuery(text);
    setSuggestions(getLiveSuggestions(text));
  };

  const handleSearchSubmit = (qToRun) => {
    const q = (qToRun || searchQuery).trim();
    if (q) {
      setParentActiveTab('search');
    } else {
      setParentActiveTab('search');
    }
  };

  // Toggle dose taken state
  const handleToggleTaken = async (medId, currentState, scheduledTime) => {
    const nextState = !currentState;
    const todayIso = new Date().toISOString().split('T')[0];
    const now = new Date();
    const formattedTime = nextState ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const timeKey = scheduledTime || '09:00 AM';

    // Optimistic UI update
    setMedications(prev => {
      const item = prev[medId] || {};
      const existingLogs = item.takenLogs || {};
      const dayLog = existingLogs[todayIso] || {};
      return {
        ...prev,
        [medId]: {
          ...item,
          taken: nextState,
          takenStatus: nextState,
          takenTime: formattedTime,
          takenLogs: {
            ...existingLogs,
            [todayIso]: { ...dayLog, [timeKey]: { taken: nextState, takenTime: formattedTime } }
          }
        }
      };
    });

    try {
      await toggleMedicationTakenState(user?.uid, medId, nextState, todayIso, timeKey);
    } catch (e) {}
  };

  // Add / Edit Medication submit
  const resetAddMedForm = () => {
    setEditingMedId(null);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedType('Tablet');
    setNewMedTime('09:00 AM');
    setNewMedFrequency('Once daily');
    setNewMedInstructions('');
    setNewMedStartDate(new Date().toISOString().split('T')[0]);
    setNewMedEndDate('2099-12-31');
  };

  const handleOpenEditMed = (med) => {
    if (!med) return;
    setEditingMedId(med.id);
    setNewMedName(med.medicineName || med.name || '');
    setNewMedDosage(med.dosage || med.strength || '');
    setNewMedType(med.medicineType || med.type || 'Tablet');
    setNewMedTime(med.time || '09:00 AM');
    setNewMedFrequency(med.frequency || 'Once daily');
    setNewMedInstructions(med.instructions || '');
    setNewMedStartDate(med.startDate || new Date().toISOString().split('T')[0]);
    setNewMedEndDate(med.endDate || '2099-12-31');
    setIsAddingMed(true);
  };

  const handleSaveMedication = async () => {
    if (!newMedName.trim() || !newMedDosage.trim()) {
      alert('Please enter medication name and dosage.');
      return;
    }

    const medData = {
      ...(editingMedId ? { id: editingMedId } : {}),
      medicineName: newMedName.trim(),
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      medicineType: newMedType,
      type: newMedType,
      time: newMedTime,
      frequency: newMedFrequency,
      instructions: newMedInstructions.trim() || 'Take as directed',
      startDate: newMedStartDate,
      endDate: newMedEndDate
    };

    setIsAddingMed(false);
    resetAddMedForm();

    try {
      const saved = await saveUserMedication(user?.uid, medData);
      
      // Update local React state IMMEDIATELY so medication renders in Upcoming Doses instantly
      if (saved && saved.id) {
        setMedications(prev => ({
          ...(prev || {}),
          [saved.id]: saved
        }));
      }
    } catch (err) {
      console.error('[Medication] Save error:', err);
    }
  };

  const handleDeleteMedication = async (medId, medName) => {
    if (window.confirm(`Are you sure you want to delete ${medName || 'this medication'}?`)) {
      setMedications(prev => {
        const next = { ...prev };
        delete next[medId];
        return next;
      });
      await deleteUserMedication(user?.uid, medId);
      const updatedRecords = await getUserMedications(user?.uid);
      setMedications(updatedRecords);
      console.log('[Medication] UI updated after delete');
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      alert('Name field cannot be left blank.');
      return;
    }

    const allergiesArray = editAllergies
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const updatedFields = {
      fullName: editName.trim(),
      dob: editDob.trim(),
      bloodType: editBloodType.trim(),
      allergies: allergiesArray
    };

    setProfile(prev => ({ ...prev, ...updatedFields }));
    setIsEditingProfile(false);
    await updateUserProfileFields(user?.uid, updatedFields);
  };

  // Settings Handlers
  const handleToggleNotifications = async () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    await updateUserPreferences(user?.uid, { notificationsEnabled: nextVal });
  };

  const handleToggleDarkMode = async () => {
    const nextVal = !isDarkMode;
    setIsDarkMode(nextVal);
    if (nextVal) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    await updateUserPreferences(user?.uid, { darkMode: nextVal });
  };

  // Dynamic calculations
  const medsList = Object.values(medications || {}).filter(m => {
    if (!m) return false;
    const name = (m.medicineName || m.name || '').trim();
    return !!name;
  });

  const remainingDoses = medsList.filter(m => !(m.taken || m.takenStatus)).length;

  return (
    <div>
      {/* Sub-Tab Navigation Header matching Mobile */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--outline-variant)',
        paddingBottom: '12px'
      }}>
        <button 
          onClick={() => setActiveSubTab('dashboard')}
          className={`filter-pill ${activeSubTab === 'dashboard' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontSize: '0.9rem' }}
        >
          <Pill size={18} /> Dashboard Home
        </button>
        <button 
          onClick={() => setActiveSubTab('profile')}
          className={`filter-pill ${activeSubTab === 'profile' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontSize: '0.9rem' }}
        >
          <User size={18} /> Profile Details
        </button>
        <button 
          onClick={() => setActiveSubTab('settings')}
          className={`filter-pill ${activeSubTab === 'settings' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontSize: '0.9rem' }}
        >
          <SettingsIcon size={18} /> Settings
        </button>
      </div>

      {/* -------------------------------------------------------------
          SUB-TAB 1: DASHBOARD HOME
          ------------------------------------------------------------- */}
      {activeSubTab === 'dashboard' && (
        <div>
          {/* Welcome Greeting Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #003d9b 0%, #001848 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 32px',
            color: 'white',
            marginBottom: '24px',
            boxShadow: '0 10px 25px rgba(0, 61, 155, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white', marginBottom: '4px' }}>
                Hello, {profile?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
                {remainingDoses === 0 
                  ? "All caught up for today! Outstanding work."
                  : `You have ${remainingDoses} dose${remainingDoses > 1 ? 's' : ''} remaining for today.`
                }
              </p>
            </div>
            <button 
              onClick={() => setActiveSubTab('profile')}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.4)'
              }}
            >
              {(profile?.fullName?.[0] || 'P').toUpperCase()}
            </button>
          </div>

          {/* Search Bar Entry Point */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={20} color="var(--primary)" style={{ position: 'absolute', left: '16px' }} />
              <input 
                type="text"
                className="form-input"
                style={{ paddingLeft: '48px', paddingRight: '40px', height: '48px', borderRadius: 'var(--radius-lg)', fontSize: '0.95rem' }}
                placeholder="Search medicine, usage, precautions..."
                value={searchQuery}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit(); }}
              />
              {searchQuery && (
                <X size={18} color="var(--outline)" style={{ position: 'absolute', right: '16px', cursor: 'pointer' }} onClick={() => handleQueryChange('')} />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="card" style={{ position: 'absolute', top: '54px', left: 0, right: 0, zIndex: 20, padding: '12px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Suggestions</p>
                {suggestions.map((sug, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSearchSubmit(sug)}
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Search size={16} color="var(--primary)" />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{sug}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Button: Add Med */}
          <div style={{ marginBottom: '24px' }}>
            <button 
              onClick={() => { resetAddMedForm(); setIsAddingMed(true); }}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem', borderRadius: 'var(--radius-lg)' }}
            >
              <PlusCircle size={20} /> Add Medication
            </button>
          </div>

          {/* Verified Pharmacy Network Bento Card */}
          <div className="bento-banner" onClick={() => setParentActiveTab('trust')} style={{ cursor: 'pointer' }}>
            <div>
              <span className="bento-badge">Verified Networks</span>
              <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '6px' }}>Verify Local Pharmacies</h3>
              <p style={{ opacity: 0.9, fontSize: '0.875rem', maxWidth: '540px' }}>
                Search certified distributors, inspect AI trust ratings, and audit safety logs.
              </p>
              <div className="bento-btn">
                <ShieldCheck size={16} /> Launch Portal
              </div>
            </div>
            <Shield size={100} style={{ opacity: 0.15, transform: 'rotate(15deg)' }} />
          </div>

          {/* Upcoming Doses Timeline */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Upcoming Doses</h3>

            {medsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)' }}>
                <Pill size={36} color="var(--outline-variant)" style={{ marginBottom: '10px' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No medications added yet.</p>
                <button 
                  onClick={() => { resetAddMedForm(); setIsAddingMed(true); }} 
                  className="btn btn-primary"
                  style={{ marginTop: '12px', fontSize: '0.85rem' }}
                >
                  Add Medication Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {medsList.map((med) => {
                  const isTaken = !!(med.taken || med.takenStatus);
                  const medName = med.medicineName || med.name || 'Medication';
                  const medType = med.medicineType || med.type || '';
                  const displayTime = med.time || '09:00 AM';

                  return (
                    <div 
                      key={med.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-lg)',
                        border: isTaken ? '1px solid #a7f3d0' : '1px solid var(--outline-variant)',
                        background: isTaken ? '#f0fdf4' : '#ffffff',
                        opacity: isTaken ? 0.85 : 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          minWidth: '60px',
                          textAlign: 'center',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-container-low)',
                          fontWeight: '700',
                          color: 'var(--text)'
                        }}>
                          {displayTime}
                        </div>

                        <div style={{ width: '4px', height: '36px', borderRadius: '2px', background: isTaken ? 'var(--secondary)' : 'var(--primary)' }} />

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '1rem', textDecoration: isTaken ? 'line-through' : 'none' }}>{medName} {medType ? `(${medType})` : ''}</h4>
                            <span className="badge badge-primary">{med.dosage || 'Standard Dose'}</span>
                          </div>
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {med.frequency || 'Once daily'} • {med.instructions || 'No special instructions'}
                          </p>
                          {isTaken && med.takenTime && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700' }}>
                              Taken at {med.takenTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                          onClick={() => handleOpenEditMed(med)}
                          style={{ padding: '8px', background: 'none', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}
                          title="Edit Medication"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteMedication(med.id, medName)}
                          style={{ padding: '8px', background: 'none', color: 'var(--error)', borderRadius: 'var(--radius-sm)' }}
                          title="Delete Medication"
                        >
                          <Trash2 size={18} />
                        </button>

                        <button 
                          onClick={() => handleToggleTaken(med.id, isTaken, med.time)}
                          className={`btn ${isTaken ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                          {isTaken ? <Check size={18} color="var(--secondary)" /> : <Check size={18} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Module Nav Cards */}
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>MediGuard AI Community Services</h3>
          <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
            <div className="card" onClick={() => setParentActiveTab('expiry')} style={{ cursor: 'pointer' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Pill size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Expiry Management</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Register and trace clinical expiration alerts automatically.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '700' }}>
                Open Cabinet <ArrowRight size={14} />
              </div>
            </div>

            <div className="card" onClick={() => setParentActiveTab('community')} style={{ cursor: 'pointer' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <FileText size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Community Safety Feed</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Read patient reviews, side effect logs, and verified guidelines.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '700' }}>
                View Feed <ArrowRight size={14} />
              </div>
            </div>

            <div className="card" onClick={() => setParentActiveTab('safety')} style={{ cursor: 'pointer' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <ShieldAlert size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Community Safety Network</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Inspect live safety maps, active alerts, and recall notices in real time.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '700' }}>
                Inspect Map <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 2: PROFILE DETAILS (Opens Immediately - 0ms)
          ------------------------------------------------------------- */}
      {activeSubTab === 'profile' && (
        <div>
          {/* Profile Card Header */}
          <div className="card" style={{ marginBottom: '24px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {(profile?.fullName?.[0] || user?.displayName?.[0] || user?.email?.[0] || 'P').toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{profile?.fullName || user?.displayName || 'Clinical User'}</h2>
                  <span className="badge badge-success">
                    HEALTH ID: {user?.uid ? `MV-${user.uid.substring(0, 6).toUpperCase()}` : 'MV-8829-XP'}
                  </span>
                </div>
              </div>

              <button onClick={() => setIsEditingProfile(true)} className="btn btn-secondary">
                <Edit2 size={16} /> Edit Profile
              </button>
            </div>
          </div>

          {/* Personal Information Grid */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Personal Information</h3>
            
            <div className="grid-cols-2" style={{ gap: '20px', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Full Name</p>
                <p style={{ fontSize: '1rem', fontWeight: '700' }}>{profile?.fullName || user?.displayName || 'Clinical User'}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Date of Birth</p>
                <p style={{ fontSize: '1rem', fontWeight: '700' }}>{profile?.dob || 'Not provided'}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Blood Type</p>
                <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--error)' }}>{profile?.bloodType || 'Not provided'}</p>
              </div>

              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Account Status</p>
                <p style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--secondary)' }}>Verified Patient</p>
              </div>
            </div>

            {/* Allergies list */}
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '8px' }}>Allergies & Sensitivities</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(Array.isArray(profile?.allergies) ? profile.allergies : (profile?.allergies ? profile.allergies.split(',') : [])).map((allg, idx) => (
                  <span key={idx} className="badge badge-danger" style={{ textTransform: 'none', fontSize: '0.85rem' }}>
                    ⚠️ {typeof allg === 'string' ? allg.trim() : allg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="card">
            <button onClick={onLogout} className="btn btn-danger" style={{ width: '100%', padding: '12px' }}>
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB 3: SETTINGS (Opens Immediately - 0ms)
          ------------------------------------------------------------- */}
      {activeSubTab === 'settings' && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>App Preferences & Settings</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--outline-variant)' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem' }}>Dark Mode</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Toggle theme contrast</p>
              </div>
              <button onClick={handleToggleDarkMode} className="btn btn-secondary">
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--outline-variant)' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem' }}>Privacy Policy</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Data protection & HIPAA rights</p>
              </div>
              <button onClick={() => setIsPrivacyModalOpen(true)} className="btn btn-secondary">
                View Policy
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem' }}>About MediTrust</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Version 2.4.0 Clinical Release</p>
              </div>
              <button onClick={() => setIsAboutModalOpen(true)} className="btn btn-secondary">
                About System
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODALS
          ------------------------------------------------------------- */}

      {/* 1. Add / Edit Medication Modal */}
      {isAddingMed && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>{editingMedId ? 'Edit Medication' : 'Add Medication'}</h3>
              <button onClick={() => { resetAddMedForm(); setIsAddingMed(false); }} style={{ background: 'none' }}><X size={20} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Medication Name</label>
              <input type="text" className="form-input" placeholder="e.g. Lisinopril" value={newMedName} onChange={e => setNewMedName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Dosage Amount</label>
              <input type="text" className="form-input" placeholder="e.g. 10mg / 1 Capsule" value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Medicine Type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Tablet', 'Capsule', 'Syrup', 'Injection'].map(t => (
                  <button key={t} type="button" onClick={() => setNewMedType(t)} className={`filter-pill ${newMedType === t ? 'active' : ''}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Schedule Time</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['08:00 AM', '09:00 AM', '02:00 PM', '09:00 PM'].map(t => (
                  <button key={t} type="button" onClick={() => setNewMedTime(t)} className={`filter-pill ${newMedTime === t ? 'active' : ''}`}>{t}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Instructions / Notes</label>
              <textarea className="form-input" style={{ height: '70px' }} placeholder="e.g. Take with food" value={newMedInstructions} onChange={e => setNewMedInstructions(e.target.value)} />
            </div>

            <button onClick={handleSaveMedication} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
              {editingMedId ? 'Save Changes' : 'Register Medication'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Edit Profile Modal */}
      {isEditingProfile && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Edit Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} style={{ background: 'none' }}><X size={20} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="text" className="form-input" placeholder="May 14, 1978" value={editDob} onChange={e => setEditDob(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Type</label>
              <input type="text" className="form-input" placeholder="O Positive (O+)" value={editBloodType} onChange={e => setEditBloodType(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Allergies (comma separated)</label>
              <input type="text" className="form-input" placeholder="Penicillin, Shellfish" value={editAllergies} onChange={e => setEditAllergies(e.target.value)} />
            </div>

            <button onClick={handleSaveProfile} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* 3. Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Privacy Policy</h3>
              <button onClick={() => setIsPrivacyModalOpen(false)} style={{ background: 'none' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              MediTrust protects your clinical data under HIPAA compliance guidelines. Personal medication logs and health IDs are encrypted in transit and at rest.
            </p>
          </div>
        </div>
      )}

      {/* 4. About Modal */}
      {isAboutModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>About MediTrust</h3>
              <button onClick={() => setIsAboutModalOpen(false)} style={{ background: 'none' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              MedVigilance MediTrust System Version 2.4.0. Designed for clinical safety verification, pharmaceutical verification, side effect reporting, and community drug security.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

