// utils/socket.js
import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { ChamberMessage } from '../models/ChamberOfSecrets/message.model.js';
import { ApiError } from "./ApiError.js";
import { asyncHandler } from "./asyncHandler.js";

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


socket.on("call-user", ({ convId, offer, from }) => {
  socket.to(convId).emit("call-made", { offer, from });
});

socket.on("answer-call", ({ convId, answer, from }) => {
  socket.to(convId).emit("answer-made", { answer, from });
});

socket.on("ice-candidate", ({ convId, candidate, from }) => {
  socket.to(convId).emit("ice-candidate", { candidate, from });
});



    // Chamber of Secrets live chat
    socket.on("joinChamber", () => {
      socket.join("chamberOfSecrets");
    });

    socket.on("sendChamberMessage", asyncHandler(async (data) => {
      // data should be { text, senderId }
      if (!data || !data.text || !data.senderId) return ApiError(400, "Invalid data");
      // Save message to DB
      const msg = await ChamberMessage.create({ text: data.text, senderId: data.senderId });
      console.log(msg)
      // Broadcast to all in the room (do NOT include senderId)
      io.to("chamberOfSecrets").emit("newChamberMessage", {
        _id: msg._id,
        text: msg.text,
        createdAt: msg.createdAt,
        senderId: msg.senderId, // include senderId in the payload
      });
    }));

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  // Setup game logic after io is initialized
  setupTruthOrDare(io);
  setupNeverHaveIEver(io);

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

// --- Never Have I Ever Socket.io Logic ---
const nhieWaitingPlayers = [];
const nhieGameRooms = {};

function getNhieRoomId(groupSize) {
  // Find a waiting room with the same group size and not full
  for (const [roomId, room] of Object.entries(nhieGameRooms)) {
    if (room.groupSize === groupSize && room.players.length < groupSize && room.state === 'waiting') {
      return roomId;
    }
  }
  // Otherwise, create a new room id
  return `nhie_${groupSize}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
}

function getPlayerIndex(room, userId) {
  return room.players.findIndex(p => p.userId === userId);
}

function broadcastNhieRoomUpdate(roomId) {
  const room = nhieGameRooms[roomId];
  if (!room) return;
  room.players.forEach(p => io.to(p.socketId).emit('nhie:roomUpdate', { ...room, roomId }));
}

function setupNeverHaveIEver(io) {
  io.on('connection', (socket) => {
    // Join waiting room
    socket.on('nhie:joinRoom', ({ userId, groupSize }) => {
      let roomId = getNhieRoomId(groupSize);
      let room = nhieGameRooms[roomId];
      if (!room) {
        room = {
          roomId,
          groupSize,
          players: [], // { userId, socketId }
          state: 'waiting',
          chanceIndex: 0,
          currentPrompt: null,
          turnInProgress: false,
          skipCounts: {},
        };
        nhieGameRooms[roomId] = room;
      }
      if (!room.players.find(p => p.userId === userId)) {
        room.players.push({ userId, socketId: socket.id });
      }
      socket.join(roomId);
      // If room is full, start game
      if (room.players.length === groupSize) {
        room.state = 'in_progress';
        room.chanceIndex = Math.floor(Math.random() * groupSize);
        room.currentPrompt = null;
        room.turnInProgress = false;
        room.skipCounts = {};
      }
      broadcastNhieRoomUpdate(roomId);
    });

    // Leave room
    socket.on('nhie:leaveRoom', ({ userId, roomId }) => {
      const room = nhieGameRooms[roomId];
      if (!room) return;
      room.players = room.players.filter(p => p.userId !== userId);
      if (room.players.length < room.groupSize) {
        room.state = 'waiting';
        room.currentPrompt = null;
        room.chanceIndex = 0;
      }
      broadcastNhieRoomUpdate(roomId);
      if (room.players.length === 0) {
        delete nhieGameRooms[roomId];
      }
    });

    // Submit prompt (by chance holder)
    socket.on('nhie:submitPrompt', ({ roomId, userId, prompt }) => {
      const room = nhieGameRooms[roomId];
      if (!room) return;
      if (room.players[room.chanceIndex].userId !== userId) return;
      room.currentPrompt = {
        text: prompt,
        answers: [],
        promptSubmitted: true,
        gamePhase: 'answering',
        createdAt: new Date(),
      };
      room.turnInProgress = false;
      broadcastNhieRoomUpdate(roomId);
    });

    // Submit answer (by non-chance holders)
    socket.on('nhie:submitAnswer', ({ roomId, userId, response }) => {
      const room = nhieGameRooms[roomId];
      if (!room || !room.currentPrompt) return;
      if (room.players[room.chanceIndex].userId === userId) return; // chance holder can't answer
      if (room.currentPrompt.answers.find(a => a.userId === userId)) return; // already answered
      room.currentPrompt.answers.push({ userId, response });
      // Check if all non-chance holders have answered
      if (room.currentPrompt.answers.length === room.groupSize - 1) {
        room.currentPrompt.gamePhase = 'reviewing';
        room.turnInProgress = true;
      }
      broadcastNhieRoomUpdate(roomId);
    });

    // Next turn (by chance holder)
    socket.on('nhie:nextTurn', ({ roomId, userId }) => {
      const room = nhieGameRooms[roomId];
      if (!room) return;
      if (room.players[room.chanceIndex].userId !== userId) return;
      room.chanceIndex = (room.chanceIndex + 1) % room.players.length;
      room.currentPrompt = null;
      room.turnInProgress = false;
      broadcastNhieRoomUpdate(roomId);
    });

    // Disconnect logic
    socket.on('disconnect', () => {
      Object.entries(nhieGameRooms).forEach(([roomId, room]) => {
        const idx = room.players.findIndex(p => p.socketId === socket.id);
        if (idx !== -1) {
          const userId = room.players[idx].userId;
          room.players.splice(idx, 1);
          if (room.players.length < room.groupSize) {
            room.state = 'waiting';
            room.currentPrompt = null;
            room.chanceIndex = 0;
          }
          broadcastNhieRoomUpdate(roomId);
          if (room.players.length === 0) {
            delete nhieGameRooms[roomId];
          }
        }
      });
    });
  });
}
