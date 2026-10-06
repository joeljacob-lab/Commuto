import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  Users, 
  MapPin, 
  Plus, 
  Clock, 
  Phone, 
  Mail, 
  Building2 
} from 'lucide-react';
import { getMyDriverRides, completeRide } from '../../services/api';

// Safe date/time formatting helpers that never throw RangeError
const safeFormatTime = (timeVal) => {
  if (!timeVal) return '9:00 PM';
  try {
    const d = new Date(timeVal);
    if (isNaN(d.getTime())) return '9:00 PM';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '9:00 PM';
  }
};

const safeFormatDate = (dateVal) => {
  if (!dateVal) return 'Scheduled Trip';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Scheduled Trip';
    return d.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Scheduled Trip';
  }
};

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    getMyDriverRides()
      .then((res) => {
        if (isMounted) {
          setRides(res?.data?.rides || []);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load offered rides.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleCompleteRide = async (rideId) => {
    if (!window.confirm('Complete this trip and release passenger escrow payout to your wallet?')) {
      return;
    }

    try {
      const res = await completeRide(rideId);
      setActionSuccess(`Trip completed! Payout of ₹${res.data?.data?.totalPayout || 0} credited to your wallet.`);
      setLoading(true);
      setRefreshKey((k) => k + 1);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(`⚠️ ${err.response?.data?.message || 'Could not complete ride.'}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
      case 'booking':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Car className="w-7 h-7 text-indigo-600" />
              Driver Ride Management
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Track your scheduled commute pools, view confirmed passengers, and collect trip payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/driver/route-pools"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Manage Route Pools
            </Link>
          </div>
        </div>

        {/* Flash Notifications */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
            {actionSuccess}
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading your scheduled rides...</p>
          </div>
        ) : rides.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <Car className="w-7 h-7" />
            </div>
            <h2 className="text-base font-bold text-slate-900">No Rides Found</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You haven&apos;t scheduled any recurring route pools or ad-hoc rides yet. Set up a pool to start sharing rides!
            </p>
            <Link
              to="/driver/route-pools"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-xs"
            >
              Create Route Pool
            </Link>
          </div>
        ) : (
          /* Rides Listing */
          <div className="space-y-6">
            {rides.map((ride) => {
              const rideDate = safeFormatDate(ride.date);

              return (
                <div
                  key={ride._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5"
                >
                  {/* Top Bar: Route Info & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(ride.status)}
                      <span className="text-xs font-bold text-slate-800">
                        {rideDate} at {ride.departureTime || '08:30'}
                      </span>
                      <span className="text-slate-400 text-xs font-mono">
                        #{String(ride._id || '').slice(-6).toUpperCase()}
                      </span>
                    </div>

                    {/* Ride Actions */}
                    {ride.status === 'completed' ? (
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
                        ✓ Payout Released
                      </span>
                    ) : ride.status === 'cancelled' ? (
                      <span className="text-xs text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                        Trip Cancelled
                      </span>
                    ) : !ride.passengers || ride.passengers.length === 0 ? (
                      <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-3 py-1.5 rounded-lg border border-slate-200">
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
                    <span>{ride.origin?.label || 'Origin'}</span>
                    <span className="text-slate-400">→</span>
                    <span>{ride.destination?.label || 'Destination'}</span>
                  </div>

                  {/* Ride Metrics */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <span>
                      Vehicle: <strong className="capitalize">{ride.vehicleId?.model || 'Car'}</strong> ({ride.vehicleId?._id || 'Registered'})
                    </span>
                    <span>•</span>
                    <span>
                      Seats Left: <strong className="text-emerald-700">{ride.availableSeats ?? 0} / {ride.totalSeats ?? 4}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Equal Split: <strong className="text-indigo-600">₹{ride.costPerHeadFinal || ride.estimatedCostPerHead || 0}</strong> / head
                    </span>
                    <span>•</span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Lock: {safeFormatTime(ride.rosterLockAt)}
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
                        {ride.availableSeats ?? 0} open {ride.availableSeats === 1 ? 'seat' : 'seats'}
                      </span>
                    </div>

                    {!ride.passengers || ride.passengers.length === 0 ? (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs text-slate-400 italic">
                        No passengers booked on this commute yet. Seats are available for matching!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ride.passengers.map((p, pIdx) => {
                          if (!p) return null;
                          const student = p.passenger;
                          const studentName = typeof student === 'object' ? (student?.name || student?._id || 'Student') : (student || 'Student');
                          const studentPhone = typeof student === 'object' ? student?.phone : null;
                          const studentEmail = typeof student === 'object' ? student?.email : null;
                          const deptName = typeof student?.deptId === 'object'
                            ? (student.deptId?.deptName || student.deptId?.name || 'Department Verified')
                            : 'Department Verified';

                          return (
                            <div
                              key={p.bookingId || pIdx}
                              className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-2xs hover:border-indigo-300 transition"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">{studentName}</span>
                                <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                  {typeof student === 'object' ? student?._id : ''}
                                </span>
                              </div>

                              {/* MUTUAL RIDES BADGE */}
                              <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/80 border border-indigo-100/70 px-2 py-0.5 rounded-md text-[11px] font-semibold w-fit">
                                <span>🤝</span>
                                <span>
                                  {p.mutualRideCount > 0
                                    ? `${p.mutualRideCount} mutual ${p.mutualRideCount === 1 ? 'ride' : 'rides'}`
                                    : 'New co-rider (1st trip)'}
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
                                    <Mail className="w-3 h-3" />
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRides;