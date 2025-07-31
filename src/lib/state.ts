
import { collection, doc, getDoc, setDoc, deleteDoc, getDocs, query, where, writeBatch, runTransaction } from "firebase/firestore";
import type { Game, Player } from '@/types';
import { db } from './firebase'; // Import the Firestore instance

const gamesCollection = collection(db, 'games');
const playersCollection = collection(db, 'players');

export const db_firestore = {
  games: {
    find: async (id: string): Promise<Game | undefined> => {
        const docRef = doc(db, 'games', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as Game;
        }
        return undefined;
    },
    findAll: async (): Promise<Game[]> => {
        const querySnapshot = await getDocs(gamesCollection);
        return querySnapshot.docs.map(doc => doc.data() as Game);
    },
    save: async (game: Game): Promise<Game> => {
        const docRef = doc(db, 'games', game.id);
        await setDoc(docRef, game, { merge: true });
        return game;
    },
    delete: async (id: string): Promise<boolean> => {
        const docRef = doc(db, 'games', id);
        await deleteDoc(docRef);
        return true;
    },
    findPlayerGames: async (playerId: string): Promise<Game[]> => {
        const q = query(collection(db, "games"), where("status", "==", "live"), where("playerIds", "array-contains", playerId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as Game);
    },
    forfeitPlayerGames: async (playerId: string, currentGameId: string): Promise<void> => {
        const gamesToForfeit = await db_firestore.games.findPlayerGames(playerId);
        
        for (const game of gamesToForfeit) {
            if (game.id !== currentGameId && game.oPlayer) {
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
    }
  },
  players: {
    find: async (uid: string): Promise<Player | undefined> => {
        const docRef = doc(db, 'players', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as Player;
        }
        return undefined;
    },
    findAll: async (): Promise<Player[]> => {
        const querySnapshot = await getDocs(playersCollection);
        return querySnapshot.docs.map(doc => doc.data() as Player);
    },
    save: async (player: Player): Promise<Player> => {
        const docRef = doc(db, 'players', player.uid);
        await setDoc(docRef, player, { merge: true });
        return player;
    },
  },
};
