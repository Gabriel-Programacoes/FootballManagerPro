"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, List, LayoutGrid, Star, UserCheck, UserCog, Gem, Shield } from "lucide-react";
import { Player } from "@/data/player-data";
import { formatCompactNumber } from "@/lib/utils";
import { PlayerDetailModal } from "@/components/player-detail-modal";
import { useCareer } from "@/contexts/career-context";

// --- FUNÇÕES HELPER ---
type PositionDetails = {
    group: 'GOL' | 'DEF' | 'MEIO' | 'ATA';
    color: string;
};

const getPositionDetails = (position: Player['position']): PositionDetails => {
    switch (position) {
        case "GOL":
            return { group: 'GOL', color: "bg-yellow-500 hover:bg-yellow-600 text-black" };
        case "LE":
        case "ZAG":
        case "LD":
            return { group: 'DEF', color: "bg-blue-500 hover:bg-blue-600" };
        case "VOL":
        case "ME":
        case "MD":
        case "MC":
        case "MAT":
            return { group: 'MEIO', color: "bg-green-500 hover:bg-green-600" };
        default:
            return { group: 'ATA', color: "bg-red-500 hover:bg-red-600" };
    }
};

const getPlayerStatus = (overall: number) => {
    if (overall >= 85) return { text: "Estrela", icon: <Star className="h-4 w-4 text-yellow-400" />, variant: "default" as const };
    if (overall >= 80) return { text: "Titular", icon: <UserCheck className="h-4 w-4 text-green-400" />, variant: "default" as const };
    if (overall >= 75) return { text: "Rotação", icon: <UserCog className="h-4 w-4 text-blue-400" />, variant: "secondary" as const};
    if (overall >= 70) return { text: "Promessa", icon: <Gem className="h-4 w-4 text-purple-400" />, variant: "outline" as const};
    return { text: "Reserva", icon: <Shield className="h-4 w-4 text-gray-400" />, variant: "outline" as const};
}

// --- COMPONENTE ---
export default function SquadPage() {
    const { managedClub, playersInClub } = useCareer();

    const [searchTerm, setSearchTerm] = useState("");
    const [positionFilter, setPositionFilter] = useState("all");
    const [sortOption, setSortOption] = useState("overall_desc");
    const [layout, setLayout] = useState<"grid" | "list">("grid");
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    const filteredAndSortedPlayers = useMemo(() => {
        if (!playersInClub) return [];

        const players = [...playersInClub]
            .filter((player) =>
                player.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter((player) => {
                if (positionFilter === "all") return true;
                return getPositionDetails(player.position).group === positionFilter;
            });

        players.sort((a, b) => {
            switch (sortOption) {
                case "overall_desc": return b.overall - a.overall;
                case "overall_asc": return a.overall - b.overall;
                case "age_asc": return a.age - b.age;
                case "age_desc": return b.age - a.age;
                case "value_desc": return b.contract.value - a.contract.value;
                case "name_asc": return a.name.localeCompare(b.name);
                default: return 0;
            }
        });

        return players;
    }, [playersInClub, searchTerm, positionFilter, sortOption]);

    const handlePlayerClick = (player: Player) => {
        setSelectedPlayer(player);
    };

    if (!managedClub) {
        return <div>Carregando informações do clube... Ou selecione um clube para começar.</div>
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Elenco - {managedClub.name}</h1>
                        <p className="text-muted-foreground">Gerencie os {playersInClub.length} jogadores do seu time.</p>
                    </div>
                    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 items-center gap-2">
                            <div className="relative w-full flex-1 md:grow-0">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar por nome..."
                                    className="w-full pl-8 md:w-[200px] lg:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={positionFilter} onValueChange={setPositionFilter}>
                                <SelectTrigger className="w-auto">
                                    <SelectValue placeholder="Posição" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas Posições</SelectItem>
                                    <SelectItem value="GOL">Goleiros</SelectItem>
                                    <SelectItem value="DEF">Defensores</SelectItem>
                                    <SelectItem value="MEIO">Meio-campistas</SelectItem>
                                    <SelectItem value="ATA">Atacantes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={sortOption} onValueChange={setSortOption}>
                                <SelectTrigger className="w-auto">
                                    <SelectValue placeholder="Ordenar por" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="overall_desc">Overall (Maior)</SelectItem>
                                    <SelectItem value="overall_asc">Overall (Menor)</SelectItem>
                                    <SelectItem value="age_asc">Idade (Menor)</SelectItem>
                                    <SelectItem value="age_desc">Idade (Maior)</SelectItem>
                                    <SelectItem value="value_desc">Valor (Maior)</SelectItem>
                                    <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                                <Button variant={layout === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setLayout('grid')}>
                                    <LayoutGrid className="h-5 w-5" />
                                </Button>
                                <Button variant={layout === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setLayout('list')}>
                                    <List className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {layout === 'grid' ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredAndSortedPlayers.map((player) => {
                            const positionDetails = getPositionDetails(player.position);
                            return (
                                <Card key={player.id} className="flex cursor-pointer flex-col transition-all hover:shadow-lg hover:border-primary/50" onClick={() => handlePlayerClick(player)}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 pr-2">
                                                <CardTitle className="text-xl truncate">{player.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground">Idade: {player.age}</p>
                                            </div>
                                            <Badge className={positionDetails.color}>{player.position}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4">
                                        <div className="flex items-end justify-between text-sm">
                                            <span className="text-muted-foreground">Overall</span>
                                            <span className="font-bold text-3xl leading-none">{player.overall}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                                            <div className="flex justify-between">
                                                <span>Valor:</span>
                                                <span className="font-mono">€ {formatCompactNumber(player.contract.value)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Salário/sem:</span>
                                                <span className="font-mono">€ {formatCompactNumber(player.contract.wage)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Jogador</TableHead>
                                    <TableHead>Pos.</TableHead>
                                    <TableHead>Idade</TableHead>
                                    <TableHead>Overall</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedPlayers.map((player) => {
                                    const positionDetails = getPositionDetails(player.position);
                                    const playerStatus = getPlayerStatus(player.overall);
                                    return (
                                        <TableRow key={player.id} className="cursor-pointer hover:bg-muted" onClick={() => handlePlayerClick(player)}>
                                            <TableCell className="font-medium">{player.name}</TableCell>
                                            <TableCell>
                                                <Badge className={positionDetails.color}>{player.position}</Badge>
                                            </TableCell>
                                            <TableCell>{player.age}</TableCell>
                                            <TableCell className="font-semibold">{player.overall}</TableCell>
                                            <TableCell>
                                                <Badge variant={playerStatus.variant} className="flex w-fit items-center gap-1">
                                                    {playerStatus.icon}
                                                    {playerStatus.text}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                € {formatCompactNumber(player.contract.value)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>

            <PlayerDetailModal
                player={selectedPlayer}
                isOpen={!!selectedPlayer}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedPlayer(null);
                    }
                }}
            />
        </>
    );
}