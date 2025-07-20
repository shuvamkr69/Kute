import express from 'express';

const router = express.Router();

// In-memory game state
const waitingPlayers = [];
const gameRooms = {};

// Join queue
router.post('/join', (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ message: 'playerId required' });
  if (waitingPlayers.includes(playerId)) {
    return res.status(200).json({ message: 'Already waiting' });
  }
  waitingPlayers.push(playerId);
  if (waitingPlayers.length >= 2) {
    const [p1, p2] = waitingPlayers.splice(0, 2);
    const roomId = `td_${p1}_${p2}_${Date.now()}`;
    const chanceHolder = Math.random() < 0.5 ? p1 : p2;
    gameRooms[roomId] = {
      players: [p1, p2],
      chanceHolder,
      state: 'waitingForChoice',
      currentChoice: null,
      truthQuestion: '',
      truthAnswer: '',
      round: 1,
    };
    return res.status(200).json({ roomId, chanceHolder });
  }
  return res.status(200).json({ message: 'Waiting for opponent...' });
});

// Get game status
router.get('/status', (req, res) => {
  const { roomId } = req.query;
  const game = gameRooms[roomId];
  if (!game) return res.status(404).json({ message: 'Room not found' });
  res.status(200).json(game);
});

// Make choice
router.post('/choose', (req, res) => {
  const { roomId, playerId, choice } = req.body;
  const game = gameRooms[roomId];
  if (!game || game.chanceHolder !== playerId) return res.status(403).json({ message: 'Not your turn.' });
  game.currentChoice = choice;
  game.state = 'waitingForQuestion';
  res.status(200).json({ message: 'Choice made.' });
});

// Submit question
router.post('/question', (req, res) => {
  const { roomId, question } = req.body;
  const game = gameRooms[roomId];
  if (!game) return res.status(404).json({ message: 'Room not found' });
  game.truthQuestion = question;
  game.state = 'waitingForAnswer';
  res.status(200).json({ message: 'Question submitted.' });
});

// Submit answer
router.post('/answer', (req, res) => {
  const { roomId, answer } = req.body;
  const game = gameRooms[roomId];
  if (!game) return res.status(404).json({ message: 'Room not found' });
  game.truthAnswer = answer;
  game.state = 'review';
  res.status(200).json({ message: 'Answer submitted.' });
});

// Next round
router.post('/next', (req, res) => {
  const { roomId } = req.body;
  const game = gameRooms[roomId];
  if (!game) return res.status(404).json({ message: 'Room not found' });
  const [p1, p2] = game.players;
  game.round += 1;
  game.chanceHolder = game.chanceHolder === p1 ? p2 : p1;
  game.currentChoice = null;
  game.truthQuestion = '';
  game.truthAnswer = '';
  game.state = 'waitingForChoice';
  res.status(200).json({ message: 'Next round started.' });
});

// Leave game
router.post('/leave', (req, res) => {
  const { playerId, roomId } = req.body;
  const idx = waitingPlayers.indexOf(playerId);
  if (idx !== -1) waitingPlayers.splice(idx, 1);
  if (roomId && gameRooms[roomId]) delete gameRooms[roomId];
  res.status(200).json({ message: 'Left game.' });
});

export default router; 