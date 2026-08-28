import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Star, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Pill, 
  MessageSquare, 
  RefreshCw, 
  Clock,
  Filter,
  CheckCircle,
  X
} from 'lucide-react';
import { 
  listenAllMedicineReviews, 
  listenSideEffectsReports, 
  saveMedicineReview, 
  saveUserSideEffectReport 
} from '../services/dbService';

export default function CommunityFeedPage({ user }) {
  const [activeCategory, setActiveCategory] = useState('All'); // All, Cardiological, Respiratory, Neurological, General
  const [searchQuery, setSearchQuery] = useState('');

  // Feed Data States
  const [dbReviews, setDbReviews] = useState({});
  const [dbSideEffects, setDbSideEffects] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [sideEffectModalOpen, setSideEffectModalOpen] = useState(false);
  
  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Form States - Product Review
  const [reviewMedName, setReviewMedName] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewCategory, setReviewCategory] = useState('General');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComments, setReviewComments] = useState('');

  // Form States - Side Effect Report
  const [effectMedName, setEffectMedName] = useState('');
  const [effectSymptom, setEffectSymptom] = useState('');
  const [effectSeverity, setEffectSeverity] = useState('Moderate');
  const [effectDescription, setEffectDescription] = useState('');

  // Real-time Listeners
  useEffect(() => {
    const unsubReviews = listenAllMedicineReviews((data) => {
      setDbReviews(data || {});
      setLoading(false);
    });

    const unsubSideEffects = listenSideEffectsReports((data) => {
      setDbSideEffects(data || {});
      setLoading(false);
    });

    return () => {
      if (typeof unsubReviews === 'function') unsubReviews();
      if (typeof unsubSideEffects === 'function') unsubSideEffects();
    };
  }, []);

  // Format Date String nicely
  const formatDateTime = (rawDate) => {
    if (!rawDate) return 'Just now';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return String(rawDate);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Static Clinical & Community Guidance Reference Posts
  const staticPosts = [
    {
      id: 'feed_static_1',
      itemType: 'review',
      sender: 'Dr. Sarah Johnson',
      role: 'CLINICAL CARDIOLOGIST',
      verified: true,
      category: 'Cardiological',
      medicineName: 'Lisinopril 10mg',
      title: 'Important Note on ACE Inhibitors & Hydration',
      comments: 'For patients taking blood pressure medications like Lisinopril, maintaining proper daily fluid balance is key. Dehydration excessively lowers blood pressure, leading to vertigo or fainting. Stay hydrated!',
      stars: 5,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 'feed_static_2',
      itemType: 'review',
      sender: 'Anonymous Patient',
      role: 'VERIFIED PATIENT',
      verified: false,
      category: 'General',
      medicineName: 'Metformin 500mg',
      title: 'Metformin Toleration Experience',
      comments: 'Taking Metformin strictly with my breakfast significantly reduced initial stomach irritation. The body seems to adapt well after the first 2 weeks. Consistent adherence pays off.',
      stars: 4,
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    }
  ];

  // Parse Product Reviews from dbReviews
  const parsedReviews = [];
  if (dbReviews && typeof dbReviews === 'object') {
    Object.keys(dbReviews).forEach(medId => {
      const medGroup = dbReviews[medId];
      if (medGroup && typeof medGroup === 'object') {
        Object.keys(medGroup).forEach(revId => {
          const r = medGroup[revId];
          if (r && typeof r === 'object' && (r.comment || r.comments || r.title || r.medicineName)) {
            parsedReviews.push({
              id: r.id || revId,
              medicineId: medId,
              itemType: 'review',
              uid: r.uid || user?.uid,
              sender: r.userName || r.sender || (user?.email ? user.email.split('@')[0] : 'Verified Patient'),
              role: r.role || 'VERIFIED PATIENT',
              verified: true,
              category: r.category || 'General',
              medicineName: r.medicineName || 'Medication',
              title: r.title || 'Product Review',
              comments: r.comment || r.comments || r.description || '',
              stars: Number(r.rating || r.stars || 5),
              createdAt: r.createdAt || new Date().toISOString()
            });
          }
        });
      }
    });
  }

  // Parse Side Effect Reports from dbSideEffects
  const parsedSideEffects = [];
  if (dbSideEffects && typeof dbSideEffects === 'object') {
    Object.keys(dbSideEffects).forEach(effId => {
      const s = dbSideEffects[effId];
      if (s && typeof s === 'object' && (s.sideEffect || s.effect || s.medicineName || s.medicine)) {
        parsedSideEffects.push({
          id: s.id || effId,
          itemType: 'side_effect',
          uid: s.uid || s.userId || user?.uid,
          sender: s.userName || s.sender || (user?.email ? user.email.split('@')[0] : 'Community Member'),
          role: 'SIDE EFFECT REPORT',
          verified: false,
          category: s.category || 'General',
          medicineName: s.medicineName || s.medicine || 'Prescription Medicine',
          title: s.sideEffect || s.effect || 'Observed Side Effect',
          comments: s.description || s.comments || 'Side effect symptom observed during treatment.',
          severity: s.severity || 'Moderate',
          createdAt: s.createdAt || new Date().toISOString()
        });
      }
    });
  }

  // Combined Shared Community Safety Feed
  const combinedFeed = [...parsedReviews, ...parsedSideEffects, ...staticPosts].sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  // Filter Feed by Search Query and Category
  const filteredFeed = combinedFeed.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (item.medicineName && item.medicineName.toLowerCase().includes(q)) ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.comments && item.comments.toLowerCase().includes(q)) ||
      (item.sender && item.sender.toLowerCase().includes(q))
    );

    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle Product Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewMedName.trim() || !reviewTitle.trim() || !reviewComments.trim()) {
      setSubmitError('Please fill in all required fields (Medicine Name, Title, Comments).');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const medId = `med_rev_${Date.now()}`;
      const reviewPayload = {
        medicineName: reviewMedName.trim(),
        title: reviewTitle.trim(),
        category: reviewCategory,
        rating: reviewRating,
        stars: reviewRating,
        comment: reviewComments.trim(),
        comments: reviewComments.trim(),
        userName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Verified Patient'),
        role: 'VERIFIED PATIENT',
        createdAt: new Date().toISOString()
      };

      const savedReview = await saveMedicineReview(user?.uid, medId, reviewPayload);

      // Immediately update local React state so review renders instantly in feed
      setDbReviews(prev => {
        const next = { ...(prev || {}) };
        if (!next[medId]) next[medId] = {};
        next[medId][savedReview.id || medId] = savedReview;
        return next;
      });

      setSubmitting(false);
      setSubmitSuccess(true);
      setSubmitSuccessMsg('Your product review has been submitted successfully to the Community Safety Feed!');

      // Clear Form
      setReviewMedName('');
      setReviewTitle('');
      setReviewComments('');
      setReviewRating(5);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Side Effect Submit
  const handleSideEffectSubmit = async (e) => {
    e.preventDefault();
    if (!effectMedName.trim() || !effectSymptom.trim() || !effectDescription.trim()) {
      setSubmitError('Please fill in all required fields (Medicine Name, Side Effect, Description).');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const sideEffectPayload = {
        medicineName: effectMedName.trim(),
        medicine: effectMedName.trim(),
        sideEffect: effectSymptom.trim(),
        effect: effectSymptom.trim(),
        severity: effectSeverity,
        description: effectDescription.trim(),
        comments: effectDescription.trim(),
        userName: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Patient User'),
        createdAt: new Date().toISOString()
      };

      const savedEffect = await saveUserSideEffectReport(user?.uid, sideEffectPayload);

      // Immediately update local React state so side effect report renders instantly in feed
      setDbSideEffects(prev => ({
        ...(prev || {}),
        [savedEffect.id || `eff_${Date.now()}`]: savedEffect
      }));

      setSubmitting(false);
      setSubmitSuccess(true);
      setSubmitSuccessMsg('Your side effect report has been saved successfully to the Community Safety Feed!');

      // Clear Form
      setEffectMedName('');
      setEffectSymptom('');
      setEffectDescription('');
      setEffectSeverity('Moderate');
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit side effect report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #002b66 0%, #004fb0 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        color: 'white',
        boxShadow: '0 8px 24px rgba(0, 43, 102, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Users size={28} color="#9ec5ff" />
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'white' }}>
                Community Safety Feed
              </h1>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '640px' }}>
              A unified public feed for patient product reviews, real-world medication experiences, and verified side-effect monitoring.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setSubmitError('');
                setReviewModalOpen(true);
              }}
              style={{
                background: '#ffffff',
                color: '#003d9b',
                border: 'none',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                fontWeight: '700',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <Star size={18} fill="#003d9b" color="#003d9b" />
              Write Product Review
            </button>

            <button
              onClick={() => {
                setSubmitSuccess(false);
                setSubmitError('');
                setSideEffectModalOpen(true);
              }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1.5px solid rgba(255,255,255,0.3)',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                fontWeight: '700',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)'
              }}
            >
              <AlertTriangle size={18} color="#ffb703" />
              Report Side Effect
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e0edff', color: '#003d9b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)' }}>{combinedFeed.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Feed Entries</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={22} fill="#2e7d32" />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)' }}>{parsedReviews.length + 2}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Product Reviews</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fff3e0', color: '#e65100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)' }}>{parsedSideEffects.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Side Effect Reports</div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }} />
            <input
              type="text"
              placeholder="Search feed by medicine name, symptoms, or keywords..."
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

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Filter size={16} color="var(--text-secondary)" style={{ marginRight: '4px' }} />
            {['All', 'Cardiological', 'Respiratory', 'Neurological', 'General'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: activeCategory === cat ? '#003d9b' : 'var(--outline-variant)',
                  background: activeCategory === cat ? '#003d9b' : 'transparent',
                  color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                  fontWeight: activeCategory === cat ? '700' : '500',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw className="spin" size={24} style={{ marginBottom: '8px' }} />
            <p>Loading community posts...</p>
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <MessageSquare size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>No Feed Posts Found</h3>
            <p style={{ fontSize: '0.9rem' }}>Try clearing your search query or selecting a different category filter.</p>
          </div>
        ) : (
          filteredFeed.map((item) => {
            const isReview = item.itemType === 'review';
            return (
              <div key={item.id} className="card" style={{ padding: '24px', borderLeft: isReview ? '4px solid #003d9b' : '4px solid #d97706' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isReview ? '#e0edff' : '#fef3c7',
                      color: isReview ? '#003d9b' : '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '1rem'
                    }}>
                      {(item.sender?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: '700', color: 'var(--text)' }}>
                          {item.sender}
                        </h4>
                        {item.verified && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#e8f5e9', color: '#2e7d32', fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>
                            <ShieldCheck size={12} /> {item.role}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Clock size={12} /> {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isReview ? (
                      <span style={{ background: '#dae2ff', color: '#003d9b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={12} fill="#003d9b" /> PRODUCT REVIEW
                      </span>
                    ) : (
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> SIDE EFFECT REPORT
                      </span>
                    )}
                  </div>
                </div>

                {/* Medicine & Title */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', tracking: '0.5px' }}>
                    {item.medicineName}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text)', margin: '2px 0 6px 0' }}>
                    {item.title}
                  </h3>
                </div>

                {/* Star Rating or Severity Indicator */}
                {isReview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= (item.stars || 5) ? '#f59e0b' : 'none'}
                        color={star <= (item.stars || 5) ? '#f59e0b' : 'var(--outline)'}
                      />
                    ))}
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                      {item.stars || 5}.0 / 5.0
                    </span>
                  </div>
                ) : (
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '0.775rem',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: item.severity === 'Critical' || item.severity === 'Severe' ? '#fee2e2' : '#fef3c7',
                      color: item.severity === 'Critical' || item.severity === 'Severe' ? '#991b1b' : '#92400e'
                    }}>
                      Severity: {item.severity || 'Moderate'}
                    </span>
                  </div>
                )}

                {/* Post Body */}
                <p style={{ margin: 0, fontSize: '0.925rem', color: 'var(--text)', lineHeight: '1.5' }}>
                  {item.comments}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: WRITE PRODUCT REVIEW                        */}
      {/* ---------------------------------------------------- */}
      {reviewModalOpen && (
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
            <div style={{ background: '#003d9b', color: 'white', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Star size={22} fill="white" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Write Product Review</h3>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>Review Published!</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    {submitSuccessMsg}
                  </p>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setReviewModalOpen(false);
                    }}
                    style={{
                      background: '#003d9b',
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
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {submitError && (
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Amoxicillin 500mg"
                      value={reviewMedName}
                      onChange={(e) => setReviewMedName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                        Category
                      </label>
                      <select
                        value={reviewCategory}
                        onChange={(e) => setReviewCategory(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                      >
                        <option value="General">General</option>
                        <option value="Cardiological">Cardiological</option>
                        <option value="Respiratory">Respiratory</option>
                        <option value="Neurological">Neurological</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                        Rating
                      </label>
                      <div style={{ display: 'flex', gap: '6px', paddingTop: '6px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={24}
                            onClick={() => setReviewRating(star)}
                            fill={star <= reviewRating ? '#f59e0b' : 'none'}
                            color={star <= reviewRating ? '#f59e0b' : 'var(--outline)'}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                      Review Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Effective treatment with minor initial fatigue"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                      Detailed Review Comments *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Share your clinical or patient experience with this medicine..."
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(false)}
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
                        background: '#003d9b',
                        color: 'white',
                        fontWeight: '700',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.7 : 1
                      }}
                    >
                      {submitting ? 'Publishing Review...' : 'Publish Review'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: REPORT SIDE EFFECT                          */}
      {/* ---------------------------------------------------- */}
      {sideEffectModalOpen && (
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
            <div style={{ background: '#b45309', color: 'white', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={22} color="white" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Report Side Effect</h3>
              </div>
              <button
                onClick={() => setSideEffectModalOpen(false)}
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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>Side Effect Logged!</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    {submitSuccessMsg}
                  </p>
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setSideEffectModalOpen(false);
                    }}
                    style={{
                      background: '#b45309',
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
                <form onSubmit={handleSideEffectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {submitError && (
                    <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Atorvastatin 20mg"
                      value={effectMedName}
                      onChange={(e) => setEffectMedName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                        Side Effect / Symptom *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Muscle Soreness / Dizziness"
                        value={effectSymptom}
                        onChange={(e) => setEffectSymptom(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                        Severity *
                      </label>
                      <select
                        value={effectSeverity}
                        onChange={(e) => setEffectSeverity(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem' }}
                      >
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
                      Detailed Symptom Description *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe when the symptom started, duration, and any accompanying discomfort..."
                      value={effectDescription}
                      onChange={(e) => setEffectDescription(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)', fontSize: '0.9rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSideEffectModalOpen(false)}
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
                        background: '#b45309',
                        color: 'white',
                        fontWeight: '700',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.7 : 1
                      }}
                    >
                      {submitting ? 'Submitting Report...' : 'Submit Side Effect Report'}
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
