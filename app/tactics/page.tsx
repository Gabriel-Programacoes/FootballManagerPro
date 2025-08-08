"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings, Plus, Shield, Zap, Star, Crown, Activity, BarChart3, TrendingUp, Flame } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Tabs, TabsList } from "@radix-ui/react-tabs";
import {TabsContent, TabsTrigger} from "@/components/ui/tabs";

// --- Tipos de Dados ---
interface Player {
    id: number;
    name: string;
    position: string;
    overall: number;
    x: number;
    y: number;
    role: string;
    instructions: string[];
}

interface Formation {
    id: string;
    name: string;
    players: Player[];
    mentality: string;
    width: number;
    depth: number;
}

// --- Funções Auxiliares ---
const getPositionColor = (position: string) => {
    if (["GOL"].includes(position)) return "bg-yellow-500 border-yellow-300";
    if (["ZAG", "LD", "LE"].includes(position)) return "bg-blue-500 border-blue-300";
    if (["VOL", "MC", "MAT", "ME", "MD"].includes(position)) return "bg-green-500 border-green-300";
    if (["PE", "PD", "SA", "ATA"].includes(position)) return "bg-red-500 border-red-300";
    return "bg-gray-500 border-gray-300";
};

const getRoleIcon = (role: string) => {
    if (role.includes("Defensivo") || role.includes("Zagueiro")) return Shield;
    if (role.includes("Ofensivo") || role.includes("Atacante")) return Zap;
    if (role.includes("Criativo") || role.includes("Meia")) return Star;
    if (role.includes("Completo")) return Crown;
    return Activity;
};

// --- Dados de Protótipo ---
const examplePlayers: Player[] = [
    { id: 1, name: "Onana", position: "GOL", overall: 84, x: 50, y: 92, role: "Goleiro", instructions: [] },
    { id: 2, name: "Dalot", position: "LD", overall: 82, x: 85, y: 75, role: "Lateral Ofensivo", instructions: [] },
    { id: 3, name: "Varane", position: "ZAG", overall: 86, x: 65, y: 80, role: "Zagueiro Central", instructions: [] },
    { id: 4, name: "Martínez", position: "ZAG", overall: 84, x: 35, y: 80, role: "Zagueiro Central", instructions: [] },
    { id: 5, name: "Shaw", position: "LE", overall: 83, x: 15, y: 75, role: "Lateral Ofensivo", instructions: [] },
    { id: 6, name: "Casemiro", position: "MDC", overall: 87, x: 50, y: 60, role: "Meio Defensivo", instructions: [] },
    { id: 7, name: "Eriksen", position: "MC", overall: 83, x: 70, y: 45, role: "Meia Central", instructions: [] },
    { id: 8, name: "Fernandes", position: "MC", overall: 88, x: 30, y: 45, role: "Meia Criativo", instructions: [] },
    { id: 9, name: "Antony", position: "AD", overall: 81, x: 85, y: 25, role: "Ponta Direita", instructions: [] },
    { id: 10, name: "Rashford", position: "AE", overall: 86, x: 15, y: 25, role: "Ponta Esquerda", instructions: [] },
    { id: 11, name: "Højlund", position: "ATA", overall: 79, x: 50, y: 15, role: "Centroavante", instructions: [] },
];
const formations: Omit<Formation, 'players'>[] = [
    { id: "4-3-3", name: "4-3-3 Ataque", mentality: "Ofensiva", width: 70, depth: 65 },
    { id: "4-2-3-1", name: "4-2-3-1 Equilibrada", mentality: "Equilibrada", width: 65, depth: 60 },
];
const rolesByPosition: Record<string, string[]> = {
    GOL: ["Goleiro", "Goleiro Distribuidor"], ZAG: ["Zagueiro Central"], LD: ["Lateral Defensivo", "Lateral Ofensivo"], LE: ["Lateral Defensivo", "Lateral Ofensivo"], MDC: ["Meio Defensivo"], MC: ["Meia Central", "Meia Criativo"], ATA: ["Centroavante", "Falso 9"]
};
const mentalityOptions = [
    { value: "Muito Defensiva", icon: Shield }, { value: "Defensiva", icon: Shield },
    { value: "Equilibrada", icon: Activity }, { value: "Ofensiva", icon: TrendingUp },
    { value: "Muito Ofensiva", icon: Flame }
];

// --- Componente do Campo Tático ---
const TacticalField = ({ formation, onDrop, onPlayerClick, onDragStart }: {
    formation: Formation; onDrop: (e: React.DragEvent) => void; onPlayerClick: (player: Player) => void; onDragStart: (player: Player) => void;
}) => (
    <div
        className="relative w-full aspect-[5/7] rounded-lg overflow-hidden bg-[#2d6b32] border-2 border-white/20"
        onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
    >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
            <defs><linearGradient id="grass" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{ stopColor: '#2d6b32' }} /><stop offset="50%" style={{ stopColor: '#3a8a42' }} /><stop offset="100%" style={{ stopColor: '#2d6b32' }} /></linearGradient></defs>
            <rect width="100%" height="100%" fill="url(#grass)" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <circle cx="50%" cy="50%" r="12%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
            <rect x="20%" y="0" width="60%" height="20%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
            <rect x="20%" y="80%" width="60%" height="20%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
        </svg>
        {formation.players.map((player) => (
            <div key={player.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move group z-10"
                 style={{ left: `${player.x}%`, top: `${player.y}%` }}
                 draggable onDragStart={(e) => { onDragStart(player); e.dataTransfer.setData("player", JSON.stringify(player)); }}
                 onClick={() => onPlayerClick(player)}
            >
                <div className={cn("w-14 h-14 rounded-full border-2 shadow-lg flex items-center justify-center transition-transform group-hover:scale-110", getPositionColor(player.position))}>
                    <Avatar className="w-12 h-12"><AvatarFallback className="text-sm font-bold text-white bg-transparent">{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                </div>
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold ring-2 ring-background">{player.overall}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-background/80 text-foreground text-xs px-2 py-0.5 rounded whitespace-nowrap">{player.name}</div>
            </div>
        ))}
    </div>
);

// --- Componente Principal ---
export default function TacticsPage() {
    const [activeFormation, setActiveFormation] = useState<Formation>({ ...formations[0], players: examplePlayers });
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
    const [activeTab, setActiveTab] = useState("formation");

    useEffect(() => {
        if (activeFormation.players.length > 0 && !selectedPlayer) {
            setSelectedPlayer(activeFormation.players[0]);
        }
    }, [activeFormation, selectedPlayer]);

    const handlePlayerDrop = (e: React.DragEvent) => {
        const field = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - field.left) / field.width) * 100;
        const y = ((e.clientY - field.top) / field.height) * 100;
        const updatedPlayers = activeFormation.players.map(p =>
            p.id === draggedPlayer?.id ? { ...p, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : p
        );
        setActiveFormation({ ...activeFormation, players: updatedPlayers });
        setSelectedPlayer(updatedPlayers.find(p => p.id === draggedPlayer?.id) || null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Centro Tático</h1>
                <p className="text-muted-foreground">Configure formações, táticas e instruções</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="formation">Formação e Jogadores</TabsTrigger>
                    <TabsTrigger value="team_style">Estilo de Equipa</TabsTrigger>
                    <TabsTrigger value="analysis">Análise Tática</TabsTrigger>
                </TabsList>

                {/* Aba de Formação e Jogadores */}
                <TabsContent value="formation" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <Card className="lg:col-span-2">
                            <CardHeader><CardTitle>Campo Tático - {activeFormation.name}</CardTitle></CardHeader>
                            <CardContent>
                                <TacticalField formation={activeFormation} onDrop={handlePlayerDrop} onPlayerClick={setSelectedPlayer} onDragStart={setDraggedPlayer} />
                            </CardContent>
                        </Card>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Formações</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <Select value={activeFormation.id} onValueChange={(id) => { const newBase = formations.find(f => f.id === id); if (newBase) setActiveFormation({ ...activeFormation, ...newBase }); }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{formations.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Button variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2" />Nova Tática</Button>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Configurar Jogador</CardTitle></CardHeader>
                                <CardContent>
                                    {selectedPlayer ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3"><Avatar><AvatarFallback>{selectedPlayer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><div><h3 className="font-semibold">{selectedPlayer.name}</h3><Badge variant="outline">{selectedPlayer.position}</Badge></div></div>
                                            <div><Label>Função no Campo</Label><Select value={selectedPlayer.role}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{rolesByPosition[selectedPlayer.position as keyof typeof rolesByPosition]?.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></div>
                                            <div><Label>Instruções</Label><div className="space-y-2 mt-2"><div className="flex items-center gap-2"><Switch id="instr1" /><Label htmlFor="instr1">Ficar na Defesa</Label></div></div></div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground"><p>Clique num jogador para configurar</p></div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Aba de Estilo de Equipa */}
                <TabsContent value="team_style" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Mentalidade da Equipa</CardTitle>
                                <CardDescription>Define o comportamento geral da equipa</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {mentalityOptions.map((option) => (
                                    <Button key={option.value} variant={activeFormation.mentality === option.value ? "secondary" : "outline"} className="w-full justify-start" onClick={() => setActiveFormation({ ...activeFormation, mentality: option.value })}>
                                        <option.icon className="h-4 w-4 mr-2" /> {option.value}
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Ajustes Finos</CardTitle>
                                <CardDescription>Configure a largura e profundidade da equipa</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2"><div className="flex justify-between"><Label>Largura</Label><span>{activeFormation.width}%</span></div><Slider value={[activeFormation.width]} onValueChange={([val]) => setActiveFormation({ ...activeFormation, width: val })} /></div>
                                <div className="space-y-2"><div className="flex justify-between"><Label>Profundidade</Label><span>{activeFormation.depth}%</span></div><Slider value={[activeFormation.depth]} onValueChange={([val]) => setActiveFormation({ ...activeFormation, depth: val })} /></div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Aba de Análise */}
                <TabsContent value="analysis" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Análise Tática</CardTitle>
                            <CardDescription>Pontos fortes e fracos da sua configuração atual</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <p>A análise da sua tática aparecerá aqui.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}