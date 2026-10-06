import { useState, useEffect } from 'react';
import { searchRides, createBooking } from '../services/api.js';
import { useNavigate, Link } from 'react-router-dom';

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

  // Debounced nominatim autocomplete for origin
  useEffect(() => {
    if (!originQuery || originQuery.length < 3) return;

    const timer = setTimeout(async () => {
      setSearchingOrigin(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            originQuery
          )}&countrycodes=in&limit=4`
        );
        const data = await res.json();

        const presets = POPULAR_LOCATIONS.filter((loc) =>
          loc.label.toLowerCase().includes(originQuery.toLowerCase())
        ).map((loc) => ({
          display_name: `${loc.label} (Campus Preset)`,
          lat: loc.coordinates[1],
          lon: loc.coordinates[0],
          isPreset: true,
        }));

        setOriginResults([...presets, ...data]);
      } catch (err) {
        console.error('Origin geocoding error:', err);
      } finally {
        setSearchingOrigin(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [originQuery]);

  // Debounced nominatim autocomplete for destination
  useEffect(() => {
    if (!destQuery || destQuery.length < 3) return;

    const timer = setTimeout(async () => {
      setSearchingDest(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            destQuery
          )}&countrycodes=in&limit=4`
        );
        const data = await res.json();

        const presets = POPULAR_LOCATIONS.filter((loc) =>
          loc.label.toLowerCase().includes(destQuery.toLowerCase())
        ).map((loc) => ({
          display_name: `${loc.label} (Campus Preset)`,
          lat: loc.coordinates[1],
          lon: loc.coordinates[0],
          isPreset: true,
        }));

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
      alert('Geolocation is not supported by your browser.');
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
      },
      () => {
        alert('Could not fetch your location. Please check browser permissions.');
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
    setIsLoading(true);
    setError('');
    setSearchAttempted(true);

    if (!origin.coordinates || !destination.coordinates) {
      setError('Please select valid origin and destination locations from the suggestions.');
      setIsLoading(false);
      return;
    }

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
      alert('🎉 Seat reserved successfully! An escrow hold has been placed. Final fare locks at 9:00 PM.');
      navigate('/bookings');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Check your wallet balance.';
      alert(`⚠️ ${msg}`);
    } finally {
      setBookingRideId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Find a Carpool Match</h1>
        <p className="text-slate-500 text-sm">
          Deterministic corridor matching with transparent escrow cost sharing.
        </p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 space-y-4">
        {/* ORIGIN BOX */}
        <div className="relative space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Origin / Pickup Location
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline flex items-center gap-1 cursor-pointer"
            >
              📍 Use Current Location
            </button>
          </div>

          <input
            type="text"
            required
            className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Search pickup point, metro, or landmark..."
            value={originQuery}
            onChange={(e) => handleOriginChange(e.target.value)}
          />

          {searchingOrigin && (
            <span className="text-[10px] text-slate-400 absolute right-2 top-8">
              Searching...
            </span>
          )}

          {/* Suggestions Dropdown */}
          {originResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
              {originResults.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectOrigin(item)}
                  className="p-2 text-xs hover:bg-indigo-50 cursor-pointer border-b border-slate-100 flex items-center justify-between"
                >
                  <span className="truncate">{item.display_name}</span>
                  {item.isPreset && (
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1 font-bold">
                      Preset
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Selected Badge */}
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Selected: <strong className="text-slate-700">{origin.label}</strong></span>
          </div>

          {/* Presets */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Quick Presets</span>
            <div className="flex flex-wrap gap-1">
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  type="button"
                  key={loc.label}
                  onClick={() => {
                    setOrigin(loc);
                    setOriginQuery(loc.label);
                    setOriginResults([]);
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                    origin.label === loc.label
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {loc.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DESTINATION BOX */}
        <div className="relative space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Destination / Drop-off
          </label>

          <input
            type="text"
            required
            className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Search destination or college gate..."
            value={destQuery}
            onChange={(e) => handleDestChange(e.target.value)}
          />

          {searchingDest && (
            <span className="text-[10px] text-slate-400 absolute right-2 top-8">
              Searching...
            </span>
          )}

          {/* Suggestions Dropdown */}
          {destResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
              {destResults.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectDest(item)}
                  className="p-2 text-xs hover:bg-indigo-50 cursor-pointer border-b border-slate-100 flex items-center justify-between"
                >
                  <span className="truncate">{item.display_name}</span>
                  {item.isPreset && (
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-1 font-bold">
                      Preset
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Selected Badge */}
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Selected: <strong className="text-slate-700">{destination.label}</strong></span>
          </div>

          {/* Presets */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Quick Presets</span>
            <div className="flex flex-wrap gap-1">
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  type="button"
                  key={loc.label}
                  onClick={() => {
                    setDestination(loc);
                    setDestQuery(loc.label);
                    setDestResults([]);
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                    destination.label === loc.label
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {loc.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TIME & DATE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Commute Date
            </label>
            <input
              type="date"
              required
              className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Preferred Time
            </label>
            <input
              type="time"
              required
              className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-xs bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 transition cursor-pointer"
        >
          {isLoading ? 'Calculating Best Matches...' : 'Find Matching Rides'}
        </button>
      </form>

      {/* RESULTS DISPLAY */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-slate-800">
          Matched Rides {searchAttempted && !isLoading && `(${results.length})`}
        </h2>

        {isLoading && <p className="text-slate-500 text-sm">Evaluating route overlaps and boarding distances...</p>}

        {!isLoading && searchAttempted && results.length === 0 && !error && (
          <div className="bg-slate-100 text-slate-600 p-6 rounded-xl text-center text-sm border border-slate-200">
            No viable rides found along this corridor. Try adjusting your preferred time or location!
          </div>
        )}

        <div className="space-y-4">
          {results.map((ride) => (
            <div
              key={ride._id}
              className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-slate-800">
                    {ride.driverId?.name || 'Driver'}
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-indigo-100">
                    {ride.vehicleId?.model || 'Vehicle'}
                  </span>
                </div>

                {/* MUTUAL RIDE BADGE */}
                <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px] font-semibold w-fit">
                  <span>🤝</span>
                  <span>
                    {ride.mutualRideCount > 0
                      ? `${ride.mutualRideCount} shared ${ride.mutualRideCount === 1 ? 'ride' : 'rides'} with driver`
                      : '1st ride together'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  <p><strong>Departure:</strong> {ride.departureTime}</p>
                  <p><strong>Available Seats:</strong> {ride.availableSeats}</p>
                  <p><strong>Est. Share:</strong> ₹{ride.estimatedCostPerHead || ride.estimatedCost || 'TBD'}</p>
                  <p className="text-indigo-600 font-medium">
                    📍 Walk to boarding: ~{ride.boardingDistanceKm} km
                  </p>
                </div>

                <div className="pt-1">
                  <Link
                    to={`/rides/${ride._id}`}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline"
                  >
                    View Trip Details →
                  </Link>
                </div>
              </div>

              <div className="flex flex-col items-end min-w-[150px] w-full sm:w-auto">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-center mb-3 w-full">
                  <span className="block text-2xl font-black">{ride.matchScore}%</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold">Match Score</span>
                </div>
                <button
                  type="button"
                  disabled={bookingRideId === ride._id}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                  onClick={() => handleBookRide(ride)}
                >
                  {bookingRideId === ride._id ? 'Reserving...' : `Book Seat (Hold ₹${ride.estimatedCostPerHead || 0})`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchRides;