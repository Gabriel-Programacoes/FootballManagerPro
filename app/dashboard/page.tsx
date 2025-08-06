"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Trophy, Coins, Loader2, Users, User, Wallet, BarChart } from "lucide-react";
import { useCareer } from "@/contexts/career-context";
import { formatCompactNumber } from "@/lib/utils";
import { useEffect, useState } from "react";

// Interface para definir a estrutura dos dados do nosso dashboard
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
    // Só busca os dados se a carreira já foi carregada e existe um clube gerenciado
    if (!isCareerLoading && managedClub?.id) {
      const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/dashboard/${managedClub.id}`);
          if (!response.ok) {
            throw new Error('Falha ao buscar dados do dashboard.');
          }
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
      // Se a carreira foi carregada e não há clube, paramos o loading
      setIsLoading(false);
    }
  }, [managedClub, isCareerLoading]);

  // Se a carreira ou o dashboard estão carregando, mostra um loader
  if (isLoading || isCareerLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // Se não há clube gerenciado (após o loading), o CareerGuard já deve ter redirecionado,
  // mas podemos ter um fallback.
  if (!managedClub || !managedLeague || !dashboardData) {
    return (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-muted-foreground">Não foi possível carregar os dados da carreira.</p>
        </div>
    );
  }

  // Dados para os cards que ainda não vêm do banco (podem ser adicionados no futuro)
  const nextMatch = { opponent: "Blue Lions FC", date: "30/07/2025", time: "16:00" };
  const seasonSummary = { championsLeague: "Oitavas de Final", nationalCup: "Quartas de Final", position: "3º" };

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Centro de Comando</h1>
          <p className="text-muted-foreground">Visão geral do seu clube, {managedClub.name}</p>
        </div>

        {/* Cards de Status do Clube com dados da API */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">€ {formatCompactNumber(dashboardData.transferBudget)}</div>
              <p className="text-xs text-muted-foreground">Para transferências</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reputação</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="px-3 py-1 text-base">{dashboardData.reputation}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jogadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalPlayers}</div>
              <p className="text-xs text-muted-foreground">No elenco principal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Idade Média</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.averageAge}</div>
              <p className="text-xs text-muted-foreground">Anos</p>
            </CardContent>
          </Card>
        </div>

        {/* Próxima Partida e Competições (ainda com dados estáticos) */}
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
                  <p className="font-semibold">{seasonSummary.position}</p>
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
      </div>
  );
}