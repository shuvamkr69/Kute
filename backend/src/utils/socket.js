// utils/socket.js
import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { ChamberMessage } from '../models/ChamberOfSecrets/message.model.js';
import { ChamberUser } from '../models/ChamberOfSecrets/chamberUser.model.js';
import { TDGame } from "../models/TruthOrDare/TDGame.model.js";
import { ApiError } from "./ApiError.js";
import { asyncHandler } from "./asyncHandler.js";
import { getOrCreateChamberUser } from '../controllers/ChamberOfSecrets/ChamberOfSecrets.controller.js';

let io = null;
const chamberUsers = new Map(); // Track online chamber users: socketId -> { userId, randomName }

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
    socket.on("joinChamber", asyncHandler(async ({ userId }) => {
      try {
        // Get or create chamber user with random name
        const chamberUser = await getOrCreateChamberUser(userId);
        
        // Store user info for this socket
        chamberUsers.set(socket.id, {
          userId,
          randomName: chamberUser.randomName
        });
        
        socket.join("chamberOfSecrets");
        
        // Emit updated user count to all users in chamber
        const onlineCount = chamberUsers.size;
        io.to("chamberOfSecrets").emit("chamberUserCount", onlineCount);
        
        // Send the user their random name
        socket.emit("chamberUserInfo", { randomName: chamberUser.randomName });
        
        console.log(`🏰 User ${chamberUser.randomName} joined Chamber of Secrets (${onlineCount} online)`);
      } catch (error) {
        console.error("❌ Error joining chamber:", error);
        socket.emit("chamberError", { message: "Failed to join chamber" });
      }
    }));

    socket.on("sendChamberMessage", asyncHandler(async (data) => {
      try {
        // data should be { text, senderId }
        if (!data || !data.text || !data.senderId) {
          socket.emit("chamberError", { message: "Invalid message data" });
          return;
        }
        
        // Get chamber user info
        const userInfo = chamberUsers.get(socket.id);
        if (!userInfo) {
          socket.emit("chamberError", { message: "User not registered in chamber" });
          return;
        }
        
        // Save message to DB with sender name
        const msg = await ChamberMessage.create({ 
          text: data.text, 
          senderId: data.senderId,
          senderName: userInfo.randomName
        });
        
        console.log(`💬 ${userInfo.randomName}: ${data.text}`);
        
        // Broadcast to all in the room
        io.to("chamberOfSecrets").emit("newChamberMessage", {
          _id: msg._id,
          text: msg.text,
          createdAt: msg.createdAt,
          senderId: msg.senderId,
          senderName: msg.senderName,
        });
      } catch (error) {
        console.error("❌ Error sending chamber message:", error);
        socket.emit("chamberError", { message: "Failed to send message" });
      }
    }));

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
      
      // Remove user from chamber tracking if they were in chamber
      const userInfo = chamberUsers.get(socket.id);
      if (userInfo) {
        chamberUsers.delete(socket.id);
        const onlineCount = chamberUsers.size;
        io.to("chamberOfSecrets").emit("chamberUserCount", onlineCount);
        console.log(`🏰 ${userInfo.randomName} left Chamber of Secrets (${onlineCount} online)`);
      }
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

export function setupTruthOrDare(io) {
  io.on('connection', (socket) => {
    socket.on('td:joinQueue', asyncHandler(async ({ userId }) => {
      if (!waitingPlayers.find(p => p.userId === userId)) {
        waitingPlayers.push({ userId, socketId: socket.id });
      }
      if (waitingPlayers.length >= 2) {
        const [p1, p2] = waitingPlayers.splice(0, 2);
        const roomId = `td_${p1.userId}_${p2.userId}_${Date.now()}`;
        const chanceHolder = Math.random() < 0.5 ? p1.userId : p2.userId;
        
        // Create TDGame document in MongoDB
        const gameDoc = await TDGame.create({
          players: [p1.userId, p2.userId],
          chanceHolder,
          status: 'in_progress',
          currentRound: 1,
          rounds: []
        });
        
        gameRooms[roomId] = {
          _id: gameDoc._id, // Include MongoDB _id
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
        
        // Emit initial state update with game._id
        const game = gameRooms[roomId];
        game.players.forEach(p => io.to(p.socketId).emit('td:stateUpdate', game));
      }
    }));

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

    socket.on('td:submitAnswer', asyncHandler(async ({ roomId, answer }) => {
      const game = gameRooms[roomId];
      if (!game) return;
      game.truthAnswer = answer;
      game.state = 'review';
      
      // Save the completed round to MongoDB
      try {
        await TDGame.findByIdAndUpdate(game._id, {
          $push: {
            rounds: {
              type: 'truth',
              prompt: game.truthQuestion,
              answer: game.truthAnswer,
              chanceHolder: game.chanceHolder,
              roundNumber: game.round
            }
          }
        });
      } catch (error) {
        console.error('Error saving round to database:', error);
      }
      
      game.players.forEach(p => io.to(p.socketId).emit('td:stateUpdate', game));
    }));

    socket.on('td:nextRound', asyncHandler(async ({ roomId }) => {
      const game = gameRooms[roomId];
      if (!game) return;
      
      // Prevent going to next round if not in review state
      if (game.state !== 'review') return;
      
      // Check if game should be completed
      if (game.round >= 4) {
        game.state = 'finished';
        
        // Update game status in MongoDB
        try {
          await TDGame.findByIdAndUpdate(game._id, {
            status: 'finished'
          });
        } catch (error) {
          console.error('Error updating game status to finished:', error);
        }
        
        // Emit game completion to both players
        game.players.forEach(p => io.to(p.socketId).emit('td:gameCompleted', game));
        return;
      }
      
      console.log(`Moving from round ${game.round} to round ${game.round + 1} in room ${roomId}`);
      
      game.round += 1;
      const [p1, p2] = game.players;
      game.chanceHolder = game.chanceHolder === p1.userId ? p2.userId : p1.userId;
      game.currentChoice = null;
      game.truthQuestion = '';
      game.truthAnswer = '';
      game.state = 'waitingForChoice';
      
      // Update the current round in MongoDB
      try {
        await TDGame.findByIdAndUpdate(game._id, {
          currentRound: game.round,
          chanceHolder: game.chanceHolder
        });
      } catch (error) {
        console.error('Error updating game in database:', error);
      }
      
      game.players.forEach(p => io.to(p.socketId).emit('td:stateUpdate', game));
    }));

    socket.on('td:leave', async ({ roomId, userId }) => {
      const idx = waitingPlayers.findIndex(p => p.userId === userId);
      if (idx !== -1) waitingPlayers.splice(idx, 1);
      if (roomId && gameRooms[roomId]) {
        const game = gameRooms[roomId];
        
        // Apply -10 penalty if game was in progress and not finished
        if (game.state !== 'finished' && game.round < 4) {
          try {
            const { User } = await import("../models/user.model.js");
            const user = await User.findById(userId);
            if (user) {
              user.leaderboardScore = (user.leaderboardScore || 0) - 10;
              await user.save();
              console.log(`Player ${userId} left game early. -10 penalty applied. New score: ${user.leaderboardScore}`);
            }
          } catch (error) {
            console.error('Error applying leave penalty:', error);
          }
        }
        
        game.players.forEach(p => {
          if (p.userId !== userId) io.to(p.socketId).emit('td:opponentLeft');
        });
        delete gameRooms[roomId];
      }
    });

    socket.on('disconnect', async () => {
      const idx = waitingPlayers.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) waitingPlayers.splice(idx, 1);
      Object.entries(gameRooms).forEach(async ([roomId, game]) => {
        if (game.players.some(p => p.socketId === socket.id)) {
          const disconnectedPlayer = game.players.find(p => p.socketId === socket.id);
          
          // Apply -10 penalty if game was in progress and not finished
          if (disconnectedPlayer && game.state !== 'finished' && game.round < 4) {
            try {
              const { User } = await import("../models/user.model.js");
              const user = await User.findById(disconnectedPlayer.userId);
              if (user) {
                user.leaderboardScore = (user.leaderboardScore || 0) - 10;
                await user.save();
                console.log(`Player ${disconnectedPlayer.userId} disconnected from game. -10 penalty applied. New score: ${user.leaderboardScore}`);
              }
            } catch (error) {
              console.error('Error applying disconnect penalty:', error);
            }
          }
          
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
    
      room.currentPrompt = {
        createdBy: userId,
        text: prompt,
        answers: [],
      };
    
      room.gamePhase = 'answering';
    
      io.to(roomId).emit('nhie:roomUpdate', room);
    });
    

    // Submit answer (by non-chance holders)
    socket.on('nhie:submitAnswer', ({ roomId, userId, response }) => {
      const room = nhieGameRooms[roomId];
      if (!room || !room.currentPrompt) return;
    
      const player = room.players.find(p => p.userId === userId);
      if (!player) return;
    
      // Save the player's answer
      if (!room.currentPrompt.answers) room.currentPrompt.answers = [];
      const existing = room.currentPrompt.answers.find(a => a.userId === userId);
      if (!existing) {
        room.currentPrompt.answers.push({ userId, response, displayName: player.displayName });
      }
    
      // Count expected answers (excluding the prompt creator)
      const expectedAnswers = room.players.filter(p => p.userId !== room.currentPrompt.createdBy).length;
    
      if (room.currentPrompt.answers.length === expectedAnswers) {
        // All players have answered, move to 'reviewing'
        room.gamePhase = 'reviewing';
    
        // Emit the updated room to all clients
        io.to(roomId).emit('nhie:roomUpdate', room);
      }
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
