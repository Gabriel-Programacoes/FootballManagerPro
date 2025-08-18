"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, Dna } from "lucide-react";
import { useMemo } from "react";

// --- NOVO MAPA DE TRADUÇÃO ---
const attributeTranslations: { [key: string]: string } = {
    Pace: "Ritmo",
    Shooting: "Finalização",
    Passing: "Passe",
    Dribbling: "Drible",
    Defending: "Defesa",
    Physical: "Físico",
};

// Definimos a "forma" do jogador da base que este modal espera
interface YouthPlayer {
    name: string;
    age: number;
    position: string;
    overall: number;
    potential: number;
    traits: string[];
    attributes: {
        Pace: number;
        Shooting: number;
        Passing: number;
        Dribbling: number;
        Defending: number;
        Physical: number;
    };
}

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
        if (!player) {
            return { best: [], worst: [] };
        }
        const sortedAttributes = Object.entries(player.attributes)
            .sort(([, a], [, b]) => b - a);

        return {
            best: sortedAttributes.slice(0, 3),
            worst: sortedAttributes.slice(-3).reverse()
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
                    {/* Coluna da Esquerda */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 text-primary">Análise Geral</h4>
                            <div className="space-y-2 text-sm p-3 bg-muted/50 rounded-lg">
                                <div className="flex justify-between"><span>Overall Atual:</span><span className="font-bold flex items-center"><Star className="h-4 w-4 mr-1 text-yellow-500" />{player.overall}</span></div>
                                <div className="flex justify-between"><span>Potencial:</span><span className="font-bold flex items-center"><TrendingUp className="h-4 w-4 mr-1 text-blue-500" />{player.potential}</span></div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Características</h4>
                            <div className="flex flex-wrap gap-2">
                                {player.traits.map((trait, index) => (
                                    <Badge key={index} variant="secondary"><Dna className="h-3 w-3 mr-1"/>{trait}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Coluna da Direita */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 text-green-500">Melhores Atributos</h4>
                            <div className="space-y-2 text-sm p-3 bg-green-500/10 rounded-lg">
                                {best.map(([name, value]) => <AttributeRow key={name} name={name} value={value as number} />)}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2 text-red-500">Piores Atributos</h4>
                            <div className="space-y-2 text-sm p-3 bg-red-500/10 rounded-lg">
                                {worst.map(([name, value]) => <AttributeRow key={name} name={name} value={value as number} />)}
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