import express from "express";
import { giveTDFeedback, applyLeavePenalty, giveAutoFeedback } from "../../controllers/TruthOrDare/TD.controller.js";

const TDRouter = express.Router();

// Join waiting list (for initial REST join, if needed)
TDRouter.post("/td/feedback", giveTDFeedback);
TDRouter.post("/td/leave-penalty", applyLeavePenalty);
TDRouter.post("/td/auto-feedback", giveAutoFeedback);

export default TDRouter; 