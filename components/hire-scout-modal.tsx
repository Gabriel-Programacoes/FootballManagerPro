"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, UserPlus, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// --- TIPOS E GERADOR DE OLHEIROS ---
interface AvailableScout {
    id: number;
    name: string;
    nationality: string;
    rating: number; // 1-5
    specialty: string;
    cost: string;
}

interface HireScoutModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onHire: (scout: AvailableScout) => void;
}

// "Fábrica" de Olheiros: Gera uma lista de candidatos aleatórios
const generateAvailableScouts = (): AvailableScout[] => {
    const names = ["Lucas Ferreira", "Matteo Ricci", "Liam O'Connell", "Kenji Tanaka", "Diego Lopez"];
    const nationalities = ["Brasil", "Itália", "Irlanda", "Japão", "Espanha"];
    const specialties = ["Jovens Promessas", "Tática Defensiva", "Mercado Asiático", "Finalizadores", "Guarda-Redes"];

    return names.map((name, index) => {
        const rating = Math.floor(Math.random() * 3) + 3; // Gera olheiros de 3 a 5 estrelas
        const cost = (rating * 100) + Math.floor(Math.random() * 50);
        return {
            id: Date.now() + index, // ID único
            name,
            nationality: nationalities[index],
            rating,
            specialty: specialties[index],
            cost: `€${cost}K`
        };
    });
};

export function HireScoutModal({ isOpen, onOpenChange, onHire }: HireScoutModalProps) {
    const [availableScouts, setAvailableScouts] = useState<AvailableScout[]>([]);

    // Gera novos olheiros cada vez que o modal é aberto
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