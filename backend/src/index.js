// index.js
import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initializeSocket, getIO } from "./utils/socket.js";
import { Score } from "./models/TruthOrDare/truthDare.model.js";

dotenv.config({
  path: './.env'
});

// Create HTTP Server
const server = createServer(app);

// Initialize Socket.IO with proper configuration
initializeSocket(server);

// Get the initialized io instance
const io = getIO();

// ✅ Connect DB & Start Server
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at: http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO listening on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
};


export const registerTruthDareHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);

    socket.on("join_match", ({ matchId, userId }) => {
      socket.join(matchId);
      console.log(`${userId} joined match ${matchId}`);
    });

    socket.on("send_truth_question", ({ matchId, question, fromUserId }) => {
      socket.to(matchId).emit("receive_truth_question", { question, fromUserId });
    });

    socket.on("submit_truth_answer", ({ matchId, answer, fromUserId }) => {
      socket.to(matchId).emit("receive_truth_answer", { answer, fromUserId });
    });

    socket.on("rate_answer", async ({ targetUserId, isThumbsUp }) => {
      const delta = isThumbsUp ? 10 : -10;

      try {
        await Score.findOneAndUpdate(
          { userId: targetUserId },
          { $inc: { rating: delta } },
          { upsert: true, new: true }
        );
        socket.to(targetUserId).emit("rating_updated", { ratingChange: delta });
      } catch (err) {
        console.error("❌ Failed to update rating:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("🚪 Client disconnected:", socket.id);
    });
  });
};

// Start the application
startServer();

export { io };