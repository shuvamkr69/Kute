import express from 'express';
import {
  getPrompt,
  submitResult,
  getLeaderboard,
  leaveQueue,
  joinQueue,
  sendTruthQuestion,
  submitTruthAnswer,
  rateTruthAnswer,
  submitFeedback,
  getMatchStatus,
} from '../../controllers/TruthOrDare/truthDare.controller.js';
import { matchPlayer } from '../../controllers/TruthOrDare/truthDare.controller.js';

const TDrouter = express.Router();

TDrouter.get('/prompt', getPrompt);
TDrouter.get('/leaderboard', getLeaderboard);
TDrouter.get("/status/:matchId", getMatchStatus);


TDrouter.post('/match', matchPlayer); // 👈 Register the match endpoint
TDrouter.post('/submit', submitResult);
TDrouter.post("/leave", leaveQueue); // ✅ Add this line
TDrouter.post('/join', joinQueue);
TDrouter.post("/sendQuestion", sendTruthQuestion);
TDrouter.post("/submitAnswer", submitTruthAnswer);
TDrouter.post("/rateAnswer", rateTruthAnswer);
TDrouter.post("/feedback", submitFeedback);


export default TDrouter;
