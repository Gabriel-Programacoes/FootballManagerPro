"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Search,
    Filter,
    Eye,
    UserPlus,
    UserMinus,
    Handshake,
    Star,
    History,
    FileQuestion,
    MessageSquareWarning,
    DollarSign, XCircle, FileText
} from 'lucide-react';
import { PlayerTransferDetailModal } from "@/components/player-transfer-detail-modal";
import { NegotiationDetailModal } from "@/components/negotiation-detail-modal"; // Importamos o modal
import { AdjustOfferModal } from "@/components/adjust-offer-modal"; // Importamos o modal
import { useCareer } from "@/contexts/career-context";
import {Progress} from "@/components/ui/progress";

// --- TIPOS DE DADOS E FUNÇÕES AUXILIARES ---
type PlayerPosition = "GOL" | "ZAG" | "LD" | "LE" | "VOL" | "MC" | "MAT" | "ME" | "MD" | "PE" | "PD" | "SA" | "ATA";

const getPositionColor = (position: PlayerPosition) => {
    const colors: Record<PlayerPosition, string> = {
        GOL: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
        ZAG: "bg-blue-500/20 text-blue-500 border-blue-500/30",
        LD: "bg-blue-500/20 text-blue-500 border-blue-500/30",
        LE: "bg-blue-500/20 text-blue-500 border-blue-500/30",
        VOL: "bg-green-500/20 text-green-500 border-green-500/30",
        MC: "bg-green-500/20 text-green-500 border-green-500/30",
        MAT: "bg-purple-500/20 text-purple-500 border-purple-500/30",
        ME: "bg-purple-500/20 text-purple-500 border-purple-500/30",
        MD: "bg-purple-500/20 text-purple-500 border-purple-500/30",
        PE: "bg-red-500/20 text-red-500 border-red-500/30",
        PD: "bg-red-500/20 text-red-500 border-red-500/30",
        SA: "bg-red-500/20 text-red-500 border-red-500/30",
        ATA: "bg-red-500/20 text-red-500 border-red-500/30",
    };
    return colors[position] || "bg-muted text-muted-foreground";
};

const parseValue = (valueStr: string): number => {
    if (!valueStr) return 0;
    const cleaned = valueStr.replace(/€/g, '').trim().toLowerCase();
    if (cleaned.endsWith('m')) {
        return parseFloat(cleaned.replace('m', '')) * 1_000_000;
    }
    if (cleaned.endsWith('k')) {
        return parseFloat(cleaned.replace('k', '')) * 1_000;
    }
    return parseFloat(cleaned);
};

const getStatusColor = (status: string) => {
    if (["Em negociação", "Aguardando resposta"].includes(status)) return "text-blue-500";
    if (["Proposta rejeitada", "Difícil"].includes(status)) return "text-red-500";
    return "text-green-500";
}

const EmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="text-center py-12">
        <Icon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

const transferMarket = [
    { id: 1, name: "Kylian Mbappé", club: "Paris SG", position: "ATA" as PlayerPosition, age: 25, overall: 91, potential: 95, value: "€180M", wage: "€500K/sem", contract: "2025", interest: "Alto", availability: "Disponível", stats: { goals: 28, assists: 8, matches: 32 }, traits: ["Velocidade", "Finalização", "Drible"] },
    { id: 2, name: "Erling Haaland", club: "Man City", position: "ATA" as PlayerPosition, age: 23, overall: 89, potential: 94, value: "€150M", wage: "€400K/sem", contract: "2027", interest: "Médio", availability: "Difícil", stats: { goals: 35, assists: 5, matches: 38 }, traits: ["Força", "Finalização", "Posicionamento"] },
];
const negotiations = [
    { id: 1, player: "Victor Osimhen", club: "Napoli", position: "ATA" as PlayerPosition, offer: "€120M", status: "Em negociação", progress: 65, deadline: "25/08/2025", lastUpdate: "Há 2 horas" },
    { id: 2, player: "Declan Rice", club: "Arsenal", position: "MDC" as PlayerPosition, offer: "€85M", status: "Proposta rejeitada", progress: 25, deadline: "22/08/2025", lastUpdate: "Há 1 dia" },
];
const transferHistory = [
    { id: 1, player: "Mason Mount", from: "Chelsea FC", to: "Red Devils FC", value: "€60M", date: "01/07/2025", position: "MC" as PlayerPosition, type: "signing" },
    { id: 2, player: "André Onana", from: "Inter Milan", to: "Red Devils FC", value: "€50M", date: "15/07/2025", position: "GOL" as PlayerPosition, type: "signing" },
    { id: 3, player: "Harry Maguire", from: "Red Devils FC", to: "West Ham", value: "€35M", date: "20/08/2025", position: "ZAG" as PlayerPosition, type: "sale" },
];
const scoutReports = [
    { id: 1, player: "Eduardo Camavinga", club: "Real Madrid", position: "MC" as PlayerPosition, age: 22, overall: 82, potential: 89, scoutRating: 8.5, recommendation: "Altamente recomendado", strengths: ["Físico", "Passe", "Versatilidade"], weaknesses: ["Experiência", "Finalização"], estimatedValue: "€65M" },
    { id: 2, player: "Gavi", club: "FC Barcelona", position: "MC" as PlayerPosition, age: 20, overall: 80, potential: 90, scoutRating: 9.0, recommendation: "Excelente investimento", strengths: ["Técnica", "Visão", "Potencial"], weaknesses: ["Físico", "Experiência"], estimatedValue: "€55M" },
];

export default function TransfersPage() {
    const { managedClub } = useCareer();
    const [activeTab, setActiveTab] = useState("market");
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

    // --- ESTADOS PARA OS FILTROS ---
    const [searchTerm, setSearchTerm] = useState("");
    const [positionFilter, setPositionFilter] = useState("all");
    const [priceFilter, setPriceFilter] = useState("all");

    const [negotiationForDetail, setNegotiationForDetail] = useState<any>(null);
    const [negotiationForOffer, setNegotiationForOffer] = useState<any>(null);

    // --- LÓGICA DE FILTRAGEM COM useMemo ---
    // Este hook recalcula a lista de jogadores apenas quando um dos filtros muda.
    const filteredMarket = useMemo(() => {
        return transferMarket.filter((player) => {
            const playerValue = parseValue(player.value);

            const matchesSearch = searchTerm === "" ||
                player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                player.club.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesPosition = positionFilter === "all" || player.position === positionFilter;

            const matchesPrice = priceFilter === "all" ||
                (priceFilter === "low" && playerValue < 50_000_000) ||
                (priceFilter === "medium" && playerValue >= 50_000_000 && playerValue < 100_000_000) ||
                (priceFilter === "high" && playerValue >= 100_000_000);

            return matchesSearch && matchesPosition && matchesPrice;
        });
    }, [searchTerm, positionFilter, priceFilter]);

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Central de Transferências</h1>
                    <p className="text-muted-foreground">Gerencie o mercado para o {managedClub?.name}</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="market">Mercado</TabsTrigger>
                        <TabsTrigger value="negotiations">Negociações</TabsTrigger>
                        <TabsTrigger value="history">Histórico</TabsTrigger>
                        <TabsTrigger value="scouts">Relatórios</TabsTrigger>
                    </TabsList>

                    {/* Aba de Mercado */}
                    <TabsContent value="market" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros de Busca</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="relative md:col-span-2">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        {/* --- INPUT CONECTADO --- */}
                                        <Input
                                            placeholder="Buscar por jogador ou clube..."
                                            className="pl-10"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    {/* --- SELECTS CONECTADOS --- */}
                                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                                        <SelectTrigger><SelectValue placeholder="Posição" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas as Posições</SelectItem>
                                            <SelectItem value="GOL">Goleiro (GOL)</SelectItem>
                                            <SelectItem value="ZAG">Zagueiro (ZAG)</SelectItem>
                                            <SelectItem value="MC">Meio-Campo (MC)</SelectItem>
                                            <SelectItem value="ATA">Atacante (ATA)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={priceFilter} onValueChange={setPriceFilter}>
                                        <SelectTrigger><SelectValue placeholder="Faixa de Preço" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos os Preços</SelectItem>
                                            <SelectItem value="low">Abaixo de €50M</SelectItem>
                                            <SelectItem value="medium">€50M - €100M</SelectItem>
                                            <SelectItem value="high">Acima de €100M</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <p className="text-sm text-muted-foreground">{filteredMarket.length} jogadores encontrados.</p>

                        <div className="grid gap-4">
                            {filteredMarket.map((player) => (
                                <Card key={player.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <Avatar className="h-16 w-16"><AvatarFallback className="text-lg">{player.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-semibold">{player.name}</h3>
                                                    <Badge className={getPositionColor(player.position)}>{player.position}</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span>{player.club}</span>
                                                    <span>{player.age} anos</span>
                                                    <span className="flex items-center"><Star className="h-3 w-3 mr-1 text-yellow-500" />{player.overall} (Potencial: {player.potential})</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="font-medium text-green-500">Valor: {player.value}</span>
                                                    <span className="text-muted-foreground">Contrato até: {player.contract}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedPlayer(player)}><Eye className="h-4 w-4 mr-1" />Detalhes</Button>
                                            <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Oferta</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Aba de Negociações (Conteúdo Modificado) */}
                    <TabsContent value="negotiations" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Handshake className="h-5 w-5" />Negociações em Andamento</CardTitle>
                                <CardDescription>Acompanhe o progresso das suas ofertas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {negotiations.length === 0 ? (
                                    <EmptyState icon={MessageSquareWarning} title="Nenhuma Negociação Ativa" description="Quando fizer uma proposta por um jogador, ela aparecerá aqui." />
                                ) : (
                                    <div className="space-y-4">
                                        {negotiations.map((neg) => (
                                            <div key={neg.id} className="p-4 rounded-lg border">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center space-x-4"><Avatar><AvatarFallback>{neg.player.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                                                        <div><h3 className="font-semibold">{neg.player}</h3><p className="text-sm text-muted-foreground">{neg.club}</p></div>
                                                    </div>
                                                    <p className="font-bold text-lg text-green-500">{neg.offer}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm"><span>Progresso</span><span className="font-medium">{neg.progress}%</span></div>
                                                    <Progress value={neg.progress} className="h-2" />
                                                    <div className="flex justify-between text-xs text-muted-foreground"><span>Status: {neg.status}</span><span>Prazo: {neg.deadline}</span></div>
                                                </div>
                                                {/* --- NOVOS BOTÕES --- */}
                                                <div className="flex justify-end space-x-2 mt-4">
                                                    <Button variant="outline" size="sm" onClick={() => setNegotiationForDetail(neg)}>
                                                        <FileText className="h-4 w-4 mr-1" />Detalhes
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => setNegotiationForOffer(neg)}>
                                                        <DollarSign className="h-4 w-4 mr-1" />Ajustar Oferta
                                                    </Button>
                                                    <Button variant="destructive" size="sm">
                                                        <XCircle className="h-4 w-4 mr-1" />Cancelar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Aba de Histórico */}
                    <TabsContent value="history" className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-green-500" />Contratações ({transferHistory.filter(t => t.type === 'signing').length})</CardTitle></CardHeader>
                            <CardContent>
                                {transferHistory.filter(t => t.type === 'signing').length === 0 ? (
                                    <EmptyState icon={History} title="Sem Contratações" description="Nenhum jogador foi contratado nesta temporada ainda." />
                                ) : (
                                    <div className="space-y-3">
                                        {transferHistory.filter(t => t.type === 'signing').map((t) => (
                                            <div key={t.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
                                                <div><p className="font-semibold">{t.player}</p><p className="text-xs text-muted-foreground">De: {t.from}</p></div>
                                                <p className="text-green-500 font-medium">{t.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><UserMinus className="h-5 w-5 text-red-500" />Vendas ({transferHistory.filter(t => t.type === 'sale').length})</CardTitle></CardHeader>
                            <CardContent>
                                {transferHistory.filter(t => t.type === 'sale').length === 0 ? (
                                    <EmptyState icon={History} title="Sem Vendas" description="Nenhum jogador foi vendido nesta temporada ainda." />
                                ) : (
                                    <div className="space-y-3">
                                        {transferHistory.filter(t => t.type === 'sale').map((t) => (
                                            <div key={t.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
                                                <div><p className="font-semibold">{t.player}</p><p className="text-xs text-muted-foreground">Para: {t.to}</p></div>
                                                <p className="text-green-500 font-medium">{t.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Aba de Relatórios */}
                    <TabsContent value="scouts" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Relatórios de Observação</CardTitle>
                                <CardDescription>Análises detalhadas dos seus olheiros</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {scoutReports.length === 0 ? (
                                    <EmptyState icon={FileQuestion} title="Nenhum Relatório Disponível" description="Envie olheiros para observar jogadores e os relatórios aparecerão aqui." />
                                ) : (
                                    <div className="space-y-4">
                                        {scoutReports.map((report) => (
                                            <div key={report.id} className="p-4 rounded-lg border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar><AvatarFallback>{report.player.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                                                        <div><h3 className="font-semibold">{report.player}</h3><p className="text-sm text-muted-foreground">{report.club} • {report.age} anos</p></div>
                                                    </div>
                                                    <Badge variant="secondary">{report.recommendation}</Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t">
                                                    <div><h4 className="font-semibold mb-2 text-green-600">Pontos Fortes</h4><div className="flex flex-wrap gap-1">{report.strengths.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}</div></div>
                                                    <div><h4 className="font-semibold mb-2 text-red-600">Pontos Fracos</h4><div className="flex flex-wrap gap-1">{report.weaknesses.map((w, i) => <Badge key={i} variant="outline" className="text-xs">{w}</Badge>)}</div></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <NegotiationDetailModal
                negotiation={negotiationForDetail}
                isOpen={!!negotiationForDetail}
                onOpenChange={(isOpen) => !isOpen && setNegotiationForDetail(null)}
            />
            <AdjustOfferModal
                negotiation={negotiationForOffer}
                isOpen={!!negotiationForOffer}
                onOpenChange={(isOpen) => !isOpen && setNegotiationForOffer(null)}
            />
            <PlayerTransferDetailModal
                player={selectedPlayer}
                isOpen={!!selectedPlayer}
                onOpenChange={(isOpen) => !isOpen && setSelectedPlayer(null)}
            />
        </>
    )
}