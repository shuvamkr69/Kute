import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/liked.model.js";
import sendPushNotification from "../utils/notifications.js";
import { User } from "../models/user.model.js";

const UserLiked = asyncHandler(async (req, res) => {
  const { likedUserId } = req.body;
  const userId = req.user._id;

  if (!likedUserId) throw new ApiError(400, "Liked user ID is required");

  const existingLike = await Like.findOne({ userId, likedUserId });
  if (existingLike) throw new ApiError(400, "You have already liked this user");

  // ✅ Check if the liked user has already liked OR superliked this user
  const likedBack = await Like.findOne({
    userId: likedUserId,
    likedUserId: userId,
    $or: [{ superLiked: true }, {}], // match if liked OR superliked
  });

  const newLike = await Like.create({
    userId,
    likedUserId,
    matched: !!likedBack,
  });

  if (likedBack) {
    // Update the reverse like to matched
    await Like.updateOne(
      { userId: likedUserId, likedUserId: userId },
      { matched: true }
    );

    const user = await User.findById(userId);
    const matchedUser = await User.findById(likedUserId);

    // Send push notifications
    await sendPushNotification(
      matchedUser.pushToken, // 🟢 user who matched back
      "🎉 It's a Match!",
      `You matched with ${user.fullName}`
    );

    await sendPushNotification(
      user.pushToken, // 🟢 current user
      "🎉 It's a Match!",
      `You matched with ${matchedUser.fullName}`
    );

    // ✅ Return match data directly for frontend MatchScreen
    return res.status(201).json(
      new ApiResponse(
        201,
        {
          matched: true,
          user: {
            image: user.avatar1,
            fullName: user.fullName,
          },
          matchedUser: {
            image: matchedUser.avatar1,
            fullName: matchedUser.fullName,
          },
        },
        "It's a Match!"
      )
    );
  }

  // 👇 fallback if no match
  res.status(201).json(
    new ApiResponse(
      201,
      {
        matched: false,
      },
      "User liked successfully"
    )
  );
});

export const getLikedUsers = async (req, res) => {
  try {
    const userId = req.user.id; // Extract logged-in user ID from auth middleware

    // Find all users who liked the logged-in user
    const likedUsers = await Like.find({ likedUserId: userId }).populate(
      "userId",
      "fullName avatar1"
    );

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
  const userId = req.user._id;

  if (!likedUserId) throw new ApiError(400, "Liked user ID is required");

  const existingLike = await Like.findOne({ userId, likedUserId });
  if (existingLike) throw new ApiError(400, "You have already liked this user");

  // ✅ Check if the liked user already liked OR superliked this user
  const likedBack = await Like.findOne({
    userId: likedUserId,
    likedUserId: userId,
    $or: [{ superLiked: true }, {}], // either like or superlike qualifies
  });

  const newSuperLike = await Like.create({
    userId,
    likedUserId,
    superLiked: true,
    matched: !!likedBack,
  });

  if (likedBack) {
    await Like.updateOne(
      { userId: likedUserId, likedUserId: userId },
      { matched: true }
    );

    const user = await User.findById(userId);
    const matchedUser = await User.findById(likedUserId);

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

    // ✅ RETURN match data properly
    return res.status(201).json(
      new ApiResponse(
        201,
        {
          matched: true,
          user: {
            image: user.avatar1,
            fullName: user.fullName,
          },
          matchedUser: {
            image: matchedUser.avatar1,
            fullName: matchedUser.fullName,
          },
        },
        "It's a Match!"
      )
    );
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        matched: false,
      },
      "User super liked successfully"
    )
  );
});

export { UserLiked };
