import Game from "../../models/WouldYouRather/WouldYouRather.model.js";
import { WaitingUser } from "../../models/WouldYouRather/WouldYouRather.model.js";


// Join matchmaking queue and auto-match
export const joinQueue = async (req, res) => {
  const { userId } = req.body;

  try {
    const alreadyWaiting = await WaitingUser.findOne({ userId });
    if (alreadyWaiting) return res.status(200).json({ message: "Already waiting" });

    await WaitingUser.create({ userId });

    const waiting = await WaitingUser.find().limit(2);
    if (waiting.length === 2) {
      const player1 = waiting[0].userId;
      const player2 = waiting[1].userId;
      const turnHolder = decideTurnHolder([player1, player2]);

      const game = await Game.create({
        players: [player1, player2],
        rounds: [{ roundNumber: 1, turnHolder }],
        currentRound: 1,
        status: "in_progress",
      });

      await WaitingUser.deleteMany({
        userId: { $in: [player1, player2] },
      });

      return res.status(200).json({
        message: "Matched",
        gameId: game._id,
        turnHolder,
        opponentId: player1.toString() === userId ? player2 : player1,
      });
    }

    return res.status(202).json({ message: "Waiting for opponent" });
  } catch (err) {
    res.status(500).json({ message: "Error joining queue", error: err.message });
  }
};



// Helper to randomly pick who starts
const decideTurnHolder = (players) => {
  return players[Math.floor(Math.random() * players.length)];
};

// Create a new game
export const createGame = async (req, res) => {
  try {
    const { player1, player2 } = req.body;
    const turnHolder = decideTurnHolder([player1, player2]);

    const game = await Game.create({
      players: [player1, player2],
      rounds: [{
        roundNumber: 1,
        turnHolder
      }],
      status: "in_progress"
    });

    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ message: "Error creating game", error: err.message });
  }
};

// Poll for current game state
export const pollGameState = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);

    if (!game) return res.status(404).json({ message: "Game not found" });

    res.json(game);
  } catch (err) {
    res.status(500).json({ message: "Error fetching game", error: err.message });
  }
};

// Submit prompt
export const submitPrompt = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { prompt } = req.body;

    const game = await Game.findById(gameId);
    const round = game.rounds[game.currentRound - 1];
    round.prompt = prompt;

    await game.save();
    res.json({ message: "Prompt submitted" });
  } catch (err) {
    res.status(500).json({ message: "Error submitting prompt", error: err.message });
  }
};

// Submit answer
export const submitAnswer = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { answer } = req.body;

    const game = await Game.findById(gameId);
    const round = game.rounds[game.currentRound - 1];
    round.answer = answer;

    await game.save();
    res.json({ message: "Answer submitted" });
  } catch (err) {
    res.status(500).json({ message: "Error submitting answer", error: err.message });
  }
};

// Submit feedback (thumbs up/down)
export const submitFeedback = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { feedback } = req.body; // "like" or "dislike"

    const game = await Game.findById(gameId);
    const round = game.rounds[game.currentRound - 1];
    round.feedback = feedback;

    // Advance round
    if (game.currentRound >= 7) {
      game.status = "finished";
    } else {
      const nextHolder = game.players.find(
        (id) => id.toString() !== round.turnHolder.toString()
      );
      game.rounds.push({
        roundNumber: game.currentRound + 1,
        turnHolder: nextHolder,
      });
      game.currentRound += 1;
    }

    await game.save();
    res.json({ message: "Feedback submitted, round advanced" });
  } catch (err) {
    res.status(500).json({ message: "Error submitting feedback", error: err.message });
  }
};
