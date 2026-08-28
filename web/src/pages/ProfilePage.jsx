import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  PhoneCall, 
  LogOut, 
  CheckCircle2, 
  Shield, 
  Edit3, 
  Save, 
  Calendar, 
  Droplet, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { listenUserProfile, getUserProfile, updateUserProfileFields, getLocalUserProfile } from '../services/dbService';

export default function ProfilePage({ user, onLogout }) {
  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Raw profile data snapshot from Firebase
  const [profileData, setProfileData] = useState(null);

  const loadProfile = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(false);

    try {
      const data = await getUserProfile(user.uid);
      applyProfileData(data);
    } catch (e) {
      console.warn("Failed to load profile directly:", e);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const applyProfileData = (data) => {
    const rawDob = data?.dob || data?.dateOfBirth || '';
    const rawBloodType = data?.bloodType || data?.bloodGroup || '';
    const rawPhone = data?.phone || data?.phoneNumber || '';
    let rawAllergies = '';
    if (Array.isArray(data?.allergies)) {
      rawAllergies = data.allergies.join(', ');
    } else if (data?.allergies) {
      rawAllergies = data.allergies;
    }

    const formatted = {
      fullName: data?.fullName || data?.name || user?.displayName || user?.email?.split('@')[0] || 'Clinical User',
      email: data?.email || user?.email || '',
      phone: rawPhone,
      dob: rawDob,
      bloodType: rawBloodType,
      allergies: rawAllergies
    };

    setProfileData(formatted);
    setFullName(formatted.fullName);
    setPhone(rawPhone);
    setDob(rawDob);
    setBloodType(rawBloodType);
    setAllergies(rawAllergies);
  };

  useEffect(() => {
    let isMounted = true;
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Instant initial load from local storage
    getLocalUserProfile(user.uid).then(cached => {
      if (isMounted && cached) {
        applyProfileData(cached);
        setLoading(false);
      }
    });

    // Real-time listener
    const unsub = listenUserProfile(
      user.uid,
      (data) => {
        if (!isMounted) return;
        setLoading(false);
        setFetchError(false);
        applyProfileData(data);
      },
      (err) => {
        if (!isMounted) return;
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, [user?.uid]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setSaveError('Full name cannot be empty.');
      return;
    }

    setSaving(true);
    setSaveError('');

    const fieldsToSave = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      dob: dob.trim(),
      bloodType: bloodType.trim(),
      allergies: allergies.trim()
    };

    try {
      // 1. Instantly persist profile fields to local storage & initiate DB sync
      const updatedData = await updateUserProfileFields(user?.uid, fieldsToSave);
      
      // 2. Immediately update current page React states
      applyProfileData({ ...(profileData || {}), ...fieldsToSave });

      // 3. Immediately exit editing mode and stop saving indicator
      setIsEditing(false);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.warn("Error saving profile:", err);
      setSaveError('Failed to save profile changes. Please try again.');
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setFullName(profileData.fullName || '');
      setPhone(profileData.phone || '');
      setDob(profileData.dob || '');
      setBloodType(profileData.bloodType || '');
      setAllergies(profileData.allergies || '');
    }
    setIsEditing(false);
    setSaveError('');
  };

  const avatarLetter = ((profileData?.fullName?.[0] || user?.email?.[0] || 'U')).toUpperCase();

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--slate-900)' }}>Patient Profile &amp; Settings</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)' }}>
          Manage your personal medical information synchronized with the database
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        {/* Header Row: Avatar, Name & Edit Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--slate-200)' }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: '700',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
          }}>
            {avatarLetter}
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--slate-900)', marginBottom: '2px' }}>
              {loading ? 'Loading profile...' : (profileData?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Clinical User')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginBottom: '6px' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-success">VERIFIED PATIENT</span>
              <span className="badge badge-primary">Account Active</span>
            </div>
          </div>

          {!loading && (
            <button
              onClick={() => {
                if (isEditing) handleCancelEdit();
                else setIsEditing(true);
              }}
              className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '10px 18px', fontWeight: '600' }}
            >
              <Edit3 size={16} /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          )}
        </div>

        {/* Success Banner */}
        {saved && (
          <div style={{ padding: '12px 16px', background: 'var(--success-bg)', color: '#065f46', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> Profile details saved successfully!
          </div>
        )}

        {/* Save Error Banner */}
        {saveError && (
          <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', color: '#991b1b', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> {saveError}
          </div>
        )}

        {/* Loading Spinner / Skeleton */}
        {loading && (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--slate-500)' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--slate-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }}></div>
            <p style={{ fontSize: '0.9rem' }}>Loading profile information...</p>
          </div>
        )}

        {/* Error State with Retry Button */}
        {!loading && fetchError && (
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <AlertCircle size={32} color="#ef4444" style={{ marginBottom: '8px' }} />
            <p style={{ color: '#991b1b', fontWeight: '600', marginBottom: '12px' }}>Could not load profile from database.</p>
            <button onClick={loadProfile} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> Retry Loading
            </button>
          </div>
        )}

        {/* VIEW MODE: DISPLAY PROFILE DETAILS */}
        {!isEditing && !loading && (
          <div className="grid-cols-2" style={{ gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <User size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: '700', textTransform: 'uppercase' }}>Full Name</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--slate-900)', fontWeight: '600' }}>{profileData?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Not provided'}</p>
            </div>

            <div style={{ padding: '16px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Mail size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: '700', textTransform: 'uppercase' }}>Email Address</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--slate-900)' }}>{user?.email || 'Not provided'}</p>
            </div>

            <div style={{ padding: '16px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Calendar size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: '700', textTransform: 'uppercase' }}>Date of Birth</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: profileData?.dob ? 'var(--slate-900)' : 'var(--slate-500)' }}>{profileData?.dob || 'Not provided'}</p>
            </div>

            <div style={{ padding: '16px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Droplet size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: '700', textTransform: 'uppercase' }}>Blood Type</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: profileData?.bloodType ? 'var(--slate-900)' : 'var(--slate-500)' }}>{profileData?.bloodType || 'Not provided'}</p>
            </div>

            <div style={{ padding: '16px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <PhoneCall size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: '700', textTransform: 'uppercase' }}>Emergency Contact</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: profileData?.phone ? 'var(--slate-900)' : 'var(--slate-500)' }}>{profileData?.phone || 'Not provided'}</p>
            </div>

            <div style={{ padding: '16px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <AlertCircle size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: '700', textTransform: 'uppercase' }}>Known Allergies</span>
              </div>
              <p style={{ fontSize: '0.95rem', color: profileData?.allergies ? 'var(--slate-900)' : 'var(--slate-500)' }}>{profileData?.allergies || 'Not provided'}</p>
            </div>
          </div>
        )}

        {/* Authenticated User UID Info Banner */}
        {!isEditing && !loading && (
          <div style={{ padding: '12px 16px', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="var(--primary-dark)" />
              <span style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: '600' }}>Authenticated UID:</span>
              <code style={{ fontSize: '0.8rem', color: 'var(--slate-700)', background: 'white', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--slate-300)' }}>
                {user?.uid}
              </code>
            </div>
          </div>
        )}

        {/* EDIT FORM MODE */}
        {isEditing && (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Sara Smith"
                required
                autoFocus
              />
            </div>

            <div className="grid-cols-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="text"
                  className="form-input"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  placeholder="e.g. May 14, 1978"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Blood Type</label>
                <input
                  type="text"
                  className="form-input"
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  placeholder="e.g. O Positive (O+)"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Care Contact Number</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Known Allergies (Comma Separated)</label>
              <input
                type="text"
                className="form-input"
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Shellfish, Lactose"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read Only)</label>
              <input
                type="text"
                disabled
                className="form-input"
                value={user?.email || ''}
                style={{ background: 'var(--slate-100)', cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving Details...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        )}

        {/* Sign Out */}
        {!isEditing && !loading && (
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--slate-200)' }}>
            <button type="button" onClick={onLogout} className="btn btn-danger">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
