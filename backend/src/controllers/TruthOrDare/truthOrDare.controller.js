import { TDGame } from "../../models/TruthOrDare/truthOrDare.model.js";
import { getIO } from "../../utils/truthOrDareSocket.js";

/**
 * Start a new Truth or Dare game between two players
 */
export const startTDGame = async (req, res) => {
  const { userId, opponentId } = req.body;

  if (!userId || !opponentId) {
    return res.status(400).json({ error: "Both player IDs are required." });
  }

  try {
    const players = [userId, opponentId];
    const firstTurn = players[Math.floor(Math.random() * 2)];

    const game = new TDGame({
      players,
      turn: firstTurn,
      status: "playing",
    });

    await game.save();
    res.status(200).json({ gameId: game._id, turn: firstTurn });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({ error: "Failed to start game." });
  }
};

/**
 * Get the current game state
 */
export const getTDGameState = async (req, res) => {
  const { gameId } = req.params;

  try {
    const game = await TDGame.findById(gameId);

    if (!game) {
      return res.status(404).json({ error: "Game not found." });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error("Error retrieving game state:", error);
    res.status(500).json({ error: "Failed to retrieve game state." });
  }
};
