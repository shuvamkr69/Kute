# Google Play Store Integration Setup Guide

## Prerequisites
- Google Play Console account
- Your app published on Google Play Store
- Service account with API access

## Step 1: Google Play Console Setup

### 1.1 Create Service Account
1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to **Setup** → **API access**
3. Click **Create new service account**
4. Fill in the service account details
5. Download the JSON key file
6. Place it in the backend folder as `google-play-key.json`

### 1.2 Grant API Access
1. In Google Play Console, go to **Setup** → **API access**
2. Find your service account and click **Grant access**
3. Select these permissions:
   - View app information
   - View financial data
   - Manage orders and subscriptions

## Step 2: Create Products in Google Play Console

### 2.1 Boost Products
Create these products in Google Play Console:
- **Product ID**: `boost_1`
  - Type: In-app product
  - Price: $0.99
  - Title: "1 Boost"
  
- **Product ID**: `boost_5`
  - Type: In-app product
  - Price: $3.99
  - Title: "5 Boosts"
  
- **Product ID**: `boost_10`
  - Type: In-app product
  - Price: $6.99
  - Title: "10 Boosts"
  
- **Product ID**: `boost_20`
  - Type: In-app product
  - Price: $11.99
  - Title: "20 Boosts"

### 2.2 Super Like Products
Create these products:
- **Product ID**: `superlike_1`
  - Type: In-app product
  - Price: $0.99
  - Title: "1 Super Like"
  
- **Product ID**: `superlike_5`
  - Type: In-app product
  - Price: $3.99
  - Title: "5 Super Likes"
  
- **Product ID**: `superlike_10`
  - Type: In-app product
  - Price: $6.99
  - Title: "10 Super Likes"
  
- **Product ID**: `superlike_20`
  - Type: In-app product
  - Price: $11.99
  - Title: "20 Super Likes"

### 2.3 Premium Subscription Products
Create these subscription products:
- **Product ID**: `premium_basic`
  - Type: Subscription
  - Price: $9.99/month
  - Title: "Basic Premium"
  
- **Product ID**: `premium_standard`
  - Type: Subscription
  - Price: $19.99/month
  - Title: "Standard Premium"
  
- **Product ID**: `premium_diamond`
  - Type: Subscription
  - Price: $29.99/month
  - Title: "Diamond Premium"

## Step 3: Environment Configuration

Add these environment variables to your `.env` file:

```env
# Google Play Store Integration
GOOGLE_PLAY_KEY_FILE=./google-play-key.json
ANDROID_PACKAGE_NAME=com.dating.kute
```

## Step 4: Frontend Integration

### 4.1 Install React Native IAP
```bash
npm install react-native-iap
```

### 4.2 Update Buy Screens
The buy screens are already updated to work with the backend API. They currently use mock purchase tokens for testing.

### 4.3 Real Google Play Integration
To integrate with real Google Play Store, you'll need to:

1. Initialize the billing connection
2. Get available products
3. Make purchases
4. Verify purchases with the backend

Example implementation:
```javascript
import { initConnection, getProducts, requestPurchase } from 'react-native-iap';

// Initialize connection
await initConnection();

// Get products
const products = await getProducts({
  skus: ['boost_1', 'boost_5', 'boost_10', 'boost_20']
});

// Make purchase
const purchase = await requestPurchase({
  sku: 'boost_1'
});

// Send to backend for verification
await api.post('/purchase/boost', {
  purchaseToken: purchase.purchaseToken,
  productId: purchase.productId
});
```

## Step 5: Testing

### 5.1 Test Accounts
1. Add test accounts in Google Play Console
2. Use these accounts to test purchases
3. Test purchases won't charge real money

### 5.2 Backend Testing
Test the endpoints:
- `GET /products` - Get available products
- `POST /purchase/boost` - Purchase boosts
- `POST /purchase/superlike` - Purchase super likes
- `POST /purchase/premium` - Purchase premium

## Step 6: Production Deployment

### 6.1 Security
- Keep your service account key secure
- Never commit the key file to version control
- Use environment variables in production

### 6.2 Monitoring
- Monitor purchase verification logs
- Set up alerts for failed purchases
- Track revenue and user engagement

## Troubleshooting

### Common Issues
1. **Invalid purchase token**: Check if the service account has proper permissions
2. **Product not found**: Verify product IDs match between frontend and Google Play Console
3. **Authentication failed**: Ensure the service account key file is correct and accessible

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## Support
For issues with Google Play Console or billing API, refer to:
- [Google Play Billing API Documentation](https://developer.android.com/google/play/billing)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer) 