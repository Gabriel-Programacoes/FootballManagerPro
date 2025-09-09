"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, UserPlus, Globe } from "lucide-react";
import { cn, formatCompactNumber } from "@/lib/utils";
import { AvailableScout } from "@/lib/game-data"; // Importar o tipo partilhado

// --- PROPRIEDADES DO MODAL ---
interface HireScoutModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onHire: (scout: AvailableScout) => void; // A função onHire espera o olheiro disponível
    availableScouts: AvailableScout[]; // O modal recebe a lista de olheiros do contexto
}

export function HireScoutModal({ isOpen, onOpenChange, onHire, availableScouts }: HireScoutModalProps) {

    // A única responsabilidade do modal é chamar a função 'onHire' quando o botão é clicado.
    const handleHire = (scoutToHire: AvailableScout) => {
        onHire(scoutToHire);
    };

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
                    {/* O modal agora renderiza a lista de olheiros que recebeu via props */}
                    {availableScouts && availableScouts.length > 0 ? (
                        availableScouts.map(scout => (
                            <Card key={scout.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h3 className="font-semibold">{scout.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center"><Globe className="h-4 w-4 mr-1"/>{scout.nationality}</span>
                                                <div className="flex items-center">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={cn("h-4 w-4", i < scout.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20")} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="secondary">{scout.specialty}</Badge>
                                        <div className="flex flex-col items-end gap-1">
                                            <p className="text-sm font-semibold text-green-500">
                                                €{formatCompactNumber(scout.cost)}
                                            </p>
                                            <Button size="sm" onClick={() => handleHire(scout)}>
                                                <UserPlus className="h-4 w-4 mr-2" /> Contratar
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