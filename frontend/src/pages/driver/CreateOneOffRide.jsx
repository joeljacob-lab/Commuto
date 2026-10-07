import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Car, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Search 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/toaster';
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
      const successMsg = 'Single-Day Ride published successfully!';
      setStatus({ error: '', success: successMsg });
      toast.success(successMsg, { title: 'Ride Published' });
      setTimeout(() => navigate('/driver/rides'), 1200);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to publish ride';
      setStatus({
        error: errMsg,
        success: '',
      });
      toast.error(errMsg, { title: 'Publishing Error' });
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
          to="/driver/rides"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to my rides</span>
        </Link>

        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 text-primary border border-border text-xs font-mono mb-2">
            <Car className="w-3.5 h-3.5" />
            <span>AD-HOC COMMUTE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
            Publish a Single-Day Ride
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Offer a one-time ride for exams, lab days, weekend trips, or special campus events.
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

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-[var(--radius)] p-6 sm:p-7 shadow-xs space-y-6">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Select Vehicle
            </label>
            <select
              required
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
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

          {/* Date & Departure Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" />
                Ride Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                Departure Time
              </label>
              <input
                type="time"
                required
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-primary" />
                Available Seats
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.totalSeats}
                onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                className="w-full bg-background border border-border rounded-[var(--radius)] p-2 text-sm font-mono text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
              />
            </div>
          </div>

          {/* Origin & Destination pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Origin */}
            <div className="p-4 bg-secondary/30 border border-border rounded-[var(--radius)] space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Origin Point
              </span>
              <div className="flex gap-2">
                <input
                  required
                  placeholder="Search starting place..."
                  value={originQuery}
                  onChange={(e) => setOriginQuery(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-[var(--radius)] p-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => searchPlace(originQuery, 'origin')}
                  className="text-xs h-9 px-3 border-border"
                >
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </div>
              {originResults.length > 0 && (
                <div className="bg-card border border-border rounded-[var(--radius)] shadow-lg max-h-36 overflow-y-auto divide-y divide-border/60">
                  {originResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setOrigin({ label: item.display_name.split(',')[0], coordinates: [parseFloat(item.lon), parseFloat(item.lat)] });
                        setOriginQuery(item.display_name.split(',')[0]);
                        setOriginResults([]);
                      }}
                      className="p-2 text-xs text-foreground hover:bg-secondary cursor-pointer transition"
                    >
                      {item.display_name}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1 pt-1 border-t border-border/80">
                {POPULAR_LOCATIONS.slice(0, 3).map((loc) => (
                  <button
                    type="button"
                    key={loc.label}
                    onClick={() => {
                      setOrigin(loc);
                      setOriginQuery(loc.label);
                    }}
                    className="text-[10px] font-mono bg-card border border-border px-2 py-0.5 rounded text-foreground hover:bg-secondary cursor-pointer transition"
                  >
                    {loc.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination */}
            <div className="p-4 bg-secondary/30 border border-border rounded-[var(--radius)] space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Destination Point
              </span>
              <div className="flex gap-2">
                <input
                  required
                  placeholder="Search campus or destination..."
                  value={destQuery}
                  onChange={(e) => setDestQuery(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-[var(--radius)] p-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => searchPlace(destQuery, 'dest')}
                  className="text-xs h-9 px-3 border-border"
                >
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </div>
              {destResults.length > 0 && (
                <div className="bg-card border border-border rounded-[var(--radius)] shadow-lg max-h-36 overflow-y-auto divide-y divide-border/60">
                  {destResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setDestination({ label: item.display_name.split(',')[0], coordinates: [parseFloat(item.lon), parseFloat(item.lat)] });
                        setDestQuery(item.display_name.split(',')[0]);
                        setDestResults([]);
                      }}
                      className="p-2 text-xs text-foreground hover:bg-secondary cursor-pointer transition"
                    >
                      {item.display_name}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1 pt-1 border-t border-border/80">
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    type="button"
                    key={loc.label}
                    onClick={() => {
                      setDestination(loc);
                      setDestQuery(loc.label);
                    }}
                    className="text-[10px] font-mono bg-card border border-border px-2 py-0.5 rounded text-foreground hover:bg-secondary cursor-pointer transition"
                  >
                    {loc.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting || approvedVehicles.length === 0}
            className="w-full bg-primary hover:bg-[#832323] text-primary-foreground py-3 text-sm font-semibold shadow-xs"
          >
            {submitting ? 'Calculating Cost & Publishing...' : 'Publish Single-Day Ride'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default CreateOneOffRide;