/**
 * Location validation and utility functions
 */

/**
 * Validates if coordinates are valid latitude/longitude values
 * @param {number} lat - Latitude value
 * @param {number} lng - Longitude value
 * @returns {boolean} - True if valid coordinates
 */
export const isValidCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
};

/**
 * Validates if location array has valid coordinates
 * @param {Array} location - Location array [lat, lng]
 * @returns {boolean} - True if valid location array
 */
export const isValidLocationArray = (location) => {
  return (
    Array.isArray(location) &&
    location.length === 2 &&
    isValidCoordinates(location[0], location[1])
  );
};

/**
 * Parses location string to coordinates array
 * @param {string} locationString - Location string "lat,lng"
 * @returns {Array|null} - [lat, lng] or null if invalid
 */
export const parseLocationString = (locationString) => {
  try {
    if (typeof locationString === 'string') {
      const coords = locationString.split(',').map(coord => parseFloat(coord.trim()));
      if (coords.length === 2 && isValidCoordinates(coords[0], coords[1])) {
        return coords;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Formats distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} - Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined) {
    return 'Distance unknown';
  }
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} km away`;
  } else {
    return `${Math.round(distance)} km away`;
  }
};

/**
 * Gets approximate address from coordinates (for display purposes)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @returns {string} - Approximate location string
 */
export const getApproximateLocation = (lat, lng) => {
  // This is a simple approximation - in a real app you'd use reverse geocoding
  const latStr = lat.toFixed(2);
  const lngStr = lng.toFixed(2);
  return `Near ${latStr}, ${lngStr}`;
};

/**
 * Calculates zoom level based on distance for map display
 * @param {number} distance - Distance in kilometers
 * @returns {object} - Map region delta values
 */
export const getMapDeltaFromDistance = (distance) => {
  if (distance < 5) {
    return { latitudeDelta: 0.01, longitudeDelta: 0.01 };
  } else if (distance < 20) {
    return { latitudeDelta: 0.05, longitudeDelta: 0.05 };
  } else if (distance < 100) {
    return { latitudeDelta: 0.2, longitudeDelta: 0.2 };
  } else {
    return { latitudeDelta: 1, longitudeDelta: 1 };
  }
};
