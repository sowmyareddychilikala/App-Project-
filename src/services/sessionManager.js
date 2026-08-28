/**
 * Session Manager for MediGuard AI / MediTrust
 * Manages active clinical sessions, avoids redundant session fetching during screen navigation,
 * and tracks session metrics for debugging.
 */

let activeSession = {
  uid: null,
  profile: null,
  status: 'NONE', // 'NONE' | 'ACTIVE' | 'EXPIRED'
  createdAt: null,
};

let sessionRequestCount = 0;

export const sessionManager = {
  /**
   * Check if a valid session already exists for the given UID
   */
  hasValidSession(uid) {
    if (!activeSession.uid) return false;
    if (activeSession.status !== 'ACTIVE') return false;
    if (uid && activeSession.uid !== uid) return false;
    return true;
  },

  /**
   * Retrieve current active session
   */
  getActiveSession() {
    return activeSession;
  },

  /**
   * Get total number of session requests made since app launch
   */
  getSessionRequestCount() {
    return sessionRequestCount;
  },

  /**
   * Main entry point to fetch or reuse a secure clinical session.
   * Logs required metrics and reuses active session if valid.
   */
  fetchSecureClinicalSession(uid, screenName = 'UnknownScreen', triggerSource = 'Navigation') {
    sessionRequestCount++;

    const existingStatus = activeSession.status;
    const isValid = activeSession.status === 'ACTIVE' && activeSession.uid === uid && uid;

    console.log(`[SessionManager] Screen: ${screenName} | Navigation Event: Return/Mount | Source: ${triggerSource} | Existing Session Status: ${existingStatus} | Total Session Requests Made: ${sessionRequestCount}`);

    if (isValid) {
      console.log(`[SessionManager] Valid active session reused for UID: ${activeSession.uid || uid}. Skipping redundant session fetch.`);
      return {
        reused: true,
        session: activeSession,
        requestCount: sessionRequestCount,
      };
    }

    // Initialize clean active session strictly for this specific UID
    activeSession = {
      uid: uid || 'guest_user',
      profile: null,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    console.log(`[SessionManager] New clinical session initialized for UID: ${activeSession.uid}.`);
    return {
      reused: false,
      session: activeSession,
      requestCount: sessionRequestCount,
    };
  },

  /**
   * Update profile data inside active session
   */
  updateSessionProfile(profileData) {
    if (activeSession) {
      activeSession.profile = profileData;
      activeSession.status = 'ACTIVE';
    }
  },

  /**
   * Invalidate / terminate active session (on Sign Out or session expiry)
   */
  clearSession() {
    console.log(`[SessionManager] Terminating active clinical session for UID: ${activeSession.uid}`);
    activeSession = {
      uid: null,
      profile: null,
      status: 'NONE',
      createdAt: null,
    };
  }
};
