import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Car, 
  ShieldCheck, 
  Fuel, 
  CheckCircle2, 
  Phone,
  Mail
} from 'lucide-react';
import { getRideById, createBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getRideById(id)
      .then((res) => {
        if (isMounted) {
          setRide(res?.data?.ride || null);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Could not load ride details.');
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
  }, [id]);

  const handleBookSeat = async () => {
    if (!ride) return;
    try {
      setBookingLoading(true);
      setError('');
      
      const payload = {
        rideId: ride._id,
        boardingPoint: {
          label: ride.boardingPoints?.[0]?.label || ride.origin?.label || 'Origin Stop',
          coordinates: ride.boardingPoints?.[0]?.point?.coordinates || ride.origin?.point?.coordinates || [0, 0]
        }
      };

      await createBooking(payload);
      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/bookings');
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to book seat. Please check your wallet balance.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Fetching corridor itinerary...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-lg font-bold text-slate-800">Trip not found</h2>
        <Link to="/search-rides" className="text-indigo-600 text-xs mt-2 underline">
          Return to search
        </Link>
      </div>
    );
  }

  const isDriver = user?._id === (ride.driverId?._id || ride.driverId);
  const driverName = typeof ride.driverId === 'object' ? (ride.driverId?.name || ride.driverId?._id) : ride.driverId;
  const driverPhone = typeof ride.driverId === 'object' ? ride.driverId?.phone : null;
  const driverEmail = typeof ride.driverId === 'object' ? ride.driverId?.email : null;

  const rideDate = ride.date ? new Date(ride.date).toLocaleDateString() : 'Scheduled Date';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          to="/search-rides"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Search Results
        </Link>

        {/* Trip Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                ride.status === 'published' || ride.status === 'booking'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {ride.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                #{String(ride._id || '').slice(-8).toUpperCase()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {ride.origin?.label} → {ride.destination?.label}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{rideDate}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Departs at {ride.departureTime}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Estimated Share / Head
            </span>
            <span className="text-3xl font-black text-indigo-700">
              ₹{ride.costPerHeadFinal || ride.estimatedCostPerHead || 20}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {ride.costLocked ? '🔒 Finalized Roster' : 'Provisional equal split'}
            </span>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Driver & Safety Identity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Driver &amp; Safety Profile
            </h2>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Driver Name</span>
                <span className="font-bold text-slate-900">{driverName}</span>
              </div>

              {driverPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Contact Phone</span>
                  <a
                    href={`tel:${driverPhone}`}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{driverPhone}</span>
                  </a>
                </div>
              )}

              {driverEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">College Email</span>
                  <span className="font-mono text-slate-700 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {driverEmail}
                  </span>
                </div>
              )}

              {/* MUTUAL COMMUTES BADGE */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Mutual Commutes</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-[11px] border border-indigo-100 inline-flex items-center gap-1">
                  <span>🤝</span>
                  <span>
                    {ride.mutualRideCount > 0
                      ? `${ride.mutualRideCount} shared ${ride.mutualRideCount === 1 ? 'ride' : 'rides'}`
                      : 'First time riding together'}
                  </span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              ✓ Verified college member. Protected by Commuto&apos;s campus identity constraint and mutual rating system.
            </p>
          </div>

          {/* Vehicle & Capacity Specs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-indigo-600" />
              Vehicle Specifications
            </h2>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Model</span>
                <span className="font-bold text-slate-900 capitalize">
                  {ride.vehicleId?.model || 'Campus Vehicle'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Vehicle Type</span>
                <span className="capitalize text-slate-700">{ride.vehicleId?.type || '4-Wheeler'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Available Capacity</span>
                <span className="font-bold text-emerald-700">
                  {ride.availableSeats} of {ride.totalSeats} seats open
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Fuel Mileage Benchmark</span>
                <span className="text-slate-700">{ride.vehicleId?.mileageKmpl || 15} km/L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Boarding Points / Stops */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            Route Corridor &amp; Designated Boarding Points
          </h2>

          <div className="space-y-3">
            {ride.boardingPoints?.map((bp, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{bp.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {bp.point?.coordinates ? `[${bp.point.coordinates[0].toFixed(3)}, ${bp.point.coordinates[1].toFixed(3)}]` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Formula Breakdown */}
        <div className="bg-indigo-50/60 rounded-2xl border border-indigo-100 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <Fuel className="w-4 h-4 text-indigo-600" />
            Transparent Daily Cost Sharing Formula
          </div>
          <p className="text-xs text-indigo-950/80 leading-relaxed">
            Commuto splits the actual fuel expense evenly between the driver and confirmed riders:
          </p>
          <div className="bg-white/80 p-3 rounded-xl font-mono text-[11px] text-indigo-900 border border-indigo-200/50">
            Fare = (Trip Distance ÷ Vehicle Mileage × ₹{ride.fuelPricePerLitreUsed || 105}/L) ÷ (1 Driver + Confirmed Riders)
          </div>
          <p className="text-[11px] text-slate-500">
            🔒 Seat fare is provisionally reserved from your escrow balance and frozen at 9:00 PM roster lock based on confirmed headcount.
          </p>
        </div>

        {/* Actions Bar */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{ride.availableSeats} seats remaining</span>
          </div>

          {bookingSuccess ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Seat Booked! Redirecting to Tickets...
            </div>
          ) : isDriver ? (
            <span className="text-xs text-slate-400 italic">
              You are the driver of this trip
            </span>
          ) : ride.availableSeats <= 0 ? (
            <button
              disabled
              className="bg-slate-200 text-slate-500 text-xs font-bold px-5 py-2.5 rounded-xl cursor-not-allowed"
            >
              Trip Full
            </button>
          ) : (
            <button
              onClick={handleBookSeat}
              disabled={bookingLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {bookingLoading ? 'Reserving...' : `Book Seat (Hold ₹${ride.costPerHeadFinal || ride.estimatedCostPerHead || 20})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideDetails;