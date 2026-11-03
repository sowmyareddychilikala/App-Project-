/**
 * MediTrust Clinical Safety System - Unit & Validation Test Runner
 * Executes real-time assertions for Form Validators, Medicine Data Models,
 * Clinical Trust Algorithms, Prescription Safety, Expiry Logic, and OCR Parsers.
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 1. CORE LOGIC & VALIDATOR IMPLEMENTATIONS
// ==========================================

const Validators = {
  // Email Validation (RFC 5322 subset)
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (trimmed.length > 254 || trimmed.length < 5) return false;
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return re.test(trimmed);
  },

  // Password Complexity Validation
  validatePassword(pwd) {
    if (!pwd || typeof pwd !== 'string') return { valid: false, reason: 'Password is required' };
    if (pwd.length < 8) return { valid: false, reason: 'Minimum 8 characters required' };
    if (pwd.length > 128) return { valid: false, reason: 'Exceeds maximum 128 characters' };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return { valid: false, reason: 'Must contain uppercase, lowercase, number, and special character' };
    }
    return { valid: true, reason: 'Password meets all complexity criteria' };
  },

  // Phone Number (E.164 or 10-digit standard)
  isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const clean = phone.replace(/[\s\-\(\)\.]/g, '');
    return /^\+?[1-9]\d{7,14}$/.test(clean);
  },

  // Medicine Name Format
  isValidMedicineName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100 && /^[a-zA-Z0-9\s\-\/\(\)]+$/.test(trimmed);
  },

  // Batch / Lot Number Validator
  isValidBatchNumber(batch) {
    if (!batch || typeof batch !== 'string') return false;
    const trimmed = batch.trim().toUpperCase();
    return /^[A-Z0-9]{4,15}$/.test(trimmed);
  },

  // National Drug Code (NDC) Format (e.g. 5-4-2, 5-3-2, 10 or 11 digits)
  isValidNDC(ndc) {
    if (!ndc || typeof ndc !== 'string') return false;
    const clean = ndc.replace(/-/g, '');
    return /^\d{10,11}$/.test(clean);
  },

  // Dosage & Unit Validation
  validateDosage(doseStr) {
    if (!doseStr || typeof doseStr !== 'string') return { valid: false };
    const match = doseStr.trim().match(/^(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|IU|tablets?|capsules?)$/i);
    if (!match) return { valid: false };
    return { valid: true, value: parseFloat(match[1]), unit: match[2].toLowerCase() };
  },

  // Date Parsing & Expiry Days Calculation
  calculateDaysToExpiry(expiryDateStr, baseDateStr = null) {
    const expiry = new Date(expiryDateStr);
    const now = baseDateStr ? new Date(baseDateStr) : new Date();
    if (isNaN(expiry.getTime())) return null;
    const diffMs = expiry.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  },

  // Expiry Alert Priority Categorization
  getExpiryAlertLevel(daysRemaining) {
    if (daysRemaining === null) return 'INVALID_DATE';
    if (daysRemaining <= 0) return 'EXPIRED'; // Critical / Red
    if (daysRemaining <= 30) return 'CRITICAL'; // Immediate Attention / Red
    if (daysRemaining <= 90) return 'WARNING'; // Amber / Reorder Alert
    return 'SAFE'; // Green / Normal
  },

  // Clinical Pharmacy Trust Score Algorithm (Scale: 1.00 to 5.00)
  calculateTrustScore({ inspectionPassed = true, avgUserRating = 4.0, totalReviews = 10, complaintCount = 0 }) {
    const inspectionWeight = 0.40;
    const userRatingWeight = 0.35;
    const safetyRecordWeight = 0.25;

    const inspectionScore = inspectionPassed ? 5.0 : 1.0;
    const clampedRating = Math.max(1.0, Math.min(5.0, avgUserRating));
    const complaintDeduction = Math.min(4.0, complaintCount * 0.5);
    const safetyScore = Math.max(1.0, 5.0 - complaintDeduction);

    const rawScore = (inspectionScore * inspectionWeight) +
                     (clampedRating * userRatingWeight) +
                     (safetyScore * safetyRecordWeight);
    return parseFloat(rawScore.toFixed(2));
  },

  // Haversine Geolocation Distance Calculation (km)
  haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  },

  // Drug-Drug Interaction Conflict Matrix
  checkDrugInteraction(drugA, drugB) {
    const pairKey = [drugA.toLowerCase(), drugB.toLowerCase()].sort().join('|');
    const knownInteractions = {
      'aspirin|warfarin': { severity: 'Severe', risk: 'Significantly increases risk of major gastrointestinal hemorrhage.' },
      'ibuprofen|lisinopril': { severity: 'Moderate', risk: 'May diminish antihypertensive effect and increase renal failure risk.' },
      'clarithromycin|simvastatin': { severity: 'Severe', risk: 'Increases simvastatin plasma levels causing potential rhabdomyolysis.' },
      'methotrexate|omeprazole': { severity: 'Moderate', risk: 'Increases serum methotrexate concentrations leading to toxicity.' },
      'amoxicillin|probenecid': { severity: 'Mild', risk: 'Probenecid reduces renal excretion of amoxicillin.' }
    };
    return knownInteractions[pairKey] || { severity: 'None', risk: 'No known adverse drug interaction found.' };
  },

  // Maximum Daily Dose Threshold Check
  validateDailyDosageLimit(drugName, dailyDoseMg) {
    const limits = {
      paracetamol: 4000,
      acetaminophen: 4000,
      ibuprofen: 2400,
      amoxicillin: 3000,
      metformin: 2550,
      aspirin: 4000,
      atorvastatin: 80,
      lisinopril: 80
    };
    const max = limits[drugName.toLowerCase()];
    if (!max) return { safe: true, maxAllowed: 'Unlisted' };
    return {
      safe: dailyDoseMg <= max,
      maxAllowed: `${max} mg`,
      exceededBy: dailyDoseMg > max ? `${dailyDoseMg - max} mg` : '0 mg'
    };
  },

  // OCR Pattern Extraction (Date & Batch)
  extractExpiryFromOCR(text) {
    if (!text || typeof text !== 'string') return null;
    // Common patterns: EXP 12/2027, EXPIRY: 15/08/2026, 05/26, DEC 2027
    const patterns = [
      /(?:EXP|EXPIRY|EXP\.?\s*DATE)[\s:\-\.]*(\d{1,2}[\/\-\.]\d{4})/i,
      /(?:EXP|EXPIRY|EXP\.?\s*DATE)[\s:\-\.]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      /(?:EXP|EXPIRY)[\s:\-\.]*([A-Za-z]{3}\s*\d{4})/i
    ];
    for (const p of patterns) {
      const match = text.match(p);
      if (match) return match[1];
    }
    return null;
  },

  extractBatchFromOCR(text) {
    if (!text || typeof text !== 'string') return null;
    const pattern = /(?:B\.?\s*NO|BATCH|LOT)[\s:\-\.]*([A-Z0-9]{4,15})/i;
    const match = text.match(pattern);
    return match ? match[1].toUpperCase() : null;
  },

  // Token Verification Simulation
  decodeJWTClaims(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = Buffer.from(parts[1], 'base64').toString('utf8');
      return JSON.parse(payload);
    } catch (e) {
      return null;
    }
  },

  // XSS & Script Tag Sanitization
  sanitizeUserInput(input) {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:[^"']*/gi, '')
      .trim();
  }
};

// ==========================================
// 2. EXECUTION SUITE EXPORT
// ==========================================
module.exports = {
  Validators,
  runSelfTest: () => {
    let passed = 0;
    let failed = 0;

    // Test email
    if (Validators.isValidEmail('doctor@hospital.org')) passed++; else failed++;
    if (!Validators.isValidEmail('invalid-email')) passed++; else failed++;

    // Test password
    if (Validators.validatePassword('Clinical@2026').valid) passed++; else failed++;
    if (!Validators.validatePassword('weak').valid) passed++; else failed++;

    // Test medicine name
    if (Validators.isValidMedicineName('Amoxicillin 500mg')) passed++; else failed++;

    // Test batch
    if (Validators.isValidBatchNumber('BCH98741')) passed++; else failed++;

    // Test NDC
    if (Validators.isValidNDC('0002-8215-01')) passed++; else failed++;

    // Test trust score
    const score = Validators.calculateTrustScore({ inspectionPassed: true, avgUserRating: 4.8, complaintCount: 0 });
    if (score >= 4.5 && score <= 5.0) passed++; else failed++;

    // Test interaction
    const inter = Validators.checkDrugInteraction('Aspirin', 'Warfarin');
    if (inter.severity === 'Severe') passed++; else failed++;

    console.log(`Self-test completed: ${passed} assertions passed, ${failed} failed.`);
    return { passed, failed };
  }
};

if (require.main === module) {
  module.exports.runSelfTest();
}
