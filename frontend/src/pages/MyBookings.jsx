import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search, 
  Star, 
  ShieldAlert,
  Phone
} from 'lucide-react';
import { getMyBookings, cancelBooking, createReview, createReport } from '../services/api';
import { Button } from '../components/ui/button';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Review Modal States
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Report Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState(null);
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await getMyBookings();
        setBookings(res.data.data || []);
      } catch (error) {
        console.error('Failed to load bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [refreshKey]);

  const handleCancelBooking = async (booking) => {
    const isPastLock = booking.rideId?.costLocked;
    const confirmMessage = isPastLock
      ? '⚠️ LATE CANCELLATION WARNING:\nRoster lock has already passed for this trip. Cancelling now will forfeit your escrow hold to make the driver whole. Proceed?'
      : 'Cancel this seat reservation? 100% of your held escrow share will be refunded to your wallet balance immediately.';

    if (!window.confirm(confirmMessage)) return;

    try {
      setCancellingId(booking._id);
      await cancelBooking(booking._id);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReview) return;

    try {
      setReviewSubmitting(true);
      const toUserId = typeof selectedBookingForReview.rideId?.driverId === 'object'
        ? selectedBookingForReview.rideId.driverId._id
        : selectedBookingForReview.rideId?.driverId;

      await createReview({
        rideId: selectedBookingForReview.rideId._id,
        toUserId,
        rating: Number(rating),
        comment: comment.trim(),
      });
      alert('Review submitted successfully!');
      setReviewModalOpen(false);
      setComment('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingForReport) return;

    try {
      setReportSubmitting(true);
      const againstUserId = typeof selectedBookingForReport.rideId?.driverId === 'object'
        ? selectedBookingForReport.rideId.driverId._id
        : selectedBookingForReport.rideId?.driverId;

      await createReport({
        rideId: selectedBookingForReport.rideId._id,
        againstUserId,
        description: reportDescription.trim(),
      });
      alert('Safety incident report filed with campus moderation queue.');
      setReportModalOpen(false);
      setReportDescription('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to file safety report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const getStatusBadge = (status, holdStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-primary border border-border">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Confirmed Pass
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Trip Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            <XCircle className="w-3.5 h-3.5" /> Cancelled ({holdStatus || 'processed'})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-primary border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-accent selection:text-accent-foreground">
      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 theme-dot-pattern opacity-40 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
          <div>
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-primary bg-secondary px-3 py-1 rounded-full border border-border">
              Passes &amp; Escrow Holds
            </span>
            <h1 className="text-3xl font-serif font-bold text-foreground mt-3 tracking-tight flex items-center gap-2.5">
              <Ticket className="w-7 h-7 text-primary" />
              My Commute Bookings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Active tickets, Equal Split fare locks, and verified trip history.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/search-rides">
              <Button size="sm" className="gap-2 font-semibold">
                <Search className="w-3.5 h-3.5" />
                Book Another Ride
              </Button>
            </Link>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 bg-card border border-border rounded-[var(--radius)] text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer shadow-xs"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bookings Feed */}
        {loading ? (
          <div className="bg-card rounded-[var(--radius)] border border-border p-12 text-center text-muted-foreground text-sm font-medium">
            Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-card rounded-[var(--radius)] border border-border p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary mx-auto mb-2 border border-border">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-foreground">No bookings yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Find classmates traveling your corridor every day and split daily fuel costs fairly with the Equal Split Model.
            </p>
            <Link to="/search-rides" className="inline-block pt-2">
              <Button size="default" className="gap-2 font-semibold">
                <Search className="w-4 h-4" />
                Search Commutes Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              if (!booking) return null;
              const ride = booking.rideId || {};
              const isPastLock = ride.costLocked;

              // Safely extract driver and vehicle strings
              const driverName = typeof ride.driverId === 'object' ? (ride.driverId?.name || ride.driverId?._id) : ride.driverId;
              const driverPhone = typeof ride.driverId === 'object' ? ride.driverId?.phone : null;
              const vehicleDisplay = typeof ride.vehicleId === 'object' 
                ? `${ride.vehicleId?.model || 'Vehicle'} (${ride.vehicleId?._id || ''})` 
                : (ride.vehicleId || 'Vehicle');

              return (
                <div
                  key={booking._id}
                  className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs transition hover:border-primary/40 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border/70 gap-2">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(booking.status, booking.holdStatus)}
                      <span className="text-xs font-semibold text-foreground font-mono">
                        {ride.date ? new Date(ride.date).toLocaleDateString() : 'Trip Date'} at {ride.departureTime || 'Scheduled'}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono">
                      Booking #{String(booking._id || '').slice(-6).toUpperCase()}
                    </div>
                  </div>

                  {/* Route & Stop Details */}
                  <div className="py-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Origin / Pickup</span>
                          <span className="text-xs font-semibold text-foreground">{ride.origin?.label || 'Pickup point'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Destination</span>
                          <span className="text-xs font-semibold text-foreground">{ride.destination?.label || 'College Campus'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Driver & Vehicle Card with Safe Phone Display */}
                    <div className="bg-background rounded-lg p-3.5 border border-border text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Driver</span>
                        <span className="font-bold text-foreground">{driverName || 'Driver'}</span>
                      </div>

                      {/* Clickable Driver Phone Badge */}
                      {driverPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Contact</span>
                          <a
                            href={`tel:${driverPhone}`}
                            className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-secondary px-2 py-0.5 rounded border border-border transition hover:scale-105"
                            title="Call Driver"
                          >
                            <Phone className="w-3 h-3 text-primary" />
                            <span>{driverPhone}</span>
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Vehicle</span>
                        <span className="font-mono text-foreground font-medium">{vehicleDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1.5 border-t border-border">
                        <span className="text-muted-foreground">Fare Split</span>
                        <span className="font-mono font-black text-primary text-sm">
                          ₹{booking.holdAmountFinal || booking.holdAmountProvisional || 0}
                          {isPastLock && <span className="text-[10px] text-muted-foreground ml-1 font-normal font-sans">(Finalized)</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs font-mono">
                      {isPastLock ? (
                        <span className="text-primary font-medium">
                          🔒 Roster locked. Equal Split finalized.
                        </span>
                      ) : (
                        <span className="text-foreground font-medium">
                          🔓 Free cancellation eligible until 9:00 PM lock.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === 'confirmed' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelBooking(booking)}
                          disabled={cancellingId === booking._id}
                          className="text-xs font-bold"
                        >
                          {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Seat'}
                        </Button>
                      )}

                      {booking.status === 'completed' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedBookingForReview(booking);
                              setReviewModalOpen(true);
                            }}
                            className="gap-1.5 text-xs font-bold"
                          >
                            <Star className="w-3.5 h-3.5 text-primary fill-current" />
                            Rate Driver
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBookingForReport(booking);
                              setReportModalOpen(true);
                            }}
                            className="gap-1.5 text-xs font-medium"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
                            Report
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mutual Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-foreground">Rate Your Commute</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Mutual ratings strengthen our campus pairwise trust graph.
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
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Optional Feedback
                </label>
                <textarea
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="On-time pickup, polite, smooth driving..."
                  className="w-full text-xs bg-background border border-border rounded-[var(--radius)] p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={reviewSubmitting}
                  className="font-bold"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                Report Trip Issue
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Complaints are reviewed by college administrators.
              </p>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Incident Description (min 10 chars)
                </label>
                <textarea
                  rows="4"
                  required
                  minLength={10}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe what occurred (rash driving, no-show, harassment, etc.)..."
                  className="w-full text-xs bg-background border border-border rounded-[var(--radius)] p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-destructive"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={reportSubmitting || reportDescription.trim().length < 10}
                  className="font-bold"
                >
                  {reportSubmitting ? 'Submitting...' : 'File Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;