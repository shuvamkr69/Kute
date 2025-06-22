// index.js
import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initializeSocket, getIO } from "./utils/socket.js";

dotenv.config({
  path: '../.env'
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



// Start the application
startServer();

export { io };