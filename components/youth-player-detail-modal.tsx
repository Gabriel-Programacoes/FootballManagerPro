"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, Dna } from "lucide-react";
import { useMemo } from "react";
import { YouthPlayer } from "@/lib/game-data";

// --- NOVO MAPA DE TRADUÇÃO ---
const attributeTranslations: { [key: string]: string } = {
    Pace: "Ritmo",
    Shooting: "Finalização",
    Passing: "Passe",
    Dribbling: "Drible",
    Defending: "Defesa",
    Physical: "Físico",
};

interface YouthPlayerDetailModalProps {
    player: YouthPlayer | null;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

// Componente para exibir uma barra de atributo
const AttributeRow = ({ name, value }: { name: string, value: number }) => (
    <div className="flex justify-between items-center text-sm">
        {/* Usamos a tradução aqui */}
        <span className="w-24">{attributeTranslations[name] || name}</span>
        <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${value}%` }} />
            </div>
            <span className="font-bold w-8 text-right">{value}</span>
        </div>
    </div>
);

export function YouthPlayerDetailModal({ player, isOpen, onOpenChange }: YouthPlayerDetailModalProps) {
    const { best, worst } = useMemo(() => {
        if (!player) return { best: [], worst: [] };

        // A lógica de ordenação está correta
        const sortedAttributes = Object.entries(player.attributes).sort(([, a], [, b]) => b - a);

        // A correção é como extraímos os dados
        return {
            best: sortedAttributes.slice(0, 3).map(([name, value]) => ({ name, value })),
            worst: sortedAttributes.slice(-2).reverse().map(([name, value]) => ({ name, value }))
        };
    }, [player]);

    if (!player) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-xl">
                                {player.name.split(" ").map((n: string) => n[0]).join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl">{player.name}</DialogTitle>
                            <DialogDescription>{player.position} • {player.age} anos</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* --- LAYOUT APRIMORADO COM FLEXBOX --- */}
                <div className="flex gap-6 py-4">
                    <div className="flex-1 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 text-primary">Análise Geral</h4>
                            <div className="space-y-2 text-sm p-3 bg-muted/50 rounded-lg">
                                <div className="flex justify-between"><span>Overall Atual:</span><span className="font-bold flex items-center"><Star className="h-4 w-4 mr-1 text-yellow-500" />{player.overall}</span></div>
                                <div className="flex justify-between"><span>Potencial:</span><span className="font-bold flex items-center"><TrendingUp className="h-4 w-4 mr-1 text-blue-500" />{`${player.potential[0]}-${player.potential[1]}`}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 text-green-500">Melhores Atributos</h4>
                            <div className="space-y-2 text-sm p-3 bg-green-500/10 rounded-lg">
                                {best.map(attr => <AttributeRow key={attr.name} name={attr.name} value={attr.value} />)}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-red-500">Piores Atributos</h4>
                            <div className="space-y-2 text-sm p-3 bg-red-500/10 rounded-lg">
                                {worst.map(attr => <AttributeRow key={attr.name} name={attr.name} value={attr.value} />)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button>Promover à Equipa Principal</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}