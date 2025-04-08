import { TDGame } from "../models/TruthOrDar/truthOrDareGame.model.js";
import { TDPrompt } from "../models/TruthOrDare/truthOrDareloveLanguage.model.js";
import { getIO } from "../utils/truthOrDareSocket.js";

/**
 * Send a Truth or Dare prompt
 */
export const sendTDPrompt = async (req, res) => {
  const { gameId, senderId, promptText, type } = req.body;
  const io = getIO();

  try {
    const game = await TDGame.findById(gameId);
    if (!game) return res.status(404).json({ error: "Game not found." });

    if (game.turn !== senderId) {
      return res.status(403).json({ error: "Not your turn!" });
    }

    // Create the prompt
    const newPrompt = new TDPrompt({
      gameId,
      senderId,
      promptText,
      type,
    });
    await newPrompt.save();

    // Update game state
    const nextTurn = game.players.find((p) => p !== senderId);
    game.turn = nextTurn;
    await game.save();

    io.to(gameId).emit("newTDPrompt", { promptText, type, nextTurn });

    res.status(200).json({ message: "Prompt sent!", nextTurn });
  } catch (error) {
    console.error("Error sending prompt:", error);
    res.status(500).json({ error: "Failed to send prompt." });
  }
};

/**
 * Receive the latest Truth or Dare prompt
 */
export const receiveTDPrompt = async (req, res) => {
  const { gameId } = req.params;

  try {
    const prompt = await TDPrompt.findOne({ gameId }).sort({ createdAt: -1 });

    if (!prompt) {
      return res.status(404).json({ error: "No prompt available." });
    }

    res.status(200).json(prompt);
  } catch (error) {
    console.error("Error retrieving prompt:", error);
    res.status(500).json({ error: "Failed to retrieve prompt." });
  }
};
