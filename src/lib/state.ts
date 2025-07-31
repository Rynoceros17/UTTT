
import { collection, doc, getDoc, setDoc, deleteDoc, getDocs, query, where, writeBatch } from "firebase/firestore";
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
        const batch = writeBatch(db);

        for (const game of gamesToForfeit) {
            if (game.id !== currentGameId) {
                const opponent = game.xPlayer.uid === playerId ? game.oPlayer : game.xPlayer;
                if(opponent) {
                    game.winner = game.xPlayer.uid === opponent.uid ? 'O' : 'X';
                }
                game.status = 'finished';
                const gameRef = doc(db, 'games', game.id);
                batch.set(gameRef, game);
            }
        }
        await batch.commit();
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
    save: async (player: Player): Promise<Player> => {
        const docRef = doc(db, 'players', player.uid);
        await setDoc(docRef, player, { merge: true });
        return player;
    },
  },
};
