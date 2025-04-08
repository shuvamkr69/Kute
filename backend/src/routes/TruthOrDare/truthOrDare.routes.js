import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.middleware.js";
import { startTDGame, getTDGameState } from "../../controllers/TruthOrDare/truthOrDare.controller.js";

const TDRouter = Router();

// Start a Truth or Dare game
TDRouter.post(`/start`, verifyJWT, startTDGame);

// Get the current game state
TDRouter.get(`/state/:gameId`, verifyJWT, getTDGameState);

export default TDRouter;


