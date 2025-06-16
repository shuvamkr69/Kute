import express from 'express';
import {
  leaveQueue,
  joinQueue,
  sendTruthQuestion,
  submitTruthAnswer,
  rateTruthAnswer,
  getMatchStatus,
  choosePrompt,
  clearWaitingList,
} from '../../controllers/TruthOrDare/truthDare.controller.js';
import { matchPlayer } from '../../controllers/TruthOrDare/truthDare.controller.js';

const TDrouter = express.Router();



TDrouter.post("/join", joinQueue);           // Player joins matchmaking
TDrouter.post("/leave", leaveQueue);         // Player leaves matchmaking
TDrouter.post("/match", matchPlayer);        // Match players
TDrouter.get("/status/:matchId", getMatchStatus); // 🔁 Used for polling
TDrouter.post("/sendQuestion", sendTruthQuestion); // P2 sends truth question
TDrouter.post("/submitAnswer", submitTruthAnswer); // P1 submits answer
TDrouter.post("/rateAnswer", rateTruthAnswer);     // P2 rates answer
TDrouter.post("/choosePrompt", choosePrompt);


TDrouter.delete("/clear-waiting", clearWaitingList); // 🚨 DELETE route for admin use


export default TDrouter;
