"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Trophy, Target, TrendingUp, Users, Plus, Coins, Loader2 } from "lucide-react";
import { useCareer } from "@/contexts/career-context";
import { formatCompactNumber } from "@/lib/utils";

// Interface para os dados que vêm da nossa API
interface DashboardData {
  totalPlayers: number;
  averageAge: string;
  teamValue: number;
  weeklyWages: number;
  transferBudget: number;
  reputation: string;
}

export default function DashboardPage() {
  const { managedClub, managedLeague, isLoading: isCareerLoading } = useCareer();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // --- DADOS DE PROTÓTIPO (Ainda não vêm do banco de dados) ---
  // Manteremos estes dados estáticos por enquanto para popular o novo layout.
  const nextMatch = { opponent: "Blue Lions FC", competition: "Premier Division", date: "15/08/2025", time: "16:30", venue: "Old Stadium", difficulty: "Difícil" };
  const recentResults = [
    { opponent: "Green Eagles", result: "2-1", competition: "Premier Division", points: 3 },
    { opponent: "Yellow Wolves", result: "1-3", competition: "Champions Cup", points: 0 },
    { opponent: "White Tigers", result: "0-0", competition: "Premier Division", points: 1 },
  ];
  const objectives = [
    { title: "Terminar no Top 4", progress: 75, reward: "€10M + Prestígio" },
    { title: "Chegar às Semifinais da Copa", progress: 50, reward: "€5M" },
  ];
  const recentNews = [
    { title: "Atacante marca hat-trick na vitória", date: "12/08/2025", type: "positive" },
    { title: "Capitão renova contrato até 2027", date: "08/08/2025", type: "positive" },
    { title: "Lesão de meio-campista preocupa comissão", date: "05/08/2025", type: "negative" },
  ];
  // --- FIM DOS DADOS DE PROTÓTIPO ---

  if (isLoading || isCareerLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!managedClub || !managedLeague || !dashboardData) {
    return <div className="flex h-full w-full items-center justify-center"><p className="text-muted-foreground">Não foi possível carregar os dados da carreira.</p></div>;
  }

  // Dados que serão dinâmicos no futuro, mas por enquanto usam uma mistura
  const seasonSummary = { leaguePosition: "3º lugar", championsLeague: "Oitavas de Final", nationalCup: "Quartas de Final" };
  const clubInfo = { morale: "Alto", position: "3º", points: 65 };

  const getNewsColor = (type: string) => type === "positive" ? "border-l-green-500" : "border-l-red-500";

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Centro de Comando</h1>
            <p className="text-muted-foreground">Bem-vindo de volta, Técnico! Gerencie seu {managedClub.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              <span className="font-bold text-lg">€ {formatCompactNumber(dashboardData.transferBudget)}</span>
            </div>
            <Avatar className="h-12 w-12">
              <AvatarFallback>{managedClub.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Status do Clube */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Posição na Liga</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{clubInfo.position}</div>
              <div className="text-sm text-muted-foreground">{clubInfo.points} pontos</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Orçamento</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">€ {formatCompactNumber(dashboardData.transferBudget)}</div>
              <div className="text-sm text-muted-foreground">Disponível</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Moral do Time</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{clubInfo.morale}</div>
              <div className="text-sm text-muted-foreground">Confiança</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Reputação</CardTitle></CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-lg px-3 py-1">{dashboardData.reputation}</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próxima Partida */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Próxima Partida</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar><AvatarFallback>BL</AvatarFallback></Avatar>
                    <div>
                      <p className="font-semibold">{nextMatch.opponent}</p>
                      <p className="text-sm text-muted-foreground">{nextMatch.competition}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{nextMatch.date}</p>
                    <p className="text-sm text-muted-foreground">{nextMatch.time}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{nextMatch.venue}</Badge>
                  <Badge variant={nextMatch.difficulty === "Difícil" ? "destructive" : "default"}>{nextMatch.difficulty}</Badge>
                </div>
                <Button className="w-full"><Plus className="h-4 w-4 mr-2" />Preparar Tática</Button>
              </div>
            </CardContent>
          </Card>

          {/* Objetivos da Temporada */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Objetivos da Temporada</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {objectives.map((objective, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{objective.title}</span>
                        <span className="text-muted-foreground">{objective.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${objective.progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">Recompensa: {objective.reward}</p>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Situação nas Competições */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />Situação nas Competições</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">{managedLeague.name}</p>
                <p className="font-semibold text-lg">{seasonSummary.leaguePosition}</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Champions Cup</p>
                <p className="font-semibold text-lg">{seasonSummary.championsLeague}</p>
              </div>
              <div className="text-center p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Copa Nacional</p>
                <p className="font-semibold text-lg">{seasonSummary.nationalCup}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Últimos Resultados */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Últimos Resultados</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentResults.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{match.opponent}</span>
                      <span className="text-sm text-muted-foreground">{match.competition}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-lg">{match.result}</span>
                      <Badge variant={match.points === 3 ? "default" : match.points === 1 ? "secondary" : "destructive"}>
                        {match.points === 3 ? "V" : match.points === 1 ? "E" : "D"}
                      </Badge>
                    </div>
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas do Clube (Vindo da API) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Jogadores</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalPlayers}</div>
              <div className="text-sm text-muted-foreground">No elenco</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Idade Média</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.averageAge}</div>
              <div className="text-sm text-muted-foreground">Anos</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Valor do Elenco</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">€ {formatCompactNumber(dashboardData.teamValue)}</div>
              <div className="text-sm text-muted-foreground">Valor de mercado</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Salários</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">€ {formatCompactNumber(dashboardData.weeklyWages)}</div>
              <div className="text-sm text-muted-foreground">Por semana</div>
            </CardContent>
          </Card>
        </div>

        {/* Notícias do Clube */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Notícias do Clube</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNews.map((news, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${getNewsColor(news.type)} bg-muted/20`}>
                    <p className="font-medium">{news.title}</p>
                    <p className="text-sm text-muted-foreground">{news.date}</p>
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  )
}