import mongoose from "mongoose";

const roundSchema = new mongoose.Schema({
  prompt: { type: String, default: null },
  answer: { type: String, default: null },
  feedback: {
    type: String,
    enum: ["like", "dislike", null],
    default: null,
  },
  turnHolder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  roundNumber: Number,
});

const gameSchema = new mongoose.Schema({
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
  
  createdAt: { type: Date, default: Date.now },
});
const waitingUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  joinedAt: { type: Date, default: Date.now, expires: 600 }, // <-- TTL index here (600s = 10 mins)
});


export const WaitingUser = mongoose.model("WYRWaitingUser", waitingUserSchema);

const WouldYouRatherGame = mongoose.model("WouldYouRatherGame", gameSchema);
export default WouldYouRatherGame;
