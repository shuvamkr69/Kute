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

    console.log("🎉 MATCH DETECTED! Sending notifications...");
    console.log("👤 User 1:", user.fullName, "Push Token:", user.pushToken ? "✅" : "❌");
    console.log("👤 User 2:", matchedUser.fullName, "Push Token:", matchedUser.pushToken ? "✅" : "❌");

    // Send push notifications
    if (matchedUser.pushToken) {
      console.log("🔥 About to send notification to matched user...");
      try {
        const result1 = await sendPushNotification(
          matchedUser.pushToken, // 🟢 user who matched back
          "🎉 It's a Match!",
          `You matched with ${user.fullName}`,
          {
            type: "match",
            matchedUserId: userId,
            matchedUserName: user.fullName,
            matchedUserImage: user.avatar1
          }
        );
        console.log("📤 Notification sent to matched user, result:", result1);
      } catch (error) {
        console.error("❌ Error sending notification to matched user:", error);
      }
    } else {
      console.log("❌ No push token for matched user");
    }

    if (user.pushToken) {
      console.log("🔥 About to send notification to current user...");
      try {
        const result2 = await sendPushNotification(
          user.pushToken, // 🟢 current user
          "🎉 It's a Match!",
          `You matched with ${matchedUser.fullName}`,
          {
            type: "match",
            matchedUserId: likedUserId,
            matchedUserName: matchedUser.fullName,
            matchedUserImage: matchedUser.avatar1
          }
        );
        console.log("📤 Notification sent to current user, result:", result2);
      } catch (error) {
        console.error("❌ Error sending notification to current user:", error);
      }
    } else {
      console.log("❌ No push token for current user");
    }

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
    // console.log("Formatted Users:", formattedUsers);

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

  // ✅ Fetch current user to access superLike count
  const currentUser = await User.findById(userId);
  if (!currentUser) throw new ApiError(404, "User not found");

  if (currentUser.superLike <= 0) {
    throw new ApiError(403, "No Super Likes remaining");
  }

  const existingLike = await Like.findOne({ userId, likedUserId });
  if (existingLike) throw new ApiError(400, "You have already liked this user");

  // ✅ Check if the liked user already liked or superliked this user
  const likedBack = await Like.findOne({
    userId: likedUserId,
    likedUserId: userId,
    $or: [{ superLiked: true }, {}], // match even normal likes
  });

  // ✅ Decrease superLike count and save
  currentUser.superLike -= 1;
  await currentUser.save();

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

    const matchedUser = await User.findById(likedUserId);

    console.log("🎉 SUPER LIKE MATCH DETECTED! Sending notifications...");
    console.log("👤 User 1:", currentUser.fullName, "Push Token:", currentUser.pushToken ? "✅" : "❌");
    console.log("👤 User 2:", matchedUser.fullName, "Push Token:", matchedUser.pushToken ? "✅" : "❌");

    if (matchedUser.pushToken) {
      console.log("🔥 About to send super like notification to matched user...");
      try {
        const result1 = await sendPushNotification(
          matchedUser.pushToken,
          "🎉 It's a Match!",
          `You matched with ${currentUser.fullName}!`,
          {
            type: "match",
            matchedUserId: userId,
            matchedUserName: currentUser.fullName,
            matchedUserImage: currentUser.avatar1
          }
        );
        console.log("📤 Super Like notification sent to matched user, result:", result1);
      } catch (error) {
        console.error("❌ Error sending super like notification to matched user:", error);
      }
    } else {
      console.log("❌ No push token for matched user (super like)");
    }

    if (currentUser.pushToken) {
      console.log("🔥 About to send super like notification to current user...");
      try {
        const result2 = await sendPushNotification(
          currentUser.pushToken,
          "🎉 It's a Match!",
          `You matched with ${matchedUser.fullName}!`,
          {
            type: "match",
            matchedUserId: likedUserId,
            matchedUserName: matchedUser.fullName,
            matchedUserImage: matchedUser.avatar1
          }
        );
        console.log("📤 Super Like notification sent to current user, result:", result2);
      } catch (error) {
        console.error("❌ Error sending super like notification to current user:", error);
      }
    } else {
      console.log("❌ No push token for current user (super like)");
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          matched: true,
          user: {
            image: currentUser.avatar1,
            fullName: currentUser.fullName,
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
