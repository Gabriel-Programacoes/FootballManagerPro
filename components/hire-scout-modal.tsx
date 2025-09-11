"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Globe } from "lucide-react";
import { cn, formatCompactNumber } from "@/lib/utils";
import { AvailableScout } from "@/lib/game-data";

// --- PROPRIEDADES DO MODAL ---
interface HireScoutModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onHire: (scout: AvailableScout) => void;
    availableScouts: AvailableScout[];
    currentScoutCount: number;
}

export function HireScoutModal({ isOpen, onOpenChange, onHire, availableScouts, currentScoutCount }: HireScoutModalProps) {
    // A função 'handleHire' era redundante, podemos chamar 'onHire' diretamente no onClick.

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Mercado de Olheiros</DialogTitle>
                    <DialogDescription>
                        Novos olheiros estão disponíveis no mercado a cada duas semanas.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* --- LÓGICA DE RENDERIZAÇÃO CORRIGIDA --- */}
                    {/* Verificamos se o array tem itens. Se tiver, fazemos o .map(). Senão, mostramos a mensagem. */}
                    {availableScouts && availableScouts.length > 0 ? (
                        availableScouts.map(scout => (
                            <Card key={scout.id}>
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex flex-col items-start gap-1">
                                        <h3 className="font-semibold">{scout.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="flex items-center"><Globe className="h-4 w-4 mr-1"/>{scout.nationality}</span>
                                            <div className="flex items-center">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={cn("h-4 w-4", i < scout.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20")} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="secondary">{scout.specialty}</Badge>
                                        <div className="flex flex-col items-end gap-1">
                                            <p className="text-sm font-semibold text-green-500">
                                                €{formatCompactNumber(scout.cost)}
                                            </p>
                                            <Button
                                                size="sm"
                                                onClick={() => onHire(scout)}
                                                disabled={currentScoutCount >= 5}
                                            >
                                                Contratar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Não há novos olheiros disponíveis no mercado de momento.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}