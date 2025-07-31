
import { GameRoom } from "@/components/GameRoom";

export default async function GamePage({ params }: { params: { gameId: string } }) {
  return <GameRoom gameId={params.gameId} />;
}
