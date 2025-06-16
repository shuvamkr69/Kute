import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  response: { type: String, enum: ['I Have', 'I Have Not'], required: true }
}, { _id: false });

const promptSchema = new mongoose.Schema({
  text: { type: String, required: true },
  answers: [answerSchema],
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  groupSize: { type: Number, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['waiting', 'in_progress', 'completed'], default: 'waiting' },
  chanceIndex: { type: Number, default: 0 },
  currentPrompt: promptSchema,

}, { timestamps: true });

export const NeverHaveIEverMatch = mongoose.model('NeverHaveIEverMatch', matchSchema);
