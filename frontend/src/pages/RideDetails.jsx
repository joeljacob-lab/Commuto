import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Car, 
  Clock, 
  Calendar, 
  Users, 
  Fuel, 
  ShieldCheck, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Ticket, 
  Sparkles 
} from 'lucide-react';
import { getRideDetails, createBooking } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        setLoading(true);
        const res = await getRideDetails(id);
        setRide(res.data.ride);
      } catch (error) {
        console.error('Failed to load ride:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRide();
  }, [id]);

  const handleBookSeat = async () => {
    if (!ride) return;
    const estShare = ride.estimatedCostPerHead || 20;

    if (!window.confirm(`Reserve 1 seat on this ride?\nA provisional escrow hold of ₹${estShare} will be placed on your wallet.`)) {
      return;
    }

    try {
      setBookingLoading(true);
      const res = await createBooking(ride._id, {
        boardingPoint: {
          label: ride.origin?.label || 'Origin Point',
          point: {
            type: 'Point',
            coordinates: ride.origin?.point?.coordinates || [76.3284, 10.0438],
          },
        },
      });

      const driverPhone = res.data?.data?.rideId?.driverId?.phone;
      const driverName = res.data?.data?.rideId?.driverId?.name || 'the driver';

      alert(`🎉 Seat Reserved Successfully!\n\nDriver: ${driverName}\n📞 Phone: ${driverPhone || 'Available in My Bookings'}\n\nRedirecting to My Bookings...`);
      navigate('/bookings');
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Loading commute details...
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
                #{String(ride._id).slice(-8).toUpperCase()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {ride.origin?.label} → {ride.destination?.label}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(ride.date).toLocaleDateString()}</span>
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
                <span className="text-slate-500 font-medium">Vehicle Model</span>
                <span className="font-bold text-slate-900 capitalize">
                  {ride.vehicleId?.model || 'Car'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Registration No</span>
                <span className="font-mono font-bold text-slate-800">
                  {ride.vehicleId?._id || 'Registered'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Seats</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {ride.vehicleId?.seats || 4} seats
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Fuel Mileage</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-slate-400" />
                  {ride.vehicleId?.mileageKmpl || 15} km/l
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Available Passenger Seats:</span>
              <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {ride.availableSeats} Seats Left
              </span>
            </div>
          </div>
        </div>

        {/* Equal Split Cost Mechanics Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Equal Split Cost Mechanics
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Commuto splits daily fuel cost equally: <strong>Cost / Head = Daily Trip Cost ÷ (1 + Confirmed Passengers)</strong>.
            The driver is counted as one seat so single passengers are never burdened with 100% of fuel costs.
            Headcounts and final fares freeze at <strong>9:00 PM</strong> on the evening before the ride.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          {isDriver ? (
            <div className="px-5 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-500" />
              You are the driver of this commute
            </div>
          ) : (
            <button
              type="button"
              disabled={bookingLoading || ride.availableSeats <= 0}
              onClick={handleBookSeat}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              {bookingLoading ? 'Reserving Seat...' : `Book Seat (Hold ₹${ride.estimatedCostPerHead || 20})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideDetails;