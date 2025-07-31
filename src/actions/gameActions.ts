
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

export async function joinGameAction(gameId: string, player: Player): Promise<{success: boolean, message?: string}> {
    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'games', gameId);
            const gameDoc = await transaction.get(gameRef);

            if (!gameDoc.exists() || gameDoc.data().status !== 'waiting') {
                throw new Error("Game not available to join.");
            }
            
            const game = gameDoc.data() as Game;

            if (game.xPlayer.uid === player.uid) {
                throw new Error("You cannot join your own game.");
            }

            // Forfeit other games the player might be in
            await db_firestore.games.forfeitPlayerGames(player.uid, game.id);
            
            transaction.update(gameRef, {
                oPlayer: player,
                status: 'live',
                playerIds: [...game.playerIds, player.uid]
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error joining game:", error);
        return { success: false, message: error.message };
    }
}

export async function makeMoveAction(gameId: string, move: Move): Promise<{ success: boolean; game?: Game; message?: string }> {
  try {
    const updatedGame = await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'games', gameId);
        const gameDoc = await transaction.get(gameRef);

        if (!gameDoc.exists()) {
            throw new Error('Game not found.');
        }

        const game = gameDoc.data() as Game;

        if (game.status !== 'live') {
            throw new Error('Game is not active.');
        }

        const { player, localBoardIndex, cellIndex } = move;
        
        const currentPlayer = player === 'X' ? game.xPlayer : game.oPlayer;
        if (!currentPlayer) {
            throw new Error('Player not in game.');
        }

        if (game.nextTurn !== player) {
            throw new Error('Not your turn.');
        }

        if (game.activeLocalBoard !== null && game.activeLocalBoard !== localBoardIndex) {
            throw new Error('You must play in the indicated board.');
        }
        
        const flatIndex = localBoardIndex * 9 + cellIndex;
        if (game.localBoards[flatIndex] !== null) {
            throw new Error('Cell already taken.');
        }

        if (game.globalBoard[localBoardIndex] !== null) {
            throw new Error('This local board has already been decided.');
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
                throw new Error("A player in the game does not exist!");
            }
            
            const winnerData = winnerDoc.data();
            const loserData = loserDoc.data();
            
            transaction.update(winnerRef, { wins: (winnerData.wins || 0) + 1 });
            transaction.update(loserRef, { losses: (loserData.losses || 0) + 1 });
        }
        
        transaction.set(gameRef, newGameState);
        return newGameState;
    });
    return { success: true, game: updatedGame as Game };
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
    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'games', gameId);
            const gameDoc = await transaction.get(gameRef);

            if (!gameDoc.exists()) return;

            const game = gameDoc.data() as Game;

            if (game.status === 'finished') return;

            if (game.status === 'waiting') {
                transaction.delete(gameRef);
                return;
            }

            if (game.status === 'live' && game.oPlayer) {
                const winner = game.xPlayer.uid === playerId ? game.oPlayer! : game.xPlayer;
                const loser = game.xPlayer.uid === playerId ? game.xPlayer : game.oPlayer!;

                const winnerRef = doc(db, 'players', winner.uid);
                const loserRef = doc(db, 'players', loser.uid);

                const [winnerDoc, loserDoc] = await Promise.all([
                    transaction.get(winnerRef),
                    transaction.get(loserRef)
                ]);

                if (!winnerDoc.exists() || !loserDoc.exists()) {
                    throw new Error("A player in the game does not exist!");
                }
                
                const newWinnerData = { ...winnerDoc.data(), wins: (winnerDoc.data().wins || 0) + 1 };
                const newLoserData = { ...loserDoc.data(), losses: (loserDoc.data().losses || 0) + 1 };

                transaction.update(winnerRef, { wins: newWinnerData.wins });
                transaction.update(loserRef, { losses: newLoserData.losses });
                transaction.update(gameRef, { 
                    status: 'finished',
                    winner: game.xPlayer.uid === winner.uid ? 'X' : 'O'
                });
            }
        });
    } catch (error) {
        console.error("Failed to forfeit game:", error);
    }
}
