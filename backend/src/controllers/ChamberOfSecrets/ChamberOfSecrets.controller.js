import { ChamberMessage } from '../../models/ChamberOfSecrets/message.model.js';
import { ChamberUser } from '../../models/ChamberOfSecrets/chamberUser.model.js';
import { generateRandomName, getTodayString } from '../../utils/randomNameGenerator.js';

export const getMessages = async (req, res) => {
  try {
    const messages = await ChamberMessage.find({ expiry: { $gt: new Date() } })
      .sort({ createdAt: 1 })
      .lean();
    // Return _id, text, createdAt, senderId, and senderName
    const safeMessages = messages.map(msg => ({ 
      _id: msg._id, 
      text: msg.text, 
      createdAt: msg.createdAt, 
      senderId: msg.senderId,
      senderName: msg.senderName 
    }));
    res.status(200).json(safeMessages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const addMessage = async (req, res) => {
  try {
    const { text, senderId } = req.body;
    if (!text || !senderId) return res.status(400).json({ error: 'Text and senderId are required' });
    
    // Get or create chamber user with random name
    const chamberUser = await getOrCreateChamberUser(senderId);
    
    const msg = await ChamberMessage.create({ 
      text, 
      senderId, 
      senderName: chamberUser.randomName 
    });
    
    res.status(201).json({ 
      _id: msg._id, 
      text: msg.text, 
      createdAt: msg.createdAt,
      senderName: msg.senderName
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
};

export const getOrCreateChamberUser = async (userId) => {
  const todayString = getTodayString();
  
  // Try to find existing user for today
  let chamberUser = await ChamberUser.findOne({
    userId,
    createdDate: todayString
  });
  
  if (!chamberUser) {
    // Create new chamber user with random name for today
    const randomName = generateRandomName();
    chamberUser = await ChamberUser.create({
      userId,
      randomName,
      createdDate: todayString,
      lastActive: new Date()
    });
  } else {
    // Update last active time
    chamberUser.lastActive = new Date();
    await chamberUser.save();
  }
  
  return chamberUser;
};

export const getUserRandomName = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'UserId is required' });
    
    const chamberUser = await getOrCreateChamberUser(userId);
    res.status(200).json({ randomName: chamberUser.randomName });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user name' });
  }
}; 