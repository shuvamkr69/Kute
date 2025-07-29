# Distance-Based Profile Sorting Implementation

## Overview
The HomeScreen now shows profiles sorted by distance in ascending order, with boosted profiles getting priority within 500km.

## How it Works

### Backend Implementation (`backend/src/controllers/user.controller.js`)

1. **Distance Calculation**: Uses Haversine formula to calculate distance between users based on their location coordinates
2. **Sorting Logic**:
   - **Priority 1**: Boosted users within 500km (closest boosted user first)
   - **Priority 2**: All other users sorted by distance in ascending order (1km, 1.6km, 2km, etc.)
   - **Priority 3**: Users without location data appear at the end

### Sorting Examples

#### Without Boost:
```
1. Alice - 1.2 km away
2. Bob - 1.6 km away  
3. Charlie - 2.3 km away
4. Diana - 5.1 km away
```

#### With Boost (Charlie is boosted):
```
1. Charlie - 2.3 km away 🚀 (boosted, within 500km)
2. Alice - 1.2 km away
3. Bob - 1.6 km away
4. Diana - 5.1 km away
```

### Frontend Implementation (`src/screens/HomeScreen.tsx`)

1. **Receives sorted profiles** from backend API
2. **Enhanced distance display**:
   - Shows meters for distances < 1km: "500m away"
   - Shows kilometers with 1 decimal: "1.6 km away"
3. **Visual indicators** for boosted profiles

## Key Features

### ✅ Distance-Based Sorting
- Closest users appear first (ascending order)
- Distance calculated using Haversine formula
- Accounts for Earth's curvature for accurate results

### ✅ Boost Priority
- Boosted users within 500km appear first
- Then sorted by distance among themselves
- Regular users follow in distance order

### ✅ Enhanced UX
- Better distance formatting (meters/kilometers)
- Visual boost indicators
- Debug logging for verification

### ✅ Error Handling
- Graceful handling of users without location data
- Validation of location coordinates
- Fallback for invalid location data

## Technical Details

### Location Storage
- Stored as array: `[latitude, longitude]`
- Example: `[40.7128, -74.0060]` (New York)

### Distance Calculation
```javascript
const distance = haversineDistance(
  currentUserLat, currentUserLng,
  otherUserLat, otherUserLng
);
```

### API Response
```json
{
  "_id": "user123",
  "name": "Alice",
  "distance": 1.25,
  "isBoosted": true,
  ...
}
```

## Testing

Run the test script to verify sorting logic:
```bash
cd backend
node ../test-distance-sorting.js
```

## Configuration

### Boost Distance Threshold
- Currently set to 500km
- Can be modified in `homescreenProfiles` function
- Line: `a.distance <= 500`

### Distance Precision
- Rounded to 2 decimal places
- Can be adjusted in distance calculation

## Future Enhancements

1. **Dynamic radius filters** - Allow users to set distance preferences
2. **Location-based filters** - Filter by city, state, or country
3. **Smart location updates** - Background location updates
4. **Distance caching** - Cache calculated distances for performance

## Files Modified

### Backend
- `backend/src/controllers/user.controller.js` - Main sorting logic
- `backend/src/utils/distanceCalculator.js` - Distance calculation utility

### Frontend  
- `src/screens/HomeScreen.tsx` - Profile display and distance formatting

### Testing
- `test-distance-sorting.js` - Verification script
