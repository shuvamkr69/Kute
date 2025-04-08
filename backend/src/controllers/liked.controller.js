import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/liked.model.js";
import sendPushNotification  from "../utils/notifications.js";
import { User } from "../models/user.model.js";

const UserLiked = asyncHandler(async (req, res) => {
  const { likedUserId } = req.body;
  const userId = req.user._id; // Assuming authentication middleware

  // Debug log to check the request body
  console.log("Request Body:", req.body);

  if (!likedUserId) {
    throw new ApiError(400, "Liked user ID is required");
  }

  // Check if the user has already liked this person
  const existingLike = await Like.findOne({ userId, likedUserId });
  if (existingLike) {
    throw new ApiError(400, "You have already liked this user");
  }

  // Check if the liked user has already liked back
  const likedBack = await Like.findOne({
    userId: likedUserId,
    likedUserId: userId,
  });

  // Create the like
  const newLike = await Like.create({
    userId,
    likedUserId,
    matched: likedBack ? true : false, // Match is formed if liked back
  });


  
  if (likedBack) {
    // Update the existing like to mark as a match
    await Like.updateOne(
      { userId: likedUserId, likedUserId: userId },
      { matched: true }
    );
  }

   const user = await User.findById(userId);
  const matchedUser = await User.findById(likedUserId);

  if (likedBack) {
    // Send push notifications for the match
    await sendPushNotification(
      matchedUser.pushToken,
      "🎉 It's a Match!",
      `You matched with ${user.fullName}!`
    );

    await sendPushNotification(
      user.pushToken,
      "🎉 It's a Match!",
      `You matched with ${matchedUser.fullName}!`
    );
  }

  const matches = await Like.find({ userId, likedUserId, matched: true }).populate(
    "likedUserId"
  );

  res.status(201).json(new ApiResponse(201, matches, "User liked successfully"));
});



export const getLikedUsers = async (req, res) => {
  try {
    const userId = req.user.id; // Extract logged-in user ID from auth middleware

    // Find all users who liked the logged-in user
    const likedUsers = await Like.find({ likedUserId: userId }).populate("userId", "fullName avatar1");

    if (!likedUsers.length) {
      return res.status(200).json([]);
    }

    // Format response
    const formattedUsers = likedUsers.map(({ userId }) => ({
      _id: userId._id,
      fullName: userId.fullName,
      profileImage: userId.avatar1 || "https://via.placeholder.com/150",
    }));
    console.log("Formatted Users:", formattedUsers);

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error fetching liked users:", error);
    res.status(500).json({ error: "Server error" });
  }
};


export const UserSuperLiked = asyncHandler(async (req, res) => {
  const { likedUserId } = req.body;
  const userId = req.user._id; // Assuming authentication middleware

  // Debug log to check the request body
  console.log("Request Body:", req.body);

  if (!likedUserId) {
    throw new ApiError(400, "Liked user ID is required");
  }

  // Check if the user has already super liked this person
  const existingLike = await Like.findOne({ userId, likedUserId });
  if (existingLike) {
    throw new ApiError(400, "You have already super liked this user");
  }

  // Create the super like
  const newSuperLike = await Like.create({
    userId,
    likedUserId,
    superLiked: true,
  });

  res.status(201).json(new ApiResponse(201, newSuperLike, "User super liked successfully"));
});

export { UserLiked };
