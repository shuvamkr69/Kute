import express from "express";
import { joinTDWaitingList } from "../../controllers/TruthOrDare/TD.controller.js";

const TDRouter = express.Router();

// Join waiting list (for initial REST join, if needed)
TDRouter.post("/td/join", joinTDWaitingList);

export default TDRouter; 