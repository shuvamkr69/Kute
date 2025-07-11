// Google Play Store Configuration
// 
// To set up Google Play Store integration:
//
// 1. Go to Google Play Console: https://play.google.com/console
// 2. Navigate to Setup → API access
// 3. Create a new service account
// 4. Download the JSON key file
// 5. Place it in the backend folder as 'google-play-key.json'
// 6. Add these environment variables to your .env file:
//
// GOOGLE_PLAY_KEY_FILE=./google-play-key.json
// ANDROID_PACKAGE_NAME=com.dating.kute
//
// 7. In Google Play Console, add your products:
//    - Boost products: boost_1, boost_5, boost_10, boost_20
//    - Super Like products: superlike_1, superlike_5, superlike_10, superlike_20
//    - Premium products: premium_basic, premium_standard, premium_diamond

export const GOOGLE_PLAY_CONFIG = {
  keyFile: process.env.GOOGLE_PLAY_KEY_FILE || './google-play-key.json',
  packageName: process.env.ANDROID_PACKAGE_NAME || 'com.dating.kute',
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
};

export const PRODUCT_IDS = {
  boosts: ['boost_1', 'boost_5', 'boost_10', 'boost_20'],
  superLikes: ['superlike_1', 'superlike_5', 'superlike_10', 'superlike_20'],
  premium: ['premium_basic', 'premium_standard', 'premium_diamond'],
}; 