# **App Name**: Tactical Tic-Tac-Toe Online

## Core Features:

- Board Rendering: Render nine local Tic-Tac-Toe boards within a global board, highlighting the active local board based on the game rules.
- Real-time Gameplay: Implement real-time move updates using WebSockets, allowing players to see their opponent's moves as they happen.
- Turn Management: Manage player turns and enforce Ultimate Tic-Tac-Toe rules, including board selection and win conditions.
- State Persistence: Implement game state persistence using Redis for fast access during active games and store match history in a Firestore database.
- Online Presence: Display an online list of available players using presence detection to determine who is available for a game.
- Room Management: Facilitate creating and joining game rooms with unique IDs for private matches between players.
- Auto-Forfeit on Disconnect: If a player disconnects unexpectedly or quits mid-game, automatically forfeit the match using a server-side cron job.

## Style Guidelines:

- Primary color: A deep blue (#3F51B5) evoking strategy and intellect.
- Background color: A very light gray (#F0F0F0) to provide a clean and unobtrusive backdrop.
- Accent color: A vibrant orange (#FF9800) to highlight interactive elements and calls to action, providing strong contrast.
- Body font: 'Inter' (sans-serif) for a modern, neutral look suitable for the user interface and in-game text. Headline font: 'Space Grotesk' (sans-serif) for headlines, to give it a modern techy style.
- Use simple, geometric icons for game pieces (X and O) and UI elements.
- Maintain a clean and organized layout with a clear distinction between the global and local boards.
- Incorporate subtle animations for player moves and game transitions to enhance user engagement.