// Em lib/simulation/match-engine.ts
import type { Player } from '@/app/squad/page'; // Usamos a nossa interface de Jogador

interface Team {
    name: string;
    players: Player[];
}

interface MatchResult {
    homeGoals: number;
    awayGoals: number;
    events: string[]; // "45' GOL! Kylian Mbappé"
}

export function simulateMatch(homeTeam: Team, awayTeam: Team): MatchResult {
    console.log(`Simulando: ${homeTeam.name} vs ${awayTeam.name}`);

    // Lógica super simples para começar:
    // A força de um time é a média do overall dos seus 11 melhores jogadores.
    const calculateTeamStrength = (team: Team) => {
        const sortedPlayers = [...team.players].sort((a, b) => b.overall - a.overall);
        const firstEleven = sortedPlayers.slice(0, 11);
        return firstEleven.reduce((sum, p) => sum + p.overall, 0) / 11;
    };

    const homeStrength = calculateTeamStrength(homeTeam);
    const awayStrength = calculateTeamStrength(awayTeam);

    // Cada time tem uma chance de marcar baseada na sua força
    let homeGoals = 0;
    if (Math.random() < homeStrength / 100) homeGoals++;
    if (Math.random() < homeStrength / 120) homeGoals++; // Chance menor para um segundo gol

    let awayGoals = 0;
    if (Math.random() < awayStrength / 100) awayGoals++;

    return {
        homeGoals,
        awayGoals,
        events: [`${homeGoals} - ${awayGoals}`]
    };
}