import { GameRoom } from "@/components/GameRoom";

export default function GamePage({ params }: { params: { gameId: string } }) {
  return <GameRoom gameId={params.gameId} />;
}
