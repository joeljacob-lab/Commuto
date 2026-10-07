import { useState, useEffect } from 'react';
import { searchRides, createBooking } from '../services/api.js';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  ArrowRight
  } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from '../components/ui/toaster';

const POPULAR_LOCATIONS = [
  { label: 'Campus Main Gate', coordinates: [76.3284, 10.0438] },
  { label: 'Aluva Metro Station', coordinates: [76.3571, 10.1076] },
  { label: 'Edappally Toll', coordinates: [76.3078, 10.0261] },
  { label: 'Kalamassery Premier', coordinates: [76.3211, 10.0542] },
  { label: 'Kakkanad Infopark Gate', coordinates: [76.3638, 10.0125] },
];

const getTomorrowDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const SearchRides = () => {
  const navigate = useNavigate();
  const [bookingRideId, setBookingRideId] = useState(null);

  // Origin State
  const [origin, setOrigin] = useState({
    label: 'Aluva Metro Station',
    coordinates: [76.3571, 10.1076],
  });
  const [originQuery, setOriginQuery] = useState('Aluva Metro Station');
  const [originResults, setOriginResults] = useState([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);

  // Destination State
  const [destination, setDestination] = useState({
    label: 'Campus Main Gate',
    coordinates: [76.3284, 10.0438],
  });
  const [destQuery, setDestQuery] = useState('Campus Main Gate');
  const [destResults, setDestResults] = useState([]);
  const [searchingDest, setSearchingDest] = useState(false);

  // Date and Time State
  const [date, setDate] = useState(getTomorrowDateStr());
  const [time, setTime] = useState('08:30');

  // Search Results
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleOriginChange = (val) => {
    setOriginQuery(val);
    if (!val || val.length < 3) {
      setOriginResults([]);
    }
  };

  const handleDestChange = (val) => {
    setDestQuery(val);
    if (!val || val.length < 3) {
      setDestResults([]);
    }
  };

  // Debounced Origin Geocoding
  useEffect(() => {
    if (!originQuery || originQuery.length < 3) return;

    const timer = setTimeout(async () => {
      setSearchingOrigin(true);
      try {
        const presets = POPULAR_LOCATIONS.filter((l) =>
          l.label.toLowerCase().includes(originQuery.toLowerCase())
        ).map((p) => ({
          display_name: `${p.label} (Campus Preset)`,
          lon: p.coordinates[0],
          lat: p.coordinates[1],
          isPreset: true,
        }));

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            originQuery
          )}&countrycodes=in&limit=4`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();

        setOriginResults([...presets, ...data]);
      } catch (err) {
        console.error('Origin geocoding error:', err);
      } finally {
        setSearchingOrigin(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [originQuery]);

  // Debounced Destination Geocoding
  useEffect(() => {
    if (!destQuery || destQuery.length < 3) return;

    const timer = setTimeout(async () => {
      setSearchingDest(true);
      try {
        const presets = POPULAR_LOCATIONS.filter((l) =>
          l.label.toLowerCase().includes(destQuery.toLowerCase())
        ).map((p) => ({
          display_name: `${p.label} (Campus Preset)`,
          lon: p.coordinates[0],
          lat: p.coordinates[1],
          isPreset: true,
        }));

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            destQuery
          )}&countrycodes=in&limit=4`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();

        setDestResults([...presets, ...data]);
      } catch (err) {
        console.error('Dest geocoding error:', err);
      } finally {
        setSearchingDest(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [destQuery]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.warning('Geolocation is not supported by your browser.', { title: 'Location Unavailable' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [
          Number(pos.coords.longitude.toFixed(5)),
          Number(pos.coords.latitude.toFixed(5)),
        ];
        setOrigin({
          label: 'My Current Location',
          coordinates: coords,
        });
        setOriginQuery('My Current Location');
        setOriginResults([]);
        toast.info('Set origin to your current GPS coordinates.', { title: 'Location Detected' });
      },
      () => {
        toast.error('Could not fetch your location. Please check browser permissions.', { title: 'Permission Denied' });
      }
    );
  };

  const handleSelectOrigin = (item) => {
    const label = item.display_name.split(',')[0].replace(' (Campus Preset)', '');
    setOrigin({
      label,
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
    });
    setOriginQuery(label);
    setOriginResults([]);
  };

  const handleSelectDest = (item) => {
    const label = item.display_name.split(',')[0].replace(' (Campus Preset)', '');
    setDestination({
      label,
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
    });
    setDestQuery(label);
    setDestResults([]);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setSearchAttempted(true);

    try {
      const response = await searchRides({
        originLng: origin.coordinates[0],
        originLat: origin.coordinates[1],
        destLng: destination.coordinates[0],
        destLat: destination.coordinates[1],
        date,
        time,
      });

      setResults(response.data.rides || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to match viable rides. Check your parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookRide = async (ride) => {
    const estimatedFare = ride.estimatedCostPerHead || ride.estimatedCost || 0;
    const confirmMsg = `Confirm booking for ${ride.departureTime} with ${ride.driverId?.name || 'Driver'}?\n\nAn escrow hold of ₹${estimatedFare} will be placed on your wallet and locked at 9:00 PM.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setBookingRideId(ride._id);

      const bookingPayload = {
        rideId: ride._id,
        boardingPoint: {
          label: origin.label || 'Passenger Pickup',
          coordinates: origin.coordinates,
        },
      };

      await createBooking(bookingPayload);
      toast.success('Seat reserved successfully! Escrow hold placed. Final fare locks at 9:00 PM.', { title: 'Seat Reserved' });
      navigate('/bookings');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Check your wallet balance.';
      toast.error(msg, { title: 'Reservation Failed' });
    } finally {
      setBookingRideId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-accent selection:text-accent-foreground">
      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 theme-dot-pattern opacity-40 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div>
          <span className="text-xs uppercase font-mono font-bold tracking-wider text-primary bg-secondary px-3 py-1 rounded-full border border-border">
            Corridor Overlap &amp; Match Engine
          </span>
          <h1 className="text-3xl font-serif font-bold text-foreground mt-3 tracking-tight">
            Find Your Campus Corridor Match
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Deterministic route scoring with transparent Equal Split cost sharing and automated escrow.
          </p>
        </div>

        {/* Search Form Card */}
        <form onSubmit={handleSearch} className="bg-card p-6 sm:p-8 rounded-[var(--radius)] shadow-xs border border-border space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ORIGIN BOX */}
            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground">
                  Pickup Location
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Use GPS Location</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full bg-background border border-border rounded-[var(--radius)] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-ring transition"
                  placeholder="Search boarding point..."
                  value={originQuery}
                  onChange={(e) => handleOriginChange(e.target.value)}
                />
                <MapPin className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
              </div>

              {searchingOrigin && (
                <span className="text-[10px] text-muted-foreground absolute right-3 top-9">
                  Searching...
                </span>
              )}

              {/* Suggestions Dropdown */}
              {originResults.length > 0 && (
                <ul className="absolute z-20 w-full bg-card border border-border rounded-[var(--radius)] mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {originResults.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleSelectOrigin(item)}
                      className="p-2.5 text-xs hover:bg-secondary cursor-pointer border-b border-border/50 flex items-center justify-between transition"
                    >
                      <span className="truncate text-foreground">{item.display_name}</span>
                      {item.isPreset && (
                        <span className="text-[9px] bg-secondary text-primary px-1.5 py-0.5 rounded font-bold border border-border">
                          Preset
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Quick Presets */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1.5">Campus Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      type="button"
                      key={loc.label}
                      onClick={() => {
                        setOrigin(loc);
                        setOriginQuery(loc.label);
                        setOriginResults([]);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-[var(--radius)] border transition cursor-pointer ${
                        origin.label === loc.label
                          ? 'bg-primary text-primary-foreground border-primary font-medium'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {loc.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DESTINATION BOX */}
            <div className="space-y-2 relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground">
                Destination / Drop-off
              </label>

              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full bg-background border border-border rounded-[var(--radius)] px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-ring transition"
                  placeholder="Search destination or campus gate..."
                  value={destQuery}
                  onChange={(e) => handleDestChange(e.target.value)}
                />
                <MapPin className="w-4 h-4 text-primary absolute right-3.5 top-3 pointer-events-none" />
              </div>

              {searchingDest && (
                <span className="text-[10px] text-muted-foreground absolute right-3 top-9">
                  Searching...
                </span>
              )}

              {/* Suggestions Dropdown */}
              {destResults.length > 0 && (
                <ul className="absolute z-20 w-full bg-card border border-border rounded-[var(--radius)] mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {destResults.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleSelectDest(item)}
                      className="p-2.5 text-xs hover:bg-secondary cursor-pointer border-b border-border/50 flex items-center justify-between transition"
                    >
                      <span className="truncate text-foreground">{item.display_name}</span>
                      {item.isPreset && (
                        <span className="text-[9px] bg-secondary text-primary px-1.5 py-0.5 rounded font-bold border border-border">
                          Preset
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Quick Presets */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1.5">Campus Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      type="button"
                      key={loc.label}
                      onClick={() => {
                        setDestination(loc);
                        setDestQuery(loc.label);
                        setDestResults([]);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-[var(--radius)] border transition cursor-pointer ${
                        destination.label === loc.label
                          ? 'bg-primary text-primary-foreground border-primary font-medium'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {loc.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* TIME & DATE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                Commute Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  className="w-full bg-background border border-border rounded-[var(--radius)] px-3.5 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-ring transition"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                Target Departure Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  className="w-full bg-background border border-border rounded-[var(--radius)] px-3.5 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-ring transition"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-destructive text-xs bg-secondary/80 p-3 rounded-[var(--radius)] border border-destructive/20 font-medium">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full font-semibold shadow-xs"
          >
            {isLoading ? 'Calculating Corridor Overlaps...' : 'Find Matching Campus Rides'}
          </Button>
        </form>

        {/* RESULTS DISPLAY */}
        <div>
          <h2 className="text-xl font-serif font-bold mb-4 text-foreground flex items-center justify-between">
            <span>Viable Corridor Matches</span>
            {searchAttempted && !isLoading && (
              <span className="text-xs font-mono font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-[var(--radius)] border border-border">
                {results.length} found
              </span>
            )}
          </h2>

          {isLoading && (
            <div className="bg-card p-8 rounded-[var(--radius)] border border-border text-center text-sm text-muted-foreground">
              Evaluating polyline forward vectors and walking radii...
            </div>
          )}

          {!isLoading && searchAttempted && results.length === 0 && !error && (
            <div className="bg-card text-muted-foreground p-8 rounded-[var(--radius)] text-center text-sm border border-border space-y-2">
              <p className="font-semibold text-foreground">No viable rides found along this corridor.</p>
              <p className="text-xs">Try widening your preferred departure time or choosing a neighboring campus preset.</p>
            </div>
          )}

          <div className="space-y-4">
            {results.map((ride) => (
              <div
                key={ride._id}
                className="bg-card p-6 rounded-[var(--radius)] shadow-xs border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:border-primary/50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-serif font-bold text-lg text-foreground">
                      {ride.driverId?.name || 'Driver'}
                    </span>
                    <span className="bg-secondary text-primary text-xs px-2.5 py-0.5 rounded-[var(--radius)] font-mono font-bold border border-border">
                      {ride.vehicleId?.model || 'Vehicle'}
                    </span>
                  </div>

                  {/* Trust Edge Indicator */}
                  <div className="flex items-center gap-1.5 text-accent-foreground bg-accent/60 border border-border px-2.5 py-0.5 rounded-[var(--radius)] text-[11px] font-semibold w-fit">
                    <span>🤝</span>
                    <span>
                      {ride.mutualRideCount > 0
                        ? `${ride.mutualRideCount} shared ${ride.mutualRideCount === 1 ? 'ride' : 'rides'} with driver`
                        : '1st ride together (Verified student)'}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono">
                    <p><strong className="text-foreground">Departs:</strong> {ride.departureTime}</p>
                    <p><strong className="text-foreground">Seats:</strong> {ride.availableSeats} open</p>
                    <p><strong className="text-foreground">Est. Share:</strong> ₹{ride.estimatedCostPerHead || ride.estimatedCost || 'TBD'}</p>
                    <p className="col-span-2 text-primary font-sans font-medium">
                      📍 Walking distance to pickup: ~{ride.boardingDistanceKm} km
                    </p>
                  </div>

                  <div className="pt-1">
                    <Link
                      to={`/rides/${ride._id}`}
                      className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1"
                    >
                      Inspect Route &amp; Roster Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col items-end min-w-[170px] w-full sm:w-auto shrink-0">
                  <div className="bg-secondary border border-border text-foreground px-4 py-2.5 rounded-[var(--radius)] text-center mb-3 w-full">
                    <span className="block text-2xl font-mono font-black text-primary">{ride.matchScore}%</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Match Score</span>
                  </div>
                  <Button
                    type="button"
                    disabled={bookingRideId === ride._id}
                    className="w-full text-xs font-bold"
                    size="default"
                    onClick={() => handleBookRide(ride)}
                  >
                    {bookingRideId === ride._id ? 'Reserving...' : `Book Seat (Hold ₹${ride.estimatedCostPerHead || 0})`}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SearchRides;