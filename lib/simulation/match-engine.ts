// lib/simulation/match-engine.ts

import type { Player } from '@/app/squad/page';
// NOVO: Importamos a definição da formação tática
import type { Formation } from '@/app/tactics/page';

// A interface para uma equipa que entra na simulação
interface Team {
    name: string;
    players: Player[]; // O elenco completo do clube
    formation: Formation | null; // A formação tática selecionada
}

// O resultado detalhado da partida
interface MatchSimulationResult {
    homeGoals: number;
    awayGoals: number;
    events: string[];
}

// Função auxiliar para calcular a força de um setor (ataque, meio, defesa)
const calculateSectorStrength = (players: Player[], sector: 'attack' | 'midfield' | 'defense'): number => {
    if (!players || players.length === 0) return 60; // Retorna um valor base se não houver jogadores

    let totalStrength = 0;
    let playerCount = 0;

    for (const player of players) {
        let playerStrength = player.overall * 0.7; // O overall ainda é a base

        // Adiciona bônus com base em atributos chave para cada setor
        switch (sector) {
            case 'attack':
                playerStrength += player.attributes.shooting.finishing * 0.2;
                playerStrength += player.attributes.pace.sprintSpeed * 0.1;
                break;
            case 'midfield':
                playerStrength += player.attributes.passing.shortPassing * 0.15;
                playerStrength += player.attributes.passing.longPassing * 0.1;
                playerStrength += player.attributes.dribbling.dribbling * 0.05;
                break;
            case 'defense':
                playerStrength += player.attributes.defending.standingTackle * 0.15;
                playerStrength += player.attributes.defending.defAwareness * 0.15;
                break;
        }
        totalStrength += playerStrength;
        playerCount++;
    }

    return totalStrength / playerCount;
};

const calculateAverageAttribute = (players: Player[], attributePath: (p: Player) => number): number => {
    if (players.length === 0) return 70; // Retorna um valor base
    const total = players.reduce((sum, player) => sum + attributePath(player), 0);
    return total / players.length;
};

// A função principal de simulação, agora aprimorada
export function simulateMatch(homeTeam: Team, awayTeam: Team): MatchSimulationResult {
    const events: string[] = [];

    // Se um time não tem uma formação tática definida, usamos os 11 melhores jogadores como padrão
    const getFirstEleven = (team: Team): Player[] => {
        if (team.formation && team.formation.players.length === 11) {
            // Mapeia os IDs da formação para os dados completos dos jogadores do elenco
            return team.formation.players.map(tacticPlayer =>
                team.players.find(p => p.id === tacticPlayer.id)
            ).filter(p => p) as Player[]; // Filtra qualquer jogador não encontrado
        }
        // Fallback: Pega os 11 melhores jogadores por overall
        return [...team.players].sort((a, b) => b.overall - a.overall).slice(0, 11);
    };

    const homeEleven = getFirstEleven(homeTeam);
    const awayEleven = getFirstEleven(awayTeam);

    // Separa os jogadores por setor com base em suas posições
    const homeAttackers = homeEleven.filter(p => ['ATA', 'SA', 'PE', 'PD'].includes(p.position));
    const homeMidfielders = homeEleven.filter(p => ['VOL', 'MC', 'MD', 'ME', 'MAT'].includes(p.position));
    const homeDefenders = homeEleven.filter(p => ['LE', 'LD', 'ZAG'].includes(p.position));
    const homeGoalkeeper = homeEleven.find(p => p.position === 'GOL');
    const homeBestFinisher = homeAttackers.length > 0 ? homeAttackers.reduce((best, p) => p.attributes.shooting.finishing > best.attributes.shooting.finishing ? p : best) : null;
    const homeBestFreeKickTaker = homeEleven.reduce((best, p) => p.attributes.passing.freeKickAccuracy > best.attributes.passing.freeKickAccuracy ? p : best);
    const homeBestPenaltyTaker = homeEleven.reduce((best, p) => p.attributes.shooting.penalties > best.attributes.shooting.penalties ? p : best);
    const homeMostAggressiveDefender = homeEleven.filter(p => ['LE', 'LD', 'ZAG'].includes(p.position)).reduce((most, p) => p.attributes.physical.aggression > most.attributes.physical.aggression ? p : most, { attributes: { physical: { aggression: 0 } } } as Player);


    const awayAttackers = awayEleven.filter(p => ['ATA', 'SA', 'PE', 'PD'].includes(p.position));
    const awayMidfielders = awayEleven.filter(p => ['VOL', 'MC', 'MD', 'ME', 'MAT'].includes(p.position));
    const awayDefenders = awayEleven.filter(p => ['LE', 'LD', 'ZAG'].includes(p.position));
    const awayGoalkeeper = awayEleven.find(p => p.position === 'GOL');
    const awayBestFinisher = awayAttackers.length > 0 ? awayAttackers.reduce((best, p) => p.attributes.shooting.finishing > best.attributes.shooting.finishing ? p : best) : null;
    const awayBestFreeKickTaker = awayEleven.reduce((best, p) => p.attributes.passing.freeKickAccuracy > best.attributes.passing.freeKickAccuracy ? p : best);
    const awayBestPenaltyTaker = awayEleven.reduce((best, p) => p.attributes.shooting.penalties > best.attributes.shooting.penalties ? p : best);
    const awayMostAggressiveDefender = awayEleven.filter(p => ['LE', 'LD', 'ZAG'].includes(p.position)).reduce((most, p) => p.attributes.physical.aggression > most.attributes.physical.aggression ? p : most, { attributes: { physical: { aggression: 0 } } } as Player);


    // Calcula a força de cada setor
    let homeAttack = calculateSectorStrength(homeAttackers, 'attack');
    let homeMidfield = calculateSectorStrength(homeMidfielders, 'midfield');
    let homeDefense = calculateSectorStrength(homeDefenders, 'defense');

    homeAttack *= 1.05;
    homeMidfield *= 1.05;

    let awayAttack = calculateSectorStrength(awayAttackers, 'attack');
    let awayMidfield = calculateSectorStrength(awayMidfielders, 'midfield');
    let awayDefense = calculateSectorStrength(awayDefenders, 'defense');

    const homeStamina = calculateAverageAttribute(homeEleven, p => p.attributes.physical.stamina);
    const awayStamina = calculateAverageAttribute(awayEleven, p => p.attributes.physical.stamina);

    let homeGoals = 0;
    let awayGoals = 0;

    for (let minute = 1; minute <= 90; minute++) {
        // Chance de ocorrer um evento de ataque a cada minuto

        if (minute === 70) {
            // A penalidade de fadiga é maior para o time com menos fôlego
            const homeFatiguePenalty = 1 - (awayStamina / homeStamina) * 0.05; // Penalidade de até 5%
            const awayFatiguePenalty = 1 - (homeStamina / awayStamina) * 0.05;

            homeAttack *= Math.max(0.9, homeFatiguePenalty); // Garante que a força não caia mais que 10%
            homeDefense *= Math.max(0.9, homeFatiguePenalty);
            awayAttack *= Math.max(0.9, awayFatiguePenalty);
            awayDefense *= Math.max(0.9, awayFatiguePenalty);
            events.push("As equipes começam a demonstrar sinais de cansaço nos minutos finais.");
        }

        if (Math.random() < 0.1) {
            // Time da casa ataca
            if (Math.random() * homeAttack > Math.random() * awayDefense) {
                // Chance de cometer uma falta
                if (Math.random() < (awayMostAggressiveDefender.attributes.physical.aggression / 300)) { // Agressão aumenta a chance de falta
                    if (Math.random() < 0.1) { // 10% de chance da falta ser um pênalti
                        events.push(`PÊNALTI para ${homeTeam.name} aos ${minute} minutos!`);
                        const penaltyTaker = homeBestPenaltyTaker;
                        const goalkeeper = awayGoalkeeper;
                        const goalChance = (penaltyTaker.attributes.shooting.penalties / (penaltyTaker.attributes.shooting.penalties + (goalkeeper?.attributes.goalkeeping.gkReflexes || 60) * 0.8));
                        if (Math.random() < goalChance) {
                            homeGoals++;
                            events.push(`GOL DE PÊNALTI! ${penaltyTaker.name} converte para ${homeTeam.name}!`);
                        } else {
                            events.push(`${goalkeeper?.name || 'O goleiro'} defende o pênalti!`);
                        }
                    } else { // Falta normal
                        events.push(`Falta perigosa para ${homeTeam.name} aos ${minute} minutos.`);
                        const freeKickTaker = homeBestFreeKickTaker;
                        const goalkeeper = awayGoalkeeper;
                        const goalChance = (freeKickTaker.attributes.passing.freeKickAccuracy / (freeKickTaker.attributes.passing.freeKickAccuracy + (goalkeeper?.attributes.goalkeeping.gkDiving || 60)));
                        if (Math.random() < goalChance) {
                            homeGoals++;
                            events.push(`GOL DE FALTA! ${freeKickTaker.name} marca um golaço para ${homeTeam.name}!`);
                        }
                    }
                } else { // Jogada normal
                    const finisherAttribute = homeBestFinisher?.attributes.shooting.finishing || 60;
                    const goalkeeperAttribute = awayGoalkeeper?.attributes.goalkeeping.gkReflexes || 60;
                    if (Math.random() < finisherAttribute / (finisherAttribute + goalkeeperAttribute)) {
                        homeGoals++;
                        events.push(`GOL! ${homeBestFinisher?.name || homeTeam.name} marca para ${homeTeam.name} aos ${minute} minutos.`);
                    }
                }
            }
        }

        // Time visitante ataca
        if (Math.random() < 0.1) {
            if (Math.random() * awayAttack > Math.random() * homeDefense) {
                if (Math.random() < (homeMostAggressiveDefender.attributes.physical.aggression / 300)) {
                    if (Math.random() < 0.1) {
                        events.push(`PÊNALTI para ${awayTeam.name} aos ${minute} minutos!`);
                        const penaltyTaker = awayBestPenaltyTaker;
                        const goalkeeper = homeGoalkeeper;
                        const goalChance = (penaltyTaker.attributes.shooting.penalties / (penaltyTaker.attributes.shooting.penalties + (goalkeeper?.attributes.goalkeeping.gkReflexes || 60) * 0.8));
                        if (Math.random() < goalChance) {
                            awayGoals++;
                            events.push(`GOL DE PÊNALTI! ${penaltyTaker.name} converte para ${awayTeam.name}!`);
                        } else {
                            events.push(`${goalkeeper?.name || 'O goleiro'} defende o pênalti!`);
                        }
                    } else {
                        events.push(`Falta perigosa para ${awayTeam.name} aos ${minute} minutos.`);
                        const freeKickTaker = awayBestFreeKickTaker;
                        const goalkeeper = homeGoalkeeper;
                        const goalChance = (freeKickTaker.attributes.passing.freeKickAccuracy / (freeKickTaker.attributes.passing.freeKickAccuracy + (goalkeeper?.attributes.goalkeeping.gkDiving || 60)));
                        if (Math.random() < goalChance) {
                            awayGoals++;
                            events.push(`GOL DE FALTA! ${freeKickTaker.name} marca um golaço para ${awayTeam.name}!`);
                        }
                    }
                } else {
                    const finisherAttribute = awayBestFinisher?.attributes.shooting.finishing || 60;
                    const goalkeeperAttribute = homeGoalkeeper?.attributes.goalkeeping.gkReflexes || 60;
                    if (Math.random() < finisherAttribute / (finisherAttribute + goalkeeperAttribute)) {
                        awayGoals++;
                        events.push(`GOL! ${awayBestFinisher?.name || awayTeam.name} marca para ${awayTeam.name} aos ${minute} minutos.`);
                    }
                }
            }
        }
    }

    // Bônus de meio-campo: um meio-campo dominante cria mais chances
    if (homeMidfield > awayMidfield + 10 && Math.random() < 0.25) {
        homeGoals++;
        events.push(`GOL! Domínio no meio-campo resulta em gol para ${homeTeam.name} nos minutos finais.`);
    }
    if (awayMidfield > homeMidfield + 10 && Math.random() < 0.25) {
        awayGoals++;
        events.push(`GOL! Domínio no meio-campo resulta em gol para ${awayTeam.name} nos minutos finais.`);
    }

    events.push(`Fim de Jogo: O resultado foi ${homeGoals} - ${awayGoals}`);

    return {
        homeGoals,
        awayGoals,
        events,
    };
}