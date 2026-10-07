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
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/toaster';

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
      toast.success('Seat reserved successfully! Your fuel share is held in escrow.', { title: 'Booking Confirmed' });
      setTimeout(() => {
        navigate('/bookings');
      }, 1500);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to book seat. Please check your wallet balance.';
      setError(msg);
      toast.error(msg, { title: 'Reservation Failed' });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Fetching corridor itinerary...</p>
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-lg font-serif font-bold text-foreground">Trip Not Found</h2>
        <Link to="/search-rides" className="text-primary text-xs mt-2 underline">
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
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-accent selection:text-accent-foreground">
      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 theme-dot-pattern opacity-40 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <Link
          to="/search-rides"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Search Results
        </Link>

        {/* Trip Banner */}
        <div className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-[var(--radius)] text-[10px] font-bold uppercase tracking-wider ${
                ride.status === 'published' || ride.status === 'booking'
                  ? 'bg-secondary text-primary border border-border'
                  : 'bg-muted text-foreground border border-border'
              }`}>
                {ride.status}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                #{String(ride._id || '').slice(-8).toUpperCase()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-serif font-extrabold text-foreground">
              {ride.origin?.label} → {ride.destination?.label}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{rideDate}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Departs at {ride.departureTime}</span>
            </p>
          </div>

          <div className="text-left md:text-right bg-background md:bg-transparent p-3 md:p-0 rounded-[var(--radius)] border md:border-none border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">
              Estimated Share / Head
            </span>
            <span className="text-3xl font-mono font-black text-primary">
              ₹{ride.costPerHeadFinal || ride.estimatedCostPerHead || 20}
            </span>
            <span className="text-[11px] text-muted-foreground block font-sans">
              {ride.costLocked ? '🔒 Finalized Roster' : 'Provisional equal split'}
            </span>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Driver & Safety Identity */}
          <div className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Driver &amp; Safety Profile
            </h2>

            <div className="bg-background p-4 rounded-lg border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Driver Name</span>
                <span className="font-bold text-foreground">{driverName}</span>
              </div>

              {driverPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Contact Phone</span>
                  <a
                    href={`tel:${driverPhone}`}
                    className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-secondary px-2 py-0.5 rounded border border-border transition hover:scale-105"
                  >
                    <Phone className="w-3 h-3 text-primary" />
                    <span>{driverPhone}</span>
                  </a>
                </div>
              )}

              {driverEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">College Email</span>
                  <span className="font-mono text-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3 text-primary" />
                    {driverEmail}
                  </span>
                </div>
              )}

              {/* MUTUAL COMMUTES BADGE */}
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-muted-foreground">Mutual Commutes</span>
                <span className="font-bold text-accent-foreground bg-accent/60 px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] border border-border inline-flex items-center gap-1">
                  <span>🤝</span>
                  <span>
                    {ride.mutualRideCount > 0
                      ? `${ride.mutualRideCount} shared ${ride.mutualRideCount === 1 ? 'ride' : 'rides'}`
                      : 'First time riding together'}
                  </span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              ✓ Verified college member. Protected by Commuto&apos;s campus identity constraint and mutual pairwise trust graph.
            </p>
          </div>

          {/* Vehicle & Capacity Specs */}
          <div className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              Vehicle Specifications
            </h2>

            <div className="bg-background p-4 rounded-lg border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-bold text-foreground capitalize">
                  {ride.vehicleId?.model || 'Campus Vehicle'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vehicle Type</span>
                <span className="capitalize text-foreground font-medium">{ride.vehicleId?.type || '4-Wheeler'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Available Capacity</span>
                <span className="font-bold text-primary font-mono">
                  {ride.availableSeats} of {ride.totalSeats} seats open
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mileage Benchmark</span>
                <span className="text-foreground font-mono">{ride.vehicleId?.mileageKmpl || 15} km/L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Boarding Points / Stops */}
        <div className="bg-card rounded-[var(--radius)] border border-border p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Route Corridor &amp; Designated Stops
          </h2>

          <div className="space-y-2.5">
            {ride.boardingPoints?.map((bp, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-secondary text-primary flex items-center justify-center font-bold font-mono text-[10px] border border-border">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-foreground">{bp.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {bp.point?.coordinates ? `[${bp.point.coordinates[0].toFixed(3)}, ${bp.point.coordinates[1].toFixed(3)}]` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Formula Breakdown */}
        <div className="bg-secondary/60 rounded-[var(--radius)] border border-border p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-serif font-bold text-sm">
            <Fuel className="w-4 h-4 text-primary" />
            Transparent Daily Cost Sharing Formula
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Commuto splits the actual fuel expense evenly between the driver and confirmed riders:
          </p>
          <div className="bg-card p-3 rounded-lg font-mono text-[11px] text-primary border border-border">
            Fare = (Trip Distance ÷ Vehicle Mileage × ₹{ride.fuelPricePerLitreUsed || 105}/L) ÷ (1 Driver + Confirmed Riders)
          </div>
          <p className="text-[11px] text-muted-foreground">
            🔒 Seat fare is provisionally reserved from your escrow balance and frozen at 9:00 PM roster lock based on confirmed headcount.
          </p>
        </div>

        {/* Actions Bar */}
        {error && (
          <div className="p-3 bg-secondary/80 border border-destructive/20 rounded-[var(--radius)] text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        <div className="bg-card rounded-[var(--radius)] border border-border p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Users className="w-4 h-4 text-primary" />
            <span>{ride.availableSeats} seats remaining</span>
          </div>

          {bookingSuccess ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground bg-secondary px-4 py-2 rounded-lg border border-border">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Seat Booked! Redirecting to Tickets...
            </div>
          ) : isDriver ? (
            <span className="text-xs text-muted-foreground italic">
              You are the driver of this trip
            </span>
          ) : ride.availableSeats <= 0 ? (
            <Button disabled size="default" className="text-xs font-bold">
              Trip Full
            </Button>
          ) : (
            <Button
              onClick={handleBookSeat}
              disabled={bookingLoading}
              size="default"
              className="font-bold text-xs shadow-xs"
            >
              {bookingLoading ? 'Reserving...' : `Book Seat (Hold ₹${ride.costPerHeadFinal || ride.estimatedCostPerHead || 20})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RideDetails;