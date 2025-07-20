// utils/socket.js
import { Server } from "socket.io";
import { Message } from "../models/message.model.js";

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

    // // Join a room named after the userId for targeted emits
    // socket.on('td_register_user', ({ userId }) => {
    //   if (userId) {
    //     socket.join(userId);
    //     console.log(`Socket ${socket.id} joined room for user ${userId}`);
    //   }
    // });

   
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

// Truth or Dare Socket.io Logic
const waitingPlayers = [];
const gameRooms = {};

function setupTruthOrDare(io) {
  io.on('connection', (socket) => {
    socket.on('td:joinQueue', ({ userId }) => {
      if (!waitingPlayers.find(p => p.userId === userId)) {
        waitingPlayers.push({ userId, socketId: socket.id });
      }
      if (waitingPlayers.length >= 2) {
        const [p1, p2] = waitingPlayers.splice(0, 2);
        const roomId = `td_${p1.userId}_${p2.userId}_${Date.now()}`;
        const chanceHolder = Math.random() < 0.5 ? p1.userId : p2.userId;
        gameRooms[roomId] = {
          players: [p1, p2],
          chanceHolder,
          state: 'waitingForChoice',
          currentChoice: null,
          truthQuestion: '',
          truthAnswer: '',
          round: 1,
        };
        io.to(p1.socketId).emit('td:matched', { roomId, chanceHolder });
        io.to(p2.socketId).emit('td:matched', { roomId, chanceHolder });
      }
    });

    socket.on('td:makeChoice', ({ roomId, userId, choice }) => {
      const game = gameRooms[roomId];
      if (!game || game.chanceHolder !== userId) return;
      game.currentChoice = choice;
      game.state = 'waitingForQuestion';
      game.players.forEach(p => io.to(p.socketId).emit('td:stateUpdate', game));
    });

    socket.on('td:submitQuestion', ({ roomId, question }) => {
      const game = gameRooms[roomId];
      if (!game) return;
      game.truthQuestion = question;
      game.state = 'waitingForAnswer';
      game.players.forEach(p => io.to(p.socketId).emit('td:stateUpdate', game));
    });

    socket.on('td:submitAnswer', ({ roomId, answer }) => {
      const game = gameRooms[roomId];
      if (!game) return;
      game.truthAnswer = answer;
      game.state = 'review';
      game.players.forEach(p => io.to(p.socketId).emit('td:stateUpdate', game));
    });

    socket.on('td:nextRound', ({ roomId }) => {
      const game = gameRooms[roomId];
      if (!game) return;
      game.round += 1;
      const [p1, p2] = game.players;
      game.chanceHolder = game.chanceHolder === p1.userId ? p2.userId : p1.userId;
      game.currentChoice = null;
      game.truthQuestion = '';
      game.truthAnswer = '';
      game.state = 'waitingForChoice';
      game.players.forEach(p => io.to(p.socketId).emit('td:stateUpdate', game));
    });

    socket.on('td:leave', ({ roomId, userId }) => {
      const idx = waitingPlayers.findIndex(p => p.userId === userId);
      if (idx !== -1) waitingPlayers.splice(idx, 1);
      if (roomId && gameRooms[roomId]) {
        const game = gameRooms[roomId];
        game.players.forEach(p => {
          if (p.userId !== userId) io.to(p.socketId).emit('td:opponentLeft');
        });
        delete gameRooms[roomId];
      }
    });

    socket.on('disconnect', () => {
      const idx = waitingPlayers.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) waitingPlayers.splice(idx, 1);
      Object.entries(gameRooms).forEach(([roomId, game]) => {
        if (game.players.some(p => p.socketId === socket.id)) {
          game.players.forEach(p => {
            if (p.socketId !== socket.id) io.to(p.socketId).emit('td:opponentLeft');
          });
          delete gameRooms[roomId];
        }
      });
    });
  });
}

export default setupTruthOrDare ;
