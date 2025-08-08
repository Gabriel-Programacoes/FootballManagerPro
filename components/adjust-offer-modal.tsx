"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Handshake, Send } from "lucide-react";

interface Negotiation {
    player: string;
    club: string;
    offer: string;
}

interface AdjustOfferModalProps {
    negotiation: Negotiation | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function AdjustOfferModal({ negotiation, isOpen, onOpenChange }: AdjustOfferModalProps) {
    if (!negotiation) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2"><Handshake /> Ajustar Oferta</DialogTitle>
                    <DialogDescription>Apresente uma nova proposta por {negotiation.player}.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">A última oferta foi de <span className="font-bold text-foreground">{negotiation.offer}</span>.</p>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="value">Novo Valor (em milhões)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                            <Input type="number" id="value" placeholder="125" className="pl-6 font-mono" />
                        </div>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="clauses">Cláusulas Adicionais</Label>
                        <p className="text-xs text-muted-foreground">Ex: +10% de futura venda, bónus por golos, etc.</p>
                        <Input id="clauses" placeholder="Ex: +10% de futura venda" />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={() => onOpenChange(false)}>
                        <Send className="h-4 w-4 mr-2" /> Enviar Nova Proposta
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}