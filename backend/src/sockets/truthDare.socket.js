// /sockets/truthDare.socket.js
import { Server } from "socket.io";
import { Score } from "../models/TruthOrDare/truthDare.model.js";

export const registerTruthDareHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ New client connected: ", socket.id);

    // Join match room
    socket.on("join_match", ({ matchId, userId }) => {
      socket.join(matchId);
      console.log(`${userId} joined match ${matchId}`);
    });

    // Send truth question
    socket.on("send_truth_question", ({ matchId, question, fromUserId }) => {
      socket.to(matchId).emit("receive_truth_question", { question, fromUserId });
    });

    socket.on("prompt_chosen", ({ matchId, chosenPrompt, fromUserId }) => {
  socket.to(matchId).emit("prompt_chosen", { chosenPrompt, fromUserId });
});

    // Submit truth answer
    socket.on("submit_truth_answer", ({ matchId, answer, fromUserId }) => {
      socket.to(matchId).emit("receive_truth_answer", { answer, fromUserId });
    });

    // Rate answer: +10 or -10
    socket.on("rate_answer", async ({ targetUserId, isThumbsUp }) => {
      const delta = isThumbsUp ? 10 : -10;

      try {
        await Score.findOneAndUpdate(
          { userId: targetUserId },
          { $inc: { rating: delta } },
          { upsert: true, new: true }
        );

        // Notify user (if connected)
        socket.to(targetUserId).emit("rating_updated", {
          ratingChange: delta,
        });

        console.log(`✅ Rating updated for ${targetUserId}: ${delta > 0 ? "+" : ""}${delta}`);
      } catch (err) {
        console.error("❌ Failed to update rating:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("🚪 Client disconnected:", socket.id);
    });
  });
};
