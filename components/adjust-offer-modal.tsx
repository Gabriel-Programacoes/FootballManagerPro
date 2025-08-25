// components/adjust-offer-modal.tsx

"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Handshake, Send, Repeat, Percent } from "lucide-react";
import { Player } from "@/app/squad/page";
import { Negotiation, Offer } from "@/lib/game-data";
import { formatCompactNumber } from "@/lib/utils";

interface AdjustOfferModalProps {
    negotiation: Negotiation | null;
    squad: Player[];
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (offer: Omit<Offer, 'date' | 'offeredBy'>) => void;
}

export function AdjustOfferModal({ negotiation, squad, isOpen, onOpenChange, onConfirm }: AdjustOfferModalProps) {
    const [offerValue, setOfferValue] = useState("0");
    const [swapPlayerId, setSwapPlayerId] = useState<string>("none");
    const [sellOnClause, setSellOnClause] = useState([0]);

    useEffect(() => {
        // Pré-preenche o formulário com os dados da última oferta
        if (negotiation) {
            const lastOffer = negotiation.offerHistory[negotiation.offerHistory.length - 1];
            setOfferValue(String(lastOffer.value / 1_000_000)); // Converte de volta para milhões
            setSwapPlayerId(lastOffer.swapPlayerId || "none");
            setSellOnClause([lastOffer.sellOnClause || 0]);
        }
    }, [negotiation, isOpen]);

    if (!negotiation) return null;

    const handleConfirm = () => {
        const numericValue = parseFloat(offerValue) * 1_000_000;
        if (!isNaN(numericValue)) {
            onConfirm({
                value: numericValue,
                swapPlayerId: swapPlayerId === "none" ? undefined : swapPlayerId,
                sellOnClause: sellOnClause[0],
            });
            onOpenChange(false);
        } else {
            alert("Por favor, insira um valor monetário válido.");
        }
    };

    const selectedSwapPlayer = squad.find(p => p.id === swapPlayerId);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2"><Handshake /> Ajustar Proposta</DialogTitle>
                    <DialogDescription>Ajuste a sua proposta por {negotiation.playerName}.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Valor da Transferência */}
                    <div className="space-y-2">
                        <Label htmlFor="value">Valor da Transferência (em milhões)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                            <Input id="value" type="number" value={offerValue} onChange={(e) => setOfferValue(e.target.value)} className="pl-6 font-mono" />
                        </div>
                    </div>

                    {/* Troca de Jogadores */}
                    <div className="space-y-2">
                        <Label htmlFor="swap-player"><Repeat className="h-4 w-4 inline-block mr-2"/>Troca de Jogador (opcional)</Label>
                        <Select value={swapPlayerId} onValueChange={setSwapPlayerId}>
                            <SelectTrigger id="swap-player"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhum jogador</SelectItem>
                                {squad.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.overall}) - €{formatCompactNumber(p.contract.value)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedSwapPlayer && <p className="text-xs text-muted-foreground">O valor de {selectedSwapPlayer.name} será considerado na proposta.</p>}
                    </div>

                    {/* Cláusula de Revenda */}
                    <div className="space-y-2">
                        <Label htmlFor="sell-on"><Percent className="h-4 w-4 inline-block mr-2"/>Cláusula de futura venda (%)</Label>
                        <div className="flex items-center gap-4">
                            <Slider id="sell-on" value={sellOnClause} onValueChange={setSellOnClause} max={50} step={5} className="flex-1" />
                            <span className="font-bold w-12 text-center">{sellOnClause[0]}%</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleConfirm}>
                        <Send className="h-4 w-4 mr-2" /> Enviar Nova Proposta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}