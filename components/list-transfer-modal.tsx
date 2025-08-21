// components/list-transfer-modal.tsx

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, Send } from "lucide-react";
import { Player } from "@/app/squad/page";
import { formatCompactNumber } from "@/lib/utils";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface ListTransferModalProps {
    player: Player | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (playerId: string, askingPrice: number) => void;
}

export function ListTransferModal({ player, isOpen, onOpenChange, onConfirm }: ListTransferModalProps) {
    const [price, setPrice] = useState("");

    if (!player) return null;

    const handleConfirm = () => {
        const numericPrice = parseFloat(price) * 1_000_000; // Converte de milhões para número
        if (!isNaN(numericPrice) && numericPrice > 0) {
            onConfirm(player.id, numericPrice);
            onOpenChange(false);
        } else {
            alert("Por favor, insira um valor de venda válido.");
        }
    };

    const formattedPrice = formatCompactNumber(parseFloat(price) * 1_000_000);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2"><ArrowRightLeft /> Listar para Transferência</DialogTitle>
                    <DialogDescription>Defina o preço de venda para {player.name}.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Valor de mercado atual: <span className="font-bold text-foreground">€ {formatCompactNumber(player.contract.value)}</span>.
                    </p>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="value">Preço de Venda (em milhões)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                            <Input
                                type="number"
                                id="value"
                                placeholder="ex: 50.5"
                                className="pl-6 font-mono"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button disabled={!price || parseFloat(price) <= 0}>
                                <Send className="h-4 w-4 mr-2" /> Confirmar Listagem
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Listagem?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Você está prestes a colocar {player.name} na lista de transferências pelo valor de <span className="font-bold text-foreground">€ {formattedPrice}</span>. Esta ação irá notificar outros clubes do seu interesse em vender o jogador. Deseja continuar?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Editar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}