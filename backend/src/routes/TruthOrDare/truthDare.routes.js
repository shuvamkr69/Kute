import express from 'express';
import {
  getPrompt,
  submitResult,
  getLeaderboard,
  leaveQueue,
  joinQueue,
  sendTruthQuestion,
  submitTruthAnswer,

} from '../../controllers/TruthOrDare/truthDare.controller.js';

import { matchPlayer } from '../../controllers/TruthOrDare/truthDare.controller.js';





const TDrouter = express.Router();

TDrouter.get('/prompt', getPrompt);
TDrouter.get('/leaderboard', getLeaderboard);


TDrouter.post('/match', matchPlayer); // 👈 Register the match endpoint
TDrouter.post('/submit', submitResult);
TDrouter.post("/leave", leaveQueue); // ✅ Add this line
TDrouter.post('/join', joinQueue);
TDrouter.post("/sendQuestion", sendTruthQuestion);
TDrouter.post("/submitAnswer", submitTruthAnswer);




export default TDrouter;
