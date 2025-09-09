"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Club } from "@/app/team-select/page";
import { formatCompactNumber } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// --- NOVAS INTERFACES PARA OS DADOS VINDOS DA API ---
interface ClubDetailsFromAPI {
    reputation: string;
    difficulty: string;
    objectives: {
        league: string;
        cup: string;
        continental?: string;
    };
    strengths: string[];
    weaknesses: string[];
    challenges: string[];
}

interface KeyPlayer {
    name: string;
    position: string;
    overall: number;
}

interface FullClubDetails {
    details: ClubDetailsFromAPI;
    keyPlayers: KeyPlayer[];
    transferBudget: number;
}


interface ClubDetailModalProps {
    club: Club | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (club: Club) => void;
}

export function ClubDetailModal({ club, isOpen, onOpenChange, onConfirm }: ClubDetailModalProps) {
    const [details, setDetails] = useState<FullClubDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && club) {
            const fetchClubDetails = async () => {
                setIsLoading(true);
                setDetails(null);
                try {
                    const response = await fetch(`/api/clubs/${club.id}`);
                    if (!response.ok) {
                        throw new Error("Falha ao buscar detalhes do clube.");
                    }
                    const data: FullClubDetails = await response.json();
                    setDetails(data);
                } catch (error) {
                    console.error(error);
                    // Em caso de erro, podemos fechar o modal ou mostrar uma mensagem
                    onOpenChange(false);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchClubDetails();
        }
    }, [isOpen, club, onOpenChange]);

    const handleConfirm = () => {
        if (club) {
            onConfirm(club);
            toast.success(`Bem-vindo ao ${club.name}!`, {
                description: "Sua carreira como manager começa agora. Boa sorte!",
                duration: 5000,
            });
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (!details) {
            return <div className="h-64 text-center">Não foi possível carregar os detalhes do clube.</div>;
        }

        return (
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Orçamento</p>
                        <p className="font-bold text-lg text-green-500">€ {formatCompactNumber(details.transferBudget)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Reputação</p>
                        <Badge variant="secondary">{details.details.reputation}</Badge>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Dificuldade</p>
                        <Badge variant={details.details.difficulty.includes('Fácil') ? 'default' : 'destructive'}>{details.details.difficulty}</Badge>
                    </div>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h4 className="font-semibold">Objetivos da Diretoria</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                        <li>{details.details.objectives.league}</li>
                        <li>{details.details.objectives.cup}</li>
                        {details.details.objectives.continental && <li>{details.details.objectives.continental}</li>}
                    </ul>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-green-600">Pontos Fortes</h4>
                        <div className="flex flex-wrap gap-1">
                            {details.details.strengths.map(item => <Badge key={item} variant="outline">{item}</Badge>)}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-red-600">Pontos Fracos</h4>
                        <div className="flex flex-wrap gap-1">
                            {details.details.weaknesses.map(item => <Badge key={item} variant="outline">{item}</Badge>)}
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h4 className="font-semibold">Craques do Time</h4>
                    <div className="flex justify-around">
                        {details.keyPlayers.map(p => (
                            <div key={p.name} className="text-center">
                                <p className="font-bold">{p.name.split(' ').pop()}</p>
                                <p className="text-xs text-muted-foreground">{p.position} ({p.overall})</p>
                            </div>
                        ))}
                    </div>
                </div>
                <Separator />
                <div className="space-y-2">
                    <h4 className="font-semibold">Desafios da Carreira</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {details.details.challenges.map(item => <li key={item}>{item}</li>)}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{club?.name}</DialogTitle>
                    <DialogDescription>Visão geral do clube e desafios da carreira.</DialogDescription>
                </DialogHeader>
                {renderContent()}
                <DialogFooter className="sm:justify-between pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        <X className="mr-2 h-4 w-4"/> Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading || !details}>
                        <Check className="mr-2 h-4 w-4"/> Aceitar Desafio
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}