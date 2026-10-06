import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  Car,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div>
            <Link to="/" className="text-xs font-semibold text-indigo-600 hover:underline">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Car className="w-6 h-6 text-emerald-600" />
              Driver Hub — My Commute Trips
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review passenger bookings, contact riders, and finalize completed trip payouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateToday}
              disabled={generating}
              className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {generating ? 'Generating...' : '⚡ Generate Tomorrow’s Pool'}
            </button>
            <Link
              to="/driver/rides/create-single"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-xs"
            >
              + Publish Single Ride
            </Link>
          </div>
        </div>

        {status.error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
            {status.error}
          </div>
        )}
        {status.success && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            {status.success}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-xs">Loading your rides...</p>
        ) : rides.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-800 font-bold text-sm mb-1">No active or scheduled rides found.</p>
            <p className="text-xs text-slate-400 mb-6">
              You can publish an ad-hoc single trip or generate from your recurring route pools.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                to="/driver/rides/create-single"
                className="bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Publish Single-Day Ride
              </Link>
              <Link
                to="/driver/routepools"
                className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-200"
              >
                Manage Route Pools
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {rides.map((ride) => (
              <div
                key={ride._id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4"
              >
                {/* Trip Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        ride.status === 'published' || ride.status === 'booking'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      ● {ride.status}
                    </span>

                    {ride.routePoolId ? (
                      <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-100">
                        🔁 Recurring Pool
                      </span>
                    ) : (
                      <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold border border-purple-100">
                        🗓️ Single-Day Ride
                      </span>
                    )}

                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{new Date(ride.date).toLocaleDateString()}</strong> at <strong>{ride.departureTime}</strong>
                    </span>
                  </div>

                  {ride.status === 'completed' ? (
                    <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full">
                      ✓ Trip Completed
                    </span>
                  ) : ride.status === 'cancelled' ? (
                    <span className="text-xs bg-slate-100 text-slate-500 font-medium px-3 py-1 rounded-lg">
                      Trip Closed (No Riders)
                    </span>
                  ) : (!ride.passengers || ride.passengers.length === 0) ? (
                    <span className="text-xs bg-slate-100 text-slate-400 font-medium px-3 py-1.5 rounded-lg border border-slate-200">
                      No Passengers (₹0 Payout)
                    </span>
                  ) : !ride.costLocked ? (
                    <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-3 py-1.5 rounded-lg border border-amber-200">
                      Awaiting 9:00 PM Roster Lock
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteRide(ride._id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                    >
                      🏁 Complete Ride &amp; Get Payout
                    </button>
                  )}
                </div>

                {/* Corridor Origin -> Destination */}
                <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{ride.origin?.label}</span>
                  <span className="text-slate-400">→</span>
                  <span>{ride.destination?.label}</span>
                </div>

                {/* Ride Metrics */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <span>
                    Vehicle: <strong className="capitalize">{ride.vehicleId?.model || 'Car'}</strong> ({ride.vehicleId?._id || 'Registered'})
                  </span>
                  <span>•</span>
                  <span>
                    Seats Left: <strong className="text-emerald-700">{ride.availableSeats} / {ride.totalSeats}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Equal Split: <strong className="text-indigo-600">₹{ride.costPerHeadFinal || ride.estimatedCostPerHead}</strong> / head
                  </span>
                  <span>•</span>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Lock: {new Date(ride.rosterLockAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* CONFIRMED PASSENGERS ROSTER */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Confirmed Passengers ({ride.passengers?.length || 0})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {ride.availableSeats} open {ride.availableSeats === 1 ? 'seat' : 'seats'}
                    </span>
                  </div>

                  {!ride.passengers || ride.passengers.length === 0 ? (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs text-slate-400 italic">
                      No passengers booked on this commute yet. Seats are available for matching!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ride.passengers.map((p) => {
                        const student = p.passenger;
                        const studentName = student?.name || student?._id || 'Student';
                        const studentPhone = student?.phone;
                        const studentEmail = student?.email;
                        const deptName = student?.deptId?.deptName || student?.deptId?.name || 'Department Verified';

                        return (
                          <div
                            key={p.bookingId}
                            className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-2xs hover:border-indigo-300 transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-sm">{studentName}</span>
                              <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                {student?._id}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{deptName}{student?.year ? `• Year ${student.year}` : ''}</span>
                            </div>

                            {p.boardingPoint?.label && (
                              <div className="flex items-center gap-1.5 text-emerald-800 text-[11px]">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate">Pickup: <strong>{p.boardingPoint.label}</strong></span>
                              </div>
                            )}

                            {/* Driver Action Contact Bar */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              {studentPhone ? (
                                <a
                                  href={`tel:${studentPhone}`}
                                  className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition cursor-pointer"
                                  title="Call Passenger"
                                >
                                  <Phone className="w-3 h-3 text-indigo-600" />
                                  <span>{studentPhone}</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No phone provided</span>
                              )}

                              {studentEmail && (
                                <a
                                  href={`mailto:${studentEmail}`}
                                  className="text-slate-400 hover:text-indigo-600 p-1 transition"
                                  title={`Email ${studentEmail}`}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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