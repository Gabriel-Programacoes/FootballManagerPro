"use client";

import {createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo} from 'react';
import { useRouter } from 'next/navigation';
import type { Club, League, Country } from '@/app/team-select/page';
import { simulateMatch } from '@/lib/simulation/match-engine';
import { Player } from '@/app/squad/page';
import {
    MatchResult,
    NewsItem,
    SeasonObjective,
    LoanListing,
    Negotiation,
    CareerSave, ScoutingReport, ScoutMission, Scout, Offer, YouthPlayer
} from "@/lib/game-data";
import {formatCompactNumber} from "@/lib/utils";
import {processNegotiation} from "@/lib/simulation/negotiation-engine";
import {generateAiOffer} from "@/lib/simulation/ai-offer-engine";
import { ScheduleMatch } from '@/app/api/schedule/[clubId]/route';
import {Formation} from "@/app/tactics/page";

// --- TIPO DO CONTEXTO ---
interface CareerContextType {
    // Estados
    managedClub: Club | null;
    managedLeague: League | null;
    activeCareer: CareerSave | null;
    hasCareer: boolean;
    isLoading: boolean;
    careers: CareerSave[];
    squad: Player[];
    schedule: ScheduleMatch[];
    activeFormation: Formation | null;
    updateFormation: (formation: Formation) => void;
    signYouthPlayer: (reportId: string) => void;
    youthSquad: YouthPlayer[];
    scouts: Scout[];

    // Carreira
    loadCareer: (index: number) => void;
    startNewCareer: (club: Club) => void;
    deleteCareer: (index: number) => void;
    saveCareerProgress: (updatedCareer: CareerSave) => void;
    advanceTime: () => Promise<void>;
    getPlayerSquad: () => Promise<Player[]>;

    // Ações de transferência
    listPlayerForTransfer: (playerId: string, askingPrice: number) => void;
    unlistPlayerForTransfer: (playerId: string) => void;

    // Ações de empréstimo
    listPlayerForLoan: (playerId: string, conditions: Omit<LoanListing, 'playerId' | 'isListed'>) => void;
    unlistPlayerForLoan: (playerId: string) => void;

    // Ações de negociação
    startNegotiation: (player: Player, initialOffer: Omit<Offer, 'date' | 'offeredBy'>) => void;
    updateNegotiation: (negotiationId: string, newOffer: Omit<Offer, 'date' | 'offeredBy'>) => void;
    negotiateAiOffer: (negotiationId: string, counterOffer: Omit<Offer, 'date' | 'offeredBy'>) => void;
    cancelNegotiation: (negotiationId: string) => void;
    acceptCounterOffer: (negotiationId: string) => void;
    acceptAiOffer: (negotiationId: string) => void;
    rejectAiOffer: (negotiationId: string) => void;

    // Ações de scout
    sendScoutOnMission: (mission: Omit<ScoutMission, 'endDate' | 'scoutId'> & { scoutId: number }) => void;
    recallScout: (scoutId: number) => void;
    fireScout: (scoutId: number) => void;
    hireScout: (scout: Scout) => void;

}

const CareerContext = createContext<CareerContextType | undefined>(undefined);

// --- HOOK DE ESTADO INTERNO ---
function useCareerState() {
    const router = useRouter();
    const [careers, setCareers] = useState<CareerSave[]>([]);
    const [activeCareer, setActiveCareer] = useState<CareerSave | null>(null);
    const [activeCareerIndex, setActiveCareerIndex] = useState<number | null>(null);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [squad, setSquad] = useState<Player[]>([]);
    const [schedule, setSchedule] = useState<ScheduleMatch[]>([]);
    const [activeFormation, setActiveFormation] = useState<Formation | null>(null);
    const [youthSquad, setYouthSquad] = useState<YouthPlayer[]>([]);
    const [scouts, setScouts] = useState<Scout[]>([]);



    const getPlayerSquad = useCallback(async (): Promise<Player[]> => {
        if (!activeCareer) return [];
        try {
            const response = await fetch(`/api/squad/${activeCareer.clubId}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Falha ao buscar plantel:", error);
            return [];
        }
    }, [activeCareer]);

    useEffect(() => {
        if (activeCareer?.clubId) {
            getPlayerSquad().then(setSquad);
            // NOVO: Lógica para buscar o calendário
            const fetchSchedule = async () => {
                const response = await fetch(`/api/schedule/${activeCareer.clubId}`);
                if (response.ok) {
                    const data = await response.json();
                    setSchedule(data);
                } else {
                    setSchedule([]);
                }
            };
            fetchSchedule();
            if (activeCareer.activeFormation) {
                setActiveFormation(activeCareer.activeFormation);
            }
            if (activeCareer.youthSquad) {
                setYouthSquad(activeCareer.youthSquad);
            }
            if (activeCareer.scouts) {
                setScouts(activeCareer.scouts);
            }
        } else {
            setSquad([]);
            setSchedule([]);
            setActiveFormation(null);
            setYouthSquad([]);
            setScouts([]);
        }
    }, [activeCareer, getPlayerSquad]);

    // Efeito para carregar dados do localStorage e das ligas na inicialização
    useEffect(() => {
        async function loadInitialData() {
            try {
                const savedCareers = localStorage.getItem('careers');
                const savedActiveIndex = localStorage.getItem('activeCareerIndex');

                if (savedCareers) {
                    let parsedCareers: CareerSave[] = JSON.parse(savedCareers);

                    // Garante a compatibilidade com saves antigos, inicializando todas as novas propriedades se não existirem
                    parsedCareers = parsedCareers.map(career => ({
                        ...career,
                        transferList: career.transferList || [],
                        loanList: career.loanList || [],
                        negotiations: career.negotiations || [],
                        scouts: career.scouts || [],
                        scoutMissions: career.scoutMissions || [],
                        scoutingReports: career.scoutingReports || [],
                        youthSquad: career.youthSquad || [],
                    }));

                    setCareers(parsedCareers);

                    if (savedActiveIndex !== null) {
                        const index = JSON.parse(savedActiveIndex);
                        setActiveCareerIndex(index);
                        setActiveCareer(parsedCareers[index] || null);
                    }
                }

                const allLeagues = await fetchAllLeagues();
                setLeagues(allLeagues);
            } catch (error) {
                console.error("Falha ao carregar dados iniciais:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadInitialData();
    }, []);

    const saveCareerProgress = useCallback((updatedCareer: CareerSave) => {
        if (activeCareerIndex === null) return;

        // A correção está em usar a forma funcional de 'setState'.
        // Isto garante que estamos sempre a modificar a versão mais recente do estado 'careers'.
        setCareers(currentCareers => {
            // Cria uma cópia do array de carreiras mais atual
            const updatedCareers = [...currentCareers];
            // Atualiza a carreira ativa na sua posição correta
            updatedCareers[activeCareerIndex] = updatedCareer;

            // Salva a lista de carreiras 100% atualizada no localStorage
            localStorage.setItem('careers', JSON.stringify(updatedCareers));

            // Retorna o novo estado para o React
            return updatedCareers;
        });

        setActiveCareer(updatedCareer);
    }, [activeCareerIndex]);

    const listPlayerForLoan = (playerId: string, conditions: Omit<LoanListing, 'playerId' | 'isListed'>) => {
        if (!activeCareer) return;

        const newCareerState = { ...activeCareer };
        const { loanList } = newCareerState;
        const existingListingIndex = loanList.findIndex(p => p.playerId === playerId);

        const newListing: LoanListing = {
            playerId,
            isListed: true,
            ...conditions
        };

        if (existingListingIndex > -1) {
            // Se o jogador já está listado, atualiza as condições
            loanList[existingListingIndex] = newListing;
        } else {
            // Se não, adiciona uma nova listagem
            loanList.push(newListing);
        }

        newCareerState.news.unshift({
            title: `${managedClub?.name} colocou um jogador disponível para empréstimo.`,
            date: new Date().toISOString(),
            type: 'neutral'
        });

        saveCareerProgress(newCareerState);
    };

    const unlistPlayerForLoan = (playerId: string) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        newCareerState.loanList = newCareerState.loanList.filter(p => p.playerId !== playerId);
        newCareerState.news.unshift({
            title: `Um jogador foi removido da lista de empréstimos.`,
            date: new Date().toISOString(),
            type: 'neutral'
        });
        saveCareerProgress(newCareerState);
    };

    const listPlayerForTransfer = (playerId: string, askingPrice: number) => {
        if (!activeCareer) return;

        const newCareerState = { ...activeCareer };
        const { transferList } = newCareerState;

        const existingListingIndex = transferList.findIndex(p => p.playerId === playerId);

        if (existingListingIndex > -1) {
            // Se o jogador já está listado, atualiza o preço
            transferList[existingListingIndex].askingPrice = askingPrice;
            transferList[existingListingIndex].isListed = true;
        } else {
            // Se não, adiciona uma nova listagem
            transferList.push({ playerId, askingPrice, isListed: true });
        }

        newCareerState.news.unshift({
            title: `${managedClub?.name} colocou um jogador no mercado por €${formatCompactNumber(askingPrice)}.`,
            date: new Date().toISOString(),
            type: 'neutral'
        });

        saveCareerProgress(newCareerState);
    };

    const unlistPlayerForTransfer = (playerId: string) => {
        if (!activeCareer) return;

        const newCareerState = { ...activeCareer };

        // Filtra a lista, mantendo apenas os jogadores cujo ID não corresponde ao fornecido
        newCareerState.transferList = newCareerState.transferList.filter(p => p.playerId !== playerId);

        newCareerState.news.unshift({
            title: `Um jogador foi removido da lista de transferências.`,
            date: new Date().toISOString(),
            type: 'neutral'
        });

        saveCareerProgress(newCareerState);
    };

    const startNegotiation = (player: Player, initialOffer: Omit<Offer, 'date' | 'offeredBy'>) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 14);
        newCareerState.negotiations.push({
            id: `neg_${Date.now()}`, initiatedBy: 'user', playerId: player.id, playerName: player.name, playerOverall: player.overall,
            myClubId: activeCareer.clubId, aiClub: { id: player.attributes.profile.team, name: player.attributes.profile.team },
            status: 'Enviada', offerHistory: [{ ...initialOffer, date: new Date().toISOString(), offeredBy: 'user' }],
            deadline: deadline.toISOString(),
        });
        newCareerState.news.unshift({ title: `Proposta enviada por ${player.name}.`, date: new Date().toISOString(), type: 'neutral' });
        saveCareerProgress(newCareerState);
    };

    const updateNegotiation = (negotiationId: string, newOffer: Omit<Offer, 'date' | 'offeredBy'>) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const negotiation = newCareerState.negotiations.find(n => n.id === negotiationId);

        if (negotiation) {
            // A função agora adiciona 'offeredBy' internamente
            negotiation.offerHistory.push({
                ...newOffer,
                date: new Date().toISOString(),
                offeredBy: 'user'
            });
            negotiation.status = 'Enviada';

            newCareerState.news.unshift({
                title: `Nova proposta enviada por ${negotiation.playerName}.`,
                date: new Date().toISOString(),
                type: 'neutral'
            });
            saveCareerProgress(newCareerState);
        }
    };

    const cancelNegotiation = (negotiationId: string) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const negotiation = newCareerState.negotiations.find(n => n.id === negotiationId);

        if (negotiation) {
            newCareerState.negotiations = newCareerState.negotiations.filter(n => n.id !== negotiationId);
            newCareerState.news.unshift({
                title: `Negociação por ${negotiation.playerName} cancelada.`,
                date: new Date().toISOString(),
                type: 'negative'
            });
            saveCareerProgress(newCareerState);
        }
    };

    const updateFormation = (formation: Formation) => {
        if (!activeCareer) return;
        setActiveFormation(formation);
        const newCareerState = { ...activeCareer, activeFormation: formation };
        saveCareerProgress(newCareerState);
    };

    const signYouthPlayer = (reportId: string) => {
        if (!activeCareer) return;

        const report = activeCareer.scoutingReports.find(r => r.reportId === reportId);
        if (!report) return;

        const potentialMidPoint = (report.player.potential[0] + report.player.potential[1]) / 2;
        const signingCost = Math.floor((potentialMidPoint * 1000) + (report.player.overall * 500));

        // Verifica se há orçamento suficiente
        if (activeCareer.budget < signingCost) {
            alert(`Orçamento insuficiente! Contratar ${report.player.name} custa €${signingCost.toLocaleString()}.`);
            return;
        }

        const newCareerState = { ...activeCareer };
        // Adiciona o jogador à academia
        newCareerState.youthSquad.push(report.player);
        // Remove o relatório da lista de disponíveis
        newCareerState.scoutingReports = newCareerState.scoutingReports.filter(r => r.reportId !== reportId);

        newCareerState.news.unshift({
            title: `${report.player.name} foi contratado para a academia por €${formatCompactNumber(signingCost)}.`,
            date: new Date().toISOString(),
            type: 'positive'
        });
        saveCareerProgress(newCareerState);
        setYouthSquad([...newCareerState.youthSquad]);
    };

    const advanceTime = useCallback(async () => {
        if (!activeCareer) return;

        const newCareerState: CareerSave = JSON.parse(JSON.stringify(activeCareer));
        const currentDate = new Date(newCareerState.currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
        newCareerState.currentDate = currentDate.toISOString();

        const completedMissions = newCareerState.scoutMissions.filter(m => new Date(m.endDate) <= currentDate);
        for (const mission of completedMissions) {
            const scout = newCareerState.scouts.find(s => s.id === mission.scoutId);
            if (!scout) continue;
            scout.status = 'Disponível';

            // --- LÓGICA PARA OLHEIROS DE JOVENS ---
            if (mission.type === 'youth') {
                try {
                    let apiUrl = `/api/youth/generate?scoutRating=${scout.rating}`;
                    if (mission.country) {
                        apiUrl += `&country=${encodeURIComponent(mission.country)}`;
                    }

                    const response = await fetch(apiUrl);

                    if (response.ok) {
                        const newPlayers: YouthPlayer[] = await response.json();
                        for (const player of newPlayers) {
                            newCareerState.scoutingReports.unshift({
                                reportId: `rep_${player.id}`,
                                scoutId: scout.id,
                                dateFound: currentDate.toISOString(),
                                notes: `Jovem talento gerado por ${scout.name}.`,
                                player: player,
                            });
                        }
                        newCareerState.news.unshift({ title: `Relatório de ${scout.name} chegou com ${newPlayers.length} novas promessas.`, date: currentDate.toISOString(), type: 'neutral' });
                    }
                } catch (error) { console.error("Falha ao processar missão de jovens:", error); }
            }
            // --- LÓGICA PARA OLHEIROS DE JOGADORES EXISTENTES (SÊNIOR) ---
            else if (mission.type === 'senior') {
                try {
                    // Monta a URL para buscar jogadores existentes no mercado
                    const minPotential = 65 + (scout.rating * 4);
                    let url = `/api/market?excludeClubId=${activeCareer.clubId}&freeAgentsOnly=false&limit=1&minPotential=${minPotential}`;
                    if (mission.country) url += `&country=${encodeURIComponent(mission.country)}`;
                    if (mission.leagueName) url += `&leagueName=${encodeURIComponent(mission.leagueName)}`;
                    if (mission.position) url += `&position=${encodeURIComponent(mission.position)}`;

                    const response = await fetch(url);
                    const potentialPlayers: Player[] = await response.json();

                    if (potentialPlayers.length > 0) {
                        const foundPlayer = potentialPlayers[0];
                        // Adapta o jogador profissional encontrado para a estrutura de YouthPlayer para o relatório
                        const playerForReport: YouthPlayer = {
                            id: foundPlayer.id,
                            name: foundPlayer.name,
                            age: foundPlayer.age,
                            position: foundPlayer.position,
                            overall: foundPlayer.overall,
                            potential: [foundPlayer.potential, foundPlayer.potential],
                            // Mapeia os atributos principais
                            attributes: {
                                pace: Math.round((foundPlayer.attributes.pace.acceleration + foundPlayer.attributes.pace.sprintSpeed) / 2),
                                shooting: foundPlayer.attributes.shooting.finishing,
                                passing: foundPlayer.attributes.passing.shortPassing,
                                dribbling: foundPlayer.attributes.dribbling.dribbling,
                                defending: foundPlayer.attributes.defending.standingTackle,
                                physical: foundPlayer.attributes.physical.strength,
                            },
                            traits: [],
                        };

                        // Verifica se já não existe um relatório para este jogador
                        if (!newCareerState.scoutingReports.some(r => r.player.id === playerForReport.id)) {
                            newCareerState.scoutingReports.unshift({
                                reportId: `rep_${playerForReport.id}`,
                                scoutId: scout.id,
                                dateFound: currentDate.toISOString(),
                                notes: `Observado por ${scout.name} no ${foundPlayer.attributes.profile.team}.`,
                                player: playerForReport,
                            });
                            newCareerState.news.unshift({ title: `Relatório de ${scout.name}: ${foundPlayer.name} parece promissor.`, date: currentDate.toISOString(), type: 'positive' });
                        }
                    }
                } catch (error) { console.error("Falha ao processar missão sênior:", error); }
            }
        }
        newCareerState.scoutMissions = newCareerState.scoutMissions.filter(m => !completedMissions.some(cm => cm.scoutId === m.scoutId));

        // --- LÓGICA DE PARTIDA ---
        const todayString = currentDate.toISOString().split('T')[0];
        const matchForToday = schedule.find(m => m.matchDate.startsWith(todayString));

        if (matchForToday) {
            // Busca o elenco do adversário para a simulação
            const opponentSquadRes = await fetch(`/api/squad/${matchForToday.isHomeGame ? matchForToday.homeTeam.id : matchForToday.awayTeam.id}`);
            const opponentSquad = opponentSquadRes.ok ? await opponentSquadRes.json() : [];

            // Define quem é o time da casa e o visitante
            const homeTeam = {
                name: matchForToday.homeTeam.name,
                players: matchForToday.isHomeGame ? squad : opponentSquad,
                formation: matchForToday.isHomeGame ? activeFormation : null
            };
            const awayTeam = {
                name: matchForToday.awayTeam.name,
                players: matchForToday.isHomeGame ? opponentSquad : squad,
                formation: !matchForToday.isHomeGame ? activeFormation : null
            };

            const matchSimulation = simulateMatch(homeTeam, awayTeam);

            const matchResult: MatchResult = {
                opponent: matchForToday.isHomeGame ? awayTeam.name : homeTeam.name,
                result: `${matchSimulation.homeGoals}-${matchSimulation.awayGoals}`,
                competition: matchForToday.leagueName,
                home: matchForToday.isHomeGame,
                points: matchSimulation.homeGoals > matchSimulation.awayGoals ? 3 : matchSimulation.homeGoals === matchSimulation.awayGoals ? 1 : 0
            };

            newCareerState.results.unshift(matchResult);
            newCareerState.news.unshift({
                title: `Resultado da Liga: ${homeTeam.name} ${matchSimulation.homeGoals} - ${matchSimulation.awayGoals} ${awayTeam.name}`,
                date: currentDate.toISOString(),
                type: (matchForToday.isHomeGame ? matchResult.points === 3 : matchResult.points === 0) ? 'positive' : matchResult.points === 1 ? 'neutral' : 'negative'
            });
        } else {
            newCareerState.news.unshift({
                title: `Dia de treino concluído.`,
                date: currentDate.toISOString(),
                type: 'neutral'
            });
        }

        // --- 1. IA FAZ PROPOSTAS POR SEUS JOGADORES ---
        const listedPlayers = squad.filter(p => newCareerState.transferList.some(item => item.playerId === p.id && item.isListed));
        for (const player of listedPlayers) {
            const existingNegotiation = newCareerState.negotiations.find(n => n.playerId === player.id);
            if (existingNegotiation) continue;

            const decision = await generateAiOffer(player, newCareerState);

            if (decision.shouldMakeOffer && decision.offer && decision.aiClub) {
                const deadline = new Date(newCareerState.currentDate);
                deadline.setDate(deadline.getDate() + 7);

                newCareerState.negotiations.push({
                    id: `neg_${Date.now()}_${player.id}`,
                    initiatedBy: 'ai',
                    playerId: player.id,
                    playerName: player.name,
                    playerOverall: player.overall,
                    myClubId: activeCareer.clubId,
                    aiClub: decision.aiClub,
                    status: 'Recebida',
                    offerHistory: [{ ...decision.offer, date: newCareerState.currentDate, offeredBy: 'ai' }],
                    deadline: deadline.toISOString(),
                });
                newCareerState.news.unshift({ title: `Proposta recebida por ${player.name} de ${decision.aiClub.name}.`, date: newCareerState.currentDate, type: 'neutral' });
            }
        }

        // --- 2. IA RESPONDE ÀS SUAS PROPOSTAS ---
        for (const negotiation of newCareerState.negotiations) {
            if (negotiation.status === 'Enviada' && negotiation.initiatedBy === 'user') {
                const lastOffer = negotiation.offerHistory[negotiation.offerHistory.length - 1];
                if (lastOffer.offeredBy === 'user') {
                    const daysSinceOffer = (currentDate.getTime() - new Date(lastOffer.date).getTime()) / (1000 * 3600 * 24);

                    if (daysSinceOffer > 2 + Math.random() * 2) {
                        const clubToFetchId = negotiation.aiClub.id;

                        if (clubToFetchId !== 'free_agent') {
                            const playerRes = await fetch(`/api/squad/${clubToFetchId}`);
                            if (!playerRes.ok) continue;

                            const clubSquad: Player[] = await playerRes.json();
                            const playerToProcess = clubSquad.find(p => p.id === negotiation.playerId);

                            if (playerToProcess) {
                                const result = processNegotiation(negotiation, playerToProcess);
                                negotiation.status = result.status;
                                if (result.status === 'Contraproposta' && result.counterOffer) {
                                    negotiation.offerHistory.push({ value: result.counterOffer, date: currentDate.toISOString(), offeredBy: 'ai' });
                                }
                                newCareerState.news.unshift({ title: result.reason, date: currentDate.toISOString(), type: result.status === 'Aceite' ? 'positive' : result.status === 'Rejeitada' ? 'negative' : 'neutral' });
                            }
                        } else {
                            // Lógica para Agentes Livres (geralmente aceitam se o salário for bom)
                            negotiation.status = 'Aceite';
                            newCareerState.news.unshift({ title: `${negotiation.playerName} aceitou os termos do seu contrato.`, date: currentDate.toISOString(), type: 'positive' });
                        }
                    }
                }
            }
        }

        for (const negotiation of newCareerState.negotiations) {
            // A IA só processa propostas que foram enviadas pelo utilizador
            if (negotiation.status === 'Enviada' && negotiation.initiatedBy === 'user') {
                const lastOfferDate = new Date(negotiation.offerHistory[negotiation.offerHistory.length - 1].date);
                const daysSinceOffer = (currentDate.getTime() - lastOfferDate.getTime()) / (1000 * 3600 * 24);

                // Responde após 2-4 dias
                if (daysSinceOffer > 2 + Math.random() * 2) {
                    const clubToFetchId = negotiation.aiClub.id;

                    const playerRes = await fetch(`/api/squad/${clubToFetchId}`);
                    if (!playerRes.ok) continue; // Pula para a próxima negociação se houver um erro

                    const clubSquad: Player[] = await playerRes.json();
                    const playerToProcess = clubSquad.find(p => p.id === negotiation.playerId);

                    if (playerToProcess) {
                        const result = processNegotiation(negotiation, playerToProcess);
                        negotiation.status = result.status;

                        if (result.status === 'Contraproposta' && result.counterOffer) {
                            negotiation.offerHistory.push({
                                value: result.counterOffer,
                                date: currentDate.toISOString(),
                                offeredBy: 'ai',
                            });
                        }

                        newCareerState.news.unshift({
                            title: result.reason,
                            date: currentDate.toISOString(),
                            type: result.status === 'Aceite' ? 'positive' : result.status === 'Rejeitada' ? 'negative' : 'neutral'
                        });
                    }
                }
            }
        }

        saveCareerProgress(newCareerState);
    }, [activeCareer, squad, getPlayerSquad, schedule, activeFormation, saveCareerProgress]);

    const acceptCounterOffer = (negotiationId: string) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const negotiation = newCareerState.negotiations.find(n => n.id === negotiationId);

        if (negotiation) {
            negotiation.status = 'Aceite';

            newCareerState.news.unshift({
                title: `Acordo alcançado por ${negotiation.playerName}!`,
                date: new Date().toISOString(),
                type: 'positive'
            });
            saveCareerProgress(newCareerState);
        }
    };

    const startNewCareer = (club: Club) => {
        const saveName = prompt("Dê um nome para sua nova carreira:", `Carreira com ${club.name}`);
        if (!saveName) return;

        const newCareer: CareerSave = {
            saveName,
            clubId: club.id,
            clubName: club.name,
            budget: 10000000,
            currentSeason: "2024/25",
            currentDate: new Date('2024-07-01').toISOString(),
            results: [],
            news: [{ title: `Bem-vindo ao ${club.name}!`, date: new Date().toISOString(), type: 'neutral' }],
            objectives: [
                { id: 'league', title: 'Terminar no meio da tabela', progress: 0, reward: 'Prestígio', isCompleted: false },
                { id: 'cup', title: 'Chegar às oitavas de final da copa', progress: 0, reward: 'Prestígio', isCompleted: false }
            ],
            transferList: [],
            loanList: [],
            youthSquad: [],
            scouts: [],
            scoutMissions: [],
            scoutingReports: [],
            negotiations: [],
            activeFormation: null,
        };

        const updatedCareers = [...careers, newCareer];
        const newIndex = updatedCareers.length - 1;

        setCareers(updatedCareers);
        setActiveCareerIndex(newIndex);
        setActiveCareer(newCareer);
        localStorage.setItem('careers', JSON.stringify(updatedCareers));
        localStorage.setItem('activeCareerIndex', JSON.stringify(newIndex));

        router.push('/dashboard');
    };

    const acceptAiOffer = (negotiationId: string) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const negotiation = newCareerState.negotiations.find(n => n.id === negotiationId);

        if (negotiation && negotiation.initiatedBy === 'ai') {
            const lastOffer = negotiation.offerHistory[negotiation.offerHistory.length - 1];

            // 1. Adiciona o valor da venda ao orçamento
            newCareerState.budget += lastOffer.value;

            // 2. Remove o jogador do seu plantel
            setSquad(squad => squad.filter(p => p.id !== negotiation.playerId));

            // 3. Remove a negociação da lista de ativas
            newCareerState.negotiations = newCareerState.negotiations.filter(n => n.id !== negotiationId);

            // 4. Cria a notícia da transferência
            newCareerState.news.unshift({
                title: `${negotiation.playerName} foi transferido para ${negotiation.aiClub.name} por €${formatCompactNumber(lastOffer.value)}.`,
                date: new Date().toISOString(),
                type: 'positive'
            });

            // 5. Remove o jogador da sua lista de transferências
            newCareerState.transferList = newCareerState.transferList.filter(item => item.playerId !== negotiation.playerId);

            saveCareerProgress(newCareerState);
        }
    };

    const rejectAiOffer = (negotiationId: string) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const negotiation = newCareerState.negotiations.find(n => n.id === negotiationId);

        if (negotiation) {
            // Apenas remove a negociação da lista
            newCareerState.negotiations = newCareerState.negotiations.filter(n => n.id !== negotiationId);

            // Adiciona uma notícia a informar da rejeição
            newCareerState.news.unshift({
                title: `Proposta de ${negotiation.aiClub.name} por ${negotiation.playerName} foi rejeitada.`,
                date: new Date().toISOString(),
                type: 'neutral'
            });

            saveCareerProgress(newCareerState);
        }
    };

    const negotiateAiOffer = (negotiationId: string, counterOffer: Omit<Offer, 'date' | 'offeredBy'>) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const negotiation = newCareerState.negotiations.find(n => n.id === negotiationId);

        if (negotiation) {
            // Adiciona a sua contraproposta ao histórico
            negotiation.offerHistory.push({
                ...counterOffer,
                date: new Date().toISOString(),
                offeredBy: 'user' // Marca que foi você a oferecer
            });
            // Altera o status para que a IA saiba que é a sua vez de responder
            negotiation.status = 'Enviada';

            newCareerState.news.unshift({
                title: `Contraproposta enviada por ${negotiation.playerName}.`,
                date: new Date().toISOString(),
                type: 'neutral'
            });

            saveCareerProgress(newCareerState);
        }
    };

    const loadCareer = (index: number) => {
        const careerToLoad = careers[index];
        if (careerToLoad) {
            setActiveCareerIndex(index);
            setActiveCareer(careerToLoad);
            localStorage.setItem('activeCareerIndex', JSON.stringify(index));
            router.push('/dashboard');
        }
    };

    const deleteCareer = (index: number) => {
        if (!confirm("Tem certeza que deseja apagar esta carreira?")) return;

        const updatedCareers = careers.filter((_, i) => i !== index);
        setCareers(updatedCareers);
        localStorage.setItem('careers', JSON.stringify(updatedCareers));

        if (activeCareerIndex === index) {
            setActiveCareerIndex(null);
            setActiveCareer(null);
            localStorage.removeItem('activeCareerIndex');
            router.push('/career-menu');
        }
    };

    const sendScoutOnMission = (mission: Omit<ScoutMission, 'endDate' | 'scoutId'> & { scoutId: number }) => {
        if (!activeCareer) return;

        // Encontra o olheiro na lista de olheiros da carreira ativa
        const scout = activeCareer.scouts.find(s => s.id === mission.scoutId);

        // Valida se o olheiro existe e se está disponível
        if (!scout || scout.status !== 'Disponível') {
            alert("Este olheiro não está disponível para uma nova missão.");
            return;
        }

        // Custo da missão baseado no rating do olheiro
        const missionCost = scout.rating * 50000; // Ex: Olheiro 5 estrelas custa 250k

        //Verifica se o clube tem orçamento para a missão
        if (activeCareer.budget < missionCost) {
            alert(`Orçamento insuficiente. A missão custa €${missionCost.toLocaleString()} e você tem €${activeCareer.budget.toLocaleString()}.`);
            return;
        }

        // Cria uma cópia segura do estado da carreira para fazer modificações
        const newCareerState = { ...activeCareer };

        // Deduz o custo do orçamento
        newCareerState.budget -= missionCost;

        // Encontra o mesmo olheiro na cópia do estado para modificar seu status
        const scoutInState = newCareerState.scouts.find(s => s.id === mission.scoutId)!;
        scoutInState.status = 'Observando';

        // Define a duração e a data de retorno da missão
        let durationInDays = 30;
        if (mission.type === 'senior') {
            durationInDays = 14;
        }

        const endDate = new Date(newCareerState.currentDate);
        endDate.setDate(endDate.getDate() + durationInDays);

        // Adiciona a missão à lista de missões ativas
        newCareerState.scoutMissions.push({
            endDate: endDate.toISOString(),
            ...mission,
        });

        // Mensagem de notícia, incluindo o custo
        const destination = mission.country || mission.leagueName || 'uma missão internacional';
        newCareerState.news.unshift({
            title: `${scout.name} foi enviado para ${destination} por €${formatCompactNumber(missionCost)}. Retorna em ${durationInDays} dias.`,
            date: new Date().toISOString(),
            type: 'neutral'
        });

        // Salva o estado atualizado do jogo
        saveCareerProgress(newCareerState);

        // Atualiza o estado local para a UI refletir a mudança imediatamente
        setScouts([...newCareerState.scouts]);
    };

    const recallScout = (scoutId: number) => {
        if (!activeCareer) return;

        const scoutToRecall = activeCareer.scouts.find(s => s.id === scoutId);
        if (!scoutToRecall || scoutToRecall.status !== 'Observando') return;

        const updatedScouts = activeCareer.scouts.map(scout => {
            // Se este não for o olheiro, retorna o olheiro original sem alterações
            if (scout.id !== scoutId) {
                return scout;
            }
            // Se for o olheiro correto, retorna um *novo objeto* com o status alterado
            return { ...scout, status: 'Disponível' as const };
        });

        const updatedMissions = activeCareer.scoutMissions.filter(m => m.scoutId !== scoutId);

        const newCareerState: CareerSave = {
            ...activeCareer,
            scouts: updatedScouts,
            scoutMissions: updatedMissions,
            news: [
                {
                    title: `${scoutToRecall.name} foi chamado de volta e está agora disponível.`,
                    date: new Date().toISOString(),
                    type: 'neutral' as const
                },
                ...activeCareer.news
            ]
        };

        saveCareerProgress(newCareerState);
        setScouts(newCareerState.scouts);
    };

    const fireScout = (scoutId: number) => {
        if (!activeCareer || !confirm("Tem a certeza que deseja demitir este olheiro?")) return;

        const scout = activeCareer.scouts.find(s => s.id === scoutId);
        if (!scout) return;

        // .filter() já cria novos arrays, o que é imutável e correto
        const updatedScouts = activeCareer.scouts.filter(s => s.id !== scoutId);
        const updatedMissions = activeCareer.scoutMissions.filter(m => m.scoutId !== scoutId);

        const newCareerState: CareerSave = {
            ...activeCareer,
            scouts: updatedScouts,
            scoutMissions: updatedMissions,
            news: [
                {
                    title: `${scout.name} foi demitido da equipa de observação.`,
                    date: new Date().toISOString(),
                    type: 'negative' as const
                },
                ...activeCareer.news
            ]
        };

        saveCareerProgress(newCareerState);
        setScouts(newCareerState.scouts);
    };

    const hireScout = (scout: Scout) => {
        if (!activeCareer || activeCareer.scouts.length >= 5) {
            alert("Atingiu o limite máximo de 5 olheiros.");
            return;
        }

        const newCareerState: CareerSave = {
            ...activeCareer,
            // Em vez de .push(), criamos um novo array com o olheiro adicionado
            scouts: [...activeCareer.scouts, scout],
            news: [
                {
                    title: `O olheiro ${scout.name} foi contratado para a sua equipa!`,
                    date: new Date().toISOString(),
                    type: 'positive' as const
                },
                ...activeCareer.news
            ]
        };

        saveCareerProgress(newCareerState);
        // Atualiza o estado local com o novo array
        setScouts(newCareerState.scouts);
    };

    // Lógica para encontrar o clube e a liga a partir do estado ativo
    const { managedClub, managedLeague } = useMemo(() => {
        if (activeCareer && leagues.length > 0) {
            for (const league of leagues) {
                const foundClub = league.clubs.find(club => club.id === activeCareer.clubId);
                if (foundClub) {
                    return { managedClub: foundClub, managedLeague: league };
                }
            }
        }
        return { managedClub: null, managedLeague: null };
    }, [activeCareer, leagues]);

    return {
        managedClub,
        managedLeague,
        activeCareer,
        hasCareer: !!activeCareer,
        isLoading,
        careers,
        schedule,
        youthSquad,
        loadCareer,
        startNewCareer,
        deleteCareer,
        saveCareerProgress,
        advanceTime,
        getPlayerSquad,
        listPlayerForTransfer,
        listPlayerForLoan,
        unlistPlayerForTransfer,
        unlistPlayerForLoan,
        startNegotiation,
        updateNegotiation,
        negotiateAiOffer,
        cancelNegotiation,
        acceptCounterOffer,
        sendScoutOnMission,
        recallScout,
        fireScout,
        hireScout,
        squad,
        acceptAiOffer,
        rejectAiOffer,
        activeFormation,
        updateFormation,
        signYouthPlayer,
        scouts,
    };
}

// --- PROVIDER ---
export function CareerProvider({ children }: { children: ReactNode }) {
    const careerState = useCareerState();

    return (
        <CareerContext.Provider value={careerState}>
            {children}
        </CareerContext.Provider>
    );
}

// --- HOOK PÚBLICO ---
export function useCareer() {
    const context = useContext(CareerContext);
    if (context === undefined) {
        throw new Error('useCareer deve ser usado dentro de um CareerProvider');
    }
    return context;
}

// Função auxiliar para carregar dados das ligas
async function fetchAllLeagues(): Promise<League[]> {
    try {
        const response = await fetch('/api/countries');
        if (!response.ok) return [];
        const countries: Country[] = await response.json();
        return countries.flatMap(country => country.leagues);
    } catch (error) {
        console.error("Failed to fetch leagues:", error);
        return [];
    }
}