import axios from "axios";
import 'dotenv/config';
import fetch from "node-fetch";

export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) {
    console.log("❌ No push token provided");
    return;
  }

  const isMatchNotification = data.type === "match";
  const isMessageNotification = data.type === "message";
  const isLikeNotification = data.type === "like_received";
  const isSuperLikeNotification = data.type === "super_like_received";
  
  const message = {
    to: expoPushToken,
    sound: "default",
    title: title,
    body: body,
    data: { 
      ...data, 
      timestamp: new Date().toISOString(),
      type: data.type || "general" // Add notification type
    },
    priority: "high", // Ensures notification is delivered immediately
    channelId: isMatchNotification 
      ? "match" 
      : isMessageNotification 
        ? "message" 
        : (isLikeNotification || isSuperLikeNotification) 
          ? "likes" 
          : "default",
    android: {
      sound: "default",
      vibrationPattern: isMatchNotification 
        ? [0, 500, 300, 500, 300, 700] 
        : isMessageNotification 
          ? [0, 250, 250, 250]
          : isSuperLikeNotification
            ? [0, 300, 150, 300, 150, 500, 300]
            : isLikeNotification
              ? [0, 200, 100, 200]
              : [0, 250, 250, 250],
      priority: "max",
      sticky: false,
      channelId: isMatchNotification 
        ? "match" 
        : isMessageNotification 
          ? "message" 
          : (isLikeNotification || isSuperLikeNotification) 
            ? "likes" 
            : "default",
    },
    ios: {
      sound: "default",
      _displayInForeground: true, // Force display in foreground for iOS
      badge: 1, // Add badge for iOS
    },
  };

  try {
    // Add debugging logs
    console.log("🚀 Sending push notification...");
    console.log("📱 Push Token:", expoPushToken ? `${expoPushToken.substring(0, 20)}...` : "MISSING");
    console.log("📬 Title:", title);
    console.log("📝 Body:", body);
    console.log("🎯 Type:", data.type || "general");
    console.log("📡 Channel:", isMatchNotification ? "match" : isMessageNotification ? "message" : "default");
    
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Push notification sent successfully:", result);
    } else {
      console.error("❌ Error sending push notification:", result);
      console.error("❌ Response status:", response.status);
    }
    
    return result;
  } catch (error) {
    console.error("❌ Failed to send push notification:", error);
    console.error("❌ Error details:", error.message);
    throw error;
  }
};

export default sendPushNotification;
