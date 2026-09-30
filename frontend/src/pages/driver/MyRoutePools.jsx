import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      } catch{
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
      setStatus({ error: '', success: `Pool status updated!` });
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setStatus({ error: 'Failed to update pool status', success: '' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route pool?')) return;
    try {
      await deleteRoutePool(id);
      setStatus({ error: '', success: 'Route pool deleted' });
      setRefreshTrigger((prev) => prev + 1);
    } catch{
      setStatus({ error: 'Failed to delete route pool', success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link to="/" className="text-sm text-indigo-600 hover:underline">
              ← Back to home
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">My Standing Route Pools</h1>
          </div>
          <Link
            to="/driver/routepools/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Create New Pool
          </Link>
        </div>

        {status.error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            {status.error}
          </div>
        )}
        {status.success && (
          <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3">
            {status.success}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading your route pools...</p>
        ) : pools.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-600 text-sm mb-4">You have not created any standing recurring route pools yet.</p>
            <Link
              to="/driver/routepools/create"
              className="inline-block bg-indigo-600 text-white font-medium text-sm px-4 py-2 rounded-lg"
            >
              Create your first Route Pool →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pools.map((pool) => (
              <div key={pool._id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        pool.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      ● {pool.status}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      Vehicle: {pool.vehicleId?._id || pool.vehicleId} ({pool.vehicleId?.model || 'Car'})
                    </span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                      {pool.distanceKm} km
                    </span>
                  </div>

                  <div className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span>{pool.origin.label}</span>
                    <span className="text-slate-400">→</span>
                    <span>{pool.destination.label}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {pool.recurrenceDays.map((d) => (
                      <span key={d} className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded">
                        {d}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500">
                    Window: <strong>{pool.departureWindowStart} – {pool.departureWindowEnd}</strong> | Max Seats:{' '}
                    <strong>{pool.maxMembers}</strong>
                  </p>
                </div>

                <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(pool._id, pool.status)}
                    className={`text-xs px-3 py-1.5 rounded font-semibold transition cursor-pointer ${
                      pool.status === 'active'
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {pool.status === 'active' ? 'Pause Pool' : 'Resume Pool'}
                  </button>
                  <button
                    onClick={() => handleDelete(pool._id)}
                    className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded font-semibold transition cursor-pointer"
                  >
                    Delete Pool
                  </button>
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