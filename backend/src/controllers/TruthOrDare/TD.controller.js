import TDWaitingList from '../../models/TruthOrDare/TDWaitingList.model.js';
import TDGameRoom from '../../models/TruthOrDare/TDGameRoom.model.js';

export const joinWaitingList = async (req, res) => {
  const { playerId } = req.body;
  // Prevent duplicate playerId in waiting list
  const alreadyWaiting = await TDWaitingList.findOne({ playerId });
  if (alreadyWaiting) {
    return res.status(200).json({ message: 'Already waiting for opponent...' });
  }
  await TDWaitingList.create({ playerId });

  const waitingPlayers = await TDWaitingList.find().limit(2);
  if (waitingPlayers.length === 2) {
    const [p1, p2] = waitingPlayers;

    // Randomly choose chanceHolder
    const chanceHolder = Math.random() < 0.5 ? p1.playerId : p2.playerId;

    const room = await TDGameRoom.create({
      players: [
        { playerId: p1.playerId },
        { playerId: p2.playerId },
      ],
      chanceHolder,
    });

    await TDWaitingList.deleteMany({
      playerId: { $in: [p1.playerId, p2.playerId] },
    });

    return res.status(200).json({ roomId: room._id, chanceHolder });
  }

  return res.status(200).json({ message: 'Waiting for opponent...' });
};

export const makeChoice = async (req, res) => {
  const { roomId, playerId, choice } = req.body;
  const room = await TDGameRoom.findById(roomId);

  if (room.chanceHolder !== playerId) {
    return res.status(403).json({ message: 'Not your turn.' });
  }

  room.currentChoice = choice; // only 'truth' for now
  room.state = 'waitingForQuestion';
  await room.save();

  return res.status(200).json({ message: 'Choice made.' });
};

export const submitTruthQuestion = async (req, res) => {
  const { roomId, question } = req.body;
  const room = await TDGameRoom.findById(roomId);
  room.truthQuestion = question;
  room.state = 'waitingForAnswer';
  await room.save();
  return res.status(200).json({ message: 'Question submitted.' });
};

export const submitTruthAnswer = async (req, res) => {
  const { roomId, answer } = req.body;
  const room = await TDGameRoom.findById(roomId);
  room.truthAnswer = answer;
  room.state = 'review';
  await room.save();
  return res.status(200).json({ message: 'Answer submitted.' });
};

export const nextRound = async (req, res) => {
  const { roomId } = req.body;
  const room = await TDGameRoom.findById(roomId);
  const [p1, p2] = room.players;
  const newHolder = room.chanceHolder === p1.playerId ? p2.playerId : p1.playerId;

  room.currentRound += 1;
  room.chanceHolder = newHolder;
  room.currentChoice = null;
  room.truthQuestion = '';
  room.truthAnswer = '';
  room.state = 'waitingForChoice';
  await room.save();

  return res.status(200).json({ message: 'Next round started.' });
};

export const getRoomStatus = async (req, res) => {
    try {
      const { roomId } = req.query;
      const room = await TDGameRoom.findById(roomId);
      if (!room) return res.status(404).json({ message: 'Room not found' });
  
      res.status(200).json({
        state: room.state,
        truthQuestion: room.truthQuestion,
        truthAnswer: room.truthAnswer,
        currentRound: room.currentRound,
        chanceHolder: room.chanceHolder,
      });
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch room status', error: err.message });
    }
  };
