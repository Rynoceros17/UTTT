
'use client';

import type { Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Shield, Minus } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';
import * as React from 'react';

interface LeaderboardProps {
    players: Player[];
}

export function Leaderboard({ players }: LeaderboardProps) {
    const sortedPlayers = React.useMemo(() => {
        return [...players].sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    }, [players]);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Trophy className="text-yellow-500" />
                    Leaderboard
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Rank</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-center">Wins</TableHead>
                            <TableHead className="text-center">Losses</TableHead>
                            <TableHead className="text-center">W/L Ratio</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedPlayers.map((player, index) => (
                            <TableRow key={player.uid}>
                                <TableCell className="font-bold text-lg text-center">
                                    {index === 0 && <Trophy className="w-6 h-6 inline-block text-yellow-400" />}
                                    {index === 1 && <Trophy className="w-6 h-6 inline-block text-gray-400" />}
                                    {index === 2 && <Trophy className="w-6 h-6 inline-block text-orange-400" />}
                                    {index > 2 && index + 1}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <PlayerAvatar player={player} className="w-10 h-10" />
                                        <span className="font-semibold">{player.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center text-green-500 font-semibold">{player.wins}</TableCell>
                                <TableCell className="text-center text-destructive font-semibold">{player.losses}</TableCell>
                                <TableCell className="text-center font-mono">
                                    {(player.wins / (player.losses || 1)).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
