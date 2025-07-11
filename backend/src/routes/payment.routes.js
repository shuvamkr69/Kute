import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  processBoostPurchase,
  processSuperLikePurchase,
  processPremiumPurchase,
  getAvailableProducts,
} from "../controllers/payment.controller.js";

const PaymentRouter = Router();

// Get available products
PaymentRouter.get("/products", verifyJWT, getAvailableProducts);

// Process purchases
PaymentRouter.post("/purchase/boost", verifyJWT, processBoostPurchase);
PaymentRouter.post("/purchase/superlike", verifyJWT, processSuperLikePurchase);
PaymentRouter.post("/purchase/premium", verifyJWT, processPremiumPurchase);

export default PaymentRouter; 