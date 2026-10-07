import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GitFork, 
  Plus, 
  ArrowLeft, 
  Clock, 
  Users, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Pause,
  Play
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { getMyRoutePools, toggleRoutePoolStatus, deleteRoutePool } from '../../services/api';

function MyRoutePools() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ error: '', success: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    const fetchPools = async () => {
      try {
        const { data } = await getMyRoutePools();
        if (!ignore) setPools(data.routePools || []);
      } catch {
        if (!ignore) setStatus({ error: 'Failed to load route pools', success: '' });
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchPools();
    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  const handleToggle = async (id) => {
    try {
      await toggleRoutePoolStatus(id);
      setStatus({ error: '', success: `Pool status updated successfully!` });
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setStatus({ error: '', success: '' }), 4000);
    } catch {
      setStatus({ error: 'Failed to update pool status', success: '' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route pool? This will stop recurring daily ride generation.')) return;
    try {
      await deleteRoutePool(id);
      setStatus({ error: '', success: 'Route pool deleted' });
      setRefreshTrigger((prev) => prev + 1);
      setTimeout(() => setStatus({ error: '', success: '' }), 4000);
    } catch {
      setStatus({ error: 'Failed to delete route pool', success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-background relative py-10 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background canvas dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 theme-dot-pattern" />

      <div className="relative max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2.5">
              My Standing Route Pools
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Recurring timetable carpools that automatically generate daily rides at midnight for your campus commute.
            </p>
          </div>

          <Button asChild className="bg-primary hover:bg-[#832323] text-primary-foreground text-xs shadow-xs">
            <Link to="/driver/routepools/create">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create New Pool
            </Link>
          </Button>
        </div>

        {/* Flash Notifications */}
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

        {/* Content Listing */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-mono">Loading your standing route pools...</p>
          </div>
        ) : pools.length === 0 ? (
          <div className="bg-card border border-border rounded-[var(--radius)] p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-secondary text-primary rounded-full flex items-center justify-center mx-auto border border-border">
              <GitFork className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-serif font-bold text-foreground">No Route Pools Created</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You haven&apos;t created any recurring route pools yet. Set up your regular weekly timetable corridor to automatically offer seats to students.
            </p>
            <Button asChild className="bg-primary hover:bg-[#832323] text-primary-foreground text-xs">
              <Link to="/driver/routepools/create">
                Create your first Route Pool →
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {pools.map((pool) => (
              <div
                key={pool._id}
                className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-xs flex flex-col sm:flex-row justify-between gap-5 hover:border-primary/30 transition-all"
              >
                <div className="space-y-3 flex-1">
                  {/* Status & Vehicle Meta */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider ${
                        pool.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      ● {pool.status}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Vehicle: <strong className="text-foreground">{pool.vehicleId?._id || pool.vehicleId}</strong> ({pool.vehicleId?.model || 'Car'})
                    </span>
                    <span className="text-xs font-mono font-bold bg-secondary text-primary px-2 py-0.5 rounded-[var(--radius)] border border-border">
                      {pool.distanceKm} km
                    </span>
                  </div>

                  {/* Corridor Path */}
                  <div className="text-base sm:text-lg font-serif font-bold text-foreground flex items-center gap-2">
                    <span>{pool.origin.label}</span>
                    <span className="text-muted-foreground font-sans text-sm">→</span>
                    <span>{pool.destination.label}</span>
                  </div>

                  {/* Recurrence Days */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {pool.recurrenceDays.map((d) => (
                        <span
                          key={d}
                          className="bg-secondary/70 text-secondary-foreground text-[11px] font-mono font-semibold px-2 py-0.5 rounded border border-border"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Time Window & Seats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono pt-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Window: <strong className="text-foreground">{pool.departureWindowStart} – {pool.departureWindowEnd}</strong>
                    </span>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Max Seats: <strong className="text-foreground">{pool.maxMembers}</strong>
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex sm:flex-col justify-end gap-2.5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                  <Button
                    variant="outline"
                    onClick={() => handleToggle(pool._id, pool.status)}
                    className={`text-xs h-9 font-medium border-border transition ${
                      pool.status === 'active'
                        ? 'hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200'
                        : 'hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
                    }`}
                  >
                    {pool.status === 'active' ? (
                      <>
                        <Pause className="w-3 h-3 mr-1.5" />
                        Pause Pool
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1.5" />
                        Resume Pool
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(pool._id)}
                    className="text-xs h-9 font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-border hover:border-rose-200 transition"
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" />
                    Delete Pool
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRoutePools;