"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {Trophy, Play, Users, Target, Star, ChevronRight, Globe, Award, Zap, TrendingUp} from 'lucide-react';
import Link from "next/link";
import { cn } from "@/lib/utils"; // Importamos o cn para classes condicionais

export default function LandingPage() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Adiciona um pequeno delay para a animação ser visível no carregamento
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const features = [
        { icon: Trophy, title: "Gerencie Grandes Clubes", description: "Assuma o controle de clubes lendários de todo o mundo", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
        { icon: Users, title: "Desenvolva Talentos", description: "Transforme jovens promessas em estrelas mundiais", color: "text-blue-500", bgColor: "bg-blue-500/10" },
        { icon: Target, title: "Conquiste Títulos", description: "Lute por troféus nas principais competições", color: "text-green-500", bgColor: "bg-green-500/10" },
        { icon: TrendingUp, title: "Evolua sua Carreira", description: "Construa um legado duradouro no futebol mundial", color: "text-purple-500", bgColor: "bg-purple-500/10" },
    ];

    const stats = [
        { label: "Países", value: "6+", icon: Globe },
        { label: "Ligas", value: "12+", icon: Award },
        { label: "Clubes", value: "200+", icon: Users },
        { label: "Jogadores", value: "5000+", icon: Star },
    ];

    const animationClass = (delay: string) => cn(
        'transition-all duration-1000',
        delay,
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-muted/30">
                <div className="relative max-w-7xl mx-auto px-6 py-20">
                    <div className="text-center space-y-8">
                        {/* Logo e Título */}
                        <div className={animationClass('delay-0')}>
                            <div className="flex items-center justify-center space-x-3 mb-6">
                                <div className="relative">
                                    <Trophy className="h-16 w-16 text-primary" />
                                    <div className="absolute -top-1 -right-1 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center ring-4 ring-muted/30">
                                        <Star className="h-3 w-3 text-white" />
                                    </div>
                                </div>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
                                Football Manager
                            </h1>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                                Pro
                            </h2>
                        </div>

                        {/* Subtítulo */}
                        <div className={animationClass('delay-300')}>
                            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                Viva a experiência completa de ser um técnico profissional.
                                Gerencie clubes lendários, desenvolva talentos e conquiste títulos históricos.
                            </p>
                            <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
                                <Badge variant="outline"><Zap className="h-3 w-3 mr-1" />Simulação Realista</Badge>
                                <Badge variant="outline"><Globe className="h-3 w-3 mr-1" />Ligas Mundiais</Badge>
                                <Badge variant="outline"><Trophy className="h-3 w-3 mr-1" />Múltiplas Competições</Badge>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className={`flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 ${animationClass('delay-500')}`}>
                            <Button size="lg" asChild className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                <Link href="/career-menu">
                                    <Play className="h-5 w-5 mr-2" />
                                    Começar Agora
                                </Link>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="px-8 py-4 text-lg font-semibold transition-all duration-300"
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Saiba Mais
                                <ChevronRight className="h-5 w-5 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="bg-background py-16">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <stat.icon className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                                <div className="text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="py-20 bg-muted/40">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">Sua Jornada Rumo à Glória</h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Descubra as funcionalidades que tornam Football Manager Pro a experiência mais completa.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-background">
                                <CardContent className="p-8">
                                    <div className="flex items-start space-x-4">
                                        <div className={`${feature.bgColor} p-3 rounded-lg`}>
                                            <feature.icon className={`h-6 w-6 ${feature.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Final */}
            <div className="bg-gradient-to-r from-primary to-green-600 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold text-primary-foreground mb-6">Pronto para Fazer História?</h2>
                    <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                        Junte-se a milhares de técnicos que já estão construindo seus legados. Sua jornada começa agora.
                    </p>
                    <Button
                        size="lg"
                        className="bg-background text-primary hover:bg-background/90 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        asChild
                    >
                        <Link href="/career-menu">
                            <Trophy className="h-5 w-5 mr-2" />
                            Iniciar Carreira Agora
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-foreground py-8">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Trophy className="h-6 w-6 text-primary" />
                        <span className="text-background font-semibold">Football Manager Pro</span>
                    </div>
                    <p className="text-muted-foreground text-sm">© 2024 Football Manager Pro. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    )
}