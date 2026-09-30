import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyVehicles, createRoutePool } from '../../services/api';

const DAYS_OF_WEEK = [
  { id: 'Mon', label: 'Mon' },
  { id: 'Tue', label: 'Tue' },
  { id: 'Wed', label: 'Wed' },
  { id: 'Thu', label: 'Thu' },
  { id: 'Fri', label: 'Fri' },
  { id: 'Sat', label: 'Sat' },
];

// Preset campus locations with real coordinates [lng, lat] for 1-click testing
const POPULAR_LOCATIONS = [
  { label: 'Campus Main Gate', coordinates: [76.3284, 10.0438] },
  { label: 'Aluva Metro Station', coordinates: [76.3571, 10.1076] },
  { label: 'Edappally Toll', coordinates: [76.3078, 10.0261] },
  { label: 'Kalamassery Premier', coordinates: [76.3211, 10.0542] },
  { label: 'Kakkanad Infopark Gate', coordinates: [76.3638, 10.0125] },
];

function CreateRoutePool() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ error: '', success: '' });

  // Selected Origin & Destination
  const [origin, setOrigin] = useState({
    label: 'Aluva Metro Station',
    coordinates: [76.3571, 10.1076], // [lng, lat]
  });
  const [destination, setDestination] = useState({
    label: 'Campus Main Gate',
    coordinates: [76.3284, 10.0438],
  });

  // Search input state
  const [originQuery, setOriginQuery] = useState('Aluva Metro Station');
  const [destQuery, setDestQuery] = useState('Campus Main Gate');
  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);

  // Form settings
  const [vehicleId, setVehicleId] = useState('');
  const [recurrenceDays, setRecurrenceDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [departureWindowStart, setDepartureWindowStart] = useState('08:00');
  const [departureWindowEnd, setDepartureWindowEnd] = useState('08:15');
  const [maxMembers, setMaxMembers] = useState(3);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data } = await getMyVehicles();
        setVehicles(data.vehicles || []);
        const firstApproved = data.vehicles?.find((v) => v.verificationStatus === 'approved');
        if (firstApproved) {
          setVehicleId(firstApproved._id);
        }
      } catch {
        setStatus({ error: 'Failed to load your vehicles', success: '' });
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, []);

  // Free OpenStreetMap Geocoding Search
  const searchPlace = async (query, target) => {
    if (!query.trim()) return;
    if (target === 'origin') setSearchingOrigin(true);
    else setSearchingDest(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=in`
      );
      const data = await res.json();
      if (target === 'origin') {
        setOriginResults(data);
      } else {
        setDestResults(data);
      }
    } catch {
      setStatus({ error: 'Location search failed. Please try again or select a preset.', success: '' });
    } finally {
      if (target === 'origin') setSearchingOrigin(false);
      else setSearchingDest(false);
    }
  };

  // Browser Geolocation API ("Use My Current Location")
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [Number(pos.coords.longitude.toFixed(5)), Number(pos.coords.latitude.toFixed(5))];
        setOrigin({
          label: 'My Current Location',
          coordinates: coords,
        });
        setOriginQuery('My Current Location');
        setOriginResults([]);
      },
      () => {
        alert('Could not fetch your location. Please check browser permissions.');
      }
    );
  };

  const handleSelectOrigin = (item) => {
    setOrigin({
      label: item.display_name.split(',')[0],
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
    });
    setOriginQuery(item.display_name.split(',')[0]);
    setOriginResults([]);
  };

  const handleSelectDest = (item) => {
    setDestination({
      label: item.display_name.split(',')[0],
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
    });
    setDestQuery(item.display_name.split(',')[0]);
    setDestResults([]);
  };

  const handleDayToggle = (dayId) => {
    setRecurrenceDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '' });

    if (recurrenceDays.length === 0) {
      return setStatus({ error: 'Please select at least one recurrence day', success: '' });
    }

    setSubmitting(true);
    try {
      const payload = {
        vehicleId,
        origin,
        destination,
        recurrenceDays,
        departureWindowStart,
        departureWindowEnd,
        maxMembers: Number(maxMembers),
      };

      await createRoutePool(payload);
      setStatus({ error: '', success: 'Recurring Route Pool created successfully!' });
      setTimeout(() => navigate('/driver/routepools'), 1200);
    } catch (err) {
      setStatus({
        error: err.response?.data?.message || 'Failed to create route pool',
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
        <Link to="/" className="text-sm text-indigo-600 hover:underline">
          ← Back to home
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-6">Create a Recurring Route Pool</h1>

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

        {!loadingVehicles && approvedVehicles.length === 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <p className="font-semibold">⚠️ No Approved Vehicle Available</p>
            <p className="mt-1">
              You must have an <strong>Approved</strong> vehicle to create a route pool.
            </p>
            <Link to="/driver/vehicles/add" className="inline-block mt-3 font-semibold text-amber-900 underline">
              Register a vehicle →
            </Link>
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
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin Location */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Origin (Starting Point)
                </span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer"
                >
                  📍 Use Current Location
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  required
                  placeholder="Search city, junction, or landmark..."
                  value={originQuery}
                  onChange={(e) => setOriginQuery(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => searchPlace(originQuery, 'origin')}
                  disabled={searchingOrigin}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 rounded-md font-semibold cursor-pointer disabled:opacity-50"
                >
                  {searchingOrigin ? '...' : 'Search'}
                </button>
              </div>

              {/* Search Suggestions Dropdown */}
              {originResults.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg shadow-md max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {originResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectOrigin(item)}
                      className="p-2 text-xs text-slate-700 hover:bg-indigo-50 cursor-pointer"
                    >
                      {item.display_name}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected badge */}
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Selected: <strong className="text-slate-700">{origin.label}</strong></span>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Quick Presets</span>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      type="button"
                      key={loc.label}
                      onClick={() => {
                        setOrigin(loc);
                        setOriginQuery(loc.label);
                        setOriginResults([]);
                      }}
                      className="text-[10px] bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      {loc.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Location */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                Destination (Ending Point)
              </span>

              <div className="flex gap-2">
                <input
                  required
                  placeholder="Search destination or campus..."
                  value={destQuery}
                  onChange={(e) => setDestQuery(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => searchPlace(destQuery, 'dest')}
                  disabled={searchingDest}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-md font-semibold cursor-pointer disabled:opacity-50"
                >
                  {searchingDest ? '...' : 'Search'}
                </button>
              </div>

              {/* Search Suggestions Dropdown */}
              {destResults.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg shadow-md max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {destResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectDest(item)}
                      className="p-2 text-xs text-slate-700 hover:bg-emerald-50 cursor-pointer"
                    >
                      {item.display_name}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected badge */}
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Selected: <strong className="text-slate-700">{destination.label}</strong></span>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Quick Presets</span>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      type="button"
                      key={loc.label}
                      onClick={() => {
                        setDestination(loc);
                        setDestQuery(loc.label);
                        setDestResults([]);
                      }}
                      className="text-[10px] bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      {loc.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recurrence Days */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Recurrence Days (Timetable)
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const selected = recurrenceDays.includes(day.id);
                return (
                  <button
                    type="button"
                    key={day.id}
                    onClick={() => handleDayToggle(day.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Departure Window & Seats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Window Start (HH:mm)
              </label>
              <input
                type="time"
                required
                value={departureWindowStart}
                onChange={(e) => setDepartureWindowStart(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Window End (HH:mm)
              </label>
              <input
                type="time"
                required
                value={departureWindowEnd}
                onChange={(e) => setDepartureWindowEnd(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Max Passenger Seats
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || approvedVehicles.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition shadow-xs cursor-pointer"
          >
            {submitting ? 'Calculating Route & Saving...' : 'Create Recurring Route Pool'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateRoutePool;