import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { CareerProvider } from "@/contexts/career-context"
import {CareerGuard} from "@/components/career-guard";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Football Manager Pro",
    description: "Gerencie seu clube de futebol dos sonhos",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
        <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark" // Definindo dark como padrão
            enableSystem
            disableTransitionOnChange
        >
            <CareerProvider>
                {/* A Sidebar é fixa e posicionada pelo seu próprio CSS */}
                <CareerGuard>
                    <AppSidebar />
                    {/* A área principal é empurrada para o lado e controla o scroll */}
                    <main className="ml-72 flex h-screen flex-col">
                        {/* O Header fica DENTRO da main, visível apenas no mobile */}
                        <header className="flex h-16 shrink-0 items-center border-b bg-background px-4 lg:hidden">
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold">⚽ Football Manager Pro</h2>
                            </div>
                        </header>
                        {/* O conteúdo da página fica em um container com scroll e padding */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {children}
                        </div>
                    </main>
                </CareerGuard>
            </CareerProvider>
        </ThemeProvider>
        </body>
        </html>
    )
}