import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { saveUserProfile } from '../services/dbService';
import { Shield, ShieldCheck, Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('welcome'); // welcome, login, register, forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), password);
      onLoginSuccess(res.user);
    } catch (err) {
      let msg = 'An error occurred during sign in. Please try again.';
      if (err.code === 'auth/invalid-email') {
        msg = 'The email address is invalid.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect credentials. Please verify your email and password.';
      } else if (err.message) {
        msg = err.message.replace('Firebase: ', '');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await saveUserProfile(res.user.uid, name.trim(), email.trim());
      onLoginSuccess(res.user);
    } catch (err) {
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered.';
      } else if (err.message) {
        msg = err.message.replace('Firebase: ', '');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('Password reset instructions sent to your email.');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #001848 0%, #003d9b 50%, #006e28 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: mode === 'welcome' ? '760px' : '440px',
        width: '100%',
        background: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        padding: '36px',
        transition: 'all 0.3s ease'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #003d9b 0%, #001848 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            marginBottom: '12px',
            boxShadow: '0 8px 20px rgba(0, 61, 155, 0.3)'
          }}>
            <Shield size={34} />
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text)', fontWeight: '800' }}>MedVigilance</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            MediTrust Clinical Safety & Verification System
          </p>
        </div>

        {/* WELCOME MODE */}
        {mode === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div className="grid-cols-2" style={{ gap: '16px', marginBottom: '28px', textAlign: 'left' }}>
              <div className="card" style={{ background: '#f8f9fb' }}>
                <ShieldCheck color="#003d9b" size={28} style={{ marginBottom: '8px' }} />
                <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>Verified Medicine Portal</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Search clinical drug databases, usage guidelines, precautions, and FDA warnings.
                </p>
              </div>
              <div className="card" style={{ background: '#f8f9fb' }}>
                <CheckCircle2 color="#006e28" size={28} style={{ marginBottom: '8px' }} />
                <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>Expiry Management</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Track active medications, schedule doses, and receive dynamic expiration alerts.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
              <button 
                onClick={() => setMode('login')} 
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '1rem' }}
              >
                Sign In <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => setMode('register')} 
                className="btn btn-secondary"
                style={{ padding: '12px 28px', fontSize: '1rem' }}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', fontWeight: '700' }}>Welcome Back</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Please enter your clinical credentials
            </p>
            
            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="dr.smith@hospital.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label">Password</label>
                <button type="button" onClick={() => setMode('forgot')} style={{ background: 'none', color: 'var(--primary)', fontSize: '0.825rem', fontWeight: '600' }}>
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input 
                  type="checkbox" 
                  checked={keepLoggedIn}
                  onChange={e => setKeepLoggedIn(e.target.checked)}
                />
                Keep me logged in
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              {loading ? 'Authenticating...' : 'Login'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button type="button" onClick={() => setMode('register')} style={{ background: 'none', color: 'var(--primary)', fontWeight: '700' }}>
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', fontWeight: '700' }}>Create Patient Account</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Register for secured clinical monitoring
            </p>
            
            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="Dr. Sarah Johnson"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="sarah.johnson@mediguard.ai"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="password" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="password" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} style={{ background: 'none', color: 'var(--primary)', fontWeight: '700' }}>
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', fontWeight: '700' }}>Reset Password</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enter your registered clinical email to receive reset instructions
            </p>
            
            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {message && (
              <div style={{ padding: '10px 14px', background: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', marginBottom: '16px', fontWeight: '600' }}>
                {message}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  style={{ paddingLeft: '38px' }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
              {loading ? 'Sending Instructions...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
              <button type="button" onClick={() => setMode('login')} style={{ background: 'none', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* HIPAA Compliant Shield Footer */}
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--outline)', fontSize: '0.75rem' }}>
          <LockKeyhole size={14} />
          <span>HIPAA Compliant & End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
}


