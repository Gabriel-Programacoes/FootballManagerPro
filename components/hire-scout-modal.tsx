// components/hire-scout-modal.tsx

"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, UserPlus, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { Scout } from "@/lib/game-data";

// --- TIPOS E GERADOR DE OLHEIROS ---
// Este é o tipo para um olheiro que está "à venda" no mercado. Não tem status ainda.
export type AvailableScout = {
    id: number;
    name: string;
    rating: number;
    specialty: string;
    nationality: string;
    cost: string;
    type: 'youth' | 'senior'; // Adicionamos o tipo aqui
};


interface HireScoutModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onHire: (scout: AvailableScout) => void; // A função onHire agora espera um AvailableScout
}

// "Fábrica" de Olheiros: Gera uma lista de candidatos aleatórios
const generateAvailableScouts = (): AvailableScout[] => {
    const names = ["Lucas Ferreira", "Matteo Ricci", "Liam O'Connell", "Kenji Tanaka", "Diego Lopez"];
    const nationalities = ["Brasil", "Itália", "Irlanda", "Japão", "Espanha"];
    const specialties = ["Jovens Promessas", "Tática Defensiva", "Mercado Asiático", "Finalizadores", "Guarda-Redes"];

    return names.map((name, index) => {
        const rating = Math.floor(Math.random() * 3) + 3;
        const cost = (rating * 100) + Math.floor(Math.random() * 50);
        return {
            id: Date.now() + index,
            name,
            nationality: nationalities[index],
            rating,
            specialty: specialties[index],
            cost: `€${cost}K`,
            type: Math.random() > 0.5 ? 'youth' : 'senior', // Gera tipos aleatórios por enquanto
        };
    });
};

export function HireScoutModal({ isOpen, onOpenChange, onHire }: HireScoutModalProps) {
    const [availableScouts, setAvailableScouts] = useState<AvailableScout[]>([]);

    useEffect(() => {
        if (isOpen) {
            setAvailableScouts(generateAvailableScouts());
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Mercado de Olheiros</DialogTitle>
                    <DialogDescription>Contrate novos talentos para a sua equipa de observação.</DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {availableScouts.map(scout => (
                        <Card key={scout.id}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h3 className="font-semibold">{scout.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            {/* @ts-ignore */}
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
                                    <div className="text-right">
                                        {/* @ts-ignore */}
                                        <p className="font-bold text-lg text-primary">{scout.cost}</p>
                                        <Badge variant="secondary">{scout.specialty}</Badge>
                                    </div>
                                    <Button onClick={() => onHire(scout)}>
                                        <UserPlus className="h-4 w-4 mr-2"/>
                                        Contratar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}