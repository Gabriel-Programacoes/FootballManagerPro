// app/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Gamepad2, Trophy } from "lucide-react";
import Link from "next/link";
import { useCareer } from "@/contexts/career-context";

export default function LandingPage() {
    const { hasCareer } = useCareer();

    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="space-y-4">
                <Trophy className="mx-auto h-16 w-16 text-primary" />
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
                    Football Manager Pro
                </h1>
                <p className="max-w-md text-muted-foreground">
                    Assuma o controle do seu clube favorito, gerencie o elenco, táticas e finanças,
                    e leve seu time à glória.
                </p>
            </div>
            <div className="mt-8 flex gap-4">
                {hasCareer ? (
                    <Button asChild size="lg">
                        <Link href="/dashboard">
                            <Gamepad2 className="mr-2 h-5 w-5" />
                            Continuar Carreira
                        </Link>
                    </Button>
                ) : (
                    <Button asChild size="lg">
                        <Link href="/team-select">
                            <Trophy className="mr-2 h-5 w-5" />
                            Iniciar Nova Carreira
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}