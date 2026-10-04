import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyDriverRides, triggerDailyGeneration, completeRide } from '../../services/api';

function MyRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState({ error: '', success: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    const fetchRides = async () => {
      try {
        const { data } = await getMyDriverRides();
        if (!ignore) setRides(data.rides || []);
      } catch (err) {
        if (!ignore) setStatus({ error: err.response?.data?.message || err.message || 'Failed to load rides', success: '' });
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchRides();
    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  const handleGenerateToday = async () => {
    setStatus({ error: '', success: '' });
    setGenerating(true);
    try {
      const { data } = await triggerDailyGeneration();
      setStatus({ error: '', success: data.message });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setStatus({
        error: err.response?.data?.message || 'Failed to generate rides',
        success: '',
      });
    } finally {
      setGenerating(false);
    }
  };

    const handleCompleteRide = async (rideId) => {
    if (!window.confirm('Mark this trip as completed? This will release the escrow payout to your wallet and update the trust graph.')) {
      return;
    }
    try {
      const res = await completeRide(rideId);
      setStatus({ 
        error: '', 
        success: `Trip completed! ₹${res.data.data.totalPayout} released to your wallet for ${res.data.data.completedRiders} passenger(s).` 
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setStatus({ error: err.response?.data?.message || 'Failed to complete ride', success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Link to="/" className="text-sm text-indigo-600 hover:underline">
              ← Back to home
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">My Daily Rides</h1>
          </div>

          <div className="flex gap-2">
            <button
                onClick={handleGenerateToday}
                disabled={generating}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition">
                {generating ? 'Generating...' : '⚡ Generate Tomorrow’s Rides'}
            </button>
            <Link
              to="/driver/rides/create-single"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
            >
              + Publish Single-Day Ride
            </Link>
          </div>
        </div>

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

        {loading ? (
          <p className="text-slate-500 text-sm">Loading your rides...</p>
        ) : rides.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-600 text-sm mb-3">No active or past rides found.</p>
            <p className="text-xs text-slate-400 mb-6">
              You can publish a single-day ride or click "Generate Today's Rides" to generate from your recurring pools!
            </p>
            <div className="flex justify-center gap-3">
              <Link
                to="/driver/rides/create-single"
                className="bg-indigo-600 text-white font-medium text-xs px-4 py-2 rounded-lg"
              >
                Publish Single-Day Ride
              </Link>
              <Link
                to="/driver/routepools"
                className="bg-slate-100 text-slate-700 font-medium text-xs px-4 py-2 rounded-lg hover:bg-slate-200"
              >
                Manage Route Pools
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div
                key={ride._id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        ride.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      ● {ride.status}
                    </span>

                    {ride.routePoolId ? (
                      <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                        🔁 Recurring Pool Ride
                      </span>
                    ) : (
                      <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">
                        🗓️ Single-Day Ride
                      </span>
                    )}

                    <span className="text-xs text-slate-500">
                      Date: <strong>{new Date(ride.date).toLocaleDateString()}</strong> at <strong>{ride.departureTime}</strong>
                    </span>
                  </div>

                  <div className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span>{ride.origin.label}</span>
                    <span className="text-slate-400">→</span>
                    <span>{ride.destination.label}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Roster Locks At: {new Date(ride.rosterLockAt).toLocaleString()}
                    </span>

                    {ride.status === 'completed' ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
                        ✅ Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCompleteRide(ride._id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        🏁 Complete Ride & Get Payout
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span>
                      Seats Available: <strong>{ride.availableSeats} / {ride.totalSeats}</strong>
                    </span>
                    <span>
                      Estimated Share: <strong className="text-indigo-600">₹{ride.estimatedCostPerHead}</strong> / head
                    </span>
                    <span>
                      Fuel Rate Used: <strong>₹{ride.fuelPricePerLitreUsed}/L</strong>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-1">
                    Roster Locks At: {new Date(ride.rosterLockAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRides;