
'use server';

import { redirect } from 'next/navigation';
import { db_firestore } from '@/lib/state';
import { createNewGame, applyMove } from '@/lib/gameLogic';
import type { Player, Game, Move } from '@/types';

export async function createGameAction(player: Player): Promise<void> {
  const gameId = Math.random().toString(36).substring(2, 9);
  const game = createNewGame(gameId, player);
  
  await db_firestore.games.forfeitPlayerGames(player.id, game.id);
  await db_firestore.games.save(game);
  redirect(`/game/${gameId}`);
}

export async function joinGameAction(gameId: string, player: Player): Promise<void> {
  const game = await db_firestore.games.find(gameId);
  if (game && game.status === 'waiting') {
    game.oPlayer = player;
    game.status = 'live';
    game.playerIds.push(player.id);
    
    await db_firestore.games.forfeitPlayerGames(player.id, game.id);

    await db_firestore.games.save(game);
  }
  redirect(`/game/${gameId}`);
}

export async function makeMoveAction(gameId: string, move: Move): Promise<{ success: boolean; message?: string }> {
  const game = await db_firestore.games.find(gameId);

  if (!game || game.status !== 'live') {
    return { success: false, message: 'Game not found or is not active.' };
  }

  const { player, localBoardIndex, cellIndex } = move;
  
  const currentPlayer = player === 'X' ? game.xPlayer : game.oPlayer;
  if (!currentPlayer) {
      return { success: false, message: 'Player not in game.' };
  }

  if (game.nextTurn !== player) {
    return { success: false, message: 'Not your turn.' };
  }

  if (game.activeLocalBoard !== null && game.activeLocalBoard !== localBoardIndex) {
    return { success: false, message: 'You must play in the indicated board.' };
  }
  
  const flatIndex = localBoardIndex * 9 + cellIndex;
  if (game.localBoards[flatIndex] !== null) {
    return { success: false, message: 'Cell already taken.' };
  }

  if (game.globalBoard[localBoardIndex] !== null) {
      return { success: false, message: 'This local board has already been decided.'}
  }

  const updatedGame = applyMove(game, move);
  await db_firestore.games.save(updatedGame);

  return { success: true };
}

export async function getGameAction(gameId: string): Promise<Game | undefined> {
  return db_firestore.games.find(gameId);
}

export async function getGamesAction(): Promise<Game[]> {
  return db_firestore.games.findAll();
}

export async function forfeitGameAction(gameId: string, playerId: string): Promise<void> {
    const game = await db_firestore.games.find(gameId);
    if (!game) return;

    if (game.status === 'waiting') {
        await db_firestore.games.delete(gameId);
        return;
    }

    if (game.status === 'live') {
        const opponent = game.xPlayer.id === playerId ? game.oPlayer : game.xPlayer;
        if(opponent) {
            game.winner = game.xPlayer.id === opponent.id ? 'O' : 'X';
        }
        game.status = 'finished';
        await db_firestore.games.save(game);
    }
}
