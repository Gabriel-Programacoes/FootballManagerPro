"use client";

import { Player } from "@/app/squad/page";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCompactNumber, translatePreferredFoot } from "@/lib/utils";
import { ArrowRightLeft, Check, FileSignature, MoreVertical, Pencil, Send, ShieldOff, X, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useCareer } from "@/contexts/career-context";
import { ListTransferModal } from "./list-transfer-modal";
import { ListLoanModal } from "./list-loan-modal";
import { LoanListing } from "@/lib/game-data";

interface PlayerDetailModalProps {
    player: Player | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

const AttributeBar = ({ name, value }: { name: string; value: number | null }) => {
    if (value === null) return null;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{name}</span>
                <span className="font-semibold">{value}</span>
            </div>
            <Progress
                value={value}
                className={cn(
                    "h-2",
                    value >= 85 && "[&>div]:bg-green-600",
                    value >= 80 && value < 85 && "[&>div]:bg-green-400",
                    value >= 70 && value < 80 && "[&>div]:bg-yellow-500",
                    value < 70 && "[&>div]:bg-red-600"
                )}
            />
        </div>
    );
};

export function PlayerDetailModal({ player, isOpen, onOpenChange }: PlayerDetailModalProps) {
    const { managedClub } = useCareer();
    const { listPlayerForTransfer } = useCareer();
    const { listPlayerForLoan } = useCareer();

    const [blockProposals, setBlockProposals] = useState(false);
    const [isEditingNumber, setIsEditingNumber] = useState(false);
    const [jerseyNumber, setJerseyNumber] = useState("");
    const [isListTransferModalOpen, setIsListTransferModalOpen] = useState(false);
    const [isListLoanModalOpen, setIsListLoanModalOpen] = useState(false);

    useEffect(() => {
        if (player) {
            setJerseyNumber(String(player.jerseyNumber || ""));
            setIsEditingNumber(false);
        }
    }, [player]);

    if (!player) return null;

    const handleListForTransfer = (playerId: string, askingPrice: number) => {
        listPlayerForTransfer(playerId, askingPrice);
        // Adicionar feedback visual aqui (ex: um "toast") seria uma boa melhoria futura.
    };

    const handleListForLoan = (playerId: string, conditions: Omit<LoanListing, 'playerId' | 'isListed'>) => {
        listPlayerForLoan(playerId, conditions);
    };

    const getPositionColor = (position: Player['position']) => {
        if (["GOL"].includes(position)) return "bg-yellow-500 text-black";
        if (["LE", "ZAG", "LD"].includes(position)) return "bg-blue-500";
        if (["VOL", "ME", "MD", "MC", "MAT"].includes(position)) return "bg-green-500";
        if (["ATA", "SA", "PE", "PD"].includes(position)) return "bg-red-500";
        return "bg-white-500";
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent showCloseButton={false} className="sm:max-w-[700px] h-[90vh] flex flex-col">

                    <DialogHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-grow">
                                <DialogTitle className="text-2xl flex items-center gap-4">
                                    <span>{player.name}</span>
                                    <Badge className={getPositionColor(player.position)}>{player.position}</Badge>
                                </DialogTitle>
                                <DialogDescription>Ficha técnica completa e ações de gestão do jogador.</DialogDescription>
                            </div>

                            <div className="flex items-center space-x-2">
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações de Mercado</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => setIsListTransferModalOpen(true)}>
                                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                                            <span>Listar para Transferência</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setIsListLoanModalOpen(true)}>
                                            <Send className="mr-2 h-4 w-4"/>
                                            <span>Listar para Empréstimo</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Contrato</DropdownMenuLabel>
                                        <DropdownMenuItem>
                                            <FileSignature className="mr-2 h-4 w-4" />
                                            <span>Renovar Contrato</span>
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500 focus:bg-red-500/10 focus:text-red-600">
                                                    <X className="mr-2 h-4 w-4" />
                                                    <span>Rescindir Contrato</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Rescindir o contrato de {player.name} terá um custo financeiro significativo e o jogador deixará o clube imediatamente. Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                                                        Confirmar Rescisão
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Botão de fechar manual */}
                                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                                    <X className="h-5 w-5" />
                                    <span className="sr-only">Fechar</span>
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-4">
                        {/* --- Coluna Esquerda: Perfil e Ações --- */}
                        <div className="md:col-span-1 space-y-4">
                            <div className="flex items-center justify-center h-40 w-40 rounded-full bg-muted mx-auto"><span
                                className="text-6xl font-bold">{player.overall}</span></div>
                            <div className="space-y-2 text-sm text-center">
                                <p>Equipe: <span className="font-semibold">{managedClub?.name}</span></p>
                            </div>
                            <div className="border-t pt-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">Nº da Camisa</span>
                                    {!isEditingNumber ? (
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg">{jerseyNumber || "-"}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                                    onClick={() => setIsEditingNumber(true)}>
                                                <Pencil className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <Input value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)}
                                                   className="h-8 w-16 text-center" maxLength={2}/>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500"
                                                    onClick={() => setIsEditingNumber(false)}><Check
                                                className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                                                    onClick={() => setIsEditingNumber(false)}><Ban
                                                className="h-4 w-4"/></Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 text-sm border-t pt-2">
                                <div className="flex justify-between"><span>Idade:</span> <span
                                    className="font-semibold">{player.age}</span></div>
                                <div className="flex justify-between"><span>Pé Preferido:</span> <span
                                    className="font-semibold">{translatePreferredFoot(player.attributes.mentality.preferredFoot)}</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm border-t pt-2">
                                <div className="flex justify-between"><span>Valor:</span> <span
                                    className="font-semibold font-mono">€ {formatCompactNumber(player.contract.value)}</span>
                                </div>
                                <div className="flex justify-between"><span>Salário:</span> <span
                                    className="font-semibold font-mono">€ {formatCompactNumber(player.contract.wage)}/sem</span>
                                </div>
                            </div>
                            <div className="space-y-3 border-t pt-3">
                                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                    <label htmlFor="block-proposals"
                                           className="text-sm font-medium flex items-center gap-2"><ShieldOff
                                        className="h-4 w-4"/> Bloquear Propostas</label>
                                    <Switch id="block-proposals" checked={blockProposals}
                                            onCheckedChange={setBlockProposals}/>
                                </div>
                            </div>
                        </div>

                        {/* --- Coluna Direita: Atributos --- */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <h4 className="font-bold mb-2">Ritmo</h4>
                                    <div className="space-y-2">
                                        <AttributeBar name="Aceleração"
                                                      value={player.attributes.pace.acceleration}/>
                                        <AttributeBar name="Velocidade"
                                                      value={player.attributes.pace.sprintSpeed}/>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2">Finalização</h4>
                                    <div className="space-y-2">
                                        <AttributeBar name="Finalização"
                                                      value={player.attributes.shooting.finishing}/>
                                        <AttributeBar name="Pênaltis"
                                                      value={player.attributes.shooting.penalties}/>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2">Passe</h4>
                                    <div className="space-y-2">
                                        <AttributeBar name="Cruzamento"
                                                      value={player.attributes.passing.crossing}/>
                                        <AttributeBar name="Passe Curto"
                                                      value={player.attributes.passing.shortPassing}/>
                                        <AttributeBar name="Passe Longo"
                                                      value={player.attributes.passing.longPassing}/>
                                        <AttributeBar name="Falta"
                                                      value={player.attributes.passing.freeKickAccuracy}/>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2">Drible</h4>
                                    <div className="space-y-2">
                                        <AttributeBar name="Drible"
                                                      value={player.attributes.dribbling.dribbling}/>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2">Defesa</h4>
                                    <div className="space-y-2">
                                        <AttributeBar name="Noção Defensiva"
                                                      value={player.attributes.defending.defAwareness}/>
                                        <AttributeBar name="Carrinho"
                                                      value={player.attributes.defending.slidingTackle}/>
                                        <AttributeBar name="Dividida em Pé"
                                                      value={player.attributes.defending.standingTackle}/>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-2">Físico</h4>
                                    <div className="space-y-2">
                                        <AttributeBar name="Fôlego"
                                                      value={player.attributes.physical.stamina}/>
                                        <AttributeBar name="Força"
                                                      value={player.attributes.physical.strength}/>
                                        <AttributeBar name="Agressividade"
                                                      value={player.attributes.physical.aggression}/>
                                    </div>
                                </div>
                                {player.attributes.goalkeeping.gkReflexes != null && (
                                    <div className="col-span-2">
                                        <h4 className="font-bold mb-2">Goleiro</h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                            <AttributeBar name="Posicionamento"
                                                          value={player.attributes.goalkeeping.gkPositioning}/>
                                            <AttributeBar name="Reflexos"
                                                          value={player.attributes.goalkeeping.gkReflexes}/>
                                            <AttributeBar name="Elasticidade"
                                                          value={player.attributes.goalkeeping.gkDiving}/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ListTransferModal
            player={player}
            isOpen={isListTransferModalOpen}
            onOpenChange={setIsListTransferModalOpen}
            onConfirm={handleListForTransfer}
        />
            <ListLoanModal
                player={player}
                isOpen={isListLoanModalOpen}
                onOpenChange={setIsListLoanModalOpen}
                onConfirm={handleListForLoan}
            />
    </>
    );
}