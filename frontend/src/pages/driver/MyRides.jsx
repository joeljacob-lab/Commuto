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
  Building2,
  CheckCircle2,
  AlertCircle,
  Star
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/toaster';
import { getMyDriverRides, completeRide, createReview } from '../../services/api';

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

const isRideLockPassed = (ride) => {
  if (!ride) return false;
  if (ride.costLocked) return true;
  if (ride.rosterLockAt && new Date() >= new Date(ride.rosterLockAt)) return true;
  if (ride.date && ride.departureTime) {
    const [h, m] = String(ride.departureTime).split(':').map(Number);
    const depDate = new Date(ride.date);
    depDate.setHours(h || 0, m || 0, 0, 0);
    if (new Date() >= depDate) return true;
  }
  return false;
};

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Review Modal state for driver rating passengers
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedPassengerForReview, setSelectedPassengerForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPassengerForReview) return;

    try {
      setReviewSubmitting(true);
      await createReview({
        rideId: selectedPassengerForReview.rideId,
        toUserId: selectedPassengerForReview.passengerId,
        rating: Number(rating),
        comment: comment.trim(),
      });
      toast.success(`Review recorded for passenger ${selectedPassengerForReview.passengerName}!`, { title: 'Feedback Recorded' });
      setReviewModalOpen(false);
      setComment('');
      setRating(5);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review for rider', { title: 'Submission Error' });
    } finally {
      setReviewSubmitting(false);
    }
  };

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
      const payoutMsg = `Trip completed! Payout of ₹${res.data?.data?.totalPayout || 0} credited to your wallet.`;
      setActionSuccess(payoutMsg);
      toast.success(payoutMsg, { title: 'Escrow Released' });
      setLoading(true);
      setRefreshKey((k) => k + 1);
      setTimeout(() => setActionSuccess(''), 4500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Could not complete ride.';
      toast.error(errorMsg, { title: 'Trip Action Failed' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
      case 'booking':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider">
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="bg-secondary text-primary border border-border px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-rose-50 text-rose-800 border border-rose-200/80 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="bg-secondary/60 text-muted-foreground border border-border px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background relative py-10 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background canvas dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-40 theme-dot-pattern" />

      <div className="relative max-w-5xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 text-primary border border-border text-xs font-mono mb-2">
              <Car className="w-3.5 h-3.5" />
              <span>DRIVER ROSTER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight flex items-center gap-2.5">
              Driver Ride Operations
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Track your scheduled commute pools, review confirmed student passengers, and collect trip payouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="border-border hover:bg-secondary/60 text-xs">
              <Link to="/driver/rides/create-single">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Single-Day Ride
              </Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-[#832323] text-primary-foreground text-xs shadow-xs">
              <Link to="/driver/routepools">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Manage Route Pools
              </Link>
            </Button>
          </div>
        </div>

        {/* Flash Notifications */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-[var(--radius)] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-mono">Loading your scheduled rides...</p>
          </div>
        ) : rides.length === 0 ? (
          /* Empty State */
          <div className="bg-card rounded-[var(--radius)] border border-border p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-secondary text-primary rounded-full flex items-center justify-center mx-auto border border-border">
              <Car className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-serif font-bold text-foreground">No Rides Found</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You haven&apos;t scheduled any recurring route pools or single-day rides yet. Create a pool to start sharing rides!
            </p>
            <Button asChild className="bg-primary hover:bg-[#832323] text-primary-foreground text-xs">
              <Link to="/driver/routepools">
                Create Route Pool →
              </Link>
            </Button>
          </div>
        ) : (
          /* Rides Listing */
          <div className="space-y-6">
            {rides.map((ride) => {
              const rideDate = safeFormatDate(ride.date);

              return (
                <div
                  key={ride._id}
                  className="bg-card rounded-[var(--radius)] border border-border p-5 sm:p-6 shadow-xs space-y-5 hover:border-primary/30 transition-all"
                >
                  {/* Top Bar: Route Info & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/80 gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {getStatusBadge(ride.status)}
                      <span className="text-xs font-semibold text-foreground">
                        {rideDate} at {ride.departureTime || '08:30'}
                      </span>
                      <span className="text-muted-foreground text-xs font-mono">
                        #{String(ride._id || '').slice(-6).toUpperCase()}
                      </span>
                    </div>

                    {/* Ride Actions */}
                    {ride.status === 'completed' ? (
                      <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-[var(--radius)] border border-emerald-200">
                        ✓ Payout Released
                      </span>
                    ) : ride.status === 'cancelled' ? (
                      <span className="text-xs font-mono text-rose-700 bg-rose-50 px-3 py-1 rounded-[var(--radius)] border border-rose-200">
                        Trip Cancelled
                      </span>
                    ) : !ride.passengers || ride.passengers.length === 0 ? (
                      <span className="text-xs bg-secondary/60 text-muted-foreground font-mono font-medium px-3 py-1.5 rounded-[var(--radius)] border border-border">
                        No Passengers (₹0 Payout)
                      </span>
                    ) : !isRideLockPassed(ride) ? (
                      <span className="text-xs bg-amber-50 text-amber-800 font-mono font-medium px-3 py-1.5 rounded-[var(--radius)] border border-amber-200/80">
                        Awaiting Roster Lock ({safeFormatTime(ride.rosterLockAt)})
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleCompleteRide(ride._id)}
                        className="bg-[#1b6a43] hover:bg-[#155334] text-white text-xs font-semibold shadow-xs"
                      >
                        🏁 Complete Ride &amp; Get Payout
                      </Button>
                    )}
                  </div>

                  {/* Corridor Origin -> Destination */}
                  <div className="text-base sm:text-lg font-serif font-bold text-foreground flex items-center gap-2">
                    <span>{ride.origin?.label || 'Origin'}</span>
                    <span className="text-muted-foreground font-sans">→</span>
                    <span>{ride.destination?.label || 'Destination'}</span>
                  </div>

                  {/* Ride Metrics */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground bg-secondary/30 p-3.5 rounded-[var(--radius)] border border-border/70">
                    <span>
                      Vehicle: <strong className="text-foreground capitalize">{ride.vehicleId?.model || 'Car'}</strong> ({ride.vehicleId?._id || 'Registered'})
                    </span>
                    <span className="text-border">•</span>
                    <span>
                      Seats: <strong className="text-emerald-700 font-mono">{ride.availableSeats ?? 0} / {ride.totalSeats ?? 4} available</strong>
                    </span>
                    <span className="text-border">•</span>
                    <span>
                      Equal Split: <strong className="text-primary font-mono font-bold">₹{ride.costPerHeadFinal || ride.estimatedCostPerHead || 0}</strong> / head
                    </span>
                    <span className="text-border">•</span>
                    <span className="text-muted-foreground text-[11px] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      Lock: {safeFormatTime(ride.rosterLockAt)}
                    </span>
                  </div>

                  {/* CONFIRMED PASSENGERS ROSTER */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        Confirmed Passengers ({ride.passengers?.length || 0})
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {ride.availableSeats ?? 0} open {ride.availableSeats === 1 ? 'seat' : 'seats'}
                      </span>
                    </div>

                    {!ride.passengers || ride.passengers.length === 0 ? (
                      <div className="bg-secondary/20 p-4 rounded-[var(--radius)] border border-border text-xs text-muted-foreground italic">
                        No passengers booked on this commute yet. Seats are available for matching!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                              className="p-3.5 bg-background border border-border rounded-[var(--radius)] space-y-2.5 text-xs shadow-2xs hover:border-primary/40 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-serif font-bold text-foreground text-sm">{studentName}</span>
                                <span className="font-mono text-[10px] font-bold text-primary bg-secondary px-2 py-0.5 rounded-full border border-border">
                                  {typeof student === 'object' ? student?._id : ''}
                                </span>
                              </div>

                              {/* MUTUAL RIDES BADGE */}
                              <div className="flex items-center gap-1.5 text-primary bg-secondary/80 border border-border px-2 py-0.5 rounded text-[11px] font-medium w-fit">
                                <span>🤝</span>
                                <span>
                                  {p.mutualRideCount > 0
                                    ? `${p.mutualRideCount} mutual ${p.mutualRideCount === 1 ? 'ride' : 'rides'}`
                                    : 'New co-rider (1st trip)'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate">{deptName}{student?.year ? ` • Year ${student.year}` : ''}</span>
                              </div>

                              {p.boardingPoint?.label && (
                                <div className="flex items-center gap-1.5 text-foreground text-[11px]">
                                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">Pickup: <strong>{p.boardingPoint.label}</strong></span>
                                </div>
                              )}

                              {/* Driver Action Contact & Rating Bar */}
                              <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {studentPhone ? (
                                    <a
                                      href={`tel:${studentPhone}`}
                                      className="inline-flex items-center gap-1.5 font-mono font-medium text-primary hover:text-[#832323] bg-secondary/60 hover:bg-secondary px-2.5 py-1 rounded-[var(--radius)] border border-border transition cursor-pointer text-[11px]"
                                      title="Call Passenger"
                                    >
                                      <Phone className="w-3 h-3 text-primary" />
                                      <span>{studentPhone}</span>
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground italic">No phone</span>
                                  )}

                                  {studentEmail && (
                                    <a
                                      href={`mailto:${studentEmail}`}
                                      className="text-muted-foreground hover:text-primary p-1 transition"
                                      title={`Email ${studentEmail}`}
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>

                                {/* Rate Rider button on completed trip */}
                                {ride.status === 'completed' && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPassengerForReview({
                                        rideId: ride._id,
                                        passengerId: typeof student === 'object' ? student?._id : student,
                                        passengerName: studentName,
                                      });
                                      setReviewModalOpen(true);
                                    }}
                                    className="gap-1.5 text-xs font-bold h-7 px-2.5"
                                  >
                                    <Star className="w-3.5 h-3.5 text-primary fill-current" />
                                    Rate Rider
                                  </Button>
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

      {/* Driver Review Modal for Passenger */}
      {reviewModalOpen && selectedPassengerForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-foreground">
                Rate Rider: {selectedPassengerForReview.passengerName}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Rate your co-rider on punctuality, communication, and carpool courtesy.
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-2">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-[var(--radius)] border transition cursor-pointer ${
                        rating >= star
                          ? 'bg-secondary border-primary/40 text-primary'
                          : 'border-border text-muted-foreground/30 hover:border-border/80'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="On-time pickup, courteous co-rider..."
                  className="w-full text-xs p-3 rounded-[var(--radius)] bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={reviewSubmitting}
                  className="font-semibold"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRides;