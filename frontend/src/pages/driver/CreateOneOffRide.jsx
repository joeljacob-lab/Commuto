import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyVehicles, createOneOffRide } from '../../services/api';

const POPULAR_LOCATIONS = [
  { label: 'Campus Main Gate', coordinates: [76.3284, 10.0438] },
  { label: 'Aluva Metro Station', coordinates: [76.3571, 10.1076] },
  { label: 'Edappally Toll', coordinates: [76.3078, 10.0261] },
  { label: 'Kalamassery Premier', coordinates: [76.3211, 10.0542] },
  { label: 'Kakkanad Infopark Gate', coordinates: [76.3638, 10.0125] },
];

function CreateOneOffRide() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ error: '', success: '' });

  const [origin, setOrigin] = useState({
    label: 'Aluva Metro Station',
    coordinates: [76.3571, 10.1076],
  });
  const [destination, setDestination] = useState({
    label: 'Campus Main Gate',
    coordinates: [76.3284, 10.0438],
  });

  const [originQuery, setOriginQuery] = useState('Aluva Metro Station');
  const [destQuery, setDestQuery] = useState('Campus Main Gate');
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    vehicleId: '',
    date: defaultDateStr,
    departureTime: '08:30',
    totalSeats: 3,
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data } = await getMyVehicles();
        setVehicles(data.vehicles || []);
        const firstApproved = data.vehicles?.find((v) => v.verificationStatus === 'approved');
        if (firstApproved) {
          setFormData((prev) => ({ ...prev, vehicleId: firstApproved._id }));
        }
      } catch {
        setStatus({ error: 'Failed to load vehicles', success: '' });
      } 
    };
    fetchVehicles();
  }, []);

  const searchPlace = async (query, target) => {
    if (!query.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
      );
      const data = await res.json();
      if (target === 'origin') setOriginResults(data);
      else setDestResults(data);
    } catch {
      setStatus({ error: 'Search failed. Select a preset below.', success: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '' });
    setSubmitting(true);

    try {
      const payload = {
        vehicleId: formData.vehicleId,
        date: formData.date,
        departureTime: formData.departureTime,
        origin,
        destination,
        totalSeats: Number(formData.totalSeats),
      };

      await createOneOffRide(payload);
      setStatus({ error: '', success: 'Single-Day Ride published successfully!' });
      setTimeout(() => navigate('/driver/rides'), 1200);
    } catch (err) {
      setStatus({
        error: err.response?.data?.message || 'Failed to publish ride',
        success: '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const approvedVehicles = vehicles.filter((v) => v.verificationStatus === 'approved');

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/driver/rides" className="text-sm text-indigo-600 hover:underline">
          ← Back to my rides
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-2">Publish a Single-Day Ride</h1>
        <p className="text-sm text-slate-500 mb-6">
          Offer a one-time ride for exams, weekend commutes, tech fests, or special campus events.
        </p>

        {status.error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {status.error}
          </div>
        )}
        {status.success && (
          <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            {status.success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Vehicle
            </label>
            <select
              required
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full border border-slate-300 rounded-md p-2.5 text-sm bg-white"
              disabled={approvedVehicles.length === 0}
            >
              <option value="">-- Choose an approved vehicle --</option>
              {approvedVehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v._id} ({v.model} • {v.seats} seats)
                </option>
              ))}
            </select>
          </div>

          {/* Date & Departure Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Ride Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Departure Time
              </label>
              <input
                type="time"
                required
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Available Seats
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.totalSeats}
                onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                className="w-full border border-slate-300 rounded-md p-2 text-sm"
              />
            </div>
          </div>

          {/* Origin & Destination pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Origin Point</span>
              <div className="flex gap-2">
                <input
                  required
                  placeholder="Search starting place..."
                  value={originQuery}
                  onChange={(e) => setOriginQuery(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-md p-2 text-sm bg-white"
                />
                <button
                  type="button"
                  onClick={() => searchPlace(originQuery, 'origin')}
                  className="bg-indigo-600 text-white text-xs px-3 py-2 rounded-md font-semibold cursor-pointer"
                >
                  Search
                </button>
              </div>
              {originResults.length > 0 && (
                <div className="bg-white border rounded shadow-md max-h-36 overflow-y-auto divide-y">
                  {originResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setOrigin({ label: item.display_name.split(',')[0], coordinates: [parseFloat(item.lon), parseFloat(item.lat)] });
                        setOriginQuery(item.display_name.split(',')[0]);
                        setOriginResults([]);
                      }}
                      className="p-2 text-xs hover:bg-indigo-50 cursor-pointer"
                    >
                      {item.display_name}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1 pt-1">
                {POPULAR_LOCATIONS.slice(0, 3).map((loc) => (
                  <button
                    type="button"
                    key={loc.label}
                    onClick={() => {
                      setOrigin(loc);
                      setOriginQuery(loc.label);
                    }}
                    className="text-[10px] bg-white border px-2 py-0.5 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {loc.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Destination Point</span>
              <div className="flex gap-2">
                <input
                  required
                  placeholder="Search campus or destination..."
                  value={destQuery}
                  onChange={(e) => setDestQuery(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-md p-2 text-sm bg-white"
                />
                <button
                  type="button"
                  onClick={() => searchPlace(destQuery, 'dest')}
                  className="bg-emerald-600 text-white text-xs px-3 py-2 rounded-md font-semibold cursor-pointer"
                >
                  Search
                </button>
              </div>
              {destResults.length > 0 && (
                <div className="bg-white border rounded shadow-md max-h-36 overflow-y-auto divide-y">
                  {destResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setDestination({ label: item.display_name.split(',')[0], coordinates: [parseFloat(item.lon), parseFloat(item.lat)] });
                        setDestQuery(item.display_name.split(',')[0]);
                        setDestResults([]);
                      }}
                      className="p-2 text-xs hover:bg-emerald-50 cursor-pointer"
                    >
                      {item.display_name}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1 pt-1">
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    type="button"
                    key={loc.label}
                    onClick={() => {
                      setDestination(loc);
                      setDestQuery(loc.label);
                    }}
                    className="text-[10px] bg-white border px-2 py-0.5 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {loc.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || approvedVehicles.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition cursor-pointer shadow-xs"
          >
            {submitting ? 'Calculating Cost & Publishing...' : 'Publish Single-Day Ride'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateOneOffRide;