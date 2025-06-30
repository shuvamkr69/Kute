import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { startChat, getUserChats, sendMessage, getMessages, deleteMessagesForUser, deleteMessagesForMe, deleteMessagesForEveryone } from "../controllers/chat.controller.js";

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


ChatRouter.delete(
  "/messages/:conversationId",
  verifyJWT,
  deleteMessagesForUser
);

ChatRouter.post(
  "/messages/delete-for-me",
  verifyJWT,
  deleteMessagesForMe
);

ChatRouter.post(
  "/messages/delete-for-everyone",
  verifyJWT,
  deleteMessagesForEveryone
);


  


export default ChatRouter;
