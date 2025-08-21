"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, UserPlus, Star } from "lucide-react";
import { formatCompactNumber, translatePosition } from "@/lib/utils";
import { Player } from "@/app/squad/page";

interface PlayerTransferDetailModalProps {
    player: Player | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

// Função auxiliar para extrair e classificar os melhores atributos de um jogador
const getTopAttributes = (player: Player) => {
    const allAttributes = [
        { name: "Aceleração", value: player.attributes.pace.acceleration },
        { name: "Velocidade", value: player.attributes.pace.sprintSpeed },
        { name: "Finalização", value: player.attributes.shooting.finishing },
        { name: "Passe Curto", value: player.attributes.passing.shortPassing },
        { name: "Drible", value: player.attributes.dribbling.dribbling },
        { name: "Corte em Pé", value: player.attributes.defending.standingTackle },
        { name: "Fôlego", value: player.attributes.physical.stamina },
        { name: "Força", value: player.attributes.physical.strength },
    ];
    // Ordena os atributos do maior para o menor
    allAttributes.sort((a, b) => (b.value || 0) - (a.value || 0));
    // Retorna os 5 melhores
    return allAttributes.slice(0, 5);
};

export function PlayerTransferDetailModal({ player, isOpen, onOpenChange }: PlayerTransferDetailModalProps) {
    if (!player) return null;

    const topAttributes = getTopAttributes(player);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-3xl font-bold">{player.overall}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl">{player.name}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2">
                                <span>{player.age} anos</span>
                                <Badge variant="secondary">{translatePosition(player.position)}</Badge>
                                <span>{player.attributes.profile.team}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Coluna da Esquerda: Informações Gerais */}
                    <div className="space-y-4">
                        <h4 className="font-semibold">Informações de Mercado</h4>
                        <div className="space-y-2 text-sm p-3 bg-muted/50 rounded-lg">
                            <div className="flex justify-between">
                                <span>Overall:</span>
                                <span className="font-medium flex items-center">
                                    <Star className="h-4 w-4 mr-1 text-yellow-500" />{player.overall}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Potencial:</span>
                                {/* 'potential' precisa ser adicionado ao seu tipo Player e à API */}
                                <span className="font-medium">{player.potential || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Valor de Mercado:</span>
                                <span className="font-medium text-green-500">€ {formatCompactNumber(player.contract.value)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Salário Semanal:</span>
                                <span className="font-medium">€ {formatCompactNumber(player.contract.wage)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Coluna da Direita: Melhores Atributos */}
                    <div className="space-y-4">
                        <h4 className="font-semibold">Melhores Atributos</h4>
                        <div className="space-y-2">
                            {topAttributes.map(attr => (
                                <div key={attr.name} className="text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span>{attr.name}</span>
                                        <span className="font-semibold">{attr.value}</span>
                                    </div>
                                    <Progress value={attr.value || 0} className="h-2" />
                                </div>
                            ))}
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
