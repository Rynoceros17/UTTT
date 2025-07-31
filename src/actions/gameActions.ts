'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/state';
import { createNewGame, applyMove } from '@/lib/gameLogic';
import type { Player, Game, Move, PlayerSymbol } from '@/types';
import { autoForfeitOnDisconnect } from '@/ai/flows/auto-forfeit-on-disconnect';

export async function createGameAction(player: Player): Promise<string> {
  const gameId = Math.random().toString(36).substring(2, 9);
  const game = createNewGame(gameId, player);
  db.games.save(game);
  revalidatePath('/');
  return gameId;
}

export async function joinGameAction(gameId: string, player: Player): Promise<void> {
  const game = db.games.find(gameId);
  if (game && game.status === 'waiting' && game.xPlayer.id !== player.id) {
    game.oPlayer = player;
    game.status = 'live';
    db.games.save(game);
    revalidatePath('/');
    revalidatePath(`/game/${gameId}`);
  } else {
    // Handle error: game not found, already full, or player is X
  }
}

export async function makeMoveAction(gameId: string, move: Move, playerId: string): Promise<{ success: boolean; message?: string }> {
  const game = db.games.find(gameId);
  if (!game || game.status !== 'live') {
    return { success: false, message: 'Game not found or is not active.' };
  }

  const { playerSymbol, localBoardIndex, cellIndex } = move;

  const currentPlayer = playerSymbol === 'X' ? game.xPlayer : game.oPlayer;
  if (currentPlayer?.id !== playerId) {
    return { success: false, message: 'Not your piece.' };
  }

  if (game.nextTurn !== playerSymbol) {
    return { success: false, message: 'Not your turn.' };
  }

  if (game.activeLocalBoard !== null && game.activeLocalBoard !== localBoardIndex) {
    return { success: false, message: 'Invalid board.' };
  }

  if (game.localBoards[localBoardIndex][cellIndex] !== null) {
    return { success: false, message: 'Cell already taken.' };
  }
  
  if (game.globalBoard[localBoardIndex] !== null) {
    return { success: false, message: 'This board is already won or drawn.'}
  }

  const updatedGame = applyMove(game, move);
  db.games.save(updatedGame);

  revalidatePath(`/game/${gameId}`);
  return { success: true };
}

export async function getGameAction(gameId: string): Promise<Game | undefined> {
  return db.games.find(gameId);
}

export async function getGamesAction(): Promise<Game[]> {
  return db.games.findAll();
}

export async function forfeitGameAction(gameId: string, forfeitingPlayerId: string): Promise<{ summary: string, message: string }> {
    const game = db.games.find(gameId);
    if (!game) {
        throw new Error('Game not found');
    }

    const opponent = game.xPlayer.id === forfeitingPlayerId ? game.oPlayer : game.xPlayer;
    if (!opponent) {
        throw new Error('Opponent not found');
    }

    game.status = 'finished';
    game.winner = opponent.id === game.xPlayer.id ? 'X' : 'O';
    db.games.save(game);
    
    revalidatePath(`/game/${gameId}`);

    const result = await autoForfeitOnDisconnect({
        gameId,
        playerId: forfeitingPlayerId,
        opponentId: opponent.id,
        gameState: JSON.stringify(game),
    });

    return result;
}
