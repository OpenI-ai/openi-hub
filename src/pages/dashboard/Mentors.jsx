import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { mentorAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { UserCheck, Star, Calendar, Users, MessageSquare, Plus, Search, Filter, CheckCircle2, BookOpen, Award } from 'lucide-react';

const BG_COLORS = ['bg-dark-700', 'bg-primary-600', 'bg-accent-700', 'bg-blue-700'];
const BACKGROUND_LABELS = { academia: 'Academia', retired_defense: 'Retired Defence', ex_drdo: 'Ex-OpenI', industry: 'Industry' };
const BACKGROUND_COLORS = { academia: 'bg-blue-100 text-blue-700', retired_defense: 'bg-green-100 text-green-700', ex_drdo: 'bg-orange-100 text-orange-700', industry: 'bg-purple-100 text-purple-700' };

function MentorDetail({ mentor, onClose }) {
  const [sessionOpen, setSessionOpen] = useState(false);
  const assignedStartups = mentor.assigned_startups || mentor.assignedStartups || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-gray-500 text-sm">← Mentors</button>
          <h1 className="font-display font-bold text-gray-900">{mentor.name}</h1>
        </div>
      </div>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 bg-dark-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">{mentor.avatar}</div>
                <div>
                  <h2 className="text-xl font-display font-bold text-gray-900">{mentor.name}</h2>
                  <p className="text-gray-600 text-sm">{mentor.designation}</p>
                  <p className="text-gray-500 text-sm">{mentor.org}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${BACKGROUND_COLORS[mentor.background]}`}>{BACKGROUND_LABELS[mentor.background]}</span>
                    <span className="flex items-center gap-1 text-sm font-bold text-yellow-600"><Star size={14} /> {mentor.rating}/5.0</span>
                    <span className="text-sm text-gray-500">{mentor.sessions} sessions</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-2">Professional Bio</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{mentor.bio}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Areas of Expertise</h3>
              <div className="flex gap-2 flex-wrap mb-5">
                {(mentor.expertise || []).map(e => <span key={e} className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-medium">{e}</span>)}
              </div>
              <h3 className="font-semibold text-gray-800 mb-3">Certifications & Credentials</h3>
              <div className="space-y-2">
                {(mentor.certifications || []).map(c => (
                  <div key={c} className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-accent-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{c}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Assigned Startups</h3>
                <button className="text-xs text-primary-600 font-semibold">Assign More →</button>
              </div>
              <div className="space-y-3">
                {assignedStartups.length === 0 && (
                  <p className="text-sm text-gray-400">No startups assigned yet.</p>
                )}
                {assignedStartups.map(startup => (
                  <div key={startup.id || startup} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-dark-950 font-bold text-sm">
                      {(startup.name || startup.toString())[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-sm">{startup.name || startup}</div>
                      <div className="text-xs text-gray-500">{startup.sector || ''}</div>
                    </div>
                    <button className="flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold">
                      <MessageSquare size={11} /> Message
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="font-semibold text-gray-800 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                {[
                  { label: 'Total Sessions', value: mentor.sessions },
                  { label: 'Rating', value: `${mentor.rating}/5.0 ⭐` },
                  { label: 'Startups Mentoring', value: assignedStartups.length },
                  { label: 'Availability', value: mentor.available ? 'Available' : 'Busy' },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{s.label}</span>
                    <span className={`text-sm font-bold ${s.label === 'Availability' ? (mentor.available ? 'text-accent-600' : 'text-red-500') : 'text-gray-800'}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setSessionOpen(true)} disabled={!mentor.available} className="w-full py-3 bg-primary-500 text-dark-950 rounded-xl font-semibold text-sm hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Calendar size={15} /> Book a Session
            </button>
            <button className="w-full py-3 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
              <MessageSquare size={15} /> Send Message
            </button>
          </div>
        </div>
      </div>

      {sessionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display font-bold text-gray-900 text-lg mb-4">Book Mentoring Session</h3>
            <p className="text-gray-600 text-sm mb-4">Book a session with {mentor.name}</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Date</label>
                <input type="date" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Time Slot</label>
                <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400">
                  <option>10:00 AM – 11:00 AM</option>
                  <option>2:00 PM – 3:00 PM</option>
                  <option>4:00 PM – 5:00 PM</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Session Topic</label>
                <textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" rows={3} placeholder="Describe what you'd like to discuss..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setSessionOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm">Cancel</button>
              <button onClick={() => setSessionOpen(false)} className="flex-1 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold">Request Session</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Mentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    mentorAPI.list()
      .then(data => setMentors(data.mentors || data || []))
      .catch(err => toast.error(err.message || 'Failed to load mentors'))
      .finally(() => setLoading(false));
  }, []);

  if (selected) return <MentorDetail mentor={selected} onClose={() => setSelected(null)} />;

  const filtered = mentors.filter(m => {
    const name = m.name || '';
    const expertise = m.expertise || [];
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || expertise.some(e => e.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'all' || m.background === filter;
    return matchSearch && matchFilter;
  });

  const totalSessions = mentors.reduce((s, m) => s + (Number(m.sessions) || 0), 0);
  const ratings = mentors.map(m => Number(m.rating)).filter(Number.isFinite);
  const avgRatingNum = ratings.length
    ? ratings.reduce((s, r) => s + r, 0) / ratings.length
    : NaN;
  const avgRating = Number.isFinite(avgRatingNum) ? avgRatingNum.toFixed(1) : '—';

  if (loading) return <LoadingSkeleton type="card" />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Mentors</h1>
          <p className="text-gray-500 text-sm mt-0.5">Onboard and manage mentors from academia, industry, and defence</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-dark-950 rounded-lg font-semibold text-sm hover:bg-primary-400">
          <Plus size={16} /> Add Mentor
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Mentors',  value: mentors.length,                              color: 'text-gray-800' },
          { label: 'Available',      value: mentors.filter(m => m.is_active).length,     color: 'text-accent-600' },
          { label: 'Total Sessions', value: totalSessions,                               color: 'text-primary-600' },
          { label: 'Avg Rating',     value: avgRating + ' ⭐',                           color: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 text-sm" placeholder="Search by name or expertise..." />
        </div>
        <div className="flex gap-2">
          {['all', 'academia', 'retired_defense', 'ex_drdo', 'industry'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize ${filter === f ? 'bg-primary-500 text-dark-950' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {BACKGROUND_LABELS[f] || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((mentor, i) => (
          <div key={mentor.id} onClick={() => setSelected(mentor)} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 ${BG_COLORS[i % BG_COLORS.length]} rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>{mentor.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-gray-900">{mentor.name}</h3>
                    <p className="text-sm text-gray-500">{mentor.designation}</p>
                    <p className="text-xs text-gray-400">{mentor.org}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="flex items-center gap-1 text-sm font-bold text-yellow-600"><Star size={13} /> {Number(mentor.rating || 0).toFixed(1)}</span>
                    <span className={`w-2 h-2 rounded-full ${mentor.is_active ? 'bg-accent-500' : 'bg-gray-300'}`} title={mentor.is_active ? 'Available' : 'Busy'} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex gap-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BACKGROUND_COLORS[mentor.background]}`}>{BACKGROUND_LABELS[mentor.background]}</span>
                {(mentor.expertise || []).slice(0, 2).map(e => <span key={e} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{e}</span>)}
                {(mentor.expertise || []).length > 2 && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">+{(mentor.expertise || []).length - 2}</span>}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{mentor.total_sessions || mentor.sessions || 0} sessions · {(mentor.assigned_startups || mentor.assignedStartups || []).length} startups</span>
              <span className={`font-semibold ${mentor.is_active ? 'text-accent-600' : 'text-gray-400'}`}>{mentor.is_active ? '● Available' : '● Busy'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
