import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getNotifications } from "../controllers/notification.controller.js";
import { sendNotification } from "../controllers/notification.controller.js";

const NotificationRouter = Router();

NotificationRouter.get(`/notifications/:userId`,
    verifyJWT,
    getNotifications
); // Get user's notifications

NotificationRouter.post(`/notifications/:userId`,
    verifyJWT,
    sendNotification
); // Send a notification

export default NotificationRouter;