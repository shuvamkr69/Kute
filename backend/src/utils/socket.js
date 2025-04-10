import { Server } from "socket.io";
import { Message } from "../models/message.model.js";

let io = null;


export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Update with your frontend URL
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("🔵 New client connected:", socket.id);

    // ✅ Join conversation room
    socket.on("joinConversation", (convId) => {
      socket.join(convId);
      console.log(`📢 User joined conversation: ${convId}`);
    });

    // ✅ Listen for new messages and broadcast them
    socket.on("sendMessage", (message) => {
      console.log("📩 New message received:", message);

      if (!message.convId) {
        console.error("❌ Error: No conversation ID provided.");
        return;
      }

      // ✅ Emit the message to all users in the room
      io.to(message.convId).emit("newMessage", message);
    });
    // 🟡 Typing event
    socket.on("typing", ({ convId, senderId }) => {
      socket.to(convId).emit("typing", { senderId });
    });

    // ⚪ Stop typing event
    socket.on("stopTyping", ({ convId, senderId }) => {
      socket.to(convId).emit("stopTyping", { senderId });
    });
    socket.on("messageRead", async ({ conversationId, receiverId }) => {
      try {
        await Message.updateMany(
          {
            conversationId,
            senderId: { $ne: receiverId },
            isRead: false,
          },
          { isRead: true }
        );
    
        io.to(conversationId).emit("messageRead", {
          conversationId,
          seenBy: receiverId,
        });
      } catch (error) {
        console.error("Failed to update message read status:", error);
      }
    });
    

    // ✅ Handle disconnection
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("❌ Socket.io not initialized!");
  return io;
};
