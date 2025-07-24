import { TDWaitingList } from "../../models/TruthOrDare/TDWaitingList.model.js";
import { User } from "../../models/user.model.js";
import { TDGame } from "../../models/TruthOrDare/TDGame.model.js";

export const joinTDWaitingList = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "userId required" });
  try {
    const alreadyWaiting = await TDWaitingList.findOne({ userId });
    if (alreadyWaiting) return res.status(200).json({ message: "Already waiting" });
    await TDWaitingList.create({ userId });
    res.status(200).json({ message: "Added to waiting list" });
  } catch (err) {
    res.status(500).json({ message: "Error joining waiting list", error: err.message });
  }
};

// POST /api/td/feedback
export const giveTDFeedback = async (req, res) => {
  const { gameId, roundNumber, userId, feedback } = req.body;
  if (!gameId || !roundNumber || !userId || !feedback) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const game = await TDGame.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });
    const round = game.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) return res.status(404).json({ message: "Round not found" });
    // Explicitly determine the answerer for this round
    const answererId = game.players.find(
      id => id.toString() === round.chanceHolder.toString()
    );
    if (!answererId) return res.status(404).json({ message: "Answerer not found" });
    const user = await User.findById(answererId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const delta = feedback === "up" ? 10 : feedback === "down" ? -10 : 0;
    user.leaderboardScore = (user.leaderboardScore || 0) + delta;
    await user.save();
    console.log(`Feedback: ${feedback} | Question Giver (chanceHolder): ${round.chanceHolder} | Answerer: ${answererId} | Score: ${user.leaderboardScore}`);
    return res.status(200).json({ message: "Feedback recorded", newScore: user.leaderboardScore });
  } catch (err) {
    return res.status(500).json({ message: "Error giving feedback", error: err.message });
  }
}; 