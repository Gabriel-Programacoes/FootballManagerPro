// app/layout.tsx

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CareerProvider } from "@/contexts/career-context"
import { CareerGuard } from "@/components/career-guard"; // Mantemos o guardião aqui
import { Toaster } from "sonner";
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
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <CareerProvider>
                <CareerGuard>
                    {children}
                </CareerGuard>
            </CareerProvider>
            <Toaster richColors />
        </ThemeProvider>
        </body>
        </html>
    )
}