"use client";

import { useCareer } from "@/contexts/career-context";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

export function CareerGuard({ children }: { children: React.ReactNode }) {
    const { hasCareer, isLoading } = useCareer(); // Pega o novo estado de loading
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Só toma a decisão DEPOIS que o carregamento inicial terminar
        if (!isLoading) {
            if (!hasCareer && pathname !== '/team-select') {
                router.replace('/team-select');
            }
        }
    }, [hasCareer, isLoading, pathname, router]);

    if (isLoading) {
        // Pode mostrar um loader de tela inteira aqui se quiser
        return <div className="flex h-screen w-full items-center justify-center">Carregando...</div>;
    }

    if (pathname === '/team-select') {
        return <>{children}</>;
    }

    if (hasCareer) {
        return <>{children}</>;
    }

    return null;
}