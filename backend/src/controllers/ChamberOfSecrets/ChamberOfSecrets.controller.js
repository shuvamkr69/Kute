import { ChamberMessage } from '../../models/ChamberOfSecrets/message.model.js';

export const getMessages = async (req, res) => {
  try {
    const messages = await ChamberMessage.find({ expiry: { $gt: new Date() } })
      .sort({ createdAt: 1 })
      .lean();
    // Only return _id, text, createdAt
    const safeMessages = messages.map(msg => ({ _id: msg._id, text: msg.text, createdAt: msg.createdAt, senderId: msg.senderId }));
    res.status(200).json(safeMessages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const addMessage = async (req, res) => {
  try {
    const { text, senderId } = req.body;
    if (!text || !senderId) return res.status(400).json({ error: 'Text and senderId are required' });
    const msg = await ChamberMessage.create({ text, senderId });
    res.status(201).json({ _id: msg._id, text: msg.text, createdAt: msg.createdAt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
}; 