"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

// Definimos a "forma" da negociação que este modal espera
interface Negotiation {
    player: string;
    club: string;
    offer: string;
    status: string;
    progress: number;
    deadline: string;
    lastUpdate: string;
}

interface NegotiationDetailModalProps {
    negotiation: Negotiation | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function NegotiationDetailModal({ negotiation, isOpen, onOpenChange }: NegotiationDetailModalProps) {
    if (!negotiation) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-xl">
                                {negotiation.player.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl">Detalhes da Negociação</DialogTitle>
                            <DialogDescription>Proposta por {negotiation.player} ({negotiation.club})</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm"><span>Oferta Atual:</span><span className="font-bold text-green-500">{negotiation.offer}</span></div>
                        <div className="flex justify-between text-sm"><span>Status:</span><Badge variant="secondary">{negotiation.status}</Badge></div>
                        <div className="flex justify-between text-sm"><span>Prazo Final:</span><span className="font-medium">{negotiation.deadline}</span></div>
                    </div>
                    <div>
                        {/* O <Label> agora funcionará corretamente */}
                        <Label htmlFor="progress">Progresso da Negociação ({negotiation.progress}%)</Label>
                        <Progress value={negotiation.progress} className="h-2 mt-1" id="progress" />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Histórico de Ofertas</h4>
                        <div className="border rounded-lg p-3 text-sm text-center text-muted-foreground">
                            <p>O histórico de propostas aparecerá aqui.</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}