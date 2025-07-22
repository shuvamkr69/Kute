import express from "express";
import { giveTDFeedback } from "../../controllers/TruthOrDare/TD.controller.js";

const TDRouter = express.Router();

// Join waiting list (for initial REST join, if needed)
TDRouter.post("/td/feedback", giveTDFeedback);

export default TDRouter; 