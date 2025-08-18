"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Target, Users, Plus, Shield, Zap, Star, Crown, Activity, Loader2 } from 'lucide-react';
import { useCareer } from "@/contexts/career-context";
import { cn } from "@/lib/utils";
// Importamos a interface do Jogador que já definimos na página de elenco
import type { Player as FullPlayer } from "@/app/squad/page";

// --- Tipos de Dados para a Tática ---
interface TacticPlayer {
    id: string; // Usamos o ID real do jogador
    name: string;
    position: string;
    overall: number;
    x: number;
    y: number;
    role: string;
}
interface Formation {
    id: string;
    name: string;
    players: TacticPlayer[];
}

// --- Funções Auxiliares ---
const getPositionColor = (position: string) => {
    if (["GOL"].includes(position)) return "bg-yellow-500 border-yellow-300";
    if (["ZAG", "LD", "LE"].includes(position)) return "bg-blue-500 border-blue-300";
    if (["MDC", "MC", "VOL"].includes(position)) return "bg-green-500 border-green-300";
    return "bg-red-500 border-red-300"; // Atacantes e Meias Ofensivos
};

const rolesByPosition: Record<string, string[]> = {
    GOL: ["Goleiro"], ZAG: ["Zagueiro"], LD: ["Lateral"], LE: ["Lateral"], VOL: ["Volante"], MC: ["Meio-Campo"], ATA: ["Atacante"]
};

// Posições padrão para uma formação 4-3-3
const defaultPositions433: { [key: string]: {x: number, y: number} } = {
    GOL: { x: 50, y: 92 }, LD: { x: 85, y: 75 }, ZAG1: { x: 65, y: 80 }, ZAG2: { x: 35, y: 80 },
    LE: { x: 15, y: 75 }, VOL: { x: 50, y: 60 }, MC1: { x: 70, y: 45 }, MC2: { x: 30, y: 45 },
    PD: { x: 85, y: 25 }, PE: { x: 15, y: 25 }, ATA: { x: 50, y: 15 },
};

// --- Componente do Campo Tático ---
const TacticalField = ({ formation, onDrop, onPlayerClick, onDragStart }: {
    formation: Formation; onDrop: (e: React.DragEvent) => void; onPlayerClick: (player: TacticPlayer) => void; onDragStart: (player: TacticPlayer) => void;
}) => (
    <div
        className="relative w-full max-w-md mx-auto aspect-[5/7] rounded-lg overflow-hidden bg-[#2d6b32] border-2 border-white/20"
        onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
    >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
            <defs><linearGradient id="grass" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{ stopColor: '#2d6b32' }} /><stop offset="50%" style={{ stopColor: '#3a8a42' }} /><stop offset="100%" style={{ stopColor: '#2d6b32' }} /></linearGradient></defs>
            <rect width="150%" height="150%" fill="url(#grass)" />
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
                    {/* --- MUDANÇA AQUI: Mostra a posição do jogador --- */}
                    <span className="text-white font-bold text-sm">{player.position}</span>
                </div>
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold ring-2 ring-background">{player.overall}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-background/80 text-foreground text-xs px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{player.name}</div>
            </div>
        ))}
    </div>
);


// --- Componente Principal ---
export default function TacticsPage() {
    const { managedClub } = useCareer();
    const [squad, setSquad] = useState<FullPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFormation, setActiveFormation] = useState<Formation | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<TacticPlayer | null>(null);
    const [draggedPlayer, setDraggedPlayer] = useState<TacticPlayer | null>(null);

    // Efeito para buscar os jogadores do clube quando a página carrega
    useEffect(() => {
        if (managedClub?.id) {
            const fetchSquad = async () => {
                try {
                    const response = await fetch(`/api/squad/${managedClub.id}`);
                    const data: FullPlayer[] = await response.json();
                    setSquad(data);

                    // Cria a formação inicial com os melhores jogadores
                    const sortedSquad = [...data].sort((a, b) => b.overall - a.overall);
                    const initialPlayers = sortedSquad.slice(0, 11).map((p, index) => {
                        const posKey = Object.keys(defaultPositions433)[index];
                        return {
                            id: p.id, name: p.name, position: p.position, overall: p.overall,
                            x: defaultPositions433[posKey].x, y: defaultPositions433[posKey].y,
                            role: rolesByPosition[p.position]?.[0] || 'Jogador'
                        };
                    });
                    setActiveFormation({ id: "4-3-3", name: "4-3-3 Padrão", players: initialPlayers });
                    setSelectedPlayer(initialPlayers[0]);

                } catch (error) {
                    console.error("Falha ao buscar elenco para táticas", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSquad();
        }
    }, [managedClub]);


    const handlePlayerDrop = (e: React.DragEvent) => {
        if (!activeFormation || !draggedPlayer) return;
        const field = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - field.left) / field.width) * 100;
        const y = ((e.clientY - field.top) / field.height) * 100;
        const updatedPlayers = activeFormation.players.map(p =>
            p.id === draggedPlayer.id ? { ...p, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : p
        );
        setActiveFormation({ ...activeFormation, players: updatedPlayers });
        setSelectedPlayer(updatedPlayers.find(p => p.id === draggedPlayer.id) || null);
    };

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    if (!activeFormation) {
        return <div className="text-center py-12">Não foi possível carregar a formação.</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Centro Tático</h1>
                <p className="text-muted-foreground">Configure a formação para o {managedClub?.name}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader><CardTitle>Campo Tático - {activeFormation.name}</CardTitle></CardHeader>
                        <CardContent>
                            <TacticalField formation={activeFormation} onDrop={handlePlayerDrop} onPlayerClick={setSelectedPlayer} onDragStart={setDraggedPlayer} />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Configurar Jogador</CardTitle></CardHeader>
                        <CardContent>
                            {selectedPlayer ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar><AvatarFallback>{selectedPlayer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                        <div><h3 className="font-semibold">{selectedPlayer.name}</h3><Badge variant="outline">{selectedPlayer.position}</Badge></div>
                                    </div>
                                    <div>
                                        <Label>Função no Campo</Label>
                                        <Select value={selectedPlayer.role}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {(rolesByPosition[selectedPlayer.position] || []).map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground"><p>Clique num jogador para configurar</p></div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}