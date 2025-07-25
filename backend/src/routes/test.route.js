import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import sendPushNotification from "../utils/notifications.js";
import { User } from "../models/user.model.js";

const TestRouter = Router();

// Test notification endpoint
TestRouter.post("/test-notification", verifyJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.pushToken) {
      return res.status(400).json({ error: "No push token found for user" });
    }

    console.log("🧪 TESTING NOTIFICATION MANUALLY...");
    console.log("📱 User:", user.fullName);
    console.log("🔑 Push Token:", user.pushToken ? `${user.pushToken.substring(0, 20)}...` : "NONE");

    const result = await sendPushNotification(
      user.pushToken,
      "🧪 Test Notification",
      "This is a manual test from backend",
      {
        type: "test",
        userId: userId,
        timestamp: new Date().toISOString()
      }
    );

    console.log("✅ Test notification result:", result);

    res.status(200).json({
      success: true,
      message: "Test notification sent",
      result: result
    });

  } catch (error) {
    console.error("❌ Test notification error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test match notification endpoint
TestRouter.post("/test-match-notification", verifyJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.pushToken) {
      return res.status(400).json({ error: "No push token found for user" });
    }

    console.log("🧪 TESTING MATCH NOTIFICATION MANUALLY...");
    console.log("📱 User:", user.fullName);
    console.log("🔑 Push Token:", user.pushToken ? `${user.pushToken.substring(0, 20)}...` : "NONE");

    const result = await sendPushNotification(
      user.pushToken,
      "🎉 Test Match!",
      "This is a test match notification from backend",
      {
        type: "match",
        matchedUserId: "test123",
        matchedUserName: "Test User",
        matchedUserImage: user.avatar1
      }
    );

    console.log("✅ Test match notification result:", result);

    res.status(200).json({
      success: true,
      message: "Test match notification sent",
      result: result
    });

  } catch (error) {
    console.error("❌ Test match notification error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default TestRouter;
