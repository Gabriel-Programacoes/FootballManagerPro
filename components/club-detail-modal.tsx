"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Club } from "@/data/club-data";
import { Player, mockPlayers } from "@/data/player-data";
import { clubDetails, ClubDetails } from "@/data/club-details"; // Importa o tipo ClubDetails
import { formatCompactNumber } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface ClubDetailModalProps {
    club: Club | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (clubId: string) => void;
}

// Perfil Padrão para ser usado como fallback
const defaultDetails: ClubDetails = {
    reputation: 'Nacional',
    difficulty: 'Médio',
    objectives: { league: 'Terminar no meio da tabela', cup: 'Fazer uma boa campanha' },
    strengths: ['Jogo Coletivo'],
    weaknesses: ['Orçamento Limitado'],
    challenges: ['Surpreender os grandes e se estabelecer na liga.']
};

export function ClubDetailModal({ club, isOpen, onOpenChange, onConfirm }: ClubDetailModalProps) {
    if (!club) return null;

    // Se clubDetails[club.id] não for encontrado, usa o defaultDetails.
    const details = clubDetails[club.id] || defaultDetails;

    const keyPlayers = club.playerIds
        .map(id => mockPlayers.find(p => p.id === id))
        .filter((p): p is Player => !!p)
        .sort((a, b) => b.overall - a.overall)
        .slice(0, 3);

    const totalValue = club.playerIds.reduce((sum, id) => {
        const player = mockPlayers.find(p => p.id === id);
        return sum + (player?.contract.value || 0);
    }, 0);
    const transferBudget = totalValue * 0.30;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{club.name}</DialogTitle>
                    <DialogDescription>Visão geral do clube e desafios da carreira.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Orçamento</p>
                            <p className="font-bold text-lg text-green-500">€ {formatCompactNumber(transferBudget)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Reputação</p>
                            <Badge variant="secondary">{details.reputation}</Badge>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Dificuldade</p>
                            <Badge variant={details.difficulty === 'Fácil' || details.difficulty === 'Muito Fácil' ? 'default' : 'destructive'}>{details.difficulty}</Badge>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="font-semibold">Objetivos da Diretoria</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            <li>{details.objectives.league}</li>
                            <li>{details.objectives.cup}</li>
                            {details.objectives.continental && <li>{details.objectives.continental}</li>}
                        </ul>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-green-600">Pontos Fortes</h4>
                            <div className="flex flex-wrap gap-1">
                                {details.strengths.map(item => <Badge key={item} variant="outline">{item}</Badge>)}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-red-600">Pontos Fracos</h4>
                            <div className="flex flex-wrap gap-1">
                                {details.weaknesses.map(item => <Badge key={item} variant="outline">{item}</Badge>)}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold">Craques do Time</h4>
                        <div className="flex justify-around">
                            {keyPlayers.map(p => (
                                <div key={p.id} className="text-center">
                                    <p className="font-bold">{p.name.split(' ').pop()}</p>
                                    <p className="text-xs text-muted-foreground">{p.position} ({p.overall})</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold">Desafios da Carreira</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {details.challenges.map(item => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                </div>
                <DialogFooter className="sm:justify-between pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        <X className="mr-2 h-4 w-4"/> Cancelar
                    </Button>
                    <Button onClick={() => onConfirm(club.id)}>
                        <Check className="mr-2 h-4 w-4"/> Aceitar Desafio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}