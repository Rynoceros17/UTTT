'use server';

/**
 * @fileOverview Handles automatic forfeit of a game if a player disconnects.
 *
 * - autoForfeitOnDisconnect - A function that handles the auto forfeit on disconnect process.
 * - AutoForfeitOnDisconnectInput - The input type for the autoForfeitOnDisconnect function.
 * - AutoForfeitOnDisconnectOutput - The return type for the autoForfeitOnDisconnect function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AutoForfeitOnDisconnectInputSchema = z.object({
  gameId: z.string().describe('The ID of the game being forfeited.'),
  playerId: z.string().describe('The ID of the player who disconnected.'),
  opponentId: z.string().describe('The ID of the player who remains connected.'),
  gameState: z.string().describe('The game state as a JSON string.'),
});
export type AutoForfeitOnDisconnectInput = z.infer<
  typeof AutoForfeitOnDisconnectInputSchema
>;

const AutoForfeitOnDisconnectOutputSchema = z.object({
  summary: z.string().describe('A summary of the game that led to the forfeit.'),
  message: z.string().describe('The message to display to the remaining player.'),
});
export type AutoForfeitOnDisconnectOutput = z.infer<
  typeof AutoForfeitOnDisconnectOutputSchema
>;

export async function autoForfeitOnDisconnect(
  input: AutoForfeitOnDisconnectInput
): Promise<AutoForfeitOnDisconnectOutput> {
  return autoForfeitOnDisconnectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoForfeitPrompt',
  input: {schema: AutoForfeitOnDisconnectInputSchema},
  output: {schema: AutoForfeitOnDisconnectOutputSchema},
  prompt: `A player has disconnected from the game. The game ID is {{gameId}}. The player who disconnected has ID {{playerId}}, and their opponent has ID {{opponentId}}. Here's the game state: {{{gameState}}}. Create a summary of the game, from the perspective of the player who remains connected, and generate a message to display to that player informing them of the forfeit. The summary should include key moments of the game and the reason for the forfeit. The message should be friendly and inform them that they have won by forfeit.

Summary:

Message:`,
});

const autoForfeitOnDisconnectFlow = ai.defineFlow(
  {
    name: 'autoForfeitOnDisconnectFlow',
    inputSchema: AutoForfeitOnDisconnectInputSchema,
    outputSchema: AutoForfeitOnDisconnectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
