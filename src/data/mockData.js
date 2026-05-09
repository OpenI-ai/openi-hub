// ─── Startups ────────────────────────────────────────────────────────────────
export const STARTUPS = [
  {
    id: 's1', name: 'TechDefend AI', logo: 'TD', stage: 'Series A',
    sector: 'Defence Electronics', technology: 'Artificial Intelligence',
    trl: 7, deeptech: true, dpiit: 'DIPP123456', gstin: '27AABCT1234A1Z5',
    cin: 'U72900MH2020PTC123456', founded: 2020, employees: 45,
    revenue: 2400000, funding: 8500000, location: 'Bengaluru, KA',
    description: 'AI-powered threat detection and autonomous defense systems for border surveillance.',
    score: 87, watchlisted: true, status: 'Active',
    solutions: ['Autonomous Surveillance Drones', 'AI Threat Detection', 'Edge AI for Battlefield'],
    patents: 3, awards: ['iDEX Winner 2022', 'OpenI Innovation Award 2023'],
    openi_cluster: 'Aeronautics & Unmanned Systems',
    founders: [{ name: 'Arjun Mehta', role: 'CEO', iit: true, ex_defense: false }],
    investors: [{ name: 'Bharat Ventures', amount: 5000000, round: 'Series A' }],
    clients: ['Indian Army', 'BSF', 'DRDO CAIR'],
    milestones: [
      { date: '2020-06', event: 'Incorporated', type: 'founding' },
      { date: '2021-03', event: 'Seed funding ₹1.5Cr', type: 'funding' },
      { date: '2022-06', event: 'iDEX Win', type: 'award' },
      { date: '2023-01', event: 'Series A ₹7Cr', type: 'funding' },
      { date: '2024-03', event: 'Army Pilot Deployment', type: 'traction' },
    ],
    financials: [
      { year: 'FY22', revenue: 800000, burn: 1200000 },
      { year: 'FY23', revenue: 1600000, burn: 1800000 },
      { year: 'FY24', revenue: 2400000, burn: 2100000 },
    ],
    shareholding: [{ name: 'Arjun Mehta', percent: 42 }, { name: 'Bharat Ventures', percent: 35 }, { name: 'ESOP Pool', percent: 23 }],
    board: [{ name: 'Arjun Mehta', designation: 'CEO & Director' }, { name: 'Priya Joshi', designation: 'Independent Director' }],
  },
  {
    id: 's2', name: 'QuantumShield Labs', logo: 'QS', stage: 'Seed',
    sector: 'Cybersecurity', technology: 'Quantum Computing',
    trl: 5, deeptech: true, dpiit: 'DIPP789012', gstin: '07AABCQ5678B1Z2',
    cin: 'U72900DL2021PTC789012', founded: 2021, employees: 18,
    revenue: 600000, funding: 2200000, location: 'New Delhi, DL',
    description: 'Post-quantum cryptography solutions for secure defense communications.',
    score: 91, watchlisted: false, status: 'Active',
    solutions: ['Post-Quantum Encryption', 'Quantum Key Distribution', 'Secure Comms Suite'],
    patents: 5, awards: ['DST Quantum Initiative 2023'],
    openi_cluster: 'Electronics & Communication Systems',
    founders: [{ name: 'Dr. Siddharth Nair', role: 'CEO', iit: true, ex_defense: false }],
    investors: [{ name: 'SIDBI VC', amount: 1500000, round: 'Seed' }],
    clients: ['MeitY', 'NIC'],
    milestones: [
      { date: '2021-09', event: 'Incorporated', type: 'founding' },
      { date: '2022-04', event: 'DST Grant ₹50L', type: 'funding' },
      { date: '2023-06', event: 'DST Quantum Initiative', type: 'award' },
    ],
    financials: [
      { year: 'FY22', revenue: 0, burn: 400000 },
      { year: 'FY23', revenue: 200000, burn: 600000 },
      { year: 'FY24', revenue: 600000, burn: 800000 },
    ],
    shareholding: [{ name: 'Dr. Siddharth Nair', percent: 60 }, { name: 'SIDBI VC', percent: 25 }, { name: 'Co-founders', percent: 15 }],
    board: [{ name: 'Dr. Siddharth Nair', designation: 'CEO & Director' }],
  },
  {
    id: 's3', name: 'AeroSense Dynamics', logo: 'AD', stage: 'Series B',
    sector: 'Aerospace & Defence', technology: 'Sensor Fusion',
    trl: 8, deeptech: true, dpiit: 'DIPP345678', gstin: '29AABCA3456C1Z8',
    cin: 'U72900KA2019PTC345678', founded: 2019, employees: 120,
    revenue: 15000000, funding: 42000000, location: 'Bengaluru, KA',
    description: 'Multi-spectral sensor fusion systems for land, air, and sea defense platforms.',
    score: 94, watchlisted: true, status: 'Incubated',
    solutions: ['Multi-spectral ISR Sensors', 'Radar Signal Processing', 'EO/IR Systems'],
    patents: 12, awards: ['Make in India Excellence 2022', 'OpenI Tech Transfer 2023'],
    openi_cluster: 'Armaments & Combat Engineering',
    founders: [{ name: 'Wing Cdr (Ret.) Ramesh Bhat', role: 'CEO', iit: false, ex_defense: true }],
    investors: [{ name: 'Kalaari Capital', amount: 25000000, round: 'Series B' }],
    clients: ['HAL', 'BEL', 'DRDO IRDE'],
    milestones: [
      { date: '2019-03', event: 'Incorporated', type: 'founding' },
      { date: '2020-06', event: 'Seed ₹2Cr', type: 'funding' },
      { date: '2021-09', event: 'Series A ₹12Cr', type: 'funding' },
      { date: '2022-12', event: 'Make in India Excellence', type: 'award' },
      { date: '2023-06', event: 'Series B ₹30Cr', type: 'funding' },
    ],
    financials: [
      { year: 'FY22', revenue: 5000000, burn: 4000000 },
      { year: 'FY23', revenue: 9000000, burn: 6000000 },
      { year: 'FY24', revenue: 15000000, burn: 9000000 },
    ],
    shareholding: [{ name: 'Ramesh Bhat', percent: 30 }, { name: 'Kalaari Capital', percent: 40 }, { name: 'Series A Investors', percent: 20 }, { name: 'ESOP', percent: 10 }],
    board: [{ name: 'Ramesh Bhat', designation: 'CEO' }, { name: 'Vani Kola', designation: 'Board Member' }],
  },
  {
    id: 's4', name: 'NeuralSoldier Tech', logo: 'NS', stage: 'Pre-seed',
    sector: 'Defence Electronics', technology: 'Edge AI / Neuromorphic',
    trl: 4, deeptech: true, dpiit: 'DIPP901234', gstin: null,
    cin: 'U72900TN2023PTC901234', founded: 2023, employees: 8,
    revenue: 0, funding: 500000, location: 'Chennai, TN',
    description: 'Neuromorphic chips for low-power AI inference in extreme battlefield environments.',
    score: 76, watchlisted: false, status: 'Applied',
    solutions: ['Neuromorphic Processors', 'Low-power Edge AI', 'Battlefield IoT'],
    patents: 1, awards: [],
    openi_cluster: 'Microelectronics & Semiconductors',
    founders: [{ name: 'Dr. Kavya Rajan', role: 'CEO', iit: true, ex_defense: false }],
    investors: [],
    clients: [],
    milestones: [{ date: '2023-04', event: 'Incorporated', type: 'founding' }],
    financials: [],
    shareholding: [{ name: 'Dr. Kavya Rajan', percent: 70 }, { name: 'Co-founders', percent: 30 }],
    board: [{ name: 'Dr. Kavya Rajan', designation: 'CEO & Director' }],
  },
  {
    id: 's5', name: 'RoboCombat Systems', logo: 'RC', stage: 'Series A',
    sector: 'Robotics & Autonomous Systems', technology: 'Robotics / ROS2',
    trl: 6, deeptech: true, dpiit: 'DIPP567890', gstin: '36AABCR5678D1Z1',
    cin: 'U72900TS2020PTC567890', founded: 2020, employees: 62,
    revenue: 8000000, funding: 18000000, location: 'Hyderabad, TS',
    description: 'Ground unmanned vehicles and explosive ordnance disposal robots for army deployment.',
    score: 88, watchlisted: true, status: 'Active',
    solutions: ['Unmanned Ground Vehicles', 'EOD Robots', 'Autonomous Logistics Bots'],
    patents: 7, awards: ['iDEX DIO Winner 2023'],
    openi_cluster: 'Unmanned Systems & Robotics',
    founders: [{ name: 'Vikram Rao', role: 'CEO', iit: false, ex_defense: false }],
    investors: [{ name: 'Iron Pillar', amount: 12000000, round: 'Series A' }],
    clients: ['Army EME Corps', 'DRDO R&DE(E)'],
    milestones: [
      { date: '2020-01', event: 'Founded', type: 'founding' },
      { date: '2021-08', event: 'Seed ₹3Cr', type: 'funding' },
      { date: '2023-03', event: 'iDEX DIO Win', type: 'award' },
      { date: '2023-09', event: 'Series A ₹15Cr', type: 'funding' },
    ],
    financials: [
      { year: 'FY22', revenue: 2000000, burn: 3000000 },
      { year: 'FY23', revenue: 5000000, burn: 4500000 },
      { year: 'FY24', revenue: 8000000, burn: 6000000 },
    ],
    shareholding: [{ name: 'Vikram Rao', percent: 38 }, { name: 'Iron Pillar', percent: 40 }, { name: 'Others', percent: 22 }],
    board: [{ name: 'Vikram Rao', designation: 'CEO' }],
  },
  {
    id: 's6', name: 'BioDefend Sciences', logo: 'BD', stage: 'Seed',
    sector: 'Life Sciences & CBRN', technology: 'Biotech / CBRN Defence',
    trl: 5, deeptech: true, dpiit: 'DIPP234567', gstin: '07AABCB2345E1Z3',
    cin: 'U72900DL2022PTC234567', founded: 2022, employees: 22,
    revenue: 1200000, funding: 3500000, location: 'New Delhi, DL',
    description: 'Rapid detection and neutralisation systems for biological and chemical threats.',
    score: 82, watchlisted: false, status: 'Active',
    solutions: ['Bio-threat Detection Kits', 'Chemical Agent Sensors', 'CBRN Protective Gear'],
    patents: 2, awards: ['DST Innovation Award 2023'],
    openi_cluster: 'Life Sciences & CBRN',
    founders: [{ name: 'Dr. Ananya Gupta', role: 'CEO', iit: false, ex_defense: false }],
    investors: [{ name: 'Ankur Capital', amount: 2500000, round: 'Seed' }],
    clients: ['DRDO DRDE', 'CBRN Defence Wing'],
    milestones: [
      { date: '2022-02', event: 'Founded', type: 'founding' },
      { date: '2022-11', event: 'Seed ₹2.5Cr', type: 'funding' },
      { date: '2023-07', event: 'DST Innovation Award', type: 'award' },
    ],
    financials: [
      { year: 'FY23', revenue: 400000, burn: 700000 },
      { year: 'FY24', revenue: 1200000, burn: 1100000 },
    ],
    shareholding: [{ name: 'Dr. Ananya Gupta', percent: 55 }, { name: 'Ankur Capital', percent: 30 }, { name: 'Co-founder', percent: 15 }],
    board: [{ name: 'Dr. Ananya Gupta', designation: 'CEO & Director' }],
  },
];

// ─── Projects ─────────────────────────────────────────────────────────────────
export const PROJECTS = [
  {
    id: 'p1', code: 'OI/2023/CAIR/AI-001', title: 'AI-based Border Surveillance System',
    startup: 'TechDefend AI', startupId: 's1', lab: 'DRDO CAIR', pm: 'Dr. Priya Sharma',
    grant: 15000000, disbursed: 9000000, status: 'Active', health: 'green',
    startDate: '2023-04-01', endDate: '2025-03-31',
    milestones: [
      { id: 'm1', title: 'System Design & Architecture', due: '2023-07-31', status: 'completed', disbursement: 3000000 },
      { id: 'm2', title: 'Prototype Development', due: '2023-12-31', status: 'completed', disbursement: 3000000 },
      { id: 'm3', title: 'Lab Testing & Validation', due: '2024-06-30', status: 'completed', disbursement: 3000000 },
      { id: 'm4', title: 'Field Trial Phase 1', due: '2024-12-31', status: 'active', disbursement: 3000000 },
      { id: 'm5', title: 'Final Delivery & Documentation', due: '2025-03-31', status: 'upcoming', disbursement: 3000000 },
    ],
    reviews: [
      { date: '2023-09-15', reviewer: 'Dr. Amit Singh', status: 'On Track', notes: 'Architecture approved. Team is well-structured.' },
      { date: '2024-01-20', reviewer: 'Dr. Priya Sharma', status: 'On Track', notes: 'Prototype demonstrated successfully. Minor calibration issues noted.' },
    ],
    documents: [
      { name: 'Project Proposal', type: 'pdf', date: '2023-03-15' },
      { name: 'M1 Completion Report', type: 'pdf', date: '2023-07-25' },
      { name: 'M2 Prototype Demo Video', type: 'mp4', date: '2023-12-20' },
    ],
  },
  {
    id: 'p2', code: 'OI/2023/DRDL/QC-002', title: 'Post-Quantum Cryptography for Missile Command',
    startup: 'QuantumShield Labs', startupId: 's2', lab: 'DRDO DRDL', pm: 'Dr. Rajesh Kumar',
    grant: 8000000, disbursed: 3200000, status: 'Active', health: 'amber',
    startDate: '2023-07-01', endDate: '2025-06-30',
    milestones: [
      { id: 'm1', title: 'Algorithm Selection & Analysis', due: '2023-10-31', status: 'completed', disbursement: 1600000 },
      { id: 'm2', title: 'Hardware Integration Design', due: '2024-04-30', status: 'completed', disbursement: 1600000 },
      { id: 'm3', title: 'Prototype Testing', due: '2024-10-31', status: 'overdue', disbursement: 1600000 },
      { id: 'm4', title: 'System Integration', due: '2025-03-31', status: 'upcoming', disbursement: 1600000 },
      { id: 'm5', title: 'Final Certification', due: '2025-06-30', status: 'upcoming', disbursement: 1600000 },
    ],
    reviews: [
      { date: '2024-02-10', reviewer: 'Dr. Rajesh Kumar', status: 'Minor Delays', notes: 'Hardware procurement delayed. Team working on alternatives.' },
    ],
    documents: [{ name: 'Project Proposal', type: 'pdf', date: '2023-06-20' }],
  },
  {
    id: 'p3', code: 'OI/2022/IRDE/SEN-003', title: 'Multi-spectral Sensor Array for LCA Tejas',
    startup: 'AeroSense Dynamics', startupId: 's3', lab: 'DRDO IRDE', pm: 'Dr. Priya Sharma',
    grant: 35000000, disbursed: 28000000, status: 'Near Completion', health: 'green',
    startDate: '2022-01-01', endDate: '2024-12-31',
    milestones: [
      { id: 'm1', title: 'Sensor Design', due: '2022-06-30', status: 'completed', disbursement: 7000000 },
      { id: 'm2', title: 'Manufacturing & Testing', due: '2022-12-31', status: 'completed', disbursement: 7000000 },
      { id: 'm3', title: 'Integration with LCA Systems', due: '2023-06-30', status: 'completed', disbursement: 7000000 },
      { id: 'm4', title: 'Flight Trials', due: '2024-06-30', status: 'completed', disbursement: 7000000 },
      { id: 'm5', title: 'Certification & Delivery', due: '2024-12-31', status: 'active', disbursement: 7000000 },
    ],
    reviews: [],
    documents: [{ name: 'Project Proposal', type: 'pdf', date: '2021-12-15' }],
  },
];

// ─── Evaluation Programs ───────────────────────────────────────────────────────
export const PROGRAMS = [
  {
    id: 'prog1', name: 'iDEX DIO Challenge – AI for Defence Round 5',
    lab: 'OpenI HQ / iDEX', type: 'Challenge', status: 'Open',
    opens: '2024-02-01', closes: '2024-04-30',
    description: 'Seeking AI-based solutions for real-time threat detection in border surveillance.',
    applications: 42, shortlisted: 8, selected: 0,
    criteria: [
      { name: 'Technology Readiness', weight: 30 },
      { name: 'Innovation & Novelty', weight: 25 },
      { name: 'Team Capability', weight: 20 },
      { name: 'Commercialisation Potential', weight: 15 },
      { name: 'Delivery Timeline', weight: 10 },
    ],
  },
  {
    id: 'prog2', name: 'OpenI DeepTech Incubation Cohort 4 – Cyber & Quantum',
    lab: 'DRDO CAIR', type: 'Incubation', status: 'Under Review',
    opens: '2023-11-01', closes: '2024-01-31',
    description: 'Incubation support for quantum computing and cybersecurity startups relevant to defense.',
    applications: 28, shortlisted: 6, selected: 3,
    criteria: [
      { name: 'DeepTech Qualification Score', weight: 35 },
      { name: 'Founder Background', weight: 25 },
      { name: 'IP & Patents', weight: 20 },
      { name: 'Market Potential', weight: 20 },
    ],
  },
  {
    id: 'prog3', name: 'OpenI Robotics & Autonomous Systems Challenge',
    lab: 'DRDO R&DE(E)', type: 'Challenge', status: 'Completed',
    opens: '2023-06-01', closes: '2023-09-30',
    description: 'Ground autonomous vehicles and robotic systems for EOD and logistics.',
    applications: 35, shortlisted: 10, selected: 4,
    criteria: [
      { name: 'Technical Solution', weight: 40 },
      { name: 'Field Readiness (Tech Readiness Level)', weight: 30 },
      { name: 'Cost Effectiveness', weight: 20 },
      { name: 'Team Experience', weight: 10 },
    ],
  },
];

// ─── Cohorts ──────────────────────────────────────────────────────────────────
export const COHORTS = [
  {
    id: 'c1', name: 'DIA-CoE Bengaluru Cohort 4 – Aerospace & Robotics',
    lab: 'DRDO GTRE', incubator: 'NSRCEL IIM Bangalore', status: 'Active',
    start: '2023-10-01', end: '2024-09-30', maxStartups: 10,
    members: ['s1', 's3', 's5'], graduated: 0,
    mentors: ['m1', 'm2'],
  },
  {
    id: 'c2', name: 'DIA-CoE Delhi Cohort 3 – Cyber & Quantum',
    lab: 'DRDO CAIR', incubator: 'IIT Delhi FITT', status: 'Active',
    start: '2024-01-01', end: '2024-12-31', maxStartups: 8,
    members: ['s2', 's6'], graduated: 0,
    mentors: ['m3'],
  },
  {
    id: 'c3', name: 'DIA-CoE Hyderabad Cohort 2 – Materials & CBRN',
    lab: 'DRDO DRDL', incubator: 'T-Hub Hyderabad', status: 'Graduated',
    start: '2022-07-01', end: '2023-06-30', maxStartups: 8,
    members: [], graduated: 6,
    mentors: [],
  },
];

// ─── Mentors / SMEs ────────────────────────────────────────────────────────────
export const MENTORS = [
  {
    id: 'm1', name: 'Prof. Sunita Rao', avatar: 'SR', org: 'IIT Delhi',
    designation: 'Professor, Dept of CS', expertise: ['AI/ML', 'Computer Vision', 'Robotics'],
    background: 'academia', sessions: 24, rating: 4.8, available: true,
    bio: '20+ years in AI research. Former advisor to DARPA and DST. Specializes in battlefield AI applications.',
    certifications: ['PhD IIT Bombay', 'Postdoc MIT CSAIL'],
    assignedStartups: ['s1', 's5'],
  },
  {
    id: 'm2', name: 'Air Marshal (Ret.) K.P. Singh', avatar: 'KS', org: 'Indian Air Force (Retd.)',
    designation: 'Former AOC-in-C Maintenance Command', expertise: ['Aerospace Systems', 'MRO', 'Defence Procurement'],
    background: 'retired_defense', sessions: 18, rating: 4.9, available: true,
    bio: '35 years of IAF service. Deep expertise in aviation systems, DRDO coordination and defense procurement policy.',
    certifications: ['NDC', 'DSSC Wellington'],
    assignedStartups: ['s3'],
  },
  {
    id: 'm3', name: 'Dr. Vikash Gupta', avatar: 'VG', org: 'DRDO CAIR (Retd.)',
    designation: 'Former Scientist G', expertise: ['Cybersecurity', 'Cryptography', 'Signal Processing'],
    background: 'ex_drdo', sessions: 31, rating: 4.7, available: false,
    bio: 'Retired DRDO scientist with 28 years in information security and electronic warfare systems.',
    certifications: ['PhD IISc Bangalore', 'CISSP'],
    assignedStartups: ['s2'],
  },
  {
    id: 'm4', name: 'Ms. Anita Krishnan', avatar: 'AK', org: 'Kalaari Capital',
    designation: 'Partner', expertise: ['Deep Tech Investment', 'Go-to-Market', 'Fundraising'],
    background: 'industry', sessions: 15, rating: 4.6, available: true,
    bio: 'Partner at Kalaari Capital focusing on deep tech and defence-tech startups. Led 12 investments in the space.',
    certifications: ['MBA IIM Ahmedabad'],
    assignedStartups: ['s3'],
  },
];

// ─── IPR Records ───────────────────────────────────────────────────────────────
export const IPR_RECORDS = [
  {
    id: 'ipr1', title: 'AI-based Multi-object Tracking System for Aerial Surveillance',
    startup: 'TechDefend AI', startupId: 's1', project: 'OI/2023/CAIR/AI-001',
    type: 'Patent', applicationNo: 'IN202311045678', filingDate: '2023-06-15',
    grantDate: null, expiryDate: '2043-06-15', jurisdiction: ['IN', 'US', 'EP'],
    status: 'Published', openi_share: 20, startup_share: 80,
    licensing: 'Unlicensed', inventors: ['Arjun Mehta', 'Dr. Priya Sharma (DRDO)'],
  },
  {
    id: 'ipr2', title: 'Quantum-Resistant Key Encapsulation Mechanism for Resource-Constrained Devices',
    startup: 'QuantumShield Labs', startupId: 's2', project: null,
    type: 'Patent', applicationNo: 'IN202221089012', filingDate: '2022-08-20',
    grantDate: '2024-01-10', expiryDate: '2042-08-20', jurisdiction: ['IN', 'PCT'],
    status: 'Granted', openi_share: 0, startup_share: 100,
    licensing: 'Licensed (Non-exclusive)', inventors: ['Dr. Siddharth Nair'],
  },
  {
    id: 'ipr3', title: 'QuantumShield™ - Registered Trademark',
    startup: 'QuantumShield Labs', startupId: 's2', project: null,
    type: 'Trademark', applicationNo: 'TM202312345', filingDate: '2023-01-10',
    grantDate: '2023-09-22', expiryDate: '2033-01-10', jurisdiction: ['IN'],
    status: 'Granted', openi_share: 0, startup_share: 100,
    licensing: 'N/A', inventors: [],
  },
  {
    id: 'ipr4', title: 'Multi-spectral Sensor Fusion Algorithm for Airborne ISR Platforms',
    startup: 'AeroSense Dynamics', startupId: 's3', project: 'OI/2022/IRDE/SEN-003',
    type: 'Patent', applicationNo: 'IN202111034567', filingDate: '2021-11-03',
    grantDate: '2023-05-18', expiryDate: '2041-11-03', jurisdiction: ['IN', 'US', 'EP', 'IL'],
    status: 'Granted', openi_share: 30, startup_share: 70,
    licensing: 'Licensed (Exclusive – HAL)', inventors: ['Wing Cdr Ramesh Bhat', 'Dr. M. Krishnan (DRDO)'],
  },
];

// ─── Infrastructure Resources ─────────────────────────────────────────────────
export const INFRASTRUCTURE = [
  {
    id: 'inf1', name: 'High-Performance GPU Cluster (PARAM Siddhi)', type: 'HPC',
    location: 'C-DAC Pune', provider: 'C-DAC / NIC',
    capacity: '4 nodes, 64 A100 GPUs', available: true,
    costPerHour: 500, minBooking: 4, maxBooking: 168,
    description: 'National supercomputing cluster for deep learning and simulation workloads.',
    bookings: [
      { startup: 'TechDefend AI', from: '2024-03-01', to: '2024-03-07', status: 'Completed' },
      { startup: 'QuantumShield Labs', from: '2024-04-10', to: '2024-04-12', status: 'Upcoming' },
    ],
  },
  {
    id: 'inf2', name: 'EMI/EMC Test Chamber', type: 'Test Facility',
    location: 'DRDO SAG Delhi', provider: 'DRDO SAG',
    capacity: '10m chamber, MIL-STD-461 certified', available: true,
    costPerHour: 2000, minBooking: 8, maxBooking: 40,
    description: 'MIL-STD-461G certified electromagnetic compatibility testing for defense electronics.',
    bookings: [
      { startup: 'AeroSense Dynamics', from: '2024-03-18', to: '2024-03-22', status: 'Upcoming' },
    ],
  },
  {
    id: 'inf3', name: 'Anechoic Chamber – Radar Cross-Section Testing', type: 'Test Facility',
    location: 'DRDO LRDE Bengaluru', provider: 'DRDO LRDE',
    capacity: 'Full-scale RCS measurement, 1–40 GHz', available: false,
    costPerHour: 5000, minBooking: 16, maxBooking: 80,
    description: 'Precision radar cross-section measurement facility for stealth technology validation.',
    bookings: [
      { startup: 'AeroSense Dynamics', from: '2024-03-05', to: '2024-03-12', status: 'Active' },
    ],
  },
  {
    id: 'inf4', name: 'Co-working & Prototyping Space', type: 'Incubation Space',
    location: 'DIA-CoE Bengaluru, GTRE Campus', provider: 'DRDO GTRE',
    capacity: '30 workstations, 3 labs, conference rooms', available: true,
    costPerHour: 50, minBooking: 168, maxBooking: 720,
    description: 'Fully equipped co-working space within DRDO GTRE campus for incubated startups.',
    bookings: [],
  },
];

// ─── Knowledge Articles ────────────────────────────────────────────────────────
export const KNOWLEDGE_ARTICLES = [
  {
    id: 'ka1', title: 'India Defence Technology Outlook 2024', type: 'report',
    source: 'DRDO / FICCI', access: 'restricted', tags: ['Defence', 'Technology', 'Policy'],
    date: '2024-01-15', views: 1243,
    summary: 'Comprehensive analysis of India\'s defence technology landscape, R&D investment trends, and strategic priorities for 2024-2030.',
  },
  {
    id: 'ka2', title: 'Deep Tech Startup Ecosystem in India – NASSCOM 2023', type: 'report',
    source: 'NASSCOM', access: 'public', tags: ['DeepTech', 'Ecosystem', 'India'],
    date: '2023-11-01', views: 3892,
    summary: 'Annual overview of India\'s deep tech startup ecosystem including funding trends, sector analysis, and government policy impact.',
  },
  {
    id: 'ka3', title: 'Technology Readiness Level Assessment Guide for Defence Startups', type: 'sop',
    source: 'DRDO', access: 'registered', tags: ['TRL', 'Assessment', 'Startup'],
    date: '2023-08-10', views: 2104,
    summary: 'Step-by-step guide for startups to self-assess their Technology Readiness Level (TRL 1-9) in the context of defence applications.',
  },
  {
    id: 'ka4', title: 'Post-Quantum Cryptography Standards – NIST 2024', type: 'article',
    source: 'NIST / Curated', access: 'public', tags: ['Quantum', 'Cryptography', 'Standards'],
    date: '2024-02-20', views: 876,
    summary: 'Summary of NIST\'s finalized post-quantum cryptographic standards and their implications for defence communication systems.',
  },
  {
    id: 'ka5', title: 'iDEX Application Handbook – How to Apply and Win', type: 'training_module',
    source: 'DRDO / iDEX Cell', access: 'registered', tags: ['iDEX', 'Application', 'Guide'],
    date: '2024-01-01', views: 4521,
    summary: 'Comprehensive handbook covering the iDEX application process, evaluation criteria, success tips, and post-selection obligations.',
  },
];

// ─── Notifications ─────────────────────────────────────────────────────────────
export const NOTIFICATIONS = [
  { id: 'n1', type: 'milestone', title: 'Milestone Overdue', message: 'Project OI/2023/DRDL/QC-002 – Milestone 3 is overdue by 45 days.', time: '2 hours ago', read: false, urgent: true },
  { id: 'n2', type: 'application', title: 'New Application Received', message: '3 new applications received for iDEX DIO Challenge – AI for Defence Round 5.', time: '5 hours ago', read: false, urgent: false },
  { id: 'n3', type: 'ipr', title: 'Patent Application Published', message: 'Patent IN202311045678 by TechDefend AI has been published by IPO.', time: '1 day ago', read: false, urgent: false },
  { id: 'n4', type: 'message', title: 'New Message', message: 'Prof. Sunita Rao sent you a message regarding mentoring session scheduling.', time: '2 days ago', read: true, urgent: false },
  { id: 'n5', type: 'booking', title: 'Booking Confirmed', message: 'EMI/EMC Test Chamber booking for AeroSense Dynamics (March 18-22) confirmed.', time: '3 days ago', read: true, urgent: false },
];

// ─── Messages ──────────────────────────────────────────────────────────────────
export const MESSAGES = [
  {
    id: 'msg1', threadId: 'th1', from: 'Prof. Sunita Rao', fromId: 'm1', fromAvatar: 'SR',
    to: 'Arjun Mehta', subject: 'Mentoring Session – AI Model Optimisation',
    messages: [
      { sender: 'Prof. Sunita Rao', text: 'Hi Arjun, I reviewed your latest prototype demo. The model accuracy is impressive but I think we can discuss pruning strategies for edge deployment. Are you available next Tuesday at 3 PM?', time: '2 days ago' },
      { sender: 'Arjun Mehta', text: 'Thank you Prof. Rao! Tuesday 3 PM works perfectly. I\'ll prepare the benchmarking results for your review.', time: '2 days ago' },
    ],
    unread: 0,
  },
  {
    id: 'msg2', threadId: 'th2', from: 'Dr. Priya Sharma', fromId: 'u2', fromAvatar: 'PS',
    to: 'Arjun Mehta', subject: 'Milestone 4 – Field Trial Requirements',
    messages: [
      { sender: 'Dr. Priya Sharma', text: 'TechDefend team – please share the field trial plan for Milestone 4 by end of this week. We need to coordinate with the Army testing team at the border trial site.', time: '5 hours ago' },
    ],
    unread: 1,
  },
];

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
export const DASHBOARD_STATS = {
  totalStartups: 1284,
  activeProjects: 47,
  totalGrant: 284000000,
  startupsCohorted: 89,
  deeptechStartups: 312,
  iprFiled: 156,
  mentors: 68,
  avgTRL: 6.2,
  topSectors: [
    { name: 'Defence Electronics', count: 287 },
    { name: 'Aerospace & UAV', count: 198 },
    { name: 'Cybersecurity', count: 176 },
    { name: 'Robotics & Autonomous', count: 142 },
    { name: 'Materials & CBRN', count: 98 },
    { name: 'Life Sciences', count: 76 },
    { name: 'Semiconductors', count: 65 },
    { name: 'Naval Systems', count: 42 },
  ],
  monthlyApplications: [
    { month: 'Oct', count: 18 },
    { month: 'Nov', count: 24 },
    { month: 'Dec', count: 12 },
    { month: 'Jan', count: 31 },
    { month: 'Feb', count: 42 },
    { month: 'Mar', count: 38 },
  ],
  projectHealth: { green: 28, amber: 12, red: 7 },
};

// ─── Startup Crawling ─────────────────────────────────────────────────────────
export const CRAWL_SOURCES = [
  { id: 'src1', name: 'Startup India (DPIIT)', type: 'Government', url: 'startupindia.gov.in', status: 'active', lastCrawled: '2026-03-06T08:00:00', totalIndexed: 98432, newToday: 124, icon: '🇮🇳' },
  { id: 'src2', name: 'iDEX Portal', type: 'Government', url: 'idex.gov.in', status: 'active', lastCrawled: '2026-03-06T07:30:00', totalIndexed: 3241, newToday: 18, icon: '🛡️' },
  { id: 'src3', name: 'MCA / ROC Database', type: 'Government', url: 'mca.gov.in', status: 'active', lastCrawled: '2026-03-06T06:00:00', totalIndexed: 142800, newToday: 310, icon: '🏛️' },
  { id: 'src4', name: 'NASSCOM Deep Tech', type: 'Industry Body', url: 'nasscom.in', status: 'active', lastCrawled: '2026-03-05T22:00:00', totalIndexed: 1870, newToday: 6, icon: '💻' },
  { id: 'src5', name: 'T-Hub Hyderabad', type: 'Incubator', url: 't-hub.co', status: 'active', lastCrawled: '2026-03-06T05:00:00', totalIndexed: 892, newToday: 3, icon: '🚀' },
  { id: 'src6', name: 'IIT Madras Research Park', type: 'Academia', url: 'iitmrp.in', status: 'active', lastCrawled: '2026-03-05T20:00:00', totalIndexed: 214, newToday: 1, icon: '🎓' },
  { id: 'src7', name: 'Invest India', type: 'Government', url: 'investindia.gov.in', status: 'paused', lastCrawled: '2026-03-04T10:00:00', totalIndexed: 5621, newToday: 0, icon: '📈' },
  { id: 'src8', name: 'SIDBI Udyam', type: 'Government', url: 'udyamregistration.gov.in', status: 'active', lastCrawled: '2026-03-06T04:00:00', totalIndexed: 22140, newToday: 87, icon: '🏭' },
];

export const CRAWLED_STARTUPS = [
  {
    id: 'cs1', name: 'SkyForce Robotics', source: 'iDEX Portal', sourceId: 'src2',
    crawledAt: '2026-03-06T08:12:00', sector: 'Robotics & Autonomous', technology: 'Swarm Robotics',
    location: 'Pune, MH', website: 'skyforcerobotics.in', founded: 2023,
    description: 'Swarm drone technology for battlefield area denial and perimeter surveillance.',
    employees: '11-50', stage: 'Seed', deeptech: true, trl: 4,
    dpiit: 'DIPP987123', cin: 'U72900PN2023PTC001122',
    score: null, status: 'pending_review', tags: ['swarm', 'drone', 'defence', 'autonomous'],
    matchedThrust: 'Aeronautics & Unmanned Systems', confidence: 92,
  },
  {
    id: 'cs2', name: 'CipherMesh Technologies', source: 'Startup India (DPIIT)', sourceId: 'src1',
    crawledAt: '2026-03-06T07:55:00', sector: 'Cybersecurity', technology: 'Post-Quantum Cryptography',
    location: 'Bengaluru, KA', website: 'ciphermesh.io', founded: 2022,
    description: 'Post-quantum encryption solutions for critical defence communication networks.',
    employees: '11-50', stage: 'Pre-Series A', deeptech: true, trl: 5,
    dpiit: 'DIPP654321', cin: 'U72900KA2022PTC009988',
    score: null, status: 'pending_review', tags: ['cryptography', 'quantum', 'cybersecurity', 'comms'],
    matchedThrust: 'Electronics & Communication Systems', confidence: 88,
  },
  {
    id: 'cs3', name: 'BioSensor Labs', source: 'NASSCOM Deep Tech', sourceId: 'src4',
    crawledAt: '2026-03-06T07:40:00', sector: 'Life Sciences & CBRN', technology: 'Biosensors',
    location: 'Hyderabad, TS', website: 'biosensorlabs.co', founded: 2021,
    description: 'Portable biosensor devices for CBRN threat detection in field conditions.',
    employees: '1-10', stage: 'Seed', deeptech: true, trl: 3,
    dpiit: 'DIPP112233', cin: 'U72900TS2021PTC004455',
    score: null, status: 'approved', tags: ['biosensor', 'CBRN', 'detection', 'portable'],
    matchedThrust: 'Life Sciences & CBRN Defence', confidence: 95,
  },
  {
    id: 'cs4', name: 'NanoArmour Composites', source: 'IIT Madras Research Park', sourceId: 'src6',
    crawledAt: '2026-03-06T06:30:00', sector: 'Advanced Materials', technology: 'Nanotechnology',
    location: 'Chennai, TN', website: 'nanoarmour.in', founded: 2024,
    description: 'Nano-composite armour materials with superior ballistic resistance and reduced weight.',
    employees: '1-10', stage: 'Pre-seed', deeptech: true, trl: 2,
    dpiit: null, cin: 'U72900TN2024PTC007788',
    score: null, status: 'pending_review', tags: ['nanotech', 'armour', 'materials', 'ballistic'],
    matchedThrust: 'Armament & Combat Engineering', confidence: 84,
  },
  {
    id: 'cs5', name: 'RadarSoft Systems', source: 'Startup India (DPIIT)', sourceId: 'src1',
    crawledAt: '2026-03-06T06:10:00', sector: 'Defence Electronics', technology: 'Signal Processing',
    location: 'Delhi, DL', website: 'radarsoft.in', founded: 2020,
    description: 'Software-defined radar signal processing for multi-mode surveillance applications.',
    employees: '51-200', stage: 'Series A', deeptech: true, trl: 7,
    dpiit: 'DIPP445566', cin: 'U72900DL2020PTC002233',
    score: null, status: 'approved', tags: ['radar', 'signal processing', 'SDR', 'surveillance'],
    matchedThrust: 'Electronics & Communication Systems', confidence: 91,
  },
  {
    id: 'cs6', name: 'AquaSub Dynamics', source: 'iDEX Portal', sourceId: 'src2',
    crawledAt: '2026-03-06T05:50:00', sector: 'Naval Systems', technology: 'Underwater Robotics',
    location: 'Visakhapatnam, AP', website: 'aquasub.co.in', founded: 2022,
    description: 'Autonomous underwater vehicles for naval reconnaissance and mine detection.',
    employees: '11-50', stage: 'Seed', deeptech: true, trl: 4,
    dpiit: 'DIPP778899', cin: 'U72900AP2022PTC006677',
    score: null, status: 'rejected', tags: ['AUV', 'naval', 'underwater', 'mine detection'],
    matchedThrust: 'Naval Systems & Technologies', confidence: 89,
    rejectionReason: 'Duplicate — similar entity already registered as AquaNav Robotics',
  },
  {
    id: 'cs7', name: 'HelixChip Semiconductors', source: 'NASSCOM Deep Tech', sourceId: 'src4',
    crawledAt: '2026-03-06T05:20:00', sector: 'Semiconductors', technology: 'VLSI Design',
    location: 'Bengaluru, KA', website: 'helixchip.in', founded: 2021,
    description: 'Indigenously designed radiation-hardened chips for space and defence applications.',
    employees: '11-50', stage: 'Series A', deeptech: true, trl: 6,
    dpiit: 'DIPP334455', cin: 'U72900KA2021PTC005544',
    score: null, status: 'pending_review', tags: ['semiconductor', 'VLSI', 'radiation hardened', 'ISRO'],
    matchedThrust: 'Electronics & Communication Systems', confidence: 87,
  },
  {
    id: 'cs8', name: 'FireWatch Analytics', source: 'T-Hub Hyderabad', sourceId: 'src5',
    crawledAt: '2026-03-06T04:45:00', sector: 'Defence Electronics', technology: 'Computer Vision',
    location: 'Hyderabad, TS', website: 'firewatchai.com', founded: 2023,
    description: 'Real-time fire and explosion detection AI for ammunition depots and military bases.',
    employees: '1-10', stage: 'Pre-seed', deeptech: false, trl: 3,
    dpiit: 'DIPP223344', cin: 'U72900TS2023PTC008899',
    score: null, status: 'pending_review', tags: ['computer vision', 'safety', 'AI', 'military base'],
    matchedThrust: 'Aeronautics & Unmanned Systems', confidence: 72,
  },
];

export const CRAWL_JOBS = [
  { id: 'job1', sourceId: 'src1', sourceName: 'Startup India (DPIIT)', status: 'completed', startedAt: '2026-03-06T08:00:00', completedAt: '2026-03-06T08:12:00', found: 124, added: 98, duplicates: 18, rejected: 8 },
  { id: 'job2', sourceId: 'src2', sourceName: 'iDEX Portal', status: 'completed', startedAt: '2026-03-06T07:30:00', completedAt: '2026-03-06T07:45:00', found: 18, added: 16, duplicates: 1, rejected: 1 },
  { id: 'job3', sourceId: 'src8', sourceName: 'SIDBI Udyam', status: 'running', startedAt: '2026-03-06T08:20:00', completedAt: null, found: 43, added: 31, duplicates: 9, rejected: 3, progress: 38 },
  { id: 'job4', sourceId: 'src3', sourceName: 'MCA / ROC Database', status: 'queued', startedAt: null, completedAt: null, found: 0, added: 0, duplicates: 0, rejected: 0, progress: 0 },
  { id: 'job5', sourceId: 'src4', sourceName: 'NASSCOM Deep Tech', status: 'failed', startedAt: '2026-03-05T22:00:00', completedAt: '2026-03-05T22:03:00', found: 0, added: 0, duplicates: 0, rejected: 0, error: 'API rate limit exceeded. Retry after 24h.' },
];
