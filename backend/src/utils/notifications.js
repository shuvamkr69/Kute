import axios from "axios";
import 'dotenv/config';

const sendPushNotification = async (pushToken, title, message) => {
  if (!pushToken) {
    console.warn("Push token is missing, skipping notification.");
    return;
  }

  const notificationData = {
    to: pushToken,
    sound: "default",
    title,
    body: message,
  };

  try {
    const response = await axios.post("https://exp.host/--/api/v2/push/send", notificationData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
      },
    }
    );
    console.log("Notification sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending push notification:", error.response?.data || error.message);
  }
};

export default sendPushNotification;
