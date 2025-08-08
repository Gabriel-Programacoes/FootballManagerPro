"use client"

import {
    Home,
    Users,
    ArrowLeftRight,
    GraduationCap,
    Trophy,
    Calendar,
    Settings,
    BarChart3,
    Target,
    FileText,
    Gamepad2,
    TrendingUp,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

const menuItems = [
    { title: "Centro de Comando", url: "/dashboard", icon: Home },
    { title: "Elenco", url: "/squad", icon: Users },
    { title: "Central de Transferências", url: "/transfers", icon: ArrowLeftRight },
    { title: "Academia", url: "/youth", icon: GraduationCap },
    { title: "Temporadas", url: "/seasons", icon: Calendar },
    { title: "Troféus", url: "/trophies", icon: Trophy },
]

const gameItems = [
    { title: "Próxima Partida", url: "/match", icon: Gamepad2 },
    { title: "Táticas", url: "/tactics", icon: Target },
    { title: "Treinamento", url: "/training", icon: TrendingUp },
]

const statsItems = [
    { title: "Estatísticas", url: "/stats", icon: BarChart3 },
    { title: "Relatórios", url: "/reports", icon: FileText },
]

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="h-10 w-10">
                        {/* Usando o placeholder de texto como alternativa */}
                        <AvatarFallback>RD</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">Red Devils FC</p>
                        <p className="text-sm text-muted-foreground">Temporada 2023/24</p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Gerenciamento</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Jogo</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {gameItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Análises</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {statsItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/settings">
                                <Settings className="h-4 w-4" />
                                <span>Configurações</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}