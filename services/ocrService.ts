export interface OCRResult {
  name: string;
  expiryDate: string; // ISO String
  batchNumber: string;
  manufacturer: string;
  trustScore: number;
  riskLevel: 'Likely Genuine' | 'Needs Verification' | 'High Risk';
  verificationDetails: string[];
  refImagePlaceholder: string; // reference pattern SVG shape descriptor
  scannedImagePlaceholder: string; // scanned pattern SVG shape descriptor
}

export const ocrService = {
  async processPackagingImage(imageUri: string): Promise<OCRResult> {
    // Simulate real-world network and AI model processing latency (2.2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2200));

    // Array of standard drugs with various levels of risk and expiries to allow thorough user testing
    const parsedDataTemplates: OCRResult[] = [
      {
        name: 'Lipitor (Atorvastatin)',
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // active (6 months)
        batchNumber: 'LP-99824',
        manufacturer: 'Pfizer Inc.',
        trustScore: 98,
        riskLevel: 'Likely Genuine',
        verificationDetails: [
          'Barcode structure matches database reference.',
          'Embossed logo pattern matches exact manufacturer dimensions.',
          'Font alignment and kerning consistent with genuine packaging.',
          'Batch history is registered and active.'
        ],
        refImagePlaceholder: 'M10 50 L90 50 M50 10 L50 90', // straight grid
        scannedImagePlaceholder: 'M10 50 L90 50 M50 10 L50 90'
      },
      {
        name: 'Metformin HCl 500mg',
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // near expiry (15 days)
        batchNumber: 'MET-4410-X',
        manufacturer: 'Bristol-Myers Squibb',
        trustScore: 95,
        riskLevel: 'Likely Genuine',
        verificationDetails: [
          'Packaging contains correct holographic markings.',
          'OCR text extraction matches metadatabase indices.',
          'Minor packaging crease detected - text remains legible.',
          'Batch serial sequence validates correctly.'
        ],
        refImagePlaceholder: 'M20 20 H80 V80 H20 Z', // solid box
        scannedImagePlaceholder: 'M20 20 H80 V80 H20 Z'
      },
      {
        name: 'Panadol Extra Strength',
        expiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // expired (5 days ago)
        batchNumber: 'PAN-7821-B',
        manufacturer: 'GlaxoSmithKline',
        trustScore: 94,
        riskLevel: 'Likely Genuine',
        verificationDetails: [
          'Batch registered under GSK international register.',
          'Standard thermal blister pack verification succeeded.',
          'WARNING: Product has passed its expiration date.'
        ],
        refImagePlaceholder: 'M50 20 L80 80 H20 Z', // triangle
        scannedImagePlaceholder: 'M50 20 L80 80 H20 Z'
      },
      {
        name: 'Aspirin Cardio 100mg',
        expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        batchNumber: 'ASP-UNKNOWN-9',
        manufacturer: 'Bayer Pharmaceuticals (Imitation?)',
        trustScore: 48,
        riskLevel: 'Needs Verification',
        verificationDetails: [
          'WARNING: Secondary packaging font does not match official Bayer standard.',
          'Batch ID registered but flagged with unusual logistics tracking.',
          'Slight packaging color tint variance (more cyan than reference).',
          'Self-verification recommended at nearest authorized chemist.'
        ],
        refImagePlaceholder: 'M10 10 L90 90 M90 10 L10 90', // X shape
        scannedImagePlaceholder: 'M10 12 L88 90 M92 10 L12 88' // slightly offset X (defect)
      },
      {
        name: 'Viagra 100mg (Counterfeit Alert)',
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        batchNumber: 'VIA-FAKE-88',
        manufacturer: 'Unlicensed Manufacturer (Flagged)',
        trustScore: 12,
        riskLevel: 'High Risk',
        verificationDetails: [
          'CRITICAL: Hologram sticker missing or replaced with cheap copy.',
          'CRITICAL: Batch number belongs to a known counterfeit recall list.',
          'CRITICAL: Font kerning and alignment contains multiple typos.',
          'DANGER: Do not consume. Immediately report this batch via Government Alert.'
        ],
        refImagePlaceholder: 'M50 50 C50 20 80 50 50 80 C20 50 50 20 50 50', // smooth drop shape
        scannedImagePlaceholder: 'M50 50 L80 80 L20 80 Z' // completely wrong shape
      }
    ];

    // Pick a random template to simulate scanning different products
    const randomIndex = Math.floor(Math.random() * parsedDataTemplates.length);
    return parsedDataTemplates[randomIndex];
  }
};
