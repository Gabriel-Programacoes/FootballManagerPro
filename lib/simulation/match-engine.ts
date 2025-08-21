import type { Player } from '@/app/squad/page';

// A interface para uma equipa que entra na simulação
interface Team {
    name: string;
    players: Player[];
}

// O resultado detalhado da partida
interface MatchSimulationResult {
    homeGoals: number;
    awayGoals: number;
    events: string[];
}

// A função principal de simulação, agora exportada
export function simulateMatch(homeTeam: Team, awayTeam: Team): MatchSimulationResult {
    console.log(`Simulando: ${homeTeam.name} vs ${awayTeam.name}`);

    // Lógica simples para começar:
    // A força de um time é a média do overall dos seus 11 melhores jogadores.
    const calculateTeamStrength = (team: Team) => {
        if (!team.players || team.players.length === 0) {
            return 60;
        }
        const sortedPlayers = [...team.players].sort((a, b) => b.overall - a.overall);
        const firstEleven = sortedPlayers.slice(0, 11);
        const totalOverall = firstEleven.reduce((sum, p) => sum + p.overall, 0);
        return totalOverall / firstEleven.length;
    };

    const homeStrength = calculateTeamStrength(homeTeam);
    const awayStrength = calculateTeamStrength(awayTeam);

    // Cada time tem uma chance de marcar baseada na sua força + um fator de aleatoriedade
    let homeGoals = 0;
    // Um time mais forte tem mais "chances de gol"
    for (let i = 0; i < 5 + Math.floor(homeStrength / 10); i++) {
        if (Math.random() < (homeStrength / (homeStrength + awayStrength)) * 0.25) {
            homeGoals++;
        }
    }

    let awayGoals = 0;
    for (let i = 0; i < 5 + Math.floor(awayStrength / 10); i++) {
        if (Math.random() < (awayStrength / (homeStrength + awayStrength)) * 0.25) {
            awayGoals++;
        }
    }

    const events = [`Fim de Jogo: O resultado foi ${homeGoals} - ${awayGoals}`];

    return {
        homeGoals,
        awayGoals,
        events,
    };
}