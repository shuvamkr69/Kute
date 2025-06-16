import express from 'express';
import {
  joinWaitingRoom,
  getWaitingRoomStatus,
  getPromptStatus,
  submitPrompt,
  submitAnswer,
  getAnswers,
  nextTurn,
  getWaitingCounts,
  cleanupEmptyWaitingRooms,
  leaveWaitingRoom,
  getCurrentTurn
} from '../../controllers/NeverHaveIEver/neverHaveIEver.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js';

const NeverHaveIEverRouter = express.Router();
NeverHaveIEverRouter.use(verifyJWT);

// ⛔ Make sure to apply your authentication middleware here
// Example: router.use(authMiddleware);

// /api/v1/neverhaveiever/
NeverHaveIEverRouter.post('/neverhaveiever/join', joinWaitingRoom);
NeverHaveIEverRouter.get('/neverhaveiever/waiting-room-status', getWaitingRoomStatus);
NeverHaveIEverRouter.get('/neverhaveiever/prompt-status', getPromptStatus);
NeverHaveIEverRouter.post('/neverhaveiever/submit-prompt', submitPrompt);
NeverHaveIEverRouter.post('/neverhaveiever/submit-answer', submitAnswer);
NeverHaveIEverRouter.get('/neverhaveiever/answers', getAnswers);
NeverHaveIEverRouter.post('/neverhaveiever/next-turn', nextTurn);
NeverHaveIEverRouter.get('/neverhaveiever/waiting-counts', getWaitingCounts);
NeverHaveIEverRouter.post('/neverhaveiever/leave', leaveWaitingRoom);
NeverHaveIEverRouter.get('/neverhaveiever/current-turn', getCurrentTurn);



setInterval(cleanupEmptyWaitingRooms, 60 * 1000); 


export default NeverHaveIEverRouter;
