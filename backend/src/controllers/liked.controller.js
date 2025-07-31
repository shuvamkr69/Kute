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

  // If no match yet, send "like received" notification to the liked user
  const user = await User.findById(userId);
  const likedUser = await User.findById(likedUserId);

  if (likedUser && likedUser.pushToken) {
    console.log("💝 Sending 'like received' notification...");
    console.log("👤 Sender:", user.fullName, "Push Token:", user.pushToken ? "✅" : "❌");
    console.log("👤 Receiver:", likedUser.fullName, "Push Token:", likedUser.pushToken ? "✅" : "❌");

    try {
      const result = await sendPushNotification(
        likedUser.pushToken,
        "💝 Someone likes you!",
        `You have a new like! Check your matches to see who it is.`,
        {
          type: "like_received",
          fromUserId: userId,
          fromUserName: user.fullName,
          fromUserImage: user.avatar1
        }
      );
      console.log("📤 Like notification sent successfully, result:", result);
    } catch (error) {
      console.error("❌ Error sending like notification:", error);
    }
  } else {
    console.log("❌ No push token for liked user or user not found");
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

    // Find all users who liked the logged-in user AND where it's a mutual match (matched: true)
    const mutualMatches = await Like.find({ 
      likedUserId: userId,
      matched: true // Only show mutual matches
    }).populate(
      "userId",
      "fullName avatar1"
    );

    if (!mutualMatches.length) {
      return res.status(200).json([]);
    }

    // Format response
    const formattedUsers = mutualMatches.map(({ userId }) => ({
      _id: userId._id,
      fullName: userId.fullName,
      profileImage: userId.avatar1 || "https://via.placeholder.com/150",
    }));
    // console.log("Formatted Mutual Matches:", formattedUsers);

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error fetching mutual matches:", error);
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

  // If no match yet, send "super like received" notification to the liked user
  const superLikedUser = await User.findById(likedUserId);

  if (superLikedUser && superLikedUser.pushToken) {
    console.log("⭐ Sending 'super like received' notification...");
    console.log("👤 Sender:", currentUser.fullName, "Push Token:", currentUser.pushToken ? "✅" : "❌");
    console.log("👤 Receiver:", superLikedUser.fullName, "Push Token:", superLikedUser.pushToken ? "✅" : "❌");

    try {
      const result = await sendPushNotification(
        superLikedUser.pushToken,
        "⭐ You got a Super Like!",
        `${currentUser.fullName} super liked you! They're really interested in getting to know you.`,
        {
          type: "super_like_received",
          fromUserId: currentUser._id,
          fromUserName: currentUser.fullName,
          fromUserImage: currentUser.avatar1
        }
      );
      console.log("📤 Super Like notification sent successfully, result:", result);
    } catch (error) {
      console.error("❌ Error sending super like notification:", error);
    }
  } else {
    console.log("❌ No push token for super liked user or user not found");
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


// Get users who liked me but I haven't liked back yet
export const getUsersWhoLikedMe = async (req, res) => {
  try {
    const userId = req.user.id; // Extract logged-in user ID from auth middleware

    // Find all users who liked me but I haven't liked back yet
    const usersWhoLikedMe = await Like.find({ 
      likedUserId: userId,
      matched: false // Not matched yet means I haven't liked them back
    }).populate("userId", "fullName avatar1");

    if (!usersWhoLikedMe.length) {
      return res.status(200).json([]);
    }

    // Format response with complete user data
    const formattedUsers = usersWhoLikedMe.map(({ userId, superLiked, createdAt }) => ({
      _id: userId._id,
      fullName: userId.fullName,
      profileImage: userId.avatar1 || "https://via.placeholder.com/150",
      superLiked: superLiked,
      likedAt: createdAt
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users who liked me:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export { UserLiked };
