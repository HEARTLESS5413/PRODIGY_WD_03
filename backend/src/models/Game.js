import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      enum: ['X', 'O'],
      required: true,
    },
  },
  { _id: false }
);

const gameSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['friend', 'random'],
      required: true,
    },
    players: {
      type: [playerSchema],
      validate: {
        validator: (players) => players.length === 2,
        message: 'Game must have exactly two players.',
      },
    },
    board: {
      type: [String],
      default: () => Array(9).fill(null),
    },
    currentTurn: {
      type: String,
      enum: ['X', 'O'],
      default: 'X',
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'abandoned'],
      default: 'waiting',
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    winningLine: {
      type: [Number],
      default: [],
    },
    rematchVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMoveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Game', gameSchema);

