import { ref, set, push, get, child, update, remove } from 'firebase/database';
import { database, auth } from './firebaseConfig';

export interface MedicineItem {
  id?: string;
  name: string;
  expiryDate: string; // ISO date
  batchNumber: string;
  manufacturer: string;
  status: 'active' | 'near_expiry' | 'expired';
  riskLevel: 'Likely Genuine' | 'Needs Verification' | 'High Risk';
  trustScore: number; // 0 to 100
  scannedAt: string;
  reminderScheduled?: boolean;
}

export interface PharmacyItem {
  id: string;
  name: string;
  address: string;
  trustScore: number;
  status: 'Trusted' | 'Under Observation' | 'High Risk';
  complaintsCount: number;
  coordinates: { latitude: number; longitude: number };
}

export interface SideEffectReport {
  id?: string;
  medicineName: string;
  symptoms: string[];
  severity: 'Mild' | 'Moderate' | 'Severe';
  healthConditions: string[];
  reviewText: string;
  reportedAt: string;
}

export interface InspectorReport {
  id?: string;
  pharmacyId: string;
  pharmacyName: string;
  medicineName: string;
  batchNumber: string;
  description: string;
  status: 'Submitted' | 'Under Investigation' | 'Action Taken';
  reportedAt: string;
}

export const databaseService = {
  // --- USER INVENTORY (Module 4) ---
  
  async addMedicine(medicine: Omit<MedicineItem, 'id' | 'status'>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Unauthenticated user cannot write to inventory.');

    // Calculate status based on expiry
    const today = new Date();
    const expiry = new Date(medicine.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status: 'active' | 'near_expiry' | 'expired' = 'active';
    if (diffDays <= 0) {
      status = 'expired';
    } else if (diffDays <= 30) {
      status = 'near_expiry';
    }

    const medicinesRef = ref(database, `users/${user.uid}/medicines`);
    const newMedicineRef = push(medicinesRef);
    const id = newMedicineRef.key as string;

    const data: MedicineItem = {
      ...medicine,
      id,
      status,
    };

    await set(newMedicineRef, data);
    return id;
  },

  async getMedicines(): Promise<MedicineItem[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `users/${user.uid}/medicines`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.values(data) as MedicineItem[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
  },

  async deleteMedicine(medicineId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    await remove(ref(database, `users/${user.uid}/medicines/${medicineId}`));
  },

  // --- PHARMACY VERIFICATION (Module 7 & 8) ---
  
  async getNearbyPharmacies(): Promise<PharmacyItem[]> {
    // Return standard mock pharmacies that sync with complaints in real-time
    const defaultPharmacies: PharmacyItem[] = [
      {
        id: 'p1',
        name: 'Apollo Pharmacy Central',
        address: '12 Medical Drive, Metro Center',
        trustScore: 96,
        status: 'Trusted',
        complaintsCount: 0,
        coordinates: { latitude: 12.9716, longitude: 77.5946 },
      },
      {
        id: 'p2',
        name: 'MediGuard Care Chemists',
        address: '45 Health Avenue, West Block',
        trustScore: 78,
        status: 'Under Observation',
        complaintsCount: 4,
        coordinates: { latitude: 12.9756, longitude: 77.5986 },
      },
      {
        id: 'p3',
        name: 'Discount Lifeline Pharmacy',
        address: '88 Alleyway Road, East Gate',
        trustScore: 35,
        status: 'High Risk',
        complaintsCount: 17,
        coordinates: { latitude: 12.9676, longitude: 77.5916 },
      }
    ];

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, 'pharmacies'));
      if (snapshot.exists()) {
        return Object.values(snapshot.val()) as PharmacyItem[];
      } else {
        // Initialize pharmacies in Realtime DB if empty
        for (const pharm of defaultPharmacies) {
          await set(ref(database, `pharmacies/${pharm.id}`), pharm);
        }
        return defaultPharmacies;
      }
    } catch (e) {
      console.error(e);
      return defaultPharmacies;
    }
  },

  async reportPharmacy(pharmacyId: string, complaintDetails: string): Promise<void> {
    const user = auth.currentUser;
    const reportRef = ref(database, `pharmacies/${pharmacyId}`);
    try {
      const snapshot = await get(reportRef);
      if (snapshot.exists()) {
        const pharmacy = snapshot.val() as PharmacyItem;
        const newComplaints = pharmacy.complaintsCount + 1;
        const newScore = Math.max(10, 96 - newComplaints * 5);
        let newStatus: 'Trusted' | 'Under Observation' | 'High Risk' = 'Trusted';
        
        if (newScore < 50) newStatus = 'High Risk';
        else if (newScore < 85) newStatus = 'Under Observation';

        await update(reportRef, {
          complaintsCount: newComplaints,
          trustScore: newScore,
          status: newStatus,
        });

        // Save report entry
        const userReportRef = push(ref(database, 'pharmacy_complaints'));
        await set(userReportRef, {
          pharmacyId,
          reporterId: user ? user.uid : 'anonymous',
          details: complaintDetails,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error reporting pharmacy:', error);
    }
  },

  // --- SIDE EFFECT COMMUNITY HUB (Module 6) ---
  
  async submitSideEffect(report: Omit<SideEffectReport, 'reportedAt'>): Promise<void> {
    const user = auth.currentUser;
    const sideEffectsRef = ref(database, 'side_effects');
    const newReportRef = push(sideEffectsRef);
    
    await set(newReportRef, {
      ...report,
      reportedAt: new Date().toISOString(),
      reporterId: user ? user.uid : 'anonymous',
    });
  },

  async getSideEffects(medicineName?: string): Promise<SideEffectReport[]> {
    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, 'side_effects'));
      if (snapshot.exists()) {
        const allReports = Object.values(snapshot.val()) as SideEffectReport[];
        if (medicineName) {
          return allReports.filter(r => r.medicineName.toLowerCase() === medicineName.toLowerCase());
        }
        return allReports;
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // --- GOVERNMENT EMERGENCY & DRUG INSPECTOR (Module 10) ---
  
  async submitInspectorAlert(report: Omit<InspectorReport, 'status' | 'reportedAt'>): Promise<string> {
    const user = auth.currentUser;
    const reportsRef = ref(database, 'inspector_reports');
    const newReportRef = push(reportsRef);
    const id = newReportRef.key as string;

    const data: InspectorReport = {
      ...report,
      id,
      status: 'Submitted',
      reportedAt: new Date().toISOString(),
    };

    await set(newReportRef, data);
    
    // Also save user correlation for status tracking
    if (user) {
      await set(ref(database, `users/${user.uid}/reports/${id}`), {
        reportId: id,
        pharmacyName: report.pharmacyName,
        medicineName: report.medicineName,
        status: 'Submitted',
        updatedAt: new Date().toISOString(),
      });
    }

    return id;
  },

  async getInspectorReports(): Promise<InspectorReport[]> {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `users/${user.uid}/reports`));
      if (snapshot.exists()) {
        const userReports = snapshot.val();
        const reportIds = Object.keys(userReports);
        
        const fullReports: InspectorReport[] = [];
        for (const id of reportIds) {
          const snapshotDetail = await get(child(dbRef, `inspector_reports/${id}`));
          if (snapshotDetail.exists()) {
            fullReports.push(snapshotDetail.val() as InspectorReport);
          }
        }
        return fullReports;
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }
};
