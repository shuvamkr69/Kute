import { Router } from "express";
import UserRouter from "./user.routes.js";
import UserLikedRouter from "./liked.route.js";
import ChatRouter from "./chat.route.js";
import NotificationRouter from "./notification.route.js";
import filterRouter from "./filter.route.js";
import getPremiumPlans from "./premiumPlans.route.js";
import AiChatbotRouter from "./AiChatbot.route.js";
import NeverHaveIEverRouter from "./NeverHaveIEver/neverHaveIEver.routes.js";
import WYRRouter from "./WouldYouRather/WouldYouRather.route.js";
import PaymentRouter from "./payment.routes.js";
import COSRouter from "./ChamberOfSecrets/ChamberOfSecrets.route.js";
import TDRouter from "./TruthOrDare/TD.route.js";

const router = Router()

router.use(UserRouter)
router.use(UserLikedRouter)
router.use(ChatRouter)
router.use(NotificationRouter)
router.use(filterRouter)
router.use(getPremiumPlans)
router.use(AiChatbotRouter)
router.use(NeverHaveIEverRouter)
router.use(WYRRouter)
router.use(PaymentRouter)
router.use(COSRouter);
router.use(TDRouter);

//Game screen routes

export default router