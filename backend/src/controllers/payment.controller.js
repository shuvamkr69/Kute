import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { google } from 'googleapis';
import { GOOGLE_PLAY_CONFIG } from "../config/googlePlay.js";

// Google Play Billing API setup
const auth = new google.auth.GoogleAuth({
  keyFile: GOOGLE_PLAY_CONFIG.keyFile,
  scopes: GOOGLE_PLAY_CONFIG.scopes,
});

const androidpublisher = google.androidpublisher({
  version: 'v3',
  auth,
});

// Verify Google Play purchase
const verifyPurchase = async (packageName, productId, purchaseToken) => {
  try {
    const response = await androidpublisher.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });

    const purchase = response.data;
    
    // Check if purchase is valid
    if (purchase.purchaseState === 0 && purchase.acknowledgementState === 1) {
      return { valid: true, purchase };
    }
    
    return { valid: false, purchase };
  } catch (error) {
    console.error('Error verifying purchase:', error);
    return { valid: false, error: error.message };
  }
};

// Process boost purchase
const processBoostPurchase = asyncHandler(async (req, res) => {
  const { purchaseToken, productId } = req.body;
  const userId = req.user._id;

  // Verify purchase with Google Play
  const verification = await verifyPurchase(
    GOOGLE_PLAY_CONFIG.packageName,
    productId,
    purchaseToken
  );

  if (!verification.valid) {
    throw new ApiError(400, "Invalid purchase");
  }

  // Update user's boost count
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Add boost based on product ID
  let boostAmount = 1; // Default
  if (productId.includes('boost_5')) boostAmount = 5;
  else if (productId.includes('boost_10')) boostAmount = 10;
  else if (productId.includes('boost_20')) boostAmount = 20;

  user.boost += boostAmount;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, { boost: user.boost }, "Boost purchased successfully")
  );
});

// Process super like purchase
const processSuperLikePurchase = asyncHandler(async (req, res) => {
  const { purchaseToken, productId } = req.body;
  const userId = req.user._id;

  // Verify purchase with Google Play
  const verification = await verifyPurchase(
    GOOGLE_PLAY_CONFIG.packageName,
    productId,
    purchaseToken
  );

  if (!verification.valid) {
    throw new ApiError(400, "Invalid purchase");
  }

  // Update user's super like count
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Add super likes based on product ID
  let superLikeAmount = 1; // Default
  if (productId.includes('superlike_5')) superLikeAmount = 5;
  else if (productId.includes('superlike_10')) superLikeAmount = 10;
  else if (productId.includes('superlike_20')) superLikeAmount = 20;

  user.superLike += superLikeAmount;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, { superLike: user.superLike }, "Super Like purchased successfully")
  );
});

// Process premium plan purchase
const processPremiumPurchase = asyncHandler(async (req, res) => {
  const { purchaseToken, productId } = req.body;
  const userId = req.user._id;

  // Verify purchase with Google Play
  const verification = await verifyPurchase(
    GOOGLE_PLAY_CONFIG.packageName,
    productId,
    purchaseToken
  );

  if (!verification.valid) {
    throw new ApiError(400, "Invalid purchase");
  }

  // Update user's premium plan
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Set premium plan based on product ID
  let premiumPlan = 'Basic';
  if (productId.includes('premium_standard')) premiumPlan = 'Standard';
  else if (productId.includes('premium_diamond')) premiumPlan = 'Diamond';

  user.ActivePremiumPlan = premiumPlan;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, { ActivePremiumPlan: user.ActivePremiumPlan }, "Premium plan activated successfully")
  );
});

// Get available products
const getAvailableProducts = asyncHandler(async (req, res) => {
  const products = {
    boosts: [
      { id: 'boost_1', name: '1 Boost', price: '$0.99' },
      { id: 'boost_5', name: '5 Boosts', price: '$3.99' },
      { id: 'boost_10', name: '10 Boosts', price: '$6.99' },
      { id: 'boost_20', name: '20 Boosts', price: '$11.99' },
    ],
    superLikes: [
      { id: 'superlike_1', name: '1 Super Like', price: '$0.99' },
      { id: 'superlike_5', name: '5 Super Likes', price: '$3.99' },
      { id: 'superlike_10', name: '10 Super Likes', price: '$6.99' },
      { id: 'superlike_20', name: '20 Super Likes', price: '$11.99' },
    ],
    premium: [
      { id: 'premium_basic', name: 'Basic Premium', price: '$9.99/month' },
      { id: 'premium_standard', name: 'Standard Premium', price: '$19.99/month' },
      { id: 'premium_diamond', name: 'Diamond Premium', price: '$29.99/month' },
    ],
  };

  return res.status(200).json(
    new ApiResponse(200, products, "Available products retrieved successfully")
  );
});

export {
  processBoostPurchase,
  processSuperLikePurchase,
  processPremiumPurchase,
  getAvailableProducts,
}; 