import mongoose from "mongoose";

const TDloveLanguagechema = new mongoose.Schema(
  {
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: "TDGame", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    promptText: { type: String, required: true },
    type: { type: String, enum: ["truth", "dare"], required: true },
  },
  { timestamps: true }
);

export const TDPrompt = mongoose.model("TDPrompt", TDloveLanguagechema);
