
'use server';

import { redirect } from 'next/navigation';
import { db_firestore } from '@/lib/state';
import { createNewGame, applyMove } from '@/lib/gameLogic';
import type { Player, Game, Move } from '@/types';
import { runTransaction, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function createGameAction(player: Player): Promise<void> {
  const gameId = Math.random().toString(36).substring(2, 9);
  const game = createNewGame(gameId, player);
  
  await db_firestore.games.forfeitPlayerGames(player.uid, game.id);
  await db_firestore.games.save(game);
  redirect(`/game/${gameId}`);
}

export async function joinGameAction(gameId: string, player: Player): Promise<void> {
  const game = await db_firestore.games.find(gameId);
  if (game && game.status === 'waiting') {
    game.oPlayer = player;
    game.status = 'live';
    game.playerIds.push(player.uid);
    
    await db_firestore.games.forfeitPlayerGames(player.uid, game.id);

    await db_firestore.games.save(game);
    redirect(`/game/${gameId}`);
  }
}

export async function makeMoveAction(gameId: string, move: Move): Promise<{ success: boolean; message?: string }> {
  try {
    const updatedGame = await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'games', gameId);
        const gameDoc = await transaction.get(gameRef);

        if (!gameDoc.exists()) {
            throw new Error('Game not found.');
        }

        const game = gameDoc.data() as Game;

        if (game.status !== 'live') {
            return { success: false, message: 'Game is not active.' };
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

        const newGameState = applyMove(game, move);
        
        if (newGameState.status === 'finished' && newGameState.winner && newGameState.winner !== 'D' && newGameState.oPlayer) {
            const winner = newGameState.winner === 'X' ? newGameState.xPlayer : newGameState.oPlayer;
            const loser = newGameState.winner === 'X' ? newGameState.oPlayer : newGameState.xPlayer;

            const winnerRef = doc(db, 'players', winner.uid);
            const loserRef = doc(db, 'players', loser.uid);

            const winnerDoc = await transaction.get(winnerRef);
            const loserDoc = await transaction.get(loserRef);
            
            if (!winnerDoc.exists() || !loserDoc.exists()) {
                throw "A player in the game does not exist!";
            }
            
            const winnerData = winnerDoc.data();
            const loserData = loserDoc.data();
            
            transaction.update(winnerRef, { wins: (winnerData.wins || 0) + 1 });
            transaction.update(loserRef, { losses: (loserData.losses || 0) + 1 });
        }
        
        transaction.set(gameRef, newGameState);
        return newGameState;
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error making move:", error);
    return { success: false, message: error.message };
  }
}

export async function getGameAction(gameId: string): Promise<Game | undefined> {
  return db_firestore.games.find(gameId);
}

export async function getGamesAction(): Promise<Game[]> {
  return db_firestore.games.findAll();
}

export async function getPlayersAction(): Promise<Player[]> {
  return db_firestore.players.findAll();
}

export async function forfeitGameAction(gameId: string, playerId: string): Promise<void> {
    const game = await db_firestore.games.find(gameId);
    if (!game) return;

    if (game.status === 'waiting') {
        await db_firestore.games.delete(gameId);
        return;
    }

    if (game.status === 'live' && game.oPlayer) {
        await runTransaction(db, async (transaction) => {
            const winner = game.xPlayer.uid === playerId ? game.oPlayer! : game.xPlayer;
            const loser = game.xPlayer.uid === playerId ? game.xPlayer : game.oPlayer!;

            const winnerRef = doc(db, 'players', winner.uid);
            const loserRef = doc(db, 'players', loser.uid);

            const [winnerDoc, loserDoc] = await Promise.all([
                transaction.get(winnerRef),
                transaction.get(loserRef)
            ]);

            if (!winnerDoc.exists() || !loserDoc.exists()) {
                throw "A player in the game does not exist!";
            }
            
            const newWinnerData = { ...winnerDoc.data(), wins: (winnerDoc.data().wins || 0) + 1 };
            const newLoserData = { ...loserDoc.data(), losses: (loserDoc.data().losses || 0) + 1 };

            transaction.update(winnerRef, { wins: newWinnerData.wins });
            transaction.update(loserRef, { losses: newLoserData.losses });

            const gameRef = doc(db, 'games', game.id);
            transaction.update(gameRef, { 
                status: 'finished',
                winner: game.xPlayer.uid === winner.uid ? 'X' : 'O'
            });
        });
    }
}
