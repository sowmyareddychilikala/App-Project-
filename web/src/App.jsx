import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ExpiryManagementPage from './pages/ExpiryManagementPage';
import MedicineInformationPage from './pages/MedicineInformationPage';
import CommunityFeedPage from './pages/CommunityFeedPage';
import ClinicalTrustPage from './pages/ClinicalTrustPage';
import CommunitySafetyNetworkPage from './pages/CommunitySafetyNetworkPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setActiveTab('dashboard');
  };

  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #001848 0%, #003d9b 50%, #006e28 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', fontWeight: '800' }}>MedVigilance MediTrust</h2>
          <p style={{ opacity: 0.8 }}>Loading Secured Clinical Safety Portal...</p>
        </div>
      </div>
    );
  }

  // Render Auth screen if not signed in
  if (!user) {
    return <AuthPage onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header 
          activeTab={activeTab} 
          onSearchClick={() => setActiveTab('search')} 
          user={user}
        />

        <main className="page-body">
          {activeTab === 'dashboard' && (
            <DashboardPage 
              user={user} 
              setActiveTab={setActiveTab}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'expiry' && (
            <ExpiryManagementPage user={user} />
          )}

          {activeTab === 'search' && (
            <MedicineInformationPage />
          )}

          {activeTab === 'community' && (
            <CommunityFeedPage user={user} />
          )}

          {activeTab === 'trust' && (
            <ClinicalTrustPage user={user} />
          )}

          {activeTab === 'safety' && (
            <CommunitySafetyNetworkPage user={user} />
          )}

          {activeTab === 'profile' && (
            <ProfilePage user={user} onLogout={handleLogout} />
          )}
        </main>
      </div>
    </div>
  );
}

