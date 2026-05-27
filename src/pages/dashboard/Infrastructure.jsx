import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { infrastructureAPI } from '../../services/api';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { Building2, Calendar, DollarSign, CheckCircle2, Search, MapPin, Cpu, Calculator } from 'lucide-react';

const TYPE_COLORS = { HPC: 'bg-purple-100 text-purple-700', 'Test Facility': 'bg-blue-100 text-blue-700', 'Incubation Space': 'bg-green-100 text-green-700' };

function BookingModal({ resource, onClose }) {
  const [hours, setHours] = useState(resource.minBooking);
  const [date, setDate] = useState('');
  const [booked, setBooked] = useState(false);

  const cost = hours * resource.costPerHour;

  if (booked) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-2xl">
        <CheckCircle2 size={48} className="text-accent-500 mx-auto mb-4" />
        <h3 className="font-display font-bold text-gray-900 text-xl mb-2">Booking Requested</h3>
        <p className="text-gray-600 text-sm mb-4">Your booking request for <strong>{resource.name}</strong> has been submitted. You'll receive confirmation within 24 hours.</p>
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-5 text-sm">
          <div className="flex justify-between py-1"><span className="text-gray-500">Resource</span><span className="font-medium">{resource.name}</span></div>
          <div className="flex justify-between py-1"><span className="text-gray-500">Duration</span><span className="font-medium">{hours} hours</span></div>
          <div className="flex justify-between py-1 border-t border-gray-200 mt-1"><span className="text-gray-700 font-semibold">Estimated Cost</span><span className="font-bold text-primary-600">₹{cost.toLocaleString('en-IN')}</span></div>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-primary-500 text-dark-950 rounded-xl font-semibold">Done</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-gray-900 text-lg">{resource.name}</h3>
            <p className="text-gray-500 text-sm">{resource.location}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl font-bold">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Start Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Duration (hours): {hours}h</label>
            <div className="flex items-center gap-3">
              <input type="range" min={resource.minBooking} max={resource.maxBooking} step={resource.minBooking} value={hours} onChange={e => setHours(+e.target.value)} className="flex-1 accent-primary-500" />
              <span className="text-sm font-bold text-gray-800 w-16">{hours}h</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Min: {resource.minBooking}h</span>
              <span>Max: {resource.maxBooking}h</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Purpose / Project Code</label>
            <input className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" placeholder="e.g., OI/2023/CAIR/AI-001" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Description of Work</label>
            <textarea className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-400" rows={2} placeholder="Brief description of testing/work to be performed..." />
          </div>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator size={16} className="text-primary-600" />
              <span className="text-sm font-semibold text-primary-800">Cost Estimate</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><span className="text-primary-600 text-xs">Rate/Hour</span><br /><span className="font-bold text-primary-800">₹{resource.costPerHour.toLocaleString('en-IN')}</span></div>
              <div><span className="text-primary-600 text-xs">Duration</span><br /><span className="font-bold text-primary-800">{hours}h</span></div>
              <div><span className="text-primary-600 text-xs">Total Est.</span><br /><span className="font-bold text-primary-800 text-lg">₹{cost.toLocaleString('en-IN')}</span></div>
            </div>
            <p className="text-xs text-primary-600 mt-2">* GST applicable. Final cost subject to actual usage and facility confirmation.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm">Cancel</button>
          <button onClick={() => {
            infrastructureAPI.createBooking(resource.id, { hours, date, purpose: '' })
              .then(() => toast.success('Booking requested successfully'))
              .catch(err => toast.error(err.message || 'Failed to create booking'));
            setBooked(true);
          }} className="flex-1 py-2.5 bg-primary-500 text-dark-950 rounded-lg text-sm font-semibold">Request Booking</button>
        </div>
      </div>
    </div>
  );
}

export default function Infrastructure() {
  const [search, setSearch] = useState('');
  const [booking, setBooking] = useState(null);
  const [infraList, setInfraList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    infrastructureAPI.list()
      .then(data => {
        const items = data.infrastructure || data || [];
        const normalized = items.map(r => ({
          id: r.id,
          name: r.name || '',
          type: r.type || 'Test Facility',
          description: r.description || '',
          location: r.location || '',
          provider: r.provider || '',
          capacity: r.capacity || '',
          costPerHour: r.cost_per_hour || r.costPerHour || 0,
          minBooking: r.min_booking || r.minBooking || 1,
          maxBooking: r.max_booking || r.maxBooking || 100,
          available: r.available !== undefined ? r.available : true,
          bookings: r.bookings || [],
        }));
        setInfraList(normalized);
      })
      .catch(err => { toast.error(err.message || 'Failed to load infrastructure'); setInfraList([]); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton type="card" />;

  const filtered = infraList.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()) || (r.type || '').toLowerCase().includes(search.toLowerCase()) || (r.location || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div id="tour-page-infra-header" className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Infrastructure & Test Facilities</h1>
          <p className="text-gray-500 text-sm mt-0.5">Explore and book OpenI labs, test facilities, and incubation infrastructure</p>
        </div>
      </div>

      {/* Infrastructure empty-state branches (carry-forward 21 May 2026)
          — when no labs onboarded yet, hide KPI tiles + search bar and
          render an intentional empty-state instead of the bug-looking
          0/0/0 + empty cards. When labs exist but search returns nothing,
          keep KPI tiles + search and show a search-empty message. */}
      {infraList.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Facilities', value: infraList.length, color: 'text-gray-800' },
            { label: 'Available Now', value: infraList.filter(r => r.available).length, color: 'text-accent-600' },
            { label: 'Active Bookings', value: infraList.reduce((s, r) => s + (r.bookings || []).filter(b => b.status === 'Active' || b.status === 'Upcoming').length, 0), color: 'text-primary-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {infraList.length > 0 && (
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 text-sm" placeholder="Search facilities..." />
        </div>
      )}

      {infraList.length === 0 && (
        <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl border border-primary-200 p-10 text-center">
          <Building2 size={48} className="text-primary-400 mx-auto mb-4" />
          <h3 className="font-display font-bold text-gray-900 text-xl mb-2">No test facilities onboarded yet</h3>
          <p className="text-gray-600 text-sm mb-6 max-w-xl mx-auto">
            Labs, test facilities and incubation infrastructure will appear here as research institutions onboard onto OpenI. You'll be able to browse, compare and book bench time, HPC access, characterisation equipment and more.
          </p>
          <p className="text-gray-500 text-xs">
            Want a specific facility listed? <a href="mailto:info@openi.ai?subject=Request%20test%20facility%20onboarding" className="text-primary-600 font-semibold underline">Email us</a> with the lab name and we'll reach out to them.
          </p>
        </div>
      )}

      {infraList.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Search size={32} className="text-gray-400 mx-auto mb-3" />
          <h3 className="font-display font-semibold text-gray-700 text-base mb-1">No matches for your search</h3>
          <p className="text-gray-500 text-sm">Try a different facility name, type, or location.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(resource => (
          <div key={resource.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLORS[resource.type] || 'bg-gray-100 text-gray-600'}`}>{resource.type}</span>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${resource.available ? 'text-accent-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${resource.available ? 'bg-accent-500' : 'bg-red-500'}`} />
                    {resource.available ? 'Available' : 'Booked'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-gray-900">{resource.name}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">{resource.description}</p>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-xs">{resource.location}</span>
              </div>
              <div className="flex items-start gap-2">
                <Building2 size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-xs">{resource.provider}</span>
              </div>
              <div className="flex items-start gap-2">
                <Cpu size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-xs">{resource.capacity}</span>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-xs">₹{resource.costPerHour.toLocaleString('en-IN')}/hr</span>
              </div>
            </div>

            {resource.bookings.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">Recent Bookings</div>
                {resource.bookings.slice(0, 2).map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-gray-600 py-1.5 border-b border-gray-50">
                    <span>{b.startup}</span>
                    <span className="text-gray-400">{b.from} – {b.to}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === 'Completed' ? 'bg-gray-100 text-gray-500' : b.status === 'Active' ? 'bg-accent-100 text-accent-700' : 'bg-blue-100 text-blue-700'}`}>{b.status}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setBooking(resource)}
              disabled={!resource.available}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${resource.available ? 'bg-primary-500 text-dark-950 hover:bg-primary-400' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              <Calendar size={15} /> {resource.available ? 'Book This Facility' : 'Currently Booked'}
            </button>
          </div>
        ))}
      </div>

      {booking && <BookingModal resource={booking} onClose={() => setBooking(null)} />}
    </div>
  );
}
