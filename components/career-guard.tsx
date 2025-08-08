// components/career-guard.tsx

"use client";

import { useCareer } from "@/contexts/career-context";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar"; // Importamos a Sidebar aqui

// Criamos um componente interno para o layout principal do jogo
function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AppSidebar />
            <main className="ml-72 flex h-screen flex-col">
                <header className="flex h-16 shrink-0 items-center border-b bg-background px-4 lg:hidden">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold">⚽ Football Manager Pro</h2>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </div>
            </main>
        </>
    );
}

export function CareerGuard({ children }: { children: React.ReactNode }) {
    const { hasCareer, isLoading } = useCareer();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicPage = pathname === '/' || pathname === '/team-select' || pathname === '/career-menu';

    useEffect(() => {
        // Se a carreira não foi carregada, não há carreira e a página não é pública, redireciona.
        if (!isLoading && !hasCareer && !isPublicPage) {
            router.replace('/team-select');
        }
    }, [hasCareer, isLoading, isPublicPage, pathname, router]);

    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center">Carregando...</div>;
    }

    // Se for uma página pública, renderiza o conteúdo diretamente, sem o layout do jogo.
    if (isPublicPage) {
        return <>{children}</>;
    }

    // Se for uma página privada e o usuário tem uma carreira, renderiza o conteúdo DENTRO do layout do jogo.
    if (hasCareer) {
        return <AppLayout>{children}</AppLayout>;
    }

    // Enquanto redireciona ou em caso de fallback, mostra um loader.
    return <div className="flex h-screen w-full items-center justify-center">Carregando...</div>;
}