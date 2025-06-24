import axios from "axios";
import 'dotenv/config';

import fetch from "node-fetch";

export const sendPushNotification = async (expoPushToken, title, body) => {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: "default",
    title: title,
    body: body,
    data: { withSome: "data" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
};


export default sendPushNotification;
