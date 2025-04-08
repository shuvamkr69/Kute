import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { sendTDPrompt, receiveTDPrompt } from "../controllers/tdPromptController.js";

const TDPromptRouter = Router();

// Send a truth or dare prompt
TDPromptRouter.post(`/send`, verifyJWT, sendTDPrompt);

// Receive a truth or dare prompt
TDPromptRouter.get(`/receive/:gameId`, verifyJWT, receiveTDPrompt);

export default TDPromptRouter;
