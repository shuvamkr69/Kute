import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  promptType: { type: String, enum: ["truth", "dare"], required: true },
  question: { type: String, required: true },
  completed: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
});

const scoreSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  wins: { type: Number, default: 0 },
  rating: { type: Number, default: 1000 }, // new field
});


const waitingSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  genderPreference: String,
  status: { type: String, default: "waiting" }, // 'waiting' or 'matched'
  matchId: { type: String, default: null },
  isChooser: Boolean,
  promptType: { type: String, enum: ["truth", "dare"], default: null }, // ✅ ADD THIS
  truthQuestion: { type: String, default: null },
  hasAnswered: { type: Boolean, default: false },
  receivedAnswer: { type: String, default: null },
});




export const WaitingPlayer = mongoose.model("WaitingPlayer", waitingSchema);
export const Game = mongoose.model("Game", gameSchema);
export const Score = mongoose.model("Score", scoreSchema);
