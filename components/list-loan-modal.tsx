// components/list-loan-modal.tsx

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Send } from "lucide-react";
import { Player } from "@/app/squad/page";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface LoanConditions {
    durationInYears: 1 | 2;
    hasOptionToBuy: boolean;
    hasObligationToBuy: boolean;
}

interface ListLoanModalProps {
    player: Player | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (playerId: string, conditions: LoanConditions) => void;
}

export function ListLoanModal({ player, isOpen, onOpenChange, onConfirm }: ListLoanModalProps) {
    const [duration, setDuration] = useState<"1" | "2">("1");
    const [optionToBuy, setOptionToBuy] = useState(false);
    const [obligationToBuy, setObligationToBuy] = useState(false);

    if (!player) return null;

    const handleConfirm = () => {
        onConfirm(player.id, {
            durationInYears: parseInt(duration, 10) as 1 | 2,
            hasOptionToBuy: optionToBuy,
            hasObligationToBuy: obligationToBuy,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2"><Send /> Listar para Empréstimo</DialogTitle>
                    <DialogDescription>Defina as condições de empréstimo para {player.name}.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Duração do Empréstimo</Label>
                        <Select value={duration} onValueChange={(value: "1" | "2") => setDuration(value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Ano</SelectItem>
                                <SelectItem value="2">2 Anos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <Label htmlFor="option-buy">Incluir Opção de Compra?</Label>
                            <Switch id="option-buy" checked={optionToBuy} onCheckedChange={setOptionToBuy} />
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                            <Label htmlFor="obligation-buy">Incluir Obrigação de Compra?</Label>
                            <Switch id="obligation-buy" checked={obligationToBuy} onCheckedChange={setObligationToBuy} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button>
                                <Send className="h-4 w-4 mr-2" /> Confirmar Listagem
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Empréstimo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Você está prestes a disponibilizar {player.name} para um empréstimo de {duration} ano(s).
                                    {optionToBuy && " A proposta incluirá uma opção de compra."}
                                    {obligationToBuy && " A proposta incluirá uma obrigação de compra."}
                                    <br/><br/>Deseja continuar?
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