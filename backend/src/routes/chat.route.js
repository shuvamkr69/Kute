import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { startChat, getUserChats, sendMessage, getMessages, deleteAllMessage } from "../controllers/chat.controller.js";

const ChatRouter = Router();

ChatRouter.post(`/chats`,
     verifyJWT,
      startChat
    );  // Start a conversation


ChatRouter.get(`/chats/:userId`,
    verifyJWT,
    getUserChats
    );  // Get user's chat list


ChatRouter.post(`/messages`,
    verifyJWT,
    sendMessage
);       // Send a message


ChatRouter.get(`/messages/:conversationId`,
    verifyJWT,
    getMessages
); // Get chat messages


// DELETE /api/v1/users/messages/:conversationId
ChatRouter.delete('/deleteAllMessages/:conversationId', async (req, res) => {
    verifyJWT,
    deleteAllMessage
  });
  


export default ChatRouter;
