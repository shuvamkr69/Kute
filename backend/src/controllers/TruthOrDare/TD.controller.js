import { TDWaitingList } from "../../models/TruthOrDare/TDWaitingList.model.js";

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