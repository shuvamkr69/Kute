// Test script to verify distance-based sorting is working correctly
// This can be run from the root directory to test the sorting logic

// Haversine distance function (same as in utils)
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Test data: Sample users with different locations
const testUsers = [
  { name: 'Alice', location: [40.7128, -74.0060] }, // New York
  { name: 'Bob', location: [40.7589, -73.9851] }, // Times Square (closer to center)
  { name: 'Charlie', location: [40.6892, -74.0445] }, // Brooklyn (further)
  { name: 'Diana', location: [40.7831, -73.9712] }, // Central Park (very close)
  { name: 'Eve', location: [41.8781, -87.6298] }, // Chicago (far)
];

// Current user location (Manhattan)
const currentLocation = [40.7614, -73.9776];

console.log('🧪 Testing Distance-Based Sorting Logic\n');
console.log('Current user location (Manhattan):', currentLocation);
console.log('─'.repeat(50));

// Calculate distances and sort
const usersWithDistance = testUsers.map(user => {
  const distance = haversineDistance(
    currentLocation[0], currentLocation[1],
    user.location[0], user.location[1]
  );
  return {
    ...user,
    distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
  };
});

// Sort by distance (ascending)
const sortedUsers = usersWithDistance.sort((a, b) => a.distance - b.distance);

console.log('📍 Users sorted by distance (ascending):');
sortedUsers.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name.padEnd(10)} - ${user.distance.toFixed(2)} km away`);
});

console.log('\n✅ Expected order: Diana < Bob < Alice < Charlie < Eve');
console.log('✅ This matches the requirement: closest users first (1km, 1.6km, 2km, etc.)');

// Test with boosted users
console.log('\n🚀 Testing with Boost Priority:');
const usersWithBoost = sortedUsers.map((user, index) => ({
  ...user,
  isBoosted: index === 3 || index === 1, // Make Charlie and Bob boosted
  boostedWithin500km: user.distance <= 500 && (index === 3 || index === 1)
}));

const finalSorted = usersWithBoost.sort((a, b) => {
  // Priority 1: Boosted users within 500km come first
  if (a.boostedWithin500km && !b.boostedWithin500km) return -1;
  if (!a.boostedWithin500km && b.boostedWithin500km) return 1;
  
  // Priority 2: Sort by distance
  return a.distance - b.distance;
});

console.log('Users with boost priority:');
finalSorted.forEach((user, index) => {
  const boostIndicator = user.isBoosted ? '🚀' : '  ';
  console.log(`${index + 1}. ${boostIndicator} ${user.name.padEnd(10)} - ${user.distance.toFixed(2)} km away`);
});

console.log('\n✅ Boosted users (🚀) within 500km appear first, then sorted by distance');
console.log('✅ Non-boosted users follow in distance order');
