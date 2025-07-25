import sendPushNotification from "../utils/notifications.js";

/**
 * Test endpoint to verify notifications are working
 * Add this to your routes for testing
 */
export const testNotification = async (req, res) => {
  try {
    const { pushToken, type = "test" } = req.body;

    if (!pushToken) {
      return res.status(400).json({ error: "Push token is required" });
    }

    console.log("🧪 Testing notification sending...");
    console.log("📱 Push token:", pushToken ? `${pushToken.substring(0, 20)}...` : "MISSING");

    let title, body, data;

    if (type === "match") {
      title = "🎉 Test Match!";
      body = "This is a test match notification from backend";
      data = {
        type: "match",
        matchedUserId: "test123",
        matchedUserName: "Test User",
        matchedUserImage: "https://via.placeholder.com/150"
      };
    } else {
      title = "🧪 Test Notification";
      body = "This is a test notification from backend";
      data = {
        type: "test",
        timestamp: new Date().toISOString()
      };
    }

    const result = await sendPushNotification(pushToken, title, body, data);

    if (result) {
      console.log("✅ Test notification sent successfully");
      res.status(200).json({
        success: true,
        message: "Test notification sent",
        result
      });
    } else {
      console.log("❌ Failed to send test notification");
      res.status(500).json({
        success: false,
        message: "Failed to send test notification"
      });
    }

  } catch (error) {
    console.error("❌ Error in test notification:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * Test endpoint to verify push token storage
 */
export const verifyPushToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { User } = await import("../models/user.model.js");
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("🔍 Verifying push token for user:", user.fullName);
    console.log("📱 Stored push token:", user.pushToken ? `${user.pushToken.substring(0, 20)}...` : "NONE");

    res.status(200).json({
      userId: user._id,
      fullName: user.fullName,
      hasPushToken: !!user.pushToken,
      pushTokenPreview: user.pushToken ? `${user.pushToken.substring(0, 20)}...` : null
    });

  } catch (error) {
    console.error("❌ Error verifying push token:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/*
To use these test endpoints, add them to your routes:

// Add to your user.route.js or create a test.route.js
import { testNotification, verifyPushToken } from "../controllers/testNotification.controller.js";

router.post("/test-notification", verifyJWT, testNotification);
router.get("/verify-push-token", verifyJWT, verifyPushToken);

Then you can test with:

POST /api/v1/users/test-notification
{
  "pushToken": "your_expo_push_token_here",
  "type": "match"  // or "test"
}

GET /api/v1/users/verify-push-token
*/
