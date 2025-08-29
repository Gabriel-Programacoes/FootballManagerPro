
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
    Home,
    Pencil,
    Trash2,
    Loader2,
    Star,
    Eye,
    UserPlus,
    Filter,
    Search,
    DollarSign,
    Handshake,
    ShieldX,
    Briefcase,
    MessagesSquare,
    FileSearch, Send, Users, RotateCcw, XCircle, ChevronDown, Clock, Repeat, Percent
} from 'lucide-react';
import { useCareer } from "@/contexts/career-context";
import { Player } from "@/app/squad/page";
import { MakeOfferModal } from "@/components/make-offer-modal";
import { Offer } from "@/lib/game-data";
import { formatCompactNumber, translatePosition, getPositionDetails } from "@/lib/utils";
import { ListTransferModal } from "@/components/list-transfer-modal";
import { PlayerTransferDetailModal } from "@/components/player-transfer-detail-modal";
import {Scout, TransferListing} from "@/lib/game-data";
import { NegotiationDetailModal } from "@/components/negotiation-detail-modal";
import { HireScoutModal } from "@/components/hire-scout-modal";
import {Country} from "@/app/team-select/page";
import {
    AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { AlertDialog } from "@/components/ui/alert-dialog";

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
    const {
        activeCareer,
        listPlayerForTransfer,
        unlistPlayerForTransfer,
        startNegotiation,
        sendScoutOnMission,
        isLoading: isCareerLoading, recallScout, fireScout, hireScout,
        squad,
    } = useCareer();

    const [playerToEdit, setPlayerToEdit] = useState<ListedPlayer | null>(null);

    const [freeAgents, setFreeAgents] = useState<Player[]>([]);
    const [isLoadingMarket, setIsLoadingMarket] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [positionFilter, setPositionFilter] = useState("all");
    const [priceFilter, setPriceFilter] = useState("all");

    const [playerToNegotiate, setPlayerToNegotiate] = useState<Player | null>(null);
    const [playerForDetail, setPlayerForDetail] = useState<Player | null>(null);
    const [negotiationForDetail, setNegotiationForDetail] = useState<any | null>(null);

    const [activeTab, setActiveTab] = useState("scouting");

    const [countriesData, setCountriesData] = useState<Country[]>([]);

    const [isHireScoutModalOpen, setIsHireScoutModalOpen] = useState(false); // Estado para o modal

    useEffect(() => {
        const fetchFilterData = async () => {
            const response = await fetch('/api/countries');
            const data = await response.json();
            setCountriesData(data);
        };
        fetchFilterData();
    }, []);

    const [missionForm, setMissionForm] = useState({
        scoutId: undefined as string | undefined,
        country: "any",
        leagueName: "any",
        position: "any",
    });

    const handleStartNegotiation = (offer: Omit<Offer, 'date' | 'offeredBy'>) => {
        if (!playerToNegotiate) return;
        startNegotiation(playerToNegotiate, offer);
        setActiveTab('negotiations');
    };

    const handleSendScout = () => {
        if (!missionForm.scoutId) {
            alert("Por favor, selecione um olheiro.");
            return;
        }
        sendScoutOnMission({
            scoutId: parseInt(missionForm.scoutId),
            type: 'senior',
            country: missionForm.country === "any" ? undefined : missionForm.country,
            leagueName: missionForm.leagueName === "any" ? undefined : missionForm.leagueName,
            position: missionForm.position === "any" ? undefined : missionForm.position,
        });
        setMissionForm(s => ({...s, scoutId: undefined}));
    };

    const handleHireScout = (scoutToHire: Omit<Scout, 'status'>) => {
        const newScout: Scout = {
            ...scoutToHire,
            status: 'Disponível',
        };
        hireScout(newScout);
        setIsHireScoutModalOpen(false);
    };

    const leaguesForSelectedCountry = useMemo(() => {
        if (missionForm.country === "any") return [];
        return countriesData.find(c => c.name === missionForm.country)?.leagues || [];
    }, [missionForm.country, countriesData]);

    const loadFreeAgents = useCallback(async () => {
        if (!activeCareer) return;
        setIsLoadingMarket(true);
        try {
            const response = await fetch(`/api/market?excludeClubId=${activeCareer.clubId}&freeAgentsOnly=true`);
            if (!response.ok) throw new Error(`Falha ao carregar agentes livres.`);
            const data = await response.json();
            setFreeAgents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingMarket(false);
        }
    }, [activeCareer]);

    useEffect(() => {
        if (activeTab === 'free-agents') {
            loadFreeAgents();
        }
    }, [activeTab, loadFreeAgents]);

    const scoutedPlayers = useMemo(() => {
        if (!activeCareer) return [];

        return activeCareer.scoutingReports.map(report => {
            const p = report.player;

            // Este objeto "pseudo-Player" tem dados suficientes para a UI funcionar
            const playerForDisplay: Player = {
                id: p.id,
                name: p.name,
                age: p.age,
                jerseyNumber: 0,
                position: p.position,
                overall: p.overall,
                potential: p.potential[1], // Usamos o potencial máximo como referência
                contract: {
                    // Estimamos o valor e o salário para exibição, já que não estão no relatório de jovens
                    value: (p.potential[1] * 15000) + (p.overall * 7000),
                    wage: Math.round(((p.potential[1] * 15000) + (p.overall * 7000)) / 150),
                    ends: 'N/A'
                },
                // Preenchemos os atributos com os dados simplificados do relatório
                attributes: {
                    pace: { acceleration: p.attributes.pace, sprintSpeed: p.attributes.pace },
                    shooting: { finishing: p.attributes.shooting, penalties: p.attributes.shooting },
                    passing: { crossing: p.attributes.passing, shortPassing: p.attributes.passing, longPassing: p.attributes.passing, freeKickAccuracy: p.attributes.passing },
                    dribbling: { dribbling: p.attributes.dribbling },
                    defending: { defAwareness: p.attributes.defending, standingTackle: p.attributes.defending, slidingTackle: p.attributes.defending },
                    physical: { stamina: p.attributes.physical, strength: p.attributes.physical, aggression: p.attributes.physical },
                    goalkeeping: { gkPositioning: null, gkReflexes: null, gkDiving: null },
                    mentality: { weakFoot: 3, preferredFoot: 'Right' },
                    profile: { height: '180cm', weight: '75kg', nation: 'Scouted', league: '', team: 'Unknown' }
                }
            };
            return playerForDisplay;
        });
    }, [activeCareer]);

    const listedPlayers = useMemo((): ListedPlayer[] => {
        if (!activeCareer || squad.length === 0) return [];
        return activeCareer.transferList.map(listing => {
            const playerDetails = squad.find(p => p.id === listing.playerId);
            return {...playerDetails, ...listing} as ListedPlayer;
        }).filter(p => p.id);
    }, [activeCareer, squad]);

    const filteredMarketPlayers = useMemo(() => {
        const source = activeTab === 'free-agents' ? freeAgents : scoutedPlayers;
        return source
            .filter(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(player => {
                if (positionFilter === 'all') return true;
                return getPositionDetails(translatePosition(player.position)).group === positionFilter;
            })
            .filter(player => {
                if (priceFilter === 'all' || activeTab === 'free-agents') return true;
                return getPriceCategory(player.contract.value) === priceFilter;
            });
    }, [freeAgents, scoutedPlayers, searchTerm, positionFilter, priceFilter, activeTab]);

    if (isCareerLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2
            className="h-12 w-12 animate-spin text-primary"/></div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Handshake className="h-8 w-8 text-primary"/>
                    <div>
                        <h1 className="text-3xl font-bold">Central de Transferências</h1>
                        <p className="text-muted-foreground">Gerencie o mercado para o {activeCareer?.clubName}</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="scouting"><Users className="w-4 h-4 mr-2"/>Olheiros</TabsTrigger>
                        <TabsTrigger value="reports"><FileSearch className="w-4 h-4 mr-2"/>Relatórios</TabsTrigger>
                        <TabsTrigger value="free-agents"><Briefcase className="w-4 h-4 mr-2"/>Agentes
                            Livres</TabsTrigger>
                        <TabsTrigger value="negotiations"><MessagesSquare
                            className="w-4 h-4 mr-2"/>Negociações</TabsTrigger>
                        <TabsTrigger value="my-club"><Home className="w-4 h-4 mr-2"/>Meu Clube</TabsTrigger>
                    </TabsList>

                    {/* Separador para gerir os Olheiros */}
                    <TabsContent value="scouting" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* CARD DA EQUIPA DE OBSERVAÇÃO */}
                            <Card>
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle>Equipa de Observação ({activeCareer?.scouts.length}/5)</CardTitle>
                                        <CardDescription>Gira a sua equipa de olheiros e as suas missões.</CardDescription>
                                    </div>
                                    <Button size="sm" onClick={() => setIsHireScoutModalOpen(true)} disabled={(activeCareer?.scouts?.length ?? 0) >= 5}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Contratar Olheiro
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {activeCareer?.scouts.length === 0 ? (
                                        <EmptyState
                                            icon={Users}
                                            title="Nenhum Olheiro Contratado"
                                            description="Clique em 'Contratar Olheiro' para começar a montar a sua equipa de observação."
                                        />
                                    ) : (
                                        activeCareer?.scouts.map(scout => {
                                            const mission = activeCareer.scoutMissions.find(m => m.scoutId === scout.id);
                                            let daysRemaining = 0;
                                            if (mission && activeCareer.currentDate) {
                                                const endDate = new Date(mission.endDate);
                                                const currentDate = new Date(activeCareer.currentDate);
                                                // Calcula a diferença em dias, arredondando para cima
                                                daysRemaining = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
                                            }

                                            return (
                                                <div key={scout.id} className="p-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback>{scout.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold">{scout.name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <div className="flex items-center">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < scout.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`} />)}</div>
                                                                <span>•</span>
                                                                {/* Exibe o status ou os dias restantes */}
                                                                {scout.status === 'Observando' && daysRemaining > 0 ? (
                                                                    <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Retorna em {daysRemaining} dia(s)
                                        </span>
                                                                ) : (
                                                                    <Badge variant={scout.status === 'Disponível' ? 'default' : 'secondary'} className="py-0">{scout.status}</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                Ações
                                                                <ChevronDown className="h-4 w-4 ml-2"/>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => recallScout(scout.id)}
                                                                disabled={scout.status !== 'Observando'}
                                                            >
                                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                                Chamar de Volta
                                                            </DropdownMenuItem>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem
                                                                        className="text-red-500 focus:bg-red-500/10 focus:text-red-600"
                                                                        onSelect={(e) => e.preventDefault()}
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-2" />
                                                                        Demitir Olheiro
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Demitir {scout.name}?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Esta ação não pode ser desfeita. O olheiro será permanentemente removido da sua equipa.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => fireScout(scout.id)} className="bg-destructive hover:bg-destructive/90">
                                                                            Confirmar Demissão
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>

                            {/* CARD DE NOVA MISSÃO */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Nova Missão</CardTitle>
                                    <CardDescription>Envie um olheiro para encontrar talentos com critérios específicos.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label>Olheiro Disponível</Label>
                                        <Select value={missionForm.scoutId} onValueChange={(val) => setMissionForm(s => ({...s, scoutId: val}))}>
                                            <SelectTrigger><SelectValue placeholder="Escolha um olheiro..." /></SelectTrigger>
                                            <SelectContent>{activeCareer?.scouts.filter(s => s.status === 'Disponível').map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.rating} Estrelas)</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>País</Label>
                                        <Select value={missionForm.country} onValueChange={(val) => setMissionForm(s => ({...s, country: val, leagueName: "any"}))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Qualquer País</SelectItem>
                                                {countriesData.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Liga</Label>
                                        <Select value={missionForm.leagueName} onValueChange={(val) => setMissionForm(s => ({...s, leagueName: val}))} disabled={missionForm.country === 'any'}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Qualquer Liga</SelectItem>
                                                {leaguesForSelectedCountry.map(l => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Posição</Label>
                                        <Select value={missionForm.position} onValueChange={(val) => setMissionForm(s => ({...s, position: val}))}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Qualquer Posição</SelectItem>
                                                <SelectItem value="GK">Goleiro (GOL)</SelectItem>
                                                <SelectItem value="CB">Defensor Central (ZAG)</SelectItem>
                                                <SelectItem value="RB/LB">Lateral (LD/LE)</SelectItem>
                                                <SelectItem value="CM/CDM">Meio-Campista (MC/VOL)</SelectItem>
                                                <SelectItem value="CAM/LM/RM">Meia Ofensivo (MAT/MD/ME)</SelectItem>
                                                <SelectItem value="ST/CF">Atacante (ATA/SA)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button className="w-full" onClick={handleSendScout} disabled={!missionForm.scoutId}>
                                        <Send className="h-4 w-4 mr-2"/>Enviar em Missão
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>


                    {/* SEPARADOR DE RELATÓRIOS */}
                    <TabsContent value="reports" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/>Filtros de Busca</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Buscar por jogador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10"/>
                                    </div>
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
                                    <Select value={priceFilter} onValueChange={setPriceFilter} disabled={activeTab !== 'reports'}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Faixa de Preço" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="low">Abaixo de €10M</SelectItem>
                                            <SelectItem value="medium">€10M - €50M</SelectItem>
                                            <SelectItem value="high">Acima de €50M</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {isLoadingMarket && activeTab === 'free-agents' ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : filteredMarketPlayers.length === 0 ? (
                            <EmptyState
                                icon={activeTab === 'reports' ? FileSearch : Briefcase}
                                title={activeTab === 'reports' ? "Nenhum Relatório de Observação" : "Nenhum Agente Livre Encontrado"}
                                description={activeTab === 'reports' ? "Envie seus olheiros em missões para descobrir novos jogadores." : "Não há jogadores sem contrato disponíveis no momento."}
                            />
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
                                                    <p className="text-sm text-muted-foreground">{player.attributes.profile.team || "Sem Clube"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm w-full sm:w-auto">
                                                <div className="flex items-center gap-1 text-muted-foreground"><Star className="h-4 w-4 text-yellow-500"/> <span className="font-bold text-foreground">{player.overall}</span></div>
                                                <Separator orientation="vertical" className="h-6"/>
                                                <div className="flex items-center gap-1 text-muted-foreground"><DollarSign className="h-4 w-4 text-green-500"/> <span className="font-bold text-foreground">{formatCompactNumber(player.contract.value)}</span></div>
                                            </div>
                                            <div className="flex items-center space-x-2 self-end sm:self-center">
                                                <Button variant="outline" size="sm" onClick={() => setPlayerForDetail(player)}><Eye className="h-4 w-4 mr-1" />Detalhes</Button>
                                                <Button size="sm" onClick={() => setPlayerToNegotiate(player)}>
                                                    <UserPlus className="h-4 w-4 mr-1" />Fazer Oferta
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="free-agents" className="mt-6 space-y-6">
                        {/* O conteúdo será renderizado pela lógica acima */}
                    </TabsContent>

                    {/* Separador de Negociações */}

                    <TabsContent value="negotiations" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Negociações em Andamento ({activeCareer?.negotiations.length || 0})</CardTitle>
                                <CardDescription>Acompanhe o progresso das suas propostas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!activeCareer || activeCareer.negotiations.length === 0 ? (
                                    <EmptyState icon={MessagesSquare} title="Nenhuma Negociação Ativa" description="Faça uma proposta por um jogador para começar a negociar."/>
                                ) : (
                                    <div className="space-y-4">
                                        {activeCareer.negotiations.map(neg => {
                                            const lastOffer = neg.offerHistory[neg.offerHistory.length - 1];
                                            const swapPlayer = squad.find(p => p.id === lastOffer.swapPlayerId);

                                            return (
                                                <Card key={neg.id} className="shadow-none border cursor-pointer hover:border-primary/50" onClick={() => setNegotiationForDetail(neg)}>
                                                    <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                                        {/* Coluna 1: Jogador e Clube */}
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarFallback>{neg.playerName.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-bold">{neg.playerName}</p>
                                                                <p className="text-sm text-muted-foreground">de {neg.aiClub.name}</p>
                                                            </div>
                                                        </div>

                                                        {/* Coluna 2: Detalhes da Proposta */}
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                                            <div className="flex items-center gap-1.5" title="Valor em dinheiro">
                                                                <DollarSign className="h-4 w-4 text-green-500"/>
                                                                <span className="font-semibold">€ {formatCompactNumber(lastOffer.value)}</span>
                                                            </div>
                                                            {swapPlayer && (
                                                                <div className="flex items-center gap-1.5" title={`Troca: ${swapPlayer.name}`}>
                                                                    <Repeat className="h-4 w-4 text-blue-500"/>
                                                                    <span className="font-semibold">{swapPlayer.name.split(' ').pop()}</span>
                                                                </div>
                                                            )}
                                                            {lastOffer.sellOnClause && lastOffer.sellOnClause > 0 && (
                                                                <div className="flex items-center gap-1.5" title={`Cláusula de revenda de ${lastOffer.sellOnClause}%`}>
                                                                    <Percent className="h-4 w-4 text-purple-500"/>
                                                                    <span className="font-semibold">{lastOffer.sellOnClause}%</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Coluna 3: Status */}
                                                        <div className="text-left sm:text-right">
                                                            <Badge variant={neg.status === 'Contraproposta' ? 'default' : 'secondary'}>{neg.status}</Badge>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Separador "Meu Clube" */}
                    <TabsContent value="my-club" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Jogadores Listados ({listedPlayers.length})</CardTitle>
                                <CardDescription>Jogadores do seu clube que estão atualmente no
                                    mercado.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {listedPlayers.length === 0 ? (
                                    <EmptyState icon={ShieldX} title="Nenhum Jogador no Mercado" description="Liste um jogador para venda ou empréstimo a partir do ecrã de elenco."/>
                                ) : (
                                    <div className="space-y-4">
                                        {listedPlayers.map((player) => (
                                            <Card key={player.id}
                                                  className="shadow-none border hover:border-primary/50 transition-colors">
                                                <CardContent
                                                    className="p-4 grid grid-cols-[auto_1fr_auto] items-center gap-4">
                                                    <Avatar
                                                        className="h-12 w-12"><AvatarFallback>{player.name?.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                                                    <div className="flex-grow">
                                                        <h3 className="font-semibold">{player.name}</h3>
                                                        <div
                                                            className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Badge
                                                                variant="outline">{translatePosition(player.position)}</Badge>
                                                            <span>{player.age} anos</span>
                                                            <span className="flex items-center"><Star
                                                                className="h-3 w-3 mr-1 text-yellow-500"/>{player.overall}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg text-green-500">€ {formatCompactNumber(player.askingPrice)}</p>
                                                        <p className="text-xs text-muted-foreground">Preço Pedido</p>
                                                    </div>
                                                    <div
                                                        className="col-span-3 flex justify-end items-center space-x-2 border-t pt-3 mt-3">
                                                        <Button variant="outline" size="sm"
                                                                onClick={() => setPlayerToEdit(player)}>
                                                            <Pencil className="h-4 w-4 mr-1"/>Editar
                                                        </Button>
                                                        <Button variant="destructive" size="sm"
                                                                onClick={() => unlistPlayerForTransfer(player.id)}>
                                                            <Trash2 className="h-4 w-4 mr-1"/>Remover
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
                onNegotiationStart={() => setActiveTab('negotiations')}
            />
            <HireScoutModal
                isOpen={isHireScoutModalOpen}
                onOpenChange={setIsHireScoutModalOpen}
                onHire={handleHireScout}
            />

            <MakeOfferModal
                player={playerToNegotiate}
                squad={squad}
                isOpen={!!playerToNegotiate}
                onOpenChange={(isOpen) => !isOpen && setPlayerToNegotiate(null)}
                onConfirm={handleStartNegotiation}
            />

            <NegotiationDetailModal
                negotiation={negotiationForDetail}
                isOpen={!!negotiationForDetail}
                onOpenChange={(isOpen: boolean) => !isOpen && setNegotiationForDetail(null)}
            />
        </>
    );
}