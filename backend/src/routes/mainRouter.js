import { Router } from "express";
import UserRouter from "./user.routes.js";
import UserLikedRouter from "./liked.route.js";
import ChatRouter from "./chat.route.js";
import NotificationRouter from "./notification.route.js";
import filterRouter from "./filter.route.js";
import getPremiumPlans from "./premiumPlans.route.js";
import AiChatbotRouter from "./AiChatbot.route.js";
import TDrouter from "./TruthOrDare/truthDare.routes.js";
import NeverHaveIEverRouter from "./NeverHaveIEver/neverHaveIEver.routes.js";
import WYRRouter from "./WouldYouRather/WouldYouRather.route.js";

const router = Router()

router.use(UserRouter)
router.use(UserLikedRouter)
router.use(ChatRouter)
router.use(NotificationRouter)
router.use(filterRouter)
router.use(getPremiumPlans)
router.use(AiChatbotRouter)
router.use(TDrouter)
router.use(NeverHaveIEverRouter)
router.use(WYRRouter)


export default router