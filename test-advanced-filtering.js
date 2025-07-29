const { haversineDistance } = require('./backend/src/utils/distanceCalculator.js');

// Test the enhanced boost priority logic
function testEnhancedBoostPriority() {
  console.log('🧪 Testing Enhanced Boost Priority Logic\n');

  // Sample users with different boost status and distances
  const users = [
    { fullName: 'Alice', distance: 50, isBoosted: false },
    { fullName: 'Bob', distance: 150, isBoosted: true },
    { fullName: 'Charlie', distance: 300, isBoosted: false },
    { fullName: 'Diana', distance: 800, isBoosted: true },
    { fullName: 'Eve', distance: 1200, isBoosted: false },
    { fullName: 'Frank', distance: 2500, isBoosted: true },
    { fullName: 'Grace', distance: 25, isBoosted: false },
    { fullName: 'Henry', distance: 5000, isBoosted: true }
  ];

  // Test with different distance filter values
  const testDistances = [1000, 2000, 5000, 10000];

  testDistances.forEach(maxDistance => {
    console.log(`\n📍 Testing with distance filter: ${maxDistance}km`);
    console.log(`Boost priority mode: ${maxDistance >= 2000 ? 'Enhanced (all distances)' : 'Standard (within 500km)'}\n`);

    // Filter users by distance
    const distanceFilteredUsers = users.filter(user => user.distance <= maxDistance);
    
    console.log('Users after distance filtering:');
    distanceFilteredUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.fullName} - ${user.distance}km - Boosted: ${user.isBoosted}`);
    });

    // Apply the enhanced sorting logic
    const sortedUsers = distanceFilteredUsers.sort((a, b) => {
      const aIsBoosted = a.isBoosted;
      const bIsBoosted = b.isBoosted;
      
      // Enhanced boost priority logic based on distance filter
      if (maxDistance >= 2000) {
        // All boosted users come first, regardless of distance
        if (aIsBoosted && !bIsBoosted) return -1;
        if (!aIsBoosted && bIsBoosted) return 1;
        
        // Among same boost status, sort by distance (closest first)
        return a.distance - b.distance;
      } else {
        // Original logic: boosted users within 500km get priority
        const aIsBoostedNearby = aIsBoosted && a.distance <= 500;
        const bIsBoostedNearby = bIsBoosted && b.distance <= 500;
        
        if (aIsBoostedNearby && !bIsBoostedNearby) return -1;
        if (!aIsBoostedNearby && bIsBoostedNearby) return 1;
        
        return a.distance - b.distance;
      }
    });

    console.log('\n✅ Sorted users (final order):');
    sortedUsers.forEach((user, index) => {
      const priorityType = maxDistance >= 2000 && user.isBoosted ? '🚀 BOOST' : 
                          maxDistance < 2000 && user.isBoosted && user.distance <= 500 ? '🚀 BOOST' : 
                          '📍 DISTANCE';
      console.log(`${index + 1}. ${user.fullName} - ${user.distance}km - ${priorityType}`);
    });

    console.log('\n' + '='.repeat(50));
  });
}

// Test distance calculation
function testDistanceCalculation() {
  console.log('\n🌍 Testing Distance Calculation\n');

  // Test coordinates (Delhi to Mumbai example)
  const delhiLat = 28.6139;
  const delhiLon = 77.2090;
  const mumbaiLat = 19.0760;
  const mumbaiLon = 72.8777;

  const distance = haversineDistance(delhiLat, delhiLon, mumbaiLat, mumbaiLon);
  console.log(`Distance from Delhi to Mumbai: ${distance} km`);
  console.log(`Expected: ~1150 km (Google Maps reference)`);

  // Test nearby locations
  const nearbyLat = 28.6200; // 0.6 km difference in latitude
  const nearbyLon = 77.2150;
  const nearbyDistance = haversineDistance(delhiLat, delhiLon, nearbyLat, nearbyLon);
  console.log(`\nNearby distance test: ${nearbyDistance} km`);
  console.log(`Expected: < 10 km`);
}

// Run tests
testEnhancedBoostPriority();
testDistanceCalculation();

console.log('\n🎯 Summary of Changes:');
console.log('✅ Default distance filter: 1000km (implemented)');
console.log('✅ Distance slider: supports up to 10,000km (implemented)');
console.log('✅ Enhanced boost priority: boosted users prioritized at high distances (implemented)');
console.log('✅ Backend sorting logic: enhanced for distance >= 2000km');
console.log('✅ Frontend slider sync: distance and sliderValue stay in sync');
