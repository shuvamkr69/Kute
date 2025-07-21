import mongoose from "mongoose";

const tdWaitingListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  joinedAt: { type: Date, default: Date.now, expires: 600 }, // 10 min TTL
});

export const TDWaitingList = mongoose.model("TDWaitingList", tdWaitingListSchema); 