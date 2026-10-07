import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GitFork, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Navigation
} from 'lucide-react';
import { Button } from '../../components/ui/button';
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

  // Free OpenStreetMap Geocoding Search with instant preset matching
  const searchPlace = async (query, target) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3) return;

    if (target === 'origin') setSearchingOrigin(true);
    else setSearchingDest(true);

    try {
      // 1. Instant local matching with campus presets
      const matchedPresets = POPULAR_LOCATIONS.filter((loc) =>
        loc.label.toLowerCase().includes(trimmed.toLowerCase())
      ).map((loc) => ({
        display_name: `${loc.label} (Campus Preset)`,
        lat: loc.coordinates[1],
        lon: loc.coordinates[0],
        isPreset: true,
      }));

      // 2. Fetch live OpenStreetMap suggestions
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmed
        )}&limit=5&countrycodes=in`
      );
      const data = await res.json();

      const combined = [...matchedPresets, ...data];
      if (target === 'origin') {
        setOriginResults(combined);
      } else {
        setDestResults(combined);
      }
    } catch {
      setStatus({ error: 'Location search failed. Please try again or select a preset.', success: '' });
    } finally {
      if (target === 'origin') setSearchingOrigin(false);
      else setSearchingDest(false);
    }
  };

  // Real-time typing debounce for Origin
  useEffect(() => {
    if (originQuery.trim().length < 3 || originQuery === origin.label) {
      return;
    }

    const timer = setTimeout(() => {
      searchPlace(originQuery, 'origin');
    }, 400);

    return () => clearTimeout(timer);
  }, [originQuery, origin.label]);

  // Real-time typing debounce for Destination
  useEffect(() => {
    if (destQuery.trim().length < 3 || destQuery === destination.label) {
      return;
    }

    const timer = setTimeout(() => {
      searchPlace(destQuery, 'dest');
    }, 400);

    return () => clearTimeout(timer);
  }, [destQuery, destination.label]);

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
    const label = item.display_name.split(',')[0].replace(' (Campus Preset)', '');
    setOrigin({
      label,
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
    });
    setOriginQuery(label);
    setOriginResults([]);
  };

  const handleSelectDest = (item) => {
    const label = item.display_name.split(',')[0].replace(' (Campus Preset)', '');
    setDestination({
      label,
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
    });
    setDestQuery(label);
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
    <div className="min-h-screen bg-background relative py-10 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background canvas dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 theme-dot-pattern" />

      <div className="relative max-w-3xl mx-auto space-y-6">
        <Link
          to="/driver/routepools"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to route pools</span>
        </Link>

        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 text-primary border border-border text-xs font-mono mb-2">
            <GitFork className="w-3.5 h-3.5" />
            <span>COMMUTE TIMETABLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
            Create Recurring Route Pool
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Establish a standing timetable route. Daily rides will be automatically scheduled every midnight.
          </p>
        </div>

        {status.error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{status.error}</span>
          </div>
        )}
        {status.success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{status.success}</span>
          </div>
        )}

        {!loadingVehicles && approvedVehicles.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-[var(--radius)] text-amber-900 text-xs space-y-2">
            <p className="font-semibold flex items-center gap-1.5 text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              No Approved Vehicle Available
            </p>
            <p className="text-amber-800">
              You must have an approved vehicle registered before you can offer route pools.
            </p>
            <Link
              to="/driver/vehicles/add"
              className="inline-block font-semibold text-primary underline hover:text-[#832323]"
            >
              Register a vehicle for verification →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-[var(--radius)] p-6 sm:p-7 shadow-xs space-y-6">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Select Approved Vehicle
            </label>
            <div className="relative">
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
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
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Origin Location */}
            <div className="p-4 bg-secondary/30 border border-border rounded-[var(--radius)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Origin (Starting Point)
                </span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-primary hover:text-[#832323] bg-secondary/80 hover:bg-secondary border border-border px-2 py-0.5 rounded cursor-pointer transition"
                >
                  <Navigation className="w-3 h-3" />
                  <span>My Location</span>
                </button>
              </div>

              <div className="relative">
                <div className="flex gap-2">
                  <input
                    required
                    placeholder="Search origin..."
                    value={originQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOriginQuery(val);
                      if (val.trim().length < 3) {
                        setOriginResults([]);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchPlace(originQuery, 'origin');
                      }
                    }}
                    className="flex-1 bg-background border border-border rounded-[var(--radius)] p-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => searchPlace(originQuery, 'origin')}
                    disabled={searchingOrigin}
                    className="text-xs h-9 px-3 border-border"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Floating Suggestions Dropdown */}
                {originResults.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-card border border-border rounded-[var(--radius)] shadow-lg max-h-48 overflow-y-auto divide-y divide-border/60">
                    {originResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectOrigin(item)}
                        className="p-2.5 text-xs text-foreground hover:bg-secondary cursor-pointer flex items-center justify-between transition"
                      >
                        <span className="truncate pr-2">{item.display_name}</span>
                        {item.isPreset && (
                          <span className="bg-secondary text-primary font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border border-border shrink-0">
                            Preset
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected badge */}
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Selected: <strong className="text-foreground">{origin.label}</strong></span>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-border/80">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Campus Presets</span>
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
                      className="text-[10px] font-mono bg-card border border-border px-2 py-0.5 rounded hover:bg-secondary text-foreground cursor-pointer transition"
                    >
                      {loc.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Location */}
            <div className="p-4 bg-secondary/30 border border-border rounded-[var(--radius)] space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Destination (Ending Point)
              </span>

              <div className="relative">
                <div className="flex gap-2">
                  <input
                    required
                    placeholder="Search campus or terminus..."
                    value={destQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDestQuery(val);
                      if (val.trim().length < 3) {
                        setDestResults([]);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchPlace(destQuery, 'dest');
                      }
                    }}
                    className="flex-1 bg-background border border-border rounded-[var(--radius)] p-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => searchPlace(destQuery, 'dest')}
                    disabled={searchingDest}
                    className="text-xs h-9 px-3 border-border"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Floating Suggestions Dropdown */}
                {destResults.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-card border border-border rounded-[var(--radius)] shadow-lg max-h-48 overflow-y-auto divide-y divide-border/60">
                    {destResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectDest(item)}
                        className="p-2.5 text-xs text-foreground hover:bg-secondary cursor-pointer flex items-center justify-between transition"
                      >
                        <span className="truncate pr-2">{item.display_name}</span>
                        {item.isPreset && (
                          <span className="bg-secondary text-primary font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border border-border shrink-0">
                            Preset
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected badge */}
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Selected: <strong className="text-foreground">{destination.label}</strong></span>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-border/80">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Campus Presets</span>
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
                      className="text-[10px] font-mono bg-card border border-border px-2 py-0.5 rounded hover:bg-secondary text-foreground cursor-pointer transition"
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
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
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
                    className={`px-3.5 py-1.5 rounded-[var(--radius)] text-xs font-mono font-semibold transition cursor-pointer border ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-secondary/60 text-secondary-foreground border-border hover:bg-secondary'
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
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                Window Start
              </label>
              <input
                type="time"
                required
                value={departureWindowStart}
                onChange={(e) => setDepartureWindowStart(e.target.value)}
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                Window End
              </label>
              <input
                type="time"
                required
                value={departureWindowEnd}
                onChange={(e) => setDepartureWindowEnd(e.target.value)}
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-primary" />
                Max Seats
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || approvedVehicles.length === 0}
            className="w-full bg-primary hover:bg-[#832323] text-primary-foreground py-3 text-sm font-semibold shadow-xs"
          >
            {submitting ? 'Calculating Route & Saving...' : 'Create Recurring Route Pool'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default CreateRoutePool;