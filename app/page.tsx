"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Trophy, Coins } from "lucide-react";
import { useCareer } from "@/contexts/career-context";
import { formatCompactNumber } from "@/lib/utils";
import { useMemo } from "react";

export default function Dashboard() {
  // 3. OBTENDO OS DADOS DO CONTEXTO
  const { managedClub, playersInClub, managedLeague } = useCareer();

  // 4. CÁLCULOS DINÂMICOS BASEADOS NO CONTEXTO
  const clubStats = useMemo(() => {
    if (!playersInClub || playersInClub.length === 0) {
      return {
        totalPlayers: 0,
        averageAge: "0",
        teamValue: "€ 0",
        weeklyWages: "€ 0",
      };
    }

    const totalPlayers = playersInClub.length;
    const averageAge = (playersInClub.reduce((sum, player) => sum + player.age, 0) / totalPlayers).toFixed(1);
    const totalValue = playersInClub.reduce((sum, player) => sum + player.contract.value, 0);
    const totalWages = playersInClub.reduce((sum, player) => sum + player.contract.wage, 0);

    return {
      totalPlayers,
      averageAge,
      teamValue: `€ ${formatCompactNumber(totalValue)}`,
      weeklyWages: `€ ${formatCompactNumber(totalWages)}`,
    };
  }, [playersInClub]);


  // Dados estáticos que podem ser movidos para o contexto no futuro
  const careerData = {
    reputation: "Continental",
    position: "3º",
    points: 65,
    budget: "€45 mi",
    morale: "Alto",
  };

  const nextMatch = { opponent: "Blue Lions FC", date: "30/07/2025", time: "16:00" }
  const seasonSummary = { championsLeague: "Oitavas de Final", nationalCup: "Quartas de Final" }

  // Se os dados do clube ainda não foram carregados, exibe uma mensagem
  if (!managedClub || !managedLeague) {
    return <div>Carregando informações da carreira...</div>;
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Centro de Comando</h1>
            <p className="text-muted-foreground">Visão geral do seu clube</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-bold text-lg">{careerData.budget}</span>
            </div>
          </div>
        </div>

        {/* Cards de Status do Clube */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card de Posição na Liga */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">{managedLeague.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{careerData.position}</div>
              <div className="text-sm text-muted-foreground">{careerData.points} pontos</div>
            </CardContent>
          </Card>
          {/* Card de Orçamento */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Orçamento</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{careerData.budget}</div>
              <div className="text-sm text-muted-foreground">Para transferências</div>
            </CardContent>
          </Card>
          {/* Card de Moral */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Moral do Time</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">{careerData.morale}</div>
              <div className="text-sm text-muted-foreground">Confiança</div>
            </CardContent>
          </Card>
          {/* Card de Reputação */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Reputação</CardTitle></CardHeader>
            <CardContent>
              <Badge variant="secondary" className="px-3 py-1 text-base">{careerData.reputation}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Próxima Partida e Competições */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Próxima Partida</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{nextMatch.opponent}</p>
                  <p className="text-sm text-muted-foreground">{managedLeague.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{nextMatch.date}</p>
                  <p className="text-sm text-muted-foreground">{nextMatch.time}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />Resumo das Competições</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Liga</p>
                  <p className="font-semibold">{careerData.position}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Continental</p>
                  <p className="font-semibold">{seasonSummary.championsLeague}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Copa</p>
                  <p className="font-semibold">{seasonSummary.nationalCup}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- SEÇÃO DE ESTATÍSTICAS COM DADOS DINÂMICOS --- */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Jogadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clubStats.totalPlayers}</div>
              <div className="text-sm text-muted-foreground">No elenco</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Idade Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clubStats.averageAge}</div>
              <div className="text-sm text-muted-foreground">Anos</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Valor do Elenco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{clubStats.teamValue}</div>
              <div className="text-sm text-muted-foreground">Valor de mercado</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Salários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{clubStats.weeklyWages}</div>
              <div className="text-sm text-muted-foreground">Por semana</div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}