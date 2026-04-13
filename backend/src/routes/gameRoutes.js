import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Game from '../models/Game.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { serializeGame } from '../utils/gameLogic.js';

export default function createGameRoutes() {
  const router = Router();

  router.get('/:gameId', protect, asyncHandler(async (req, res) => {
    const game = await Game.findById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }

    const isParticipant = game.players.some(
      (player) => player.user.toString() === req.auth.userId
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not part of this game.' });
    }

    return res.json({ game: serializeGame(game) });
  }));

  return router;
}
