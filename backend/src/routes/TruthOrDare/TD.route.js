import express from 'express';
import { getRoomStatus, joinWaitingList, makeChoice, nextRound, submitTruthAnswer, submitTruthQuestion } from '../../controllers/TruthOrDare/TD.controller.js';


const TDRouter = express.Router();

TDRouter.post('/td/join', joinWaitingList);
TDRouter.post('/td/choose', makeChoice);
TDRouter.post('/td/question', submitTruthQuestion);
TDRouter.post('/td/answer', submitTruthAnswer);
TDRouter.post('/td/next', nextRound);
TDRouter.get('/td/status', getRoomStatus);


export default TDRouter;
