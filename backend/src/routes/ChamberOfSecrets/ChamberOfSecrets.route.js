import express from 'express';
import { getMessages, addMessage, getUserRandomName } from '../../controllers/ChamberOfSecrets/ChamberOfSecrets.controller.js';

const COSRouter = express.Router();

COSRouter.get('/chamber-of-secrets/messages', getMessages);
COSRouter.post('/chamber-of-secrets/messages', addMessage);
COSRouter.get('/chamber-of-secrets/user/:userId/name', getUserRandomName);

export default COSRouter; 