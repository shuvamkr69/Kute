import { Server } from "socket.io";


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
