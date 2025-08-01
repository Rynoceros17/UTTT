
'use server';

import { redirect } from 'next/navigation';
import { db_firestore } from '@/lib/state';
import { createNewGame, applyMove } from '@/lib/gameLogic';
import type { Player, Game, Move, ChatMessage, PlayerSymbol } from '@/types';
import { runTransaction, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function createGameAction(player: Player, timeLimit?: number): Promise<string> {
  const gameId = Math.random().toString(36).substring(2, 9);
  const game = createNewGame(gameId, player, timeLimit);
  
  // Forfeit any of the player's live games
  await db_firestore.games.forfeitPlayerGames(player.uid, game.id);
  // Delete any of the player's waiting games
  await db_firestore.games.deleteWaitingGamesForPlayer(player.uid);
  
  await db_firestore.games.save(game);
  return gameId;
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
                // This case should be handled by client-side logic disabling the button,
                // but we add a server-side check for robustness.
                // This is not an error, just prevents joining.
                return;
            }

            // Forfeit other games the player might be in
            await db_firestore.games.forfeitPlayerGames(player.uid, game.id);
            
            const updateData: Partial<Game> = {
                oPlayer: player,
                status: 'live',
                playerIds: [...game.playerIds, player.uid]
            };

            if (game.timeLimit) {
                updateData.lastMoveTimestamp = Date.now();
            }

            transaction.update(gameRef, updateData);
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

export async function sendChatMessageAction(gameId: string, message: Omit<ChatMessage, 'timestamp'>): Promise<{success: boolean}> {
    try {
        const gameRef = doc(db, 'games', gameId);
        const newMessage: ChatMessage = {
            ...message,
            timestamp: Date.now()
        };
        await updateDoc(gameRef, {
            chat: arrayUnion(newMessage)
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending chat message:", error);
        return { success: false };
    }
}

export async function requestRematchAction(gameId: string, playerId: string): Promise<{ success: boolean; message?: string }> {
    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'games', gameId);
            const gameDoc = await transaction.get(gameRef);

            if (!gameDoc.exists() || gameDoc.data().status !== 'finished') {
                throw new Error("Game is not finished or does not exist.");
            }

            const game = gameDoc.data() as Game;
            const currentRequests = game.rematchRequestedBy || [];
            
            if (currentRequests.includes(playerId)) {
                return;
            }

            const newRequests = [...currentRequests, playerId];
            transaction.update(gameRef, { rematchRequestedBy: newRequests });

            const playerIds = [game.xPlayer.uid, game.oPlayer?.uid].filter(Boolean) as string[];

            if (playerIds.every(pid => newRequests.includes(pid))) {
                const newId = Math.random().toString(36).substring(2, 9);
                const isXPlayerFirst = Math.random() < 0.5;
                const player1 = game.xPlayer;
                const player2 = game.oPlayer!;

                const newGame = createNewGame(newId, isXPlayerFirst ? player1 : player2, game.timeLimit);
                newGame.oPlayer = isXPlayerFirst ? player2 : player1;
                newGame.status = 'live';
                newGame.playerIds = [player1.uid, player2.uid];
                 if (newGame.timeLimit) {
                    newGame.lastMoveTimestamp = Date.now();
                }

                const newGameRef = doc(db, 'games', newId);
                transaction.set(newGameRef, newGame);
                
                // Set nextGameId on the old game document
                transaction.update(gameRef, { nextGameId: newId });
            }
        });

        return { success: true };

    } catch (error: any)
 {
        console.error("Error requesting rematch:", error);
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

export async function timeoutGameAction(gameId: string, timedOutPlayerSymbol: 'X' | 'O'): Promise<void> {
    try {
        await runTransaction(db, async (transaction) => {
            const gameRef = doc(db, 'games', gameId);
            const gameDoc = await transaction.get(gameRef);

            if (!gameDoc.exists()) return;

            const game = gameDoc.data() as Game;
            if (game.status !== 'live' || !game.oPlayer) return;

            const xWins = game.globalBoard.filter(c => c === 'X').length;
            const oWins = game.globalBoard.filter(c => c === 'O').length;

            let winnerSymbol: PlayerSymbol | 'D';

            if (timedOutPlayerSymbol === 'X') {
                winnerSymbol = oWins > xWins ? 'O' : 'D';
            } else {
                winnerSymbol = xWins > oWins ? 'X' : 'D';
            }

            const winner = winnerSymbol === 'X' ? game.xPlayer : game.oPlayer;
            const loser = winnerSymbol === 'X' ? game.oPlayer : game.xPlayer;

            if (winnerSymbol !== 'D') {
                 const winnerRef = doc(db, 'players', winner.uid);
                 const loserRef = doc(db, 'players', loser.uid);
                 
                 const winnerDoc = await transaction.get(winnerRef);
                 const loserDoc = await transaction.get(loserRef);

                 if (winnerDoc.exists() && loserDoc.exists()) {
                     transaction.update(winnerRef, { wins: (winnerDoc.data()?.wins || 0) + 1 });
                     transaction.update(loserRef, { losses: (loserDoc.data()?.losses || 0) + 1 });
                 }
            }

            transaction.update(gameRef, {
                status: 'finished',
                winner: winnerSymbol,
                winReason: 'timeout'
            });
        });
    } catch (error) {
        console.error("Error processing game timeout:", error);
    }
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

            const moveCount = game.localBoards.filter(c => c !== null).length;
            if (moveCount < 18) {
                // Not enough moves, just delete the game, no win/loss
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
                     transaction.update(gameRef, { 
                        status: 'finished',
                        winner: game.xPlayer.uid === winner.uid ? 'X' : 'O'
                    });
                    return;
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
