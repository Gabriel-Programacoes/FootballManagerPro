// components/negotiation-detail-modal.tsx

"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Handshake, Check, X } from "lucide-react";
import { Negotiation } from "@/lib/game-data";
import { useCareer } from "@/contexts/career-context";
import { useState } from "react";
import { AdjustOfferModal } from "./adjust-offer-modal";
import { formatCompactNumber } from "@/lib/utils";
import { DollarSign, Repeat, Percent } from "lucide-react"

interface NegotiationDetailModalProps {
    negotiation: Negotiation | null; // Usa o tipo importado
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;

}

export function NegotiationDetailModal({ negotiation, isOpen, onOpenChange }: NegotiationDetailModalProps) {
    const { cancelNegotiation, squad, updateNegotiation, acceptAiOffer, rejectAiOffer, negotiateAiOffer } = useCareer();
    const [isAdjustingOffer, setIsAdjustingOffer] = useState(false);

    if (!negotiation) return null;

    const isCounterOffer = negotiation.status === 'Contraproposta';

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-xl">
                                    {negotiation.playerName.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-2xl">Detalhes da Negociação</DialogTitle>
                                <DialogDescription>Proposta por {negotiation.playerName} {negotiation.aiClub ? `(${negotiation.aiClub.name})` : '(Contrato Profissional)'}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm"><span>Status:</span><Badge variant={isCounterOffer ? "default" : "secondary"}>{negotiation.status}</Badge></div>
                            <div className="flex justify-between text-sm"><span>Prazo Final:</span><span className="font-medium">{new Date(negotiation.deadline).toLocaleDateString()}</span></div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Histórico da Negociação</h4>
                            <div className="border rounded-lg p-3 text-sm space-y-3 max-h-48 overflow-y-auto">
                                {negotiation.offerHistory.map((offer, index) => {
                                    const swapPlayer = squad.find(p => p.id === offer.swapPlayerId);
                                    return (
                                        <div key={index}>
                                            <p className="font-semibold mb-1.5 border-b pb-1">{index % 2 === 0 ? "Sua Oferta" : "Contra-Proposta do Clube"}</p>
                                            <div className="space-y-1 text-muted-foreground">
                                                {typeof offer.value === 'number' && (
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4 text-green-500" />
                                                        <span>Valor: <span className="font-mono text-foreground">€ {formatCompactNumber(offer.value)}</span></span>
                                                    </div>
                                                )}
                                                {swapPlayer && (
                                                    <div className="flex items-center gap-2">
                                                        <Repeat className="h-4 w-4 text-blue-500" />
                                                        <span>Troca: <span className="font-semibold text-foreground">{swapPlayer.name}</span></span>
                                                    </div>
                                                )}
                                                {offer.sellOnClause && offer.sellOnClause > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <Percent className="h-4 w-4 text-purple-500" />
                                                        <span>Cláusula de Revenda: <span className="font-semibold text-foreground">{offer.sellOnClause}%</span></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )})}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between pt-4">
                        {/* Mostra botões diferentes dependendo de quem iniciou a negociação */}
                        {negotiation.initiatedBy === 'user' ? (
                            <>
                                <Button variant="destructive" onClick={() => {cancelNegotiation(negotiation.id); onOpenChange(false);}}>
                                    <X className="h-4 w-4 mr-2" />
                                    Retirar Proposta
                                </Button>
                                <div className="flex gap-2">
                                    {isCounterOffer && (
                                        <Button variant="secondary" onClick={() => {
                                            const lastOffer = negotiation.offerHistory[negotiation.offerHistory.length - 1];
                                            updateNegotiation(negotiation.id, {
                                                value: lastOffer.value,
                                                swapPlayerId: lastOffer.swapPlayerId,
                                                sellOnClause: lastOffer.sellOnClause
                                            });
                                            onOpenChange(false);
                                        }}>
                                            <Check className="h-4 w-4 mr-2" />
                                            Aceitar Contraproposta
                                        </Button>
                                    )}
                                    <Button onClick={() => setIsAdjustingOffer(true)}>
                                        <Handshake className="h-4 w-4 mr-2" />
                                        {isCounterOffer ? "Fazer Nova Oferta" : "Ajustar Oferta"}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex w-full justify-end gap-2">
                                <Button variant="destructive" onClick={() => {rejectAiOffer(negotiation.id); onOpenChange(false);}}>
                                    <X className="h-4 w-4 mr-2" />
                                    Rejeitar
                                </Button>
                                <Button variant="secondary" onClick={() => setIsAdjustingOffer(true)}>
                                    <Handshake className="h-4 w-4 mr-2" />
                                    Fazer Contraproposta
                                </Button>
                                <Button onClick={() => {acceptAiOffer(negotiation.id); onOpenChange(false);}}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Aceitar Proposta
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AdjustOfferModal
                negotiation={negotiation}
                squad={squad}
                isOpen={isAdjustingOffer}
                onOpenChange={setIsAdjustingOffer}
                onConfirm={(offer) => {
                    if (negotiation.initiatedBy === 'user') {
                        updateNegotiation(negotiation.id, offer);
                    } else {
                        negotiateAiOffer(negotiation.id, offer);
                    }
                    setIsAdjustingOffer(false);
                }}
            />
        </>
    );
}