import type { Game, Player } from '@/types';

// In-memory store to simulate a database
const games = new Map<string, Game>();
const players = new Map<string, Player>();

export const db = {
  games: {
    find: (id: string) => games.get(id),
    findAll: () => Array.from(games.values()),
    save: (game: Game) => games.set(game.id, game),
    delete: (id: string) => games.delete(id),
  },
  players: {
    find: (id: string) => players.get(id),
    findAll: () => Array.from(players.values()),
    save: (player: Player) => players.set(player.id, player),
  },
};
