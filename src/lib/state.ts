
import type { Game, Player } from '@/types';

// In-memory store to simulate Redis (ephemeral) + Firestore (persistent)
const games = new Map<string, Game>();
const players = new Map<string, Player>();

// This is a simple in-memory implementation. 
// In a production environment, you'd replace this with a real-time database 
// like Firestore for game state and a presence solution.
export const db = {
  games: {
    find: (id: string): Game | undefined => games.get(id),
    findAll: (): Game[] => Array.from(games.values()),
    save: (game: Game): Game => {
      games.set(game.id, game);
      return game;
    },
    delete: (id: string): boolean => games.delete(id),
  },
  players: {
    find: (id: string) => players.get(id),
    findAll: () => Array.from(players.values()),
    save: (player: Player) => {
        players.set(player.id, player);
        return player;
    }
  },
};
