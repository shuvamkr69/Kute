import mongoose from "mongoose";

const roundSchema = new mongoose.Schema({
  type: { type: String, enum: ["truth"], required: true }, // Only truth for now
  prompt: { type: String, default: null },
  answer: { type: String, default: null },
  chanceHolder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  roundNumber: Number,
});

const tdGameSchema = new mongoose.Schema({
  players: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  currentRound: { type: Number, default: 1 },
  rounds: [roundSchema],
  status: {
    type: String,
    enum: ["waiting", "in_progress", "finished"],
    default: "waiting",
  },
  chanceHolder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export const TDGame = mongoose.model("TDGame", tdGameSchema); 