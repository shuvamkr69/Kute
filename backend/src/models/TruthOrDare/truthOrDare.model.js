import mongoose from "mongoose";

const TDGameSchema = new mongoose.Schema(
  {
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    turn: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["playing", "completed"], default: "playing" },
  },
  { timestamps: true }
);

export const TDGame = mongoose.model("TDGame", TDGameSchema);
