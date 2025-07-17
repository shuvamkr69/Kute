// utils/socket.js
import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { Score } from "../models/TruthOrDare/truthDare.model.js";

let io = null;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Update for production
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔵 New client connected:", socket.id);

    // Chat System
    socket.on("joinConversation", (convId) => {
      socket.join(convId);
      console.log(`📢 User joined conversation: ${convId}`);
    });

    socket.on("sendMessage", (message) => {
      if (!message.convId) return console.error("❌ No conversation ID.");
      io.to(message.convId).emit("newMessage", message);
    });

    socket.on("typing", ({ convId, senderId }) => {
      socket.to(convId).emit("typing", { senderId });
    });

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

        // Also update Conversation's lastMessage.isRead if the last message is from the other user
        const conversation = await (await import("../models/conversation.model.js")).Conversation.findById(conversationId);
        if (conversation && conversation.lastMessage && conversation.lastMessage.senderId.toString() !== receiverId.toString()) {
          conversation.lastMessage.isRead = true;
          await conversation.save();
        }

        io.to(conversationId).emit("messageRead", {
          conversationId,
          seenBy: receiverId,
        });
      } catch (error) {
        console.error("❌ Failed to update message read status:", error);
      }
    });

    // 🎯 Truth or Dare Game System

    // Join match room
    socket.on("join_match", ({ matchId, userId }) => {
      socket.join(matchId);
      console.log(`🎮 ${userId} joined match room ${matchId}`);
    });

    // Send truth question
    socket.on("send_truth_question", ({ matchId, question, fromUserId }) => {
      socket.to(matchId).emit("receive_truth_question", { question, fromUserId });
    });

    // Submit truth answer
    socket.on("submit_truth_answer", ({ matchId, answer, fromUserId }) => {
      socket.to(matchId).emit("receive_truth_answer", { answer, fromUserId });
    });

    // Rate answer (+10 or -10)
    socket.on("rate_answer", async ({ targetUserId, isThumbsUp }) => {
      const delta = isThumbsUp ? 10 : -10;

      try {
        await Score.findOneAndUpdate(
          { userId: targetUserId },
          { $inc: { rating: delta } },
          { upsert: true, new: true }
        );

        // Optionally emit the new rating
        socket.to(targetUserId).emit("rating_updated", { ratingChange: delta });

        console.log(`📈 Rating ${isThumbsUp ? "increased" : "decreased"} by ${Math.abs(delta)} for user ${targetUserId}`);
      } catch (err) {
        console.error("❌ Failed to update rating:", err.message);
      }
    });


    // Add inside io.on("connection", (socket) => { ... });

socket.on("call-user", ({ convId, offer, from }) => {
  socket.to(convId).emit("call-made", { offer, from });
});

socket.on("answer-call", ({ convId, answer, from }) => {
  socket.to(convId).emit("answer-made", { answer, from });
});

socket.on("ice-candidate", ({ convId, candidate, from }) => {
  socket.to(convId).emit("ice-candidate", { candidate, from });
});



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
