import express from 'express';
import { getLoveAdvice } from '../controllers/AiChatbot.controller.js';

const AiChatbotRouter = express.Router();

AiChatbotRouter.post('/aiChatbot/advice', getLoveAdvice);

export default AiChatbotRouter;
