/**
 * Calculates road driving distance (in km) and polyline coordinates between two points.
 * GeoJSON coordinate standard: [longitude, latitude]
 */
export const calculateRoute = async (originCoords, destCoords) => {
  const [originLng, originLat] = originCoords;
  const [destLng, destLat] = destCoords;

  try {
    // Free Open Source Routing Machine (OSRM) API
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    const response = await fetch(osrmUrl, { headers: { 'User-Agent': 'Commuto-College-Carpool' } });
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Number((route.distance / 1000).toFixed(2)); // convert meters to km

      return {
        distanceKm,
        routePolyline: {
          type: 'LineString',
          coordinates: route.geometry.coordinates, // array of [lng, lat]
        },
      };
    }
    throw new Error('OSRM route calculation failed');
  } catch (err) {
    console.warn('Routing API fallback to straight-line calculation:', err.message);

    // Fallback: Haversine distance if external API times out
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(destLat - originLat);
    const dLon = toRad(destLng - originLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(originLat)) * Math.cos(toRad(destLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDistance = Number((R * c).toFixed(2));

    // Multiply straight line by 1.25 as typical road curvature approximation
    const approxRoadDistance = Number((straightDistance * 1.25).toFixed(2));

    return {
      distanceKm: approxRoadDistance > 0.5 ? approxRoadDistance : 1.0,
      routePolyline: {
        type: 'LineString',
        coordinates: [
          [originLng, originLat],
          [destLng, destLat],
        ],
      },
    };
  }
};