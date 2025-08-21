"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Home, Pencil, Trash2, Loader2, Star, Eye, UserPlus, Filter, Search, DollarSign, Handshake, ShieldX } from 'lucide-react';
import { useCareer } from "@/contexts/career-context";
import { Player } from "@/app/squad/page";
import { formatCompactNumber, translatePosition, getPositionDetails } from "@/lib/utils";
import { ListTransferModal } from "@/components/list-transfer-modal";
import { PlayerTransferDetailModal } from "@/components/player-transfer-detail-modal";
import { TransferListing } from "@/lib/game-data";

type ListedPlayer = Player & TransferListing;

const EmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="text-center py-12">
        <Icon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

const getPriceCategory = (value: number): 'low' | 'medium' | 'high' => {
    if (value < 10_000_000) return 'low';
    if (value >= 10_000_000 && value < 50_000_000) return 'medium';
    return 'high';
};

export default function TransfersPage() {
    const { activeCareer, getPlayerSquad, listPlayerForTransfer, unlistPlayerForTransfer, isLoading: isCareerLoading } = useCareer();

    const [squad, setSquad] = useState<Player[]>([]);
    const [isLoadingSquad, setIsLoadingSquad] = useState(true);
    const [playerToEdit, setPlayerToEdit] = useState<ListedPlayer | null>(null);

    const [marketPlayers, setMarketPlayers] = useState<Player[]>([]);
    const [isLoadingMarket, setIsLoadingMarket] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [positionFilter, setPositionFilter] = useState("all");
    const [priceFilter, setPriceFilter] = useState("all");
    const [playerForDetail, setPlayerForDetail] = useState<Player | null>(null);

    const [activeTab, setActiveTab] = useState("market");

    useEffect(() => {
        if (!isCareerLoading && activeCareer) {
            // Carrega o plantel do utilizador para o separador "Meu Clube"
            const loadMySquad = async () => {
                setIsLoadingSquad(true);
                const playerSquad = await getPlayerSquad();
                setSquad(playerSquad);
                setIsLoadingSquad(false);
            };

            // Carrega os jogadores de outros clubes para o separador "Mercado"
            const loadMarket = async () => {
                setIsLoadingMarket(true);
                try {
                    const response = await fetch(`/api/market?excludeClubId=${activeCareer.clubId}`);
                    if (!response.ok) throw new Error("Falha ao carregar o mercado.");
                    const data = await response.json();
                    setMarketPlayers(data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsLoadingMarket(false);
                }
            };

            loadMySquad();
            loadMarket();
        }
    }, [isCareerLoading, activeCareer, getPlayerSquad]);

    const listedPlayers = useMemo((): ListedPlayer[] => {
        if (!activeCareer || squad.length === 0) return [];
        return activeCareer.transferList.map(listing => {
            const playerDetails = squad.find(p => p.id === listing.playerId);
            return { ...playerDetails, ...listing } as ListedPlayer;
        }).filter(p => p.id);
    }, [activeCareer, squad]);

    const filteredMarketPlayers = useMemo(() => {
        return marketPlayers
            .filter(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(player => {
                if (positionFilter === 'all') return true;
                return getPositionDetails(translatePosition(player.position)).group === positionFilter;
            })
            .filter(player => {
                if (priceFilter === 'all') return true;
                return getPriceCategory(player.contract.value) === priceFilter;
            });
    }, [marketPlayers, searchTerm, positionFilter, priceFilter]);

    if (isCareerLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Handshake className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Central de Transferências</h1>
                        <p className="text-muted-foreground">Gerencie o mercado para o {activeCareer?.clubName}</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="market"><Search className="w-4 h-4 mr-2"/>Mercado</TabsTrigger>
                        <TabsTrigger value="my-club"><Home className="w-4 h-4 mr-2" />Meu Clube</TabsTrigger>
                    </TabsList>

                    {/* Separador "Meu Clube" */}
                    <TabsContent value="my-club" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Jogadores Listados ({listedPlayers.length})</CardTitle>
                                <CardDescription>Jogadores do seu clube que estão atualmente no mercado.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {listedPlayers.length === 0 ? (
                                    <EmptyState icon={ShieldX} title="Nenhum Jogador no Mercado" description="Liste um jogador para venda ou empréstimo a partir do ecrã de elenco."/>
                                ) : (
                                    <div className="space-y-4">
                                        {listedPlayers.map((player) => (
                                            <Card key={player.id} className="shadow-none border hover:border-primary/50 transition-colors">
                                                <CardContent className="p-4 grid grid-cols-[auto_1fr_auto] items-center gap-4">
                                                    <Avatar className="h-12 w-12"><AvatarFallback>{player.name?.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                                                    <div className="flex-grow">
                                                        <h3 className="font-semibold">{player.name}</h3>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Badge variant="outline">{translatePosition(player.position)}</Badge>
                                                            <span>{player.age} anos</span>
                                                            <span className="flex items-center"><Star className="h-3 w-3 mr-1 text-yellow-500"/>{player.overall}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg text-green-500">€ {formatCompactNumber(player.askingPrice)}</p>
                                                        <p className="text-xs text-muted-foreground">Preço Pedido</p>
                                                    </div>
                                                    <div className="col-span-3 flex justify-end items-center space-x-2 border-t pt-3 mt-3">
                                                        <Button variant="outline" size="sm" onClick={() => setPlayerToEdit(player)}>
                                                            <Pencil className="h-4 w-4 mr-1" />Editar
                                                        </Button>
                                                        <Button variant="destructive" size="sm" onClick={() => unlistPlayerForTransfer(player.id)}>
                                                            <Trash2 className="h-4 w-4 mr-1" />Remover
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Separador "Mercado" */}
                    <TabsContent value="market" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/>Filtros de Busca no Mercado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Buscar por jogador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10"/>
                                    </div>
                                    <div>
                                        <Select value={positionFilter} onValueChange={setPositionFilter}>
                                            <SelectTrigger className="w-full"><SelectValue placeholder="Posição" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                <SelectItem value="GOL">GOL</SelectItem>
                                                <SelectItem value="DEF">DEF</SelectItem>
                                                <SelectItem value="MEIO">MEI</SelectItem>
                                                <SelectItem value="ATA">ATA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Select value={priceFilter} onValueChange={setPriceFilter}>
                                            <SelectTrigger className="w-full"><SelectValue placeholder="Faixa de Preço" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                <SelectItem value="low">Abaixo de €10M</SelectItem>
                                                <SelectItem value="medium">€10M - €50M</SelectItem>
                                                <SelectItem value="high">Acima de €50M</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {isLoadingMarket ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : (
                            <div className="grid gap-4">
                                <p className="text-sm text-muted-foreground">{filteredMarketPlayers.length} jogadores encontrados.</p>
                                {filteredMarketPlayers.map((player) => (
                                    <Card key={player.id} className="shadow-none border">
                                        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-grow">
                                                <Avatar className="h-12 w-12"><AvatarFallback>{player.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                                                <div>
                                                    <h3 className="font-semibold">{player.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{player.attributes.profile.team}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm w-full sm:w-auto">
                                                <div className="flex items-center gap-1 text-muted-foreground"><Star className="h-4 w-4 text-yellow-500"/> <span className="font-bold text-foreground">{player.overall}</span></div>
                                                <Separator orientation="vertical" className="h-6"/>
                                                <div className="flex items-center gap-1 text-muted-foreground"><DollarSign className="h-4 w-4 text-green-500"/> <span className="font-bold text-foreground">{formatCompactNumber(player.contract.value)}</span></div>
                                            </div>
                                            <div className="flex items-center space-x-2 self-end sm:self-center">
                                                <Button variant="outline" size="sm" onClick={() => setPlayerForDetail(player)}><Eye className="h-4 w-4 mr-1" />Detalhes</Button>
                                                <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Fazer Oferta</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <ListTransferModal
                player={playerToEdit as Player}
                isOpen={!!playerToEdit}
                onOpenChange={(isOpen) => !isOpen && setPlayerToEdit(null)}
                onConfirm={listPlayerForTransfer}
            />
            <PlayerTransferDetailModal
                player={playerForDetail}
                isOpen={!!playerForDetail}
                onOpenChange={(isOpen: boolean) => !isOpen && setPlayerForDetail(null)}
            />
        </>
    );
}