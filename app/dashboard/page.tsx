"use client";

import {useEffect, useMemo, useState} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Target, TrendingUp, Users, Loader2, ChevronRight } from "lucide-react";
import { useCareer } from "@/contexts/career-context";
import { formatCompactNumber } from "@/lib/utils";

// Interface para os dados que vêm da API do dashboard (sem alterações)
interface DashboardData {
  totalPlayers: number;
  averageAge: string;
  teamValue: number;
  weeklyWages: number;
  transferBudget: number;
  reputation: string;
}

export default function DashboardPage() {
  // --- HOOKS E ESTADOS ---
  const { managedClub, activeCareer, advanceTime, isLoading: isCareerLoading, schedule } = useCareer();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  // Efeito para buscar os dados iniciais do dashboard (sem alterações)
  useEffect(() => {
    if (!isCareerLoading && managedClub?.id) {
      const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/dashboard/${managedClub.id}`);
          if (!response.ok) throw new Error('Falha ao buscar dados do dashboard.');
          const data = await response.json();
          setDashboardData(data);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDashboardData();
    } else if (!isCareerLoading && !managedClub) {
      setIsLoading(false);
    }
  }, [managedClub, isCareerLoading]);

  // --- FUNÇÃO DO CORE LOOP ---
  // Handler para o botão que avança o tempo no jogo
  const handleAdvanceTime = async () => {
    setIsSimulating(true);
    await advanceTime();
    setIsSimulating(false);
  };

  const nextMatch = useMemo(() => {
    if (!activeCareer || schedule.length === 0) return null;

    const currentDate = new Date(activeCareer.currentDate);

    // Encontra a primeira partida no calendário que ainda não aconteceu
    return schedule.find(match => new Date(match.matchDate) >= currentDate);

  }, [activeCareer, schedule]);

  // --- RENDERIZAÇÃO ---
  if (isLoading || isCareerLoading || !activeCareer || !dashboardData) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  // Formata a data atual do jogo para uma exibição amigável
  const gameDate = new Date(activeCareer.currentDate).toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const getNewsColor = (type: string) => type === "positive" ? "border-l-green-500" : type === 'negative' ? "border-l-red-500" : "border-l-gray-500";

  return (
      <div className="space-y-6">
        {/* --- CABEÇALHO DINÂMICO --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Centro de Comando</h1>
            <p className="text-muted-foreground">{gameDate}</p>
          </div>
          <Button size="lg" onClick={handleAdvanceTime} disabled={isSimulating} className="w-full sm:w-auto">
            {isSimulating ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
                <ChevronRight className="h-5 w-5 mr-2" />
            )}
            {isSimulating ? 'Simulando...' : 'Avançar Dia'}
          </Button>
        </div>

        {/* --- PAINEL DE ESTATÍSTICAS (Dados da API) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Posição na Liga</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-blue-600">3º</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Orçamento</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">€ {formatCompactNumber(dashboardData.transferBudget)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Moral do Time</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-purple-600">Alto</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Reputação</CardTitle></CardHeader>
            <CardContent><Badge variant="secondary" className="text-lg px-3 py-1">{dashboardData.reputation}</Badge></CardContent>
          </Card>
        </div>

        {/* --- PRÓXIMA PARTIDA E OBJETIVOS (Dados dinâmicos do save) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Próxima Partida</CardTitle></CardHeader>
            <CardContent>
              {/* ALTERADO: Renderização condicional para a próxima partida */}
              {nextMatch ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {(nextMatch.isHomeGame ? nextMatch.awayTeam.name : nextMatch.homeTeam.name).split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{nextMatch.isHomeGame ? nextMatch.awayTeam.name : nextMatch.homeTeam.name}</p>
                          <p className="text-sm text-muted-foreground">{nextMatch.leagueName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{new Date(nextMatch.matchDate).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">15:00</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{nextMatch.isHomeGame ? 'Casa' : 'Fora'}</Badge>
                      <Badge variant="default">Competitivo</Badge>
                    </div>
                    <Button className="w-full">Preparar Tática</Button>
                  </div>
              ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Fim da temporada!</p>
                  </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Objetivos da Temporada</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeCareer.objectives.map((objective, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="font-medium">{objective.title}</span><span className="text-muted-foreground">{objective.progress}%</span></div>
                      <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${objective.progress}%` }} /></div>
                      <p className="text-xs text-muted-foreground">Recompensa: {objective.reward}</p>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- ÚLTIMOS RESULTADOS --- */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Últimos Resultados</CardTitle></CardHeader>
          <CardContent>
            {activeCareer.results.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma partida jogada nesta temporada.</p>
            ) : (
                <div className="space-y-3">
                  {activeCareer.results.slice(0, 5).map((match, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3"><span className="font-medium">{match.opponent}</span><span className="text-sm text-muted-foreground">{match.competition}</span></div>
                        <div className="flex items-center space-x-3"><span className="font-bold text-lg">{match.result}</span><Badge variant={match.points === 3 ? "default" : match.points === 1 ? "secondary" : "destructive"}>{match.points === 3 ? "V" : match.points === 1 ? "E" : "D"}</Badge></div>
                      </div>
                  ))}
                </div>
            )}
          </CardContent>
        </Card>

        {/* --- NOTÍCIAS DO CLUBE (Dados dinâmicos do save) --- */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Notícias do Clube</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeCareer.news.slice(0, 5).map((news, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${getNewsColor(news.type)} bg-muted/20`}>
                    <p className="font-medium">{news.title}</p>
                    <p className="text-sm text-muted-foreground">{new Date(news.date).toLocaleDateString('pt-BR')}</p>
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}