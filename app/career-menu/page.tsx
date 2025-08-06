// app/career-menu/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCareer } from "@/contexts/career-context";
import { PlusCircle, Play, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CareerMenuPage() {
    const { careers, loadCareer, deleteCareer } = useCareer();

    return (
        <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold">Gerenciar Carreiras</h1>
                    <p className="text-muted-foreground">Continue um jogo salvo ou inicie uma nova jornada.</p>
                </div>

                <div className="space-y-4">
                    {careers.length > 0 ? (
                        careers.map((career, index) => (
                            <Card key={index} className="flex items-center justify-between p-4">
                                <div>
                                    <h3 className="font-semibold">{career.saveName}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Técnico do {career.clubName}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => deleteCareer(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    <Button onClick={() => loadCareer(index)}>
                                        <Play className="mr-2 h-4 w-4" />
                                        Continuar
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <Card className="p-8 text-center">
                            <CardDescription>Nenhuma carreira salva encontrada. Comece uma nova!</CardDescription>
                        </Card>
                    )}
                </div>

                <Card className="bg-secondary">
                    <CardContent className="flex items-center justify-between p-4">
                        <p className="font-semibold">Pronto para um novo desafio?</p>
                        <Button asChild>
                            <Link href="/team-select">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Iniciar Nova Carreira
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}