"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, UserPlus, Star } from "lucide-react";

// Definimos o "formato" do jogador que este modal espera receber
interface Player {
    name: string;
    club: string;
    position: string;
    age: number;
    overall: number;
    potential: number;
    value: string;
    wage: string;
    stats: { goals: number; assists: number; matches: number };
    traits: string[];
    availability: string;
}

interface PlayerTransferDetailModalProps {
    player: Player | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function PlayerTransferDetailModal({ player, isOpen, onOpenChange }: PlayerTransferDetailModalProps) {
    if (!player) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-xl">
                                {player.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl">{player.name}</DialogTitle>
                            <DialogDescription>{player.club} • {player.position} • {player.age} anos</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Coluna da Esquerda */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Informações Gerais</h4>
                            <div className="space-y-2 text-sm p-3 bg-muted/50 rounded-lg">
                                <div className="flex justify-between"><span>Overall:</span><span className="font-medium flex items-center"><Star className="h-4 w-4 mr-1 text-yellow-500" />{player.overall}</span></div>
                                <div className="flex justify-between"><span>Potencial:</span><span className="font-medium">{player.potential}</span></div>
                                <div className="flex justify-between"><span>Valor de Mercado:</span><span className="font-medium text-green-500">{player.value}</span></div>
                                <div className="flex justify-between"><span>Salário Atual:</span><span className="font-medium">{player.wage}</span></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Características</h4>
                            <div className="flex flex-wrap gap-2">
                                {player.traits.map((trait, index) => (
                                    <Badge key={index} variant="secondary">{trait}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Coluna da Direita */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Estatísticas da Temporada</h4>
                            <div className="space-y-2 text-sm p-3 bg-muted/50 rounded-lg">
                                <div className="flex justify-between"><span>Gols:</span><span className="font-medium">{player.stats.goals}</span></div>
                                <div className="flex justify-between"><span>Assistências:</span><span className="font-medium">{player.stats.assists}</span></div>
                                <div className="flex justify-between"><span>Jogos:</span><span className="font-medium">{player.stats.matches}</span></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Status de Transferência</h4>
                            <Badge variant={player.availability === 'Disponível' ? 'default' : 'destructive'}>{player.availability}</Badge>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline"><Target className="h-4 w-4 mr-2" />Observar Jogador</Button>
                    <Button><UserPlus className="h-4 w-4 mr-2" />Fazer Proposta</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}