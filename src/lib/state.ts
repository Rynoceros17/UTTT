import { collection, doc, getDoc, setDoc, deleteDoc, getDocs, query, where, writeBatch } from "firebase/firestore";
import type { Game, Player } from '@/types';
import { db } from './firebase'; // Import the Firestore instance

const gamesCollection = collection(db, 'games');

// This is a simple in-memory implementation.
// In a production environment, you'd replace this with a real-time database
// like Firestore for game state and a presence solution.
export const db_firestore = {
  games: {
    find: async (id: string): Promise<Game | undefined> => {
        const docRef = doc(db, 'games', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            // Firestore returns a DocumentData, we need to cast it to Game
            // We should add a converter for more safety in a real app
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
        await setDoc(docRef, game, { merge: true }); // Use merge to avoid overwriting on partial updates
        return game;
    },
    delete: async (id: string): Promise<boolean> => {
        const docRef = doc(db, 'games', id);
        await deleteDoc(docRef);
        return true; // Assume success if no error is thrown
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
                const opponent = game.xPlayer.id === playerId ? game.oPlayer : game.xPlayer;
                if(opponent) {
                    game.winner = game.xPlayer.id === opponent.id ? 'O' : 'X';
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
    // Player logic would go here, e.g., storing player profiles.
    // For now, player data is embedded in the game documents.
    find: (id: string) => { throw new Error("Not implemented")},
    findAll: () => { throw new Error("Not implemented")},
    save: (player: Player) => { throw new Error("Not implemented")},
  },
};
