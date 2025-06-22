import express from "express";
import {
  createGame,
  pollGameState,
  submitPrompt,
  submitAnswer,
  submitFeedback,
  joinQueue
} from "../../controllers/WouldYouRather/WouldYouRather.controller.js";

const WYRRouter = express.Router();

// Routes
WYRRouter.post("/wyr/create", createGame);
WYRRouter.post("/wyr/join-queue", joinQueue);
WYRRouter.get("/wyr/poll/:gameId", pollGameState);
WYRRouter.post("/wyr/submit-prompt/:gameId", submitPrompt);
WYRRouter.post("/wyr/submit-answer/:gameId", submitAnswer);
WYRRouter.post("/wyr/submit-feedback/:gameId", submitFeedback);

export default WYRRouter;
