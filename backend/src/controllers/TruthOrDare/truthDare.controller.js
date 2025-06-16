import axios from "axios";
import { Game, Score } from "../../models/TruthOrDare/truthDare.model.js";
import { WaitingPlayer } from "../../models/TruthOrDare/truthDare.model.js";
import mongoose from "mongoose";

export const getPrompt = async (req, res) => {
  try {
    const response = await axios.get("https://api.truthordarebot.xyz/api/dare");
    res.status(200).json(response.data);
  } catch {
    res.status(500).json({ error: "Failed to fetch prompt" });
  }
};

export const joinQueue = async (req, res) => {
  const { userId, genderPreference } = req.body;

  if (!userId || !genderPreference) {
    return res.status(400).json({ error: "Missing userId or gender" });
  }

  try {
    const existing = await WaitingPlayer.findOne({ userId });

    if (existing) {
      return res.status(400).json({ error: "Already in queue" });
    }

    await WaitingPlayer.create({ userId, genderPreference });
    return res.json({ success: true });
  } catch (err) {
    console.error("Join queue error:", err);
    res.status(500).json({ error: "Failed to join queue" });
  }
};

export const matchPlayer = async (req, res) => {
  const { userId, genderPreference } = req.body;

  // Step 1: Check if already matched
  const existing = await WaitingPlayer.findOne({ userId });

  if (existing && existing.status === "matched" && existing.matchId) {
    const players = await WaitingPlayer.find({ matchId: existing.matchId });
    return res.json({ matched: true, players });
  }

  if (!existing) {
  return res.status(400).json({ error: "Player not in waiting queue." });
}


  // Step 2: Try to find a match based on strict gender preference logic
const match = await WaitingPlayer.findOne({
  userId: { $ne: userId },
  status: "waiting",
  $or: [
    // Male ↔ Female and vice versa
    {
      genderPreference: "Male",
      $expr: { $eq: [existing.genderPreference, "Female"] }
    },
    {
      genderPreference: "Female",
      $expr: { $eq: [existing.genderPreference, "Male"] }
    },
    // Others ↔ Others
    {
      genderPreference: "Others",
      $expr: { $eq: [existing.genderPreference, "Others"] }
    }
  ]
});


  if (match) {
    const matchId = new mongoose.Types.ObjectId().toString();
    const chooser = Math.random() < 0.5 ? userId : match.userId;

    await Promise.all([
  WaitingPlayer.updateOne(
    { userId },
    { $set: { status: "matched", matchId, isChooser: userId === chooser } }
  ),
  WaitingPlayer.updateOne(
    { userId: match.userId },
    { $set: { status: "matched", matchId, isChooser: match.userId === chooser } }
  )
]);

// Now fetch again — ensure it waits until updates are applied
const matchedPlayers = await WaitingPlayer.find({
  matchId,
  isChooser: { $in: [true, false] }, // Only return if isChooser exists
});

if (matchedPlayers.length === 2) {
  return res.json({ matched: true, players: matchedPlayers });
}

// Else fallback
return res.json({ matched: false });

  }

  // Step 4: Still waiting
  return res.json({ matched: false });
};

export const submitResult = async (req, res) => {
  const { userId, promptType, question, completed } = req.body;
  try {
    const newGame = new Game({ userId, promptType, question, completed });
    await newGame.save();

    if (completed) {
      await Score.findOneAndUpdate(
        { userId },
        { $inc: { wins: 1 } },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ message: "Result saved" });
  } catch {
    res.status(500).json({ error: "Failed to save result" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Score.find().sort({ wins: -1 }).limit(10);

    res.status(200).json(leaderboard);
  } catch {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

export const leaveQueue = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const player = await WaitingPlayer.findOne({ userId });

    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    if (player.status === "matched") {
      // 🛑 Do NOT remove matched players!
      return res.json({ message: "User is matched — not removing." });
    }

    await WaitingPlayer.deleteOne({ userId });
    return res.json({ message: "User removed from waiting list" });
  } catch (err) {
    console.error("Error in leaveQueue:", err);
    return res.status(500).json({ error: "Server error" });
  }
};










//rating the truth
export const rateTruthAnswer = async (req, res) => {
  const { targetUserId, ratingDelta } = req.body;

  try {
    await Score.findOneAndUpdate(
      { userId: targetUserId },
      { $inc: { rating: ratingDelta } },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Rating updated" });
  } catch {
    res.status(500).json({ error: "Failed to update rating" });
  }
};





export const submitFeedback = async (req, res) => {
  const { matchId, fromUserId, liked } = req.body;
  const points = liked ? 10 : -10;

  await WaitingPlayer.updateOne(
    { matchId, userId: { $ne: fromUserId } }, // Update opponent's score
    { $inc: { rating: points } }
  );

  res.json({ success: true });
};














export const getMatchStatus = async (req, res) => {
  const { matchId } = req.params;

  if (!matchId) {
    return res.status(400).json({ error: "Missing matchId" });
  }

  try {
    const players = await WaitingPlayer.find({ matchId });

    if (!players || players.length !== 2) {
      return res.status(404).json({ error: "Match not found or incomplete" });
    }
    console.log("🔍 Match ID:", matchId);
console.log("🧑‍🤝‍🧑 Players in match:", players);


    return res.json(players);
  } catch (err) {
    console.error("Error in getMatchStatus:", err);
    res.status(500).json({ error: "Server error" });
  }
};





export const sendTruthQuestion = async (req, res) => {
  const { matchId, question } = req.body;

  if (!matchId || !question) {
    return res.status(400).json({ error: "Missing matchId or question" });
  }

  try {
    const players = await WaitingPlayer.find({ matchId });

    const chooser = players.find((p) => p.isChooser === true);
    const nonChooser = players.find((p) => p.isChooser === false);

    if (!chooser || !nonChooser) {
      return res.status(404).json({ error: "Players not found" });
    }

    // Store the question in chooser's doc
    await WaitingPlayer.updateOne(
      { userId: chooser.userId },
      { $set: { truthQuestion: question } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error in sendTruthQuestion:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const submitTruthAnswer = async (req, res) => {
  const { matchId, answer } = req.body;

  if (!matchId || !answer) {
    return res.status(400).json({ error: "Missing matchId or answer" });
  }

  try {
    const players = await WaitingPlayer.find({ matchId });

    const nonChooser = players.find((p) => p.isChooser === false);

    if (!nonChooser) {
      return res.status(404).json({ error: "Opponent not found" });
    }

    await WaitingPlayer.updateOne(
      { userId: nonChooser.userId },
      { $set: { receivedAnswer: answer } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error in submitTruthAnswer:", err);
    res.status(500).json({ error: "Server error" });
  }
};



export const choosePrompt = async (req, res) => {
  const { userId, matchId, promptType } = req.body;

  if (!userId || !matchId || !promptType) {
    return res
      .status(400)
      .json({ error: "Missing userId, matchId, or promptType" });
  }

  const normalizedPrompt = promptType.toLowerCase();

  if (normalizedPrompt !== "truth" && normalizedPrompt !== "dare") {
    return res.status(400).json({ error: "Invalid promptType. Must be 'truth' or 'dare'." });
  }

  try {
    const players = await WaitingPlayer.find({ matchId });

    if (!players || players.length !== 2) {
      return res.status(404).json({ error: "Match not found or incomplete" });
    }

    const targetPlayer = players.find(p => p.userId === userId);

    if (!targetPlayer) {
      return res.status(404).json({ error: "User not found in match" });
    }

    const updated = await WaitingPlayer.findOneAndUpdate(
      { userId, matchId },
      { promptType: normalizedPrompt },
      { new: true }
    );

    console.log(`🎯 Prompt set to '${normalizedPrompt}' by user ${userId} in match ${matchId}`);

    return res.json({ success: true, updated });
  } catch (err) {
    console.error("❌ Error in choosePrompt:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


//clearing waiting list from mongo db button

export const clearWaitingList = async (req, res) => {
  try {
    await WaitingPlayer.deleteMany({});
    res.json({ success: true, message: "Waiting list cleared" });
  } catch (err) {
    console.error("❌ Failed to clear waiting list:", err);
    res.status(500).json({ error: "Failed to clear waiting list" });
  }
};
