import mongoose from 'mongoose';

const TDWaitingListSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('TDWaitingList', TDWaitingListSchema);
