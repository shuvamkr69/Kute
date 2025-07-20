import mongoose from 'mongoose';

const TDGameRoomSchema = new mongoose.Schema({
  players: [
    {
      playerId: String,
    },
  ],
  currentRound: { type: Number, default: 1 },
  chanceHolder: { type: String }, // playerId
  currentChoice: { type: String, enum: ['truth', 'dare', null], default: null },
  truthQuestion: { type: String, default: '' },
  truthAnswer: { type: String, default: '' },
  state: { type: String, default: 'waitingForChoice' }, // other possible values: 'waitingForQuestion', 'waitingForAnswer', 'review'
});

export default mongoose.model('TDGameRoom', TDGameRoomSchema);
