"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Eye, Star, Plus, Send, AlertCircle, Users, FileSearch } from "lucide-react";
import { useCareer } from "@/contexts/career-context";
import { YouthPlayerDetailModal } from "@/components/youth-player-detail-modal";
import {AvailableScout, HireScoutModal} from "@/components/hire-scout-modal";
import {cn, formatCompactNumber} from "@/lib/utils";
import { YouthPlayer } from "@/lib/game-data";
import { Country } from "@/app/team-select/page";


// Componente para estado vazio
const EmptyState = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="text-center py-12">
        <Icon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);


export default function YouthAcademyPage() {
    // --- GESTÃO DE ESTADO ---
    const {
        managedClub,
        youthSquad,
        activeCareer,
        scouts,
        hireScout,
        startContractNegotiation,
        sendScoutOnMission,
        signYouthPlayer
    } = useCareer();

    const [selectedYouthPlayer, setSelectedYouthPlayer] = useState<YouthPlayer | null>(null);
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);
    const [countriesData, setCountriesData] = useState<Country[]>([]);

    // Estado do formulário de envio de olheiro
    const [missionForm, setMissionForm] = useState({
        scoutId: undefined as string | undefined,
        country: "any",
        leagueName: "any",
        position: "any",
    });
    const [scoutError, setScoutError] = useState<string | null>(null);

    // --- BUSCA DE DADOS PARA FILTROS DE OBSERVAÇÃO ---
    useEffect(() => {
        const fetchFilterData = async () => {
            const response = await fetch('/api/countries');
            if(response.ok) {
                const data = await response.json();
                setCountriesData(data);
            }
        };
        fetchFilterData();
    }, []);

    const handleHireScout = (scoutToHire: AvailableScout) => {
        // Converte o olheiro 'AvailableScout' para o tipo 'Scout' que o contexto espera
        hireScout({
            ...scoutToHire,
            status: 'Disponível',
        });
        setIsHireModalOpen(false);
    };

    // --- MANIPULADORES DE EVENTOS CONECTADOS AO CONTEXTO ---
    const handleSendScout = () => {
        setScoutError(null);
        if (!missionForm.scoutId) {
            setScoutError("Por favor, selecione um olheiro disponível.");
            return;
        }


        sendScoutOnMission({
            scoutId: parseInt(missionForm.scoutId),
            type: 'youth',
            country: missionForm.country === "any" ? undefined : missionForm.country,
        });

        // Reseta o formulário para a próxima missão
        setMissionForm(s => ({...s, scoutId: undefined}));
    };

    const leaguesForSelectedCountry = useMemo(() => {
        if (missionForm.country === "any") return [];
        return countriesData.find(c => c.name === missionForm.country)?.leagues || [];
    }, [missionForm.country, countriesData]);


    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Categorias de Base & Observação</h1>
                    <p className="text-muted-foreground">Desenvolva os futuros talentos e descubra novas jóias para o {managedClub?.name}</p>
                </div>

                <Tabs defaultValue="squad">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="squad">Elenco da Base ({youthSquad.length})</TabsTrigger>
                        <TabsTrigger value="scouting">Observação ({activeCareer?.scouts.length || 0})</TabsTrigger>
                        <TabsTrigger value="reports">Relatórios ({activeCareer?.scoutingReports.length || 0})</TabsTrigger>
                    </TabsList>

                    {/* Aba do Elenco da Base */}
                    <TabsContent value="squad" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Elenco da Base</CardTitle>
                                <CardDescription>Acompanhe e gira o desenvolvimento dos seus jovens talentos.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {youthSquad.length === 0 ? (
                                    <EmptyState
                                        icon={GraduationCap}
                                        title="A academia está vazia"
                                        description="Uma nova safra de talentos chegará no início da próxima temporada (15 de Julho)."
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {youthSquad.map((player) => (
                                            <div key={player.id} className="p-4 rounded-lg border">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="flex items-center space-x-4">
                                                        <Avatar className="h-12 w-12"><AvatarFallback>{player.name.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback></Avatar>
                                                        <div>
                                                            <div className="flex items-center space-x-2"><h3 className="font-semibold">{player.name}</h3><Badge variant="outline">{player.position}</Badge><span className="text-sm text-muted-foreground">{player.age} anos</span></div>
                                                            <div className="flex items-center space-x-4 mt-1">
                                                                <div className="text-sm">Overall: <span className="font-bold text-green-500">{player.overall}</span></div>
                                                                <div className="text-sm">Potencial: <span className="font-bold text-blue-500">{`${player.potential[0]}-${player.potential[1]}`}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                                        <Button variant="outline" size="sm" onClick={() => setSelectedYouthPlayer(player)}><Eye className="h-4 w-4 mr-1"/> Ver Análise</Button>
                                                        <Button size="sm" onClick={() => startContractNegotiation(player)}>Promover</Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mt-3">
                                                    <div className="flex justify-between text-xs text-muted-foreground"><span>Progresso para o próximo nível</span></div>
                                                    <Progress value={(player.overall / player.potential[1]) * 100} className="h-2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Aba de Observação */}
                    <TabsContent value="scouting" className="mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <Card>
                                <CardHeader className="flex flex-row items-start justify-between">
                                    <div>
                                        <CardTitle>Rede de Olheiros ({scouts.length}/5)</CardTitle>
                                        <CardDescription>Gira a sua equipa de olheiros.</CardDescription>
                                    </div>
                                    <Button size="sm" onClick={() => setIsHireModalOpen(true)} disabled={scouts.length >= 5}>
                                        <Plus className="h-4 w-4 mr-2"/>Contratar
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {scouts.length === 0 ? (
                                        <EmptyState icon={Users} title="Nenhum Olheiro Contratado" description="Clique em 'Contratar' para montar a sua equipa." />
                                    ) : (
                                        scouts.map(scout => (
                                            <div key={scout.id} className="p-3 rounded-lg border flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold">{scout.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <div className="flex items-center">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-3 w-3", i < scout.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30")} />)}</div>
                                                        <span>• {scout.specialty}</span>
                                                    </div>
                                                </div>
                                                <Badge variant={scout.status === 'Disponível' ? 'default' : 'secondary'}>{scout.status}</Badge>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Nova Missão de Observação</CardTitle>
                                    <CardDescription>Envie um olheiro para encontrar talentos.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Select value={missionForm.scoutId} onValueChange={(val) => setMissionForm(s => ({...s, scoutId: val}))}>
                                        <SelectTrigger><SelectValue placeholder="Escolha um olheiro disponível..." /></SelectTrigger>
                                        <SelectContent>{scouts.filter(s => s.status === 'Disponível').map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.rating} estrelas)</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={missionForm.country} onValueChange={(val) => setMissionForm(s => ({...s, country: val, leagueName: "any"}))}>
                                        <SelectTrigger><SelectValue placeholder="País" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Qualquer País</SelectItem>
                                            {countriesData.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={missionForm.leagueName} onValueChange={(val) => setMissionForm(s => ({...s, leagueName: val}))} disabled={missionForm.country === 'any'}>
                                        <SelectTrigger><SelectValue placeholder="Liga" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Qualquer Liga</SelectItem>
                                            {leaguesForSelectedCountry.map(l => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {scoutError && (<div className="flex items-center gap-2 text-sm text-destructive p-2 bg-destructive/10 rounded-lg"><AlertCircle className="h-4 w-4" /><p>{scoutError}</p></div>)}
                                    <Button className="w-full" onClick={handleSendScout} disabled={!missionForm.scoutId}><Send className="h-4 w-4 mr-2"/>Enviar em Missão</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Aba de Relatórios */}
                    <TabsContent value="reports" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Relatórios de Observação</CardTitle>
                                <CardDescription>Jogadores encontrados pelos seus olheiros.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {activeCareer?.scoutingReports.length === 0 ? (
                                    <EmptyState icon={FileSearch} title="Nenhum Relatório Disponível" description="Os relatórios dos seus olheiros aparecerão aqui quando eles retornarem de suas missões." />
                                ) : (activeCareer?.scoutingReports.map(report => {
                                    const player = report.player;
                                    const potentialMidPoint = (player.potential[0] + player.potential[1]) / 2;
                                    const signingCost = Math.floor((potentialMidPoint * 1000) + (player.overall * 500));

                                    return (
                                        <div key={player.id} className="p-3 rounded-lg border flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar><AvatarFallback>{player.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                                                <div>
                                                    <p className="font-semibold">{player.name} ({player.age})</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="outline">{player.position}</Badge>
                                                        <span className="flex items-center"><Star className="h-3 w-3 mr-1 text-yellow-500"/>{player.overall}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-2">
                                                        {player.traits && player.traits.map(trait => (
                                                            <Badge key={trait} variant="secondary">{trait}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-bold text-blue-500">{player.potential}</p>
                                                    <p className="text-xs text-muted-foreground">Potencial</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <p className="font-semibold text-sm text-green-500">€{formatCompactNumber(signingCost)}</p>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => signYouthPlayer(report.reportId)}
                                                        disabled={(activeCareer?.budget || 0) < signingCost}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1"/> Assinar para Academia
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            <YouthPlayerDetailModal player={selectedYouthPlayer} isOpen={!!selectedYouthPlayer} onOpenChange={(isOpen) => !isOpen && setSelectedYouthPlayer(null)} />
            <HireScoutModal
                isOpen={isHireModalOpen}
                onOpenChange={setIsHireModalOpen}
                onHire={handleHireScout}
            />
        </>
    );
}