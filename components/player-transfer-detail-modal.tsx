"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserPlus, Star } from "lucide-react";
import { formatCompactNumber, translatePosition } from "@/lib/utils";
import { Player } from "@/app/squad/page";
import { useCareer } from "@/contexts/career-context";
import { cn } from "@/lib/utils";

interface PlayerTransferDetailModalProps {
    player: Player | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onNegotiationStart: () => void;
}

const getTopAttributes = (player: Player) => {
    let allAttributes = [];
    const isGk = player.position.toUpperCase() === 'GK';

    if (isGk) {
        allAttributes = [
            { name: "Elasticidade (GOL)", value: player.attributes.goalkeeping.gkDiving },
            { name: "Reflexos (GOL)", value: player.attributes.goalkeeping.gkReflexes },
            { name: "Posicionamento (GOL)", value: player.attributes.goalkeeping.gkPositioning },
            { name: "Velocidade", value: player.attributes.pace.sprintSpeed },
            { name: "Força", value: player.attributes.physical.strength },
        ];
    } else {
        allAttributes = [
            { name: "Aceleração", value: player.attributes.pace.acceleration },
            { name: "Velocidade", value: player.attributes.pace.sprintSpeed },
            { name: "Finalização", value: player.attributes.shooting.finishing },
            { name: "Passe Curto", value: player.attributes.passing.shortPassing },
            { name: "Drible", value: player.attributes.dribbling.dribbling },
            { name: "Corte em Pé", value: player.attributes.defending.standingTackle },
            { name: "Fôlego", value: player.attributes.physical.stamina },
            { name: "Força", value: player.attributes.physical.strength },
        ];
    }

    // Filtra atributos nulos ou inválidos e ordena do maior para o menor
    return allAttributes
        .filter(attr => attr.value !== null && attr.value > 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 5); // Retorna os 5 melhores
};

export function PlayerTransferDetailModal({ player, isOpen, onOpenChange, onNegotiationStart }: PlayerTransferDetailModalProps) {
    const { startNegotiation } = useCareer();

    if (!player) return null;

    const handleMakeOffer = () => {
        const initialOffer = {
            value: player.contract.value,
        };
        startNegotiation(player, initialOffer);
        onOpenChange(false); // Fecha o modal de detalhes
        onNegotiationStart(); // Avisa a página para mudar para o separador de negociações
    };

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
                        <h4 className="font-semibold">{player.position.toUpperCase() === 'GK' ? 'Atributos de Goleiro' : 'Melhores Atributos'}</h4>
                        <div className="space-y-2">
                            {topAttributes.map(attr => (
                                <div key={attr.name} className="text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span>{attr.name}</span>
                                        <span className="font-semibold">{attr.value}</span>
                                    </div>
                                    <Progress
                                        value={attr.value || 0}
                                        className="h-2"
                                        indicatorClassName={cn(
                                            attr.value && attr.value >= 85 && "bg-green-500",
                                            attr.value && attr.value >= 70 && attr.value < 85 && "bg-yellow-500",
                                            attr.value && attr.value < 70 && "bg-red-500",
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleMakeOffer}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Fazer Proposta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}