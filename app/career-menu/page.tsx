"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Play, Save, Settings, Trophy, Calendar, Trash2, Plus, ArrowLeft, Clock, Award } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCareer } from "@/contexts/career-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CareerMenuPage() {
    const router = useRouter();
    // Usamos os dados e funções do nosso contexto real
    const { careers, loadCareer, deleteCareer } = useCareer();

    // Função para formatar a data (pode ser movida para utils.ts no futuro)
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-muted/40">
            {/* Header */}
            <div className="bg-background shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar
                            </Button>
                            <div className="flex items-center space-x-3">
                                <Trophy className="h-8 w-8 text-primary" />
                                <div>
                                    <h1 className="text-2xl font-bold">Football Manager Pro</h1>
                                    <p className="text-sm text-muted-foreground">Menu Principal</p>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurações
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Menu Principal */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Play className="h-5 w-5" />Ações Principais</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button className="w-full justify-start h-12" asChild>
                                    <Link href="/team-select">
                                        <Plus className="h-5 w-5 mr-3" />
                                        <div className="text-left">
                                            <div className="font-semibold">Nova Carreira</div>
                                            <div className="text-xs opacity-90">Comece uma nova jornada</div>
                                        </div>
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-12"
                                    disabled={careers.length === 0}
                                    onClick={() => careers.length > 0 && loadCareer(0)}
                                >
                                    <Play className="h-5 w-5 mr-3" />
                                    <div className="text-left">
                                        <div className="font-semibold">Continuar Última</div>
                                        <div className="text-xs text-muted-foreground">
                                            {careers.length > 0 ? careers[0].clubName : 'Nenhum save disponível'}
                                        </div>
                                    </div>
                                </Button>
                                {/* O botão "Carregar Jogo" pode ser implementado no futuro para mostrar esta mesma lista */}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Lista de Saves */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Save className="h-5 w-5" />
                                        Suas Carreiras ({careers.length})
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {careers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">Nenhuma carreira iniciada</h3>
                                        <p className="text-muted-foreground mb-6">Comece sua jornada como técnico criando uma nova carreira</p>
                                        <Button asChild>
                                            <Link href="/team-select">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Criar Nova Carreira
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {careers.map((save, index) => (
                                            <Card key={index} className="hover:shadow-md transition-shadow border">
                                                <CardContent className="p-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4">
                                                            <Avatar className="h-16 w-16">
                                                                <AvatarFallback className="text-lg font-bold">
                                                                    {save.clubName.split(' ').map(n => n[0]).join('')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="space-y-1">
                                                                <h3 className="text-xl font-bold">{save.saveName}</h3>
                                                                <p className="text-sm text-muted-foreground">Técnico: {save.clubName}</p>
                                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                                    <span className="flex items-center gap-1"><Award className="h-3 w-3" />{save.clubName}</span>
                                                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />2024/25</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <div className="text-right space-y-1">
                                                                <div className="flex items-center space-x-4 text-sm">
                                                                    <div className="flex items-center gap-1">
                                                                        <Trophy className="h-3 w-3 text-yellow-600" />
                                                                        <span className="font-medium">0</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="h-3 w-3 text-blue-600" />
                                                                        <span className="font-medium">0h</span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Criado: {formatDate(new Date().toISOString())}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col space-y-2">
                                                                <Button size="sm" onClick={() => loadCareer(index)}>
                                                                    <Play className="h-4 w-4 mr-1" />Continuar
                                                                </Button>
                                                                <div className="flex space-x-1">
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button size="icon" variant="outline" className="text-destructive hover:text-destructive">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Excluir Carreira</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Tem certeza que deseja excluir a carreira "{save.saveName}"? Esta ação não pode ser desfeita.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                <AlertDialogAction onClick={() => deleteCareer(index)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
)
}