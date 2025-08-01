
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Swords, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { RulesDialog } from './RulesDialog';

interface StatsProps {
    totalGames: number;
    totalPlayers: number;
}

export function Stats({ totalGames, totalPlayers }: StatsProps) {
    const [isRulesOpen, setRulesOpen] = React.useState(false);

    return (
        <>
        <RulesDialog isOpen={isRulesOpen} onOpenChange={setRulesOpen} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalPlayers}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                    <Swords className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalGames}</div>
                </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2 flex items-center justify-center p-6">
                 <Button onClick={() => setRulesOpen(true)} className="w-full h-full text-lg">
                    <BookOpen className="mr-2 h-5 w-5" />
                    View Game Rules
                </Button>
            </Card>
        </div>
        </>
    )
}
