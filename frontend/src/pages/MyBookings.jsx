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
      const against = typeof selectedBookingForReport.rideId?.driverId === 'object'
        ? selectedBookingForReport.rideId.driverId._id
        : selectedBookingForReport.rideId?.driverId;

      await createReport({
        against,
        rideId: selectedBookingForReport.rideId._id,
        description: reportDescription.trim(),
      });
      alert('Report submitted to administrators.');
      setReportModalOpen(false);
      setReportDescription('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const getStatusBadge = (status, holdStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Confirmed Pass
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <CheckCircle2 className="w-3 h-3" /> Trip Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3 h-3" /> Cancelled ({holdStatus || 'processed'})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-7 h-7 text-indigo-600" />
              My Commute Bookings
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Active tickets, Equal Split fare locks, and trip history.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/search-rides"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              Book Another Ride
            </Link>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bookings Feed */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
            Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No bookings yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Find classmates traveling your corridor and split fuel costs.
            </p>
            <Link
              to="/search-rides"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-xs hover:bg-indigo-700 transition"
            >
              <Search className="w-3.5 h-3.5" />
              Search Commutes Now
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
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition hover:shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(booking.status, booking.holdStatus)}
                      <span className="text-xs font-bold text-slate-700">
                        {ride.date ? new Date(ride.date).toLocaleDateString() : 'Trip Date'} at {ride.departureTime || 'Scheduled'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      Booking #{String(booking._id || '').slice(-6).toUpperCase()}
                    </div>
                  </div>

                  {/* Route & Stop Details */}
                  <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Origin / Pickup</span>
                          <span className="text-xs font-bold text-slate-800">{ride.origin?.label || 'Pickup point'}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Destination</span>
                          <span className="text-xs font-bold text-slate-800">{ride.destination?.label || 'College Campus'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Driver & Vehicle Card with Safe Phone Display */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Driver</span>
                        <span className="font-bold text-slate-900">{driverName || 'Driver'}</span>
                      </div>

                      {/* Clickable Driver Phone Badge */}
                      {driverPhone && (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">Contact / Phone</span>
                          <a
                            href={`tel:${driverPhone}`}
                            className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition cursor-pointer"
                            title="Call Driver"
                          >
                            <Phone className="w-3 h-3 text-indigo-600" />
                            <span>{driverPhone}</span>
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-500">
                        <span>Vehicle</span>
                        <span className="font-mono">{vehicleDisplay}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-600">Fare Split</span>
                        <span className="font-bold text-indigo-700">
                          ₹{booking.holdAmountFinal || booking.holdAmountProvisional || 0}
                          {isPastLock && <span className="text-[10px] text-slate-400 ml-1 font-normal">(Finalized)</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {isPastLock ? (
                        <span className="text-amber-700 font-medium">
                          🔒 Roster locked. Equal Split finalized.
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">
                          🔓 Free cancellation eligible until 9:00 PM lock.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(booking)}
                          disabled={cancellingId === booking._id}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition cursor-pointer"
                        >
                          {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Seat'}
                        </button>
                      )}

                      {booking.status === 'completed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingForReview(booking);
                              setReviewModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5" />
                            Rate Driver
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingForReport(booking);
                              setReportModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                            Report
                          </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Rate Your Commute</h3>
            <p className="text-xs text-slate-500 mt-1">
              Mutual ratings strengthen our campus trust graph.
            </p>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-lg border transition cursor-pointer ${
                        rating >= star
                          ? 'bg-amber-50 border-amber-400 text-amber-500'
                          : 'border-slate-200 text-slate-300'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Optional Comment
                </label>
                <textarea
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="On-time pickup, polite, smooth driving..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Report Trip Issue
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Complaints are reviewed by college administrators.
            </p>

            <form onSubmit={handleReportSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Description of Incident (min 10 chars)
                </label>
                <textarea
                  rows="4"
                  required
                  minLength={10}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe what occurred (rash driving, no-show, harassment, etc.)..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting || reportDescription.trim().length < 10}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {reportSubmitting ? 'Submitting...' : 'File Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;