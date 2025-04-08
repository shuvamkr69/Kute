import mongoose from 'mongoose';

const aiChatSchema = new mongoose.Schema({
  userId: String,
  userInput: String,
  chatContext: Array,
  aiResponse: String,
}, { timestamps: true });

export default mongoose.model('AiChatbot', aiChatSchema);
