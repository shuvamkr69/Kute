import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import getPremiumPlans from "../controllers/premiumPlans.controller.js";


const PremiumPlanRouter = Router();

PremiumPlanRouter.get('/premiumPlans',
    verifyJWT,
    getPremiumPlans
); // Get user's notifications



export default PremiumPlanRouter;