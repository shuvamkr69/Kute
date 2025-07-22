import express from "express";
import { joinTDWaitingList, giveTDFeedback } from "../../controllers/TruthOrDare/TD.controller.js";

const TDRouter = express.Router();

// Join waiting list (for initial REST join, if needed)
TDRouter.post("/td/join", joinTDWaitingList);
TDRouter.post("/td/feedback", giveTDFeedback);

export default TDRouter; 