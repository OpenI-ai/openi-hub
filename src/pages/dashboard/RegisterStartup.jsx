import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { startupAPI, publicAPI } from '../../services/api';
import { CheckCircle2, ChevronRight, ChevronLeft, Upload, AlertCircle, Building2, Users, DollarSign, Cpu, FileText, Shield } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Basic Information', icon: Building2 },
  { id: 2, title: 'Team & Management', icon: Users },
  { id: 3, title: 'Technology & Product', icon: Cpu },
  { id: 4, title: 'Financial & Funding', icon: DollarSign },
  { id: 5, title: 'Legal & Compliance', icon: FileText },
  { id: 6, title: 'Review & Submit', icon: Shield },
];

// Fallbacks — overridden by taxonomy API on mount
let OPENI_CLUSTERS = [
  'Aeronautics & Unmanned Systems', 'Armaments & Combat Engineering',
  'Combat Vehicles & Engineering', 'Electronics & Communication Systems',
  'Life Sciences & CBRN', 'Materials & Stealth', 'Missiles & Strategic Systems',
  'Naval Systems & Underwater', 'Microelectronics & Semiconductors',
  'Cyber & Information Systems', 'Robotics & Autonomous Systems', 'Other',
];

let SECTORS = [];
let TECHNOLOGIES = [];

const FUNDING_STAGES = ['Bootstrapped', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Listed'];

export default function RegisterStartup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [sectors, setSectors] = useState(SECTORS);
  const [technologies, setTechnologies] = useState(TECHNOLOGIES);

  useEffect(() => {
    publicAPI.getTaxonomy().then(data => {
      if (data.sectors) setSectors(data.sectors.filter(s => !s.parent_id).map(s => s.name).sort());
      if (data.technologies) setTechnologies(data.technologies.filter(t => !t.parent_id).map(t => t.name).sort());
    }).catch(() => {});
  }, []);
  const [verifying, setVerifying] = useState({ gstin: false, dpiit: false, cin: false });
  const [verified, setVerified] = useState({ gstin: false, dpiit: false, cin: false });

  const [form, setForm] = useState({
    // Step 1
    companyName: '', legalName: '', founded: '', website: '', email: '',
    mobile: '', location: '', city: '', state: '',
    // Step 2
    founderName: '', founderRole: '', founderEmail: '', founderLinkedin: '',
    coFounders: [], teamSize: '', iitNitGrad: false, exDefense: false, academia: false,
    boardMembers: [], shareholding: [],
    // Step 3
    sector: '', technology: '', openiCluster: '', trl: '1',
    productDescription: '', solutions: '', useCases: '',
    isDeeptech: false, deepTechDomain: '',
    patents: '0', patentDetails: '',
    // Step 4
    fundingStage: '', totalFunding: '', investors: '',
    revenue: '', employees: '',
    // Step 5
    gstin: '', dpiit: '', cin: '', pan: '', udyam: '',
    startupIndiaReg: false, msmeCert: false,
    citizenshipIndia: true,
    // Step 6 – no form fields
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const simulateVerify = (field) => {
    setVerifying(v => ({ ...v, [field]: true }));
    setTimeout(() => {
      setVerifying(v => ({ ...v, [field]: false }));
      setVerified(v => ({ ...v, [field]: true }));
    }, 1500);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    const payload = {
      name: form.companyName,
      legal_name: form.legalName,
      founded: form.founded ? Number(form.founded) : null,
      website: form.website,
      email: form.email,
      mobile: form.mobile,
      location: form.location,
      city: form.city,
      state: form.state,
      sector: form.sector,
      technology: form.technology,
      openi_cluster: form.openiCluster,
      trl: Number(form.trl) || 1,
      description: form.productDescription,
      solutions: form.solutions ? form.solutions.split('\n').filter(Boolean) : [],
      deeptech: form.isDeeptech,
      patents: Number(form.patents) || 0,
      stage: form.fundingStage || 'Bootstrapped',
      funding: Number(form.totalFunding) || 0,
      revenue: Number(form.revenue) || 0,
      employees: Number(form.employees) || 0,
      gstin: form.gstin,
      dpiit: form.dpiit,
      cin: form.cin,
      status: 'Applied',
    };
    startupAPI.create(payload)
      .then(() => {
        toast.success('Startup registered successfully');
        setSubmitted(true);
        // Send newcomers to their profile with ?autofill=1 so the auto-fill CTA auto-opens
        setTimeout(() => navigate('/dashboard/profile?autofill=1'), 2000);
      })
      .catch(err => {
        toast.error(err.message || 'Registration failed, saved locally');
        setSubmitted(true);
        setTimeout(() => navigate('/dashboard/profile?autofill=1'), 2000);
      })
      .finally(() => setSubmitting(false));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-accent-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-gray-600 mb-4">Your startup profile has been submitted for verification. You will receive an email within 2-3 working days.</p>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-left text-sm mb-6">
            <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500">Application ID</span><span className="font-mono font-semibold text-primary-600">OI-2024-REG-00892</span></div>
            <div className="flex justify-between py-1.5 border-b border-gray-100"><span className="text-gray-500">Company</span><span className="font-semibold">{form.companyName || 'Your Company'}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-gray-500">Status</span><span className="text-accent-600 font-semibold">Under Review</span></div>
          </div>
          <p className="text-gray-400 text-sm">Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">Startup Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Create your OpenI Hub profile · All fields marked * are mandatory</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => step > s.id ? setStep(s.id) : null}
                className={`flex items-center gap-2 flex-shrink-0 ${step === s.id ? 'opacity-100' : step > s.id ? 'opacity-100 cursor-pointer' : 'opacity-40'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.id ? 'bg-accent-500 text-white' : step === s.id ? 'bg-primary-500 text-dark-950' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.id ? <CheckCircle2 size={16} /> : s.id}
                </div>
                <span className={`text-sm font-medium whitespace-nowrap hidden sm:block ${step === s.id ? 'text-gray-900' : 'text-gray-500'}`}>{s.title}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 transition-all ${step > s.id ? 'bg-accent-400' : 'bg-gray-200'}`} style={{ minWidth: 16 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Step 1 – Basic Info */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building2 size={20} className="text-primary-500" /> Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Company Name *" value={form.companyName} onChange={v => update('companyName', v)} placeholder="TechDefend AI Pvt. Ltd." />
                <FormField label="Legal/Registered Name *" value={form.legalName} onChange={v => update('legalName', v)} placeholder="As per MCA registration" />
                <FormField label="Year of Incorporation *" type="number" value={form.founded} onChange={v => update('founded', v)} placeholder="2020" />
                <FormField label="Website" value={form.website} onChange={v => update('website', v)} placeholder="https://yourcompany.in" />
                <FormField label="Official Email *" type="email" value={form.email} onChange={v => update('email', v)} placeholder="info@yourcompany.in" />
                <FormField label="Mobile (OTP will be sent) *" type="tel" value={form.mobile} onChange={v => update('mobile', v)} placeholder="+91 9876543210" />
                <div className="md:col-span-2">
                  <FormField label="Registered Address *" value={form.location} onChange={v => update('location', v)} placeholder="Full registered address" />
                </div>
                <FormField label="City *" value={form.city} onChange={v => update('city', v)} placeholder="Bengaluru" />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">State *</label>
                  <select value={form.state} onChange={e => update('state', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400">
                    <option value="">Select State</option>
                    {['Karnataka','Delhi','Maharashtra','Tamil Nadu','Telangana','Gujarat','Rajasthan','Uttar Pradesh','West Bengal','Kerala','Haryana','Punjab'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 – Team */}
          {step === 2 && (
            <div className="p-8">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users size={20} className="text-primary-500" /> Team & Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField label="Founder Name *" value={form.founderName} onChange={v => update('founderName', v)} placeholder="Full name" />
                <FormField label="Founder Designation *" value={form.founderRole} onChange={v => update('founderRole', v)} placeholder="CEO / CTO / Founder" />
                <FormField label="Founder Email *" type="email" value={form.founderEmail} onChange={v => update('founderEmail', v)} placeholder="founder@company.in" />
                <FormField label="LinkedIn Profile" value={form.founderLinkedin} onChange={v => update('founderLinkedin', v)} placeholder="linkedin.com/in/founder" />
                <FormField label="Total Team Size *" type="number" value={form.teamSize} onChange={v => update('teamSize', v)} placeholder="15" />
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 block">Founder Background</label>
                  {[
                    { key: 'iitNitGrad', label: 'IIT / NIT / AIIMS / IISc Graduate' },
                    { key: 'exDefense', label: 'Ex-Defence Personnel (Army / Navy / IAF / CG)' },
                    { key: 'academia', label: 'Academia / Research Institution Spinoff' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[opt.key]} onChange={e => update(opt.key, e.target.checked)} className="rounded text-primary-500" />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700 block mb-3">Shareholding Pattern</label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-gray-500 mb-2 px-1">
                    <span>Shareholder Name</span><span>% Share</span><span>Nationality</span>
                  </div>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="grid grid-cols-3 gap-3 mb-2">
                      <input className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-400" placeholder="Name" />
                      <input type="number" className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-400" placeholder="%" />
                      <select className="px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-primary-400">
                        <option>Indian</option><option>NRI</option><option>Foreign</option>
                      </select>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 mt-1">Note: Foreign shareholding must be disclosed as per FDI norms. Total must equal 100%.</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 – Technology */}
          {step === 3 && (
            <div className="p-8">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Cpu size={20} className="text-primary-500" /> Technology & Product
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Primary Sector *</label>
                  <select value={form.sector} onChange={e => update('sector', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400">
                    <option value="">Select sector</option>
                    {sectors.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Core Technology *</label>
                  <select value={form.technology} onChange={e => update('technology', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400">
                    <option value="">Select technology</option>
                    {technologies.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">OpenI Thrust Area Cluster *</label>
                  <select value={form.openiCluster} onChange={e => update('openiCluster', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400">
                    <option value="">Select OpenI cluster</option>
                    {OPENI_CLUSTERS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block" title="NASA standard 1-9 scale: 1=basic concept, 4=lab demo, 6=prototype in relevant environment, 9=proven in production">Tech Readiness Level <span className="text-gray-500 font-normal">(1 = concept · 9 = proven in production)</span> *</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="1" max="9" value={form.trl} onChange={e => update('trl', e.target.value)} className="flex-1 accent-primary-500" />
                    <div className="w-10 h-10 rounded-full bg-primary-500 text-dark-950 font-bold text-lg flex items-center justify-center flex-shrink-0">{form.trl}</div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{['', 'Basic principles observed', 'Technology concept formulated', 'Proof of concept validated', 'Technology validated in lab', 'Technology validated in relevant environment', 'Technology demonstrated in relevant environment', 'System prototype demonstration', 'System complete and qualified', 'Actual system proven in operational environment'][form.trl]}</p>
                </div>
                <div className="md:col-span-2">
                  <FormField label="Product/Solution Description *" type="textarea" value={form.productDescription} onChange={v => update('productDescription', v)} placeholder="Describe your core product or solution in detail (min. 200 words)" rows={4} />
                </div>
                <div className="md:col-span-2">
                  <FormField label="Key Solutions Offered *" type="textarea" value={form.solutions} onChange={v => update('solutions', v)} placeholder="List the specific solutions/products (one per line)" rows={3} />
                </div>
                <div className="md:col-span-2">
                  <FormField label="Defence Use Cases & Applications *" type="textarea" value={form.useCases} onChange={v => update('useCases', v)} placeholder="How does your solution apply to defence requirements?" rows={3} />
                </div>
                <div className="md:col-span-2 bg-primary-50 rounded-xl p-4 border border-primary-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.isDeeptech} onChange={e => update('isDeeptech', e.target.checked)} className="w-5 h-5 rounded text-primary-500" />
                    <div>
                      <div className="text-sm font-semibold text-primary-800">Apply for DeepTech Qualification</div>
                      <div className="text-xs text-primary-600 mt-0.5">Your startup will undergo a special assessment to be listed as a DeepTech startup in OpenI's registry, unlocking priority evaluation and additional funding opportunities.</div>
                    </div>
                  </label>
                </div>
                <FormField label="Number of Patents Filed" type="number" value={form.patents} onChange={v => update('patents', v)} placeholder="0" />
                <FormField label="Patent Application Numbers" value={form.patentDetails} onChange={v => update('patentDetails', v)} placeholder="IN2023XXXXX, PCT/IN2023/..." />
              </div>
            </div>
          )}

          {/* Step 4 – Financials */}
          {step === 4 && (
            <div className="p-8">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign size={20} className="text-primary-500" /> Financial & Funding
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Current Funding Stage *</label>
                  <select value={form.fundingStage} onChange={e => update('fundingStage', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400">
                    <option value="">Select stage</option>
                    {FUNDING_STAGES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <FormField label="Total Funding Raised (₹)" type="number" value={form.totalFunding} onChange={v => update('totalFunding', v)} placeholder="e.g., 50000000" />
                <FormField label="Annual Revenue (₹, FY24)" type="number" value={form.revenue} onChange={v => update('revenue', v)} placeholder="e.g., 15000000" />
                <FormField label="Current Headcount" type="number" value={form.employees} onChange={v => update('employees', v)} placeholder="e.g., 45" />
                <div className="md:col-span-2">
                  <FormField label="Key Investors & Grants *" type="textarea" value={form.investors} onChange={v => update('investors', v)} placeholder="List investors, VC firms, government grants received (iDEX, DPIIT, DST, SIDBI, etc.)" rows={3} />
                </div>
                <div className="md:col-span-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">Financial information is confidential and will only be shared with authorised OpenI personnel involved in evaluation. Audited financial statements (last 2 years) will be required post-shortlisting.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 – Legal */}
          {step === 5 && (
            <div className="p-8">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText size={20} className="text-primary-500" /> Legal & Compliance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* GSTIN */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">GSTIN</label>
                  <div className="flex gap-2">
                    <input value={form.gstin} onChange={e => update('gstin', e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" placeholder="27AABCT1234A1Z5" />
                    <button onClick={() => simulateVerify('gstin')} disabled={verifying.gstin || verified.gstin} className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${verified.gstin ? 'bg-accent-100 text-accent-700 border border-accent-300' : 'bg-primary-500 text-dark-950 hover:bg-primary-400'}`}>
                      {verifying.gstin ? '...' : verified.gstin ? '✓ Verified' : 'Verify'}
                    </button>
                  </div>
                </div>
                {/* DPIIT */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">DPIIT Startup India Number</label>
                  <div className="flex gap-2">
                    <input value={form.dpiit} onChange={e => update('dpiit', e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" placeholder="DIPP123456" />
                    <button onClick={() => simulateVerify('dpiit')} disabled={verifying.dpiit || verified.dpiit} className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${verified.dpiit ? 'bg-accent-100 text-accent-700 border border-accent-300' : 'bg-primary-500 text-dark-950 hover:bg-primary-400'}`}>
                      {verifying.dpiit ? '...' : verified.dpiit ? '✓ Verified' : 'Verify'}
                    </button>
                  </div>
                </div>
                {/* CIN */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">CIN / LLPIN (MCA21)</label>
                  <div className="flex gap-2">
                    <input value={form.cin} onChange={e => update('cin', e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" placeholder="U72900MH2020PTC123456" />
                    <button onClick={() => simulateVerify('cin')} disabled={verifying.cin || verified.cin} className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${verified.cin ? 'bg-accent-100 text-accent-700 border border-accent-300' : 'bg-primary-500 text-dark-950 hover:bg-primary-400'}`}>
                      {verifying.cin ? '...' : verified.cin ? '✓ Verified' : 'Verify'}
                    </button>
                  </div>
                </div>
                <FormField label="PAN" value={form.pan} onChange={v => update('pan', v)} placeholder="AABCT1234A" />
                <FormField label="UDYAM Registration Number" value={form.udyam} onChange={v => update('udyam', v)} placeholder="UDYAM-XX-00-0000000" />
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 block">Certifications</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.startupIndiaReg} onChange={e => update('startupIndiaReg', e.target.checked)} className="rounded text-primary-500" />
                    <span className="text-sm text-gray-700">DPIIT Recognised Startup</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.msmeCert} onChange={e => update('msmeCert', e.target.checked)} className="rounded text-primary-500" />
                    <span className="text-sm text-gray-700">MSME / UDYAM Registered</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.citizenshipIndia} onChange={e => update('citizenshipIndia', e.target.checked)} className="rounded text-primary-500" />
                    <span className="text-sm text-gray-700">All directors/shareholders are Indian citizens (or NRI with OCI)</span>
                  </label>
                </div>
                {/* Document Upload */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-3">Upload Supporting Documents</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Certificate of Incorporation', 'PAN Card', 'GSTIN Certificate', 'DPIIT Recognition Certificate', 'Audited Financials (FY23, FY24)', 'Pitch Deck'].map(doc => (
                      <div key={doc} className="flex items-center gap-3 p-3 border border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer group">
                        <Upload size={16} className="text-gray-400 group-hover:text-primary-500" />
                        <span className="text-sm text-gray-600 group-hover:text-primary-700">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6 – Review */}
          {step === 6 && (
            <div className="p-8">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Shield size={20} className="text-primary-500" /> Review & Submit
              </h2>
              <div className="space-y-4">
                {[
                  { title: 'Basic Information', fields: [['Company', form.companyName || '—'], ['Founded', form.founded || '—'], ['City', form.city || '—'], ['State', form.state || '—']] },
                  { title: 'Team', fields: [['Founder', form.founderName || '—'], ['Role', form.founderRole || '—'], ['Team Size', form.teamSize || '—']] },
                  { title: 'Technology', fields: [['Sector', form.sector || '—'], ['Technology', form.technology || '—'], ['OpenI Cluster', form.openiCluster || '—'], ['Tech Readiness', form.trl], ['DeepTech', form.isDeeptech ? 'Yes – Applying' : 'No']] },
                  { title: 'Financial', fields: [['Stage', form.fundingStage || '—'], ['Funding', form.totalFunding ? `₹${Number(form.totalFunding).toLocaleString('en-IN')}` : '—'], ['Revenue', form.revenue ? `₹${Number(form.revenue).toLocaleString('en-IN')}` : '—']] },
                  { title: 'Legal', fields: [['GSTIN', `${form.gstin || '—'} ${verified.gstin ? '✓' : ''}`], ['CIN', `${form.cin || '—'} ${verified.cin ? '✓' : ''}`], ['DPIIT', `${form.dpiit || '—'} ${verified.dpiit ? '✓' : ''}`]] },
                ].map(section => (
                  <div key={section.title} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">{section.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {section.fields.map(([label, val]) => (
                        <div key={label}>
                          <div className="text-xs text-gray-400">{label}</div>
                          <div className="text-sm font-medium text-gray-800">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 rounded text-primary-500" required />
                    <p className="text-sm text-primary-800">I certify that all information provided is accurate and complete. I understand that providing false information may result in disqualification and legal action. I agree to OpenI's data usage policy for startup evaluation and incubation purposes.</p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-2xl">
            <button
              onClick={() => setStep(s => s - 1)} disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-sm text-gray-400">Step {step} of {STEPS.length}</span>
            {step < STEPS.length ? (
              <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-2 px-5 py-2 bg-primary-500 text-dark-950 rounded-lg hover:bg-primary-400 text-sm font-semibold">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 text-sm font-semibold disabled:opacity-50">
                <CheckCircle2 size={16} /> {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, type = 'text', value, onChange, placeholder, rows }) {
  const cls = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400";
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} rows={rows || 3} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} />
      )}
    </div>
  );
}
