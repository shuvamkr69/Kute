import { Router } from "express";
import UserRouter from "./user.routes.js";
import UserLikedRouter from "./liked.route.js";
import ChatRouter from "./chat.route.js";
import NotificationRouter from "./notification.route.js";
import TDRouter from "./TruthOrDare/truthOrDare.routes.js";
import filterRouter from "./filter.route.js";
import getPremiumPlans from "../controllers/premiumPlans.controller.js";
import AiChatbotRouter from "./AiChatbot.route.js";

const router = Router()

router.use(UserRouter)
router.use(UserLikedRouter)
router.use(ChatRouter)
router.use(NotificationRouter)
router.use(TDRouter)
router.use(filterRouter)
router.use(getPremiumPlans)
router.use(AiChatbotRouter)


export default router