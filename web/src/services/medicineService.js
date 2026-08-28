// Web Medicine Catalog & Information Search Service — Shared Database Parity

export const databaseMedicines = [
  {
    id: 'med_c1',
    name: 'Paracetamol',
    genericName: 'Paracetamol / Acetaminophen',
    category: 'Pain Relief',
    type: 'Tablet',
    strength: '500mg',
    price: '$4.50',
    manufacturer: 'GSK Pharma',
    tag: 'IN STOCK',
    desc: 'Used for relieving mild to moderate pain including headache, migraine, muscle ache.',
    purpose: 'Relief of mild to moderate pain (headache, muscle ache, toothache) and fever reduction.',
    conditions: 'Headache, fever, body ache, toothache, minor arthritis pain.',
    usage: 'Take 1-2 tablets every 4-6 hours as needed. Do not exceed 8 tablets (4000mg) in 24 hours.',
    dosageInfo: 'Adults: 500mg - 1000mg per dose. Children: Consult doctor for weight-based dosing.',
    precautions: 'Severe liver damage may occur if you take more than the maximum daily amount or consume with alcohol.',
    contraindications: 'Hypersensitivity to acetaminophen. Severe hepatic impairment.',
    sideEffects: 'Generally well tolerated. Rare cases of skin rash or allergic reactions.',
    warningSigns: 'Stop use immediately if skin redness or severe rash develops.',
    interactions: 'Warfarin, other acetaminophen-containing products, alcohol.',
    storage: 'Store below 30°C (86°F) in a dry place. Protect from light.',
    safetyInfo: 'Keep out of reach of children. Use only under adult supervision.',
    dosageTable: [
      { group: 'Adults (18+ yrs)', desc: '500mg-1000mg every 4-6 hours (max 4g/day)' },
      { group: 'Children (6-12 yrs)', desc: '250mg-500mg every 4-6 hours (max 2g/day)' }
    ],
    instructionsList: [
      'Take with a full glass of water.',
      'Can be taken with or without food.',
      'Do not take with other acetaminophen medications.'
    ],
    criticalWarnings: [
      { title: 'HEPATOTOXICITY', desc: 'Overdose can lead to acute liver failure.' }
    ],
    sideEffectsCommon: ['Nausea', 'Sleepiness'],
    sideEffectsSerious: ['Stevens-Johnson syndrome', 'Anaphylaxis']
  },
  {
    id: 'med_c2',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    category: 'Antibiotics',
    type: 'Capsule',
    strength: '500mg',
    price: '$12.00',
    manufacturer: 'Pfizer Inc.',
    tag: 'PRESCRIPTION',
    desc: 'A penicillin-type antibiotic used to treat various bacterial infections like pneumonia and bronchitis.',
    purpose: 'Treatment of infections caused by susceptible strains of bacteria.',
    conditions: 'Strep throat, middle ear infections, pneumonia, urinary tract infections.',
    usage: 'Take 500mg every 8 hours or 875mg every 12 hours, with or without food.',
    dosageInfo: 'Complete the entire prescribed course even if symptoms disappear early.',
    precautions: 'Check for history of penicillin allergy. Prolonged use may result in fungal overgrowth.',
    contraindications: 'Serious hypersensitivity reactions to penicillin or other beta-lactams.',
    sideEffects: 'Diarrhea, nausea, vomiting, rash, vaginal yeast infections.',
    warningSigns: 'Contact doctor immediately if severe watery or bloody diarrhea develops.',
    interactions: 'Oral contraceptives (decreased efficacy), Probenecid, Allopurinol.',
    storage: 'Store capsules at room temp 20-25°C.',
    safetyInfo: 'Not effective against viral infections like colds or the flu.',
    dosageTable: [
      { group: 'Adults (18+ yrs)', desc: '500mg every 8 hours or 875mg every 12 hours' },
      { group: 'Children (3 months+)', desc: '20-45 mg/kg/day in divided doses based on severity' }
    ],
    instructionsList: [
      'Take with or without food.',
      'Finish the complete bottle even if you feel better.'
    ],
    criticalWarnings: [
      { title: 'PENICILLIN ALLERGY', desc: 'Can trigger life-threatening allergic reactions.' }
    ],
    sideEffectsCommon: ['Mild diarrhea', 'Nausea'],
    sideEffectsSerious: ['Clostridioides difficile-associated diarrhea', 'Anaphylaxis']
  },
  {
    id: 'med_c3',
    name: 'Cetirizine',
    genericName: 'Cetirizine Hydrochloride',
    category: 'Allergy',
    type: 'Tablet',
    strength: '10mg',
    price: '$8.25',
    manufacturer: 'Bayer',
    tag: 'IN STOCK',
    desc: 'An antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, and sneezing.',
    purpose: 'Relief of allergy symptoms and chronic urticaria (hives).',
    conditions: 'Hay fever, allergic rhinitis, chronic hives, pollen allergy.',
    usage: 'Take 10mg once daily. Do not exceed 10mg in 24 hours.',
    dosageInfo: 'Adults & Children 6+ yrs: 10mg daily. Elderly: 5mg daily.',
    precautions: 'May cause drowsiness. Use caution when driving or operating machinery.',
    contraindications: 'Severe renal impairment (CrCl < 10 mL/min).',
    sideEffects: 'Drowsiness, fatigue, dry mouth, headache.',
    warningSigns: 'Discontinue if severe allergic swelling of face or throat occurs.',
    interactions: 'Alcohol, CNS depressants, Sedatives.',
    storage: 'Store between 20° to 25°C.',
    safetyInfo: 'Avoid excessive alcohol consumption while taking cetirizine.',
    dosageTable: [
      { group: 'Adults (18-64 yrs)', desc: '10mg once daily' },
      { group: 'Seniors (65+ yrs)', desc: '5mg once daily' }
    ],
    instructionsList: [
      'Can be taken with or without food.',
      'Take at bedtime if drowsiness occurs.'
    ],
    criticalWarnings: [
      { title: 'DROWSINESS RISK', desc: 'Can impair alertness and motor coordination.' }
    ],
    sideEffectsCommon: ['Drowsiness', 'Dry mouth', 'Headache'],
    sideEffectsSerious: ['Angioedema', 'Severe hypotension']
  },
  {
    id: 'med_c4',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'Pain Relief',
    type: 'Tablet',
    strength: '400mg',
    price: '$6.50',
    manufacturer: 'Advil Corp',
    tag: 'IN STOCK',
    desc: 'Nonsteroidal anti-inflammatory drug (NSAID) used to reduce pain, fever, and inflammation.',
    purpose: 'Reduction of fever and relief of minor aches, pains, headaches, backache, and toothache.',
    conditions: 'Muscle soreness, arthritis, dental pain, fever, menstrual cramps.',
    usage: 'Take 1 tablet (400mg) every 4 to 6 hours while symptoms persist. Do not exceed 1200mg/day.',
    dosageInfo: 'Take with food or milk to minimize potential stomach upset.',
    precautions: 'NSAIDs may increase the risk of serious cardiovascular events and stomach bleeding.',
    contraindications: 'History of asthma or allergic reactions after taking aspirin or NSAIDs.',
    sideEffects: 'Heartburn, nausea, dizziness, mild stomach discomfort.',
    warningSigns: 'Stop use immediately if signs of stomach bleeding occur.',
    interactions: 'Aspirin, oral anticoagulants, corticosteroids, SSRIs.',
    storage: 'Store between 20-25°C.',
    safetyInfo: 'Avoid use in late pregnancy.',
    dosageTable: [
      { group: 'Adults (12+ yrs)', desc: '200mg - 400mg every 4-6 hours (max 1200mg/day)' }
    ],
    instructionsList: [
      'Take with food or milk.',
      'Do not take longer than 10 days without consulting doctor.'
    ],
    criticalWarnings: [
      { title: 'GI BLEEDING', desc: 'Can cause stomach bleeding in vulnerable individuals.' }
    ],
    sideEffectsCommon: ['Heartburn', 'Nausea'],
    sideEffectsSerious: ['Gastrointestinal ulceration', 'Kidney damage']
  },
  {
    id: 'med_c5',
    name: 'Azithromycin',
    genericName: 'Azithromycin dihydrate',
    category: 'Antibiotics',
    type: 'Tablet',
    strength: '250mg',
    price: '$22.50',
    manufacturer: 'Sandoz',
    tag: 'PRESCRIPTION',
    desc: 'A macrolide antibiotic used to treat a wide variety of bacterial infections.',
    purpose: 'Treatment of respiratory, ear, skin, and throat bacterial infections.',
    conditions: 'Pneumonia, bronchitis, sinusitis, tonsillitis, skin infections.',
    usage: 'Take 500mg on Day 1, followed by 250mg once daily on Days 2 through 5.',
    dosageInfo: 'Take once daily. Complete the full 5-day therapy course.',
    precautions: 'Use caution in patients with known prolongation of QT interval.',
    contraindications: 'Hypersensitivity to azithromycin or macrolides.',
    sideEffects: 'Diarrhea, nausea, abdominal pain, headache.',
    warningSigns: 'Contact doctor if irregular heartbeat or severe dizziness develops.',
    interactions: 'Warfarin, Antacids, Digoxin.',
    storage: 'Store between 15°C and 30°C.',
    safetyInfo: 'Not effective for viral cold or influenza.',
    dosageTable: [
      { group: 'Adults (18+ yrs)', desc: '500mg Day 1, then 250mg daily Days 2-5' }
    ],
    instructionsList: [
      'Take once daily at the same time.',
      'Finish full 5-day course.'
    ],
    criticalWarnings: [
      { title: 'QT PROLONGATION', desc: 'May affect heart electrical rhythms.' }
    ],
    sideEffectsCommon: ['Loose stools', 'Nausea'],
    sideEffectsSerious: ['Liver toxicity', 'Anaphylaxis']
  },
  {
    id: 'med_c6',
    name: 'Omeprazole',
    genericName: 'Omeprazole magnesium',
    category: 'Gastrointestinal',
    type: 'Capsule',
    strength: '20mg',
    price: '$9.75',
    manufacturer: 'AstraZeneca',
    tag: 'IN STOCK',
    desc: 'Proton pump inhibitor (PPI) that decreases stomach acid production.',
    purpose: 'Relief of frequent heartburn and treatment of acid reflux (GERD).',
    conditions: 'Heartburn, GERD, acid reflux, stomach ulcers.',
    usage: 'Take 1 capsule (20mg) daily in the morning before breakfast.',
    dosageInfo: 'Take for up to 14 days or as prescribed by a physician.',
    precautions: 'Long-term PPI use may reduce vitamin B12 and magnesium levels.',
    contraindications: 'Known allergy to omeprazole or benzimidazoles.',
    sideEffects: 'Headache, abdominal pain, flatulence, nausea.',
    warningSigns: 'Seek medical evaluation if chest pain or difficulty swallowing occurs.',
    interactions: 'Clopidogrel, St John’s Wort, Ketoconazole.',
    storage: 'Store at 15-30°C in dry conditions.',
    safetyInfo: 'Swallow capsule whole; do not chew.',
    dosageTable: [
      { group: 'Adults (18+ yrs)', desc: '20mg once daily before breakfast' }
    ],
    instructionsList: [
      'Take 30 minutes before first meal of day.',
      'Swallow capsule whole.'
    ],
    criticalWarnings: [
      { title: 'MAGNESIUM LOSS', desc: 'Prolonged use can cause low blood magnesium.' }
    ],
    sideEffectsCommon: ['Headache', 'Flatulence'],
    sideEffectsSerious: ['C. difficile infection', 'Bone fractures']
  },
  {
    id: 'med_c8',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    category: 'Diabetes',
    type: 'Tablet',
    strength: '500mg',
    price: '$7.80',
    manufacturer: 'Merck',
    tag: 'PRESCRIPTION',
    desc: 'First-line biguanide oral medication for controlling high blood sugar in type 2 diabetes.',
    purpose: 'Lowers blood glucose levels and improves insulin sensitivity in adults with type 2 diabetes.',
    conditions: 'Type 2 diabetes mellitus, insulin resistance, polycystic ovary syndrome (PCOS).',
    usage: 'Take 500mg once or twice daily with meals to reduce stomach discomfort.',
    dosageInfo: 'Gradually titrate dose up to a maximum of 2000mg-2550mg daily under physician guidance.',
    precautions: 'Lactic acidosis is a rare but serious metabolic complication associated with metformin.',
    contraindications: 'Severe renal impairment (eGFR < 30 mL/min/1.73m²), metabolic acidosis.',
    sideEffects: 'Diarrhea, nausea, gas, stomach upset, metallic taste.',
    warningSigns: 'Seek emergency care for severe tiredness, muscle pain, trouble breathing.',
    interactions: 'Iodinated contrast media, Cimetidine, Alcohol.',
    storage: 'Store at 20°C to 25°C. Protect from light.',
    safetyInfo: 'Discontinue prior to intravascular iodinated contrast radiologic procedures.',
    dosageTable: [
      { group: 'Adults', desc: '500mg twice daily or 850mg once daily with meals' }
    ],
    instructionsList: [
      'Take with meals to minimize gastrointestinal upset.',
      'Stay well hydrated throughout the day.'
    ],
    criticalWarnings: [
      { title: 'LACTIC ACIDOSIS', desc: 'Can cause fatal lactic accumulation in renal impairment.' }
    ],
    sideEffectsCommon: ['Diarrhea', 'Nausea', 'Abdominal pain'],
    sideEffectsSerious: ['Lactic acidosis', 'Hypoglycemia (when combined with insulin)']
  },
  {
    id: 'med_c9',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    category: 'Cardiovascular',
    type: 'Tablet',
    strength: '10mg',
    price: '$5.50',
    manufacturer: 'AstraZeneca',
    tag: 'PRESCRIPTION',
    desc: 'ACE inhibitor used to treat high blood pressure, heart failure, and improve survival after heart attack.',
    purpose: 'Lowers blood pressure to prevent strokes, heart attacks, and kidney problems.',
    conditions: 'Hypertension, heart failure, post-myocardial infarction.',
    usage: 'Take 10mg once daily in the morning with or without food.',
    dosageInfo: 'Start at 10mg daily; doctor may titrate up to 40mg daily based on blood pressure response.',
    precautions: 'Do not use during pregnancy as ACE inhibitors can cause fetal death.',
    contraindications: 'History of angioedema related to previous ACE inhibitor treatment.',
    sideEffects: 'Persistent dry cough, dizziness, headache, lightheadedness.',
    warningSigns: 'Seek immediate emergency help if swelling of face, lips, tongue, or throat occurs.',
    interactions: 'Potassium supplements, NSAIDs, Lithium.',
    storage: 'Store between 15°C and 30°C in a dry location.',
    safetyInfo: 'Get up slowly from sitting or lying position to prevent dizziness.',
    dosageTable: [
      { group: 'Adults', desc: '10mg once daily (range 10mg - 40mg/day)' }
    ],
    instructionsList: [
      'Take once daily at the same time each morning.',
      'Check blood pressure regularly.'
    ],
    criticalWarnings: [
      { title: 'FETAL TOXICITY', desc: 'Can cause serious fetal harm or death when used during pregnancy.' }
    ],
    sideEffectsCommon: ['Dry cough', 'Dizziness'],
    sideEffectsSerious: ['Angioedema', 'Renal failure']
  },
  {
    id: 'med_c10',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin calcium',
    category: 'Cardiovascular',
    type: 'Tablet',
    strength: '20mg',
    price: '$14.20',
    manufacturer: 'Pfizer Inc.',
    tag: 'PRESCRIPTION',
    desc: 'HMG-CoA reductase inhibitor (statin) that reduces LDL cholesterol and triglycerides in the blood.',
    purpose: 'Lowers cholesterol and lowers the risk of stroke, heart attack, and other heart complications.',
    conditions: 'Hyperlipidemia, high cholesterol, cardiovascular disease prevention.',
    usage: 'Take 20mg once daily at any time of day, with or without food.',
    dosageInfo: 'Daily dose ranges from 10mg to 80mg once daily based on lipid goals.',
    precautions: 'Unexplained muscle pain, tenderness, or weakness should be reported promptly.',
    contraindications: 'Active liver disease or unexplained persistent elevations of hepatic transaminases.',
    sideEffects: 'Joint pain, diarrhea, throat irritation, mild muscle pain.',
    warningSigns: 'Contact physician immediately if severe muscle weakness or dark urine develops.',
    interactions: 'Grapefruit juice, Clarithromycin, Gemfibrozil, Cyclosporine.',
    storage: 'Store at 20-25°C.',
    safetyInfo: 'Combine with a low-fat, heart-healthy diet for maximum efficacy.',
    dosageTable: [
      { group: 'Adults', desc: '10mg - 20mg once daily (max 80mg/day)' }
    ],
    instructionsList: [
      'Take once daily at any time.',
      'Avoid large quantities of grapefruit juice.'
    ],
    criticalWarnings: [
      { title: 'RHABDOMYOLYSIS', desc: 'Severe muscle breakdown that can cause acute kidney failure.' }
    ],
    sideEffectsCommon: ['Joint pain', 'Mild muscle pain'],
    sideEffectsSerious: ['Rhabdomyolysis', 'Hepatic failure']
  }
];

export const searchMedicines = (queryStr, category = 'ALL') => {
  const q = (queryStr || '').trim().toLowerCase();
  return databaseMedicines.filter(med => {
    const matchesCategory = category === 'ALL' || med.category.toLowerCase() === category.toLowerCase();
    const matchesQuery = !q || 
      med.name.toLowerCase().includes(q) || 
      med.genericName.toLowerCase().includes(q) ||
      med.conditions.toLowerCase().includes(q) ||
      med.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
};
