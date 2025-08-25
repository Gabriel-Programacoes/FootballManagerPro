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
    CareerSave, ScoutingReport, ScoutMission, Scout, Offer
} from "@/lib/game-data";
import {formatCompactNumber} from "@/lib/utils";
import {processNegotiation} from "@/lib/simulation/negotiation-engine";
import {generateAiOffer} from "@/lib/simulation/ai-offer-engine";

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
        } else {
            setSquad([]); // Limpa o plantel se não houver carreira ativa
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
                        scouts: career.scouts || [ // Adiciona um olheiro inicial para saves antigos
                            { id: 1, name: "Jorge Costa", rating: 3, specialty: "Jovens Promessas", status: 'Disponível' }
                        ],
                        scoutMissions: career.scoutMissions || [],
                        scoutingReports: career.scoutingReports || [],
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
        if (activeCareerIndex !== null) {
            const updatedCareers = [...careers];
            updatedCareers[activeCareerIndex] = updatedCareer;
            setCareers(updatedCareers);
            setActiveCareer(updatedCareer);
            localStorage.setItem('careers', JSON.stringify(updatedCareers));
        }
    }, [activeCareerIndex, careers]);

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

    const advanceTime = useCallback(async () => {
        if (!activeCareer) return;

        const newCareerState: CareerSave = JSON.parse(JSON.stringify(activeCareer));
        const currentDate = new Date(newCareerState.currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
        newCareerState.currentDate = currentDate.toISOString();

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

        // --- 3. OLHEIROS RETORNAM DE MISSÕES ---
        const completedMissions = newCareerState.scoutMissions.filter(m => new Date(m.endDate) <= currentDate);
        for (const mission of completedMissions) {
            const scout = newCareerState.scouts.find(s => s.id === mission.scoutId);
            if (!scout) continue;
            scout.status = 'Disponível';

            try {
                const minPotential = 65 + (scout.rating * 4);
                let url = `/api/market?excludeClubId=${activeCareer.clubId}&freeAgentsOnly=false&limit=1&minPotential=${minPotential}`;
                if (mission.country) url += `&country=${encodeURIComponent(mission.country)}`;
                if (mission.leagueName) url += `&leagueName=${encodeURIComponent(mission.leagueName)}`;
                if (mission.position) url += `&position=${encodeURIComponent(mission.position)}`;

                const response = await fetch(url);
                const potentialPlayers: Player[] = await response.json();

                if (potentialPlayers.length > 0) {
                    const foundPlayer = potentialPlayers[0];
                    if (!newCareerState.scoutingReports.some(r => r.playerId === foundPlayer.id)) {
                        newCareerState.scoutingReports.unshift({
                            playerId: foundPlayer.id, scoutId: scout.id, dateFound: currentDate.toISOString(),
                            notes: `Encontrado por ${scout.name}.`, playerDetails: foundPlayer,
                        });
                        newCareerState.news.unshift({ title: `Relatório de ${scout.name}: ${foundPlayer.name} parece promissor.`, date: currentDate.toISOString(), type: 'positive' });
                    }
                }
            } catch (error) { console.error("Falha ao processar missão de observação:", error); }
        }
        newCareerState.scoutMissions = newCareerState.scoutMissions.filter(m => !completedMissions.some(cm => cm.scoutId === m.scoutId));


        const dayOfMonth = currentDate.getDate();
        if (dayOfMonth % 7 === 0) {
            const playerSquad = await getPlayerSquad();
            const opponentTeam = { name: "Adversário FC", players: [] };

            const matchSimulation = simulateMatch(
                { name: newCareerState.clubName, players: playerSquad },
                opponentTeam
            );

            const matchResult: MatchResult = {
                opponent: opponentTeam.name,
                result: `${matchSimulation.homeGoals}-${matchSimulation.awayGoals}`,
                competition: "Amigável",
                home: true,
                points: matchSimulation.homeGoals > matchSimulation.awayGoals ? 3 : matchSimulation.homeGoals === matchSimulation.awayGoals ? 1 : 0
            };

            newCareerState.results.unshift(matchResult);
            newCareerState.news.unshift({
                title: `Resultado: ${newCareerState.clubName} ${matchResult.result} ${matchResult.opponent}`,
                date: currentDate.toISOString(),
                type: matchResult.points === 3 ? 'positive' : matchResult.points === 1 ? 'neutral' : 'negative'
            });
        } else {
            newCareerState.news.unshift({
                title: `Dia de treino concluído.`,
                date: currentDate.toISOString(),
                type: 'neutral'
            });
        }
        for (const negotiation of newCareerState.negotiations) {
            // A IA só processa propostas que foram enviadas pelo utilizador
            if (negotiation.status === 'Enviada' && negotiation.initiatedBy === 'user') {
                const lastOfferDate = new Date(negotiation.offerHistory[negotiation.offerHistory.length - 1].date);
                const daysSinceOffer = (currentDate.getTime() - lastOfferDate.getTime()) / (1000 * 3600 * 24);

                // Responde após 2-4 dias
                if (daysSinceOffer > 2 + Math.random() * 2) {
                    // CORREÇÃO: Usa o ID do clube correto (o clube da IA) para buscar o plantel
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
    }, [activeCareer, squad, getPlayerSquad, saveCareerProgress]);

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
            scouts: [
                { id: 1, name: "Jorge Costa", rating: 3, specialty: "Jovens Promessas", status: 'Disponível' }
            ],
            scoutMissions: [],
            scoutingReports: [],
            negotiations: [],
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
        const newCareerState = { ...activeCareer };

        const scout = newCareerState.scouts.find(s => s.id === mission.scoutId);
        if (scout && scout.status === 'Disponível') {
            // Mapeamento de rating para duração em dias
            const durationMap: { [key: number]: number } = {
                1: 30, // 1 estrela = 30 dias
                2: 21, // 2 estrelas = 21 dias
                3: 14, // 3 estrelas = 14 dias
                4: 10, // 4 estrelas = 10 dias
                5: 7,  // 5 estrelas = 7 dias
            };

            const durationInDays = durationMap[scout.rating] || 30; // Usa 30 como padrão

            const endDate = new Date(newCareerState.currentDate);
            endDate.setDate(endDate.getDate() + durationInDays);

            scout.status = 'Observando';
            newCareerState.scoutMissions.push({
                endDate: endDate.toISOString(),
                ...mission,
            });

            newCareerState.news.unshift({
                title: `${scout.name} foi enviado para observar em ${mission.region || 'geral'}. Retorna em ${durationInDays} dias.`,
                date: new Date().toISOString(),
                type: 'neutral'
            });

            saveCareerProgress(newCareerState);
        }
    };

    const recallScout = (scoutId: number) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const scout = newCareerState.scouts.find(s => s.id === scoutId);

        if (scout && scout.status === 'Observando') {
            scout.status = 'Disponível';
            // Remove a missão associada
            newCareerState.scoutMissions = newCareerState.scoutMissions.filter(m => m.scoutId !== scoutId);

            newCareerState.news.unshift({
                title: `${scout.name} foi chamado de volta e está agora disponível.`,
                date: new Date().toISOString(),
                type: 'neutral'
            });
            saveCareerProgress(newCareerState);
        }
    };

    const fireScout = (scoutId: number) => {
        if (!activeCareer || !confirm("Tem a certeza que deseja demitir este olheiro?")) return;
        const newCareerState = { ...activeCareer };
        const scout = newCareerState.scouts.find(s => s.id === scoutId);

        if (scout) {
            newCareerState.scouts = newCareerState.scouts.filter(s => s.id !== scoutId);
            // Remove também qualquer missão que ele possa ter
            newCareerState.scoutMissions = newCareerState.scoutMissions.filter(m => m.scoutId !== scoutId);

            newCareerState.news.unshift({
                title: `${scout.name} foi demitido da equipa de observação.`,
                date: new Date().toISOString(),
                type: 'negative'
            });
            saveCareerProgress(newCareerState);
        }
    };

    const hireScout = (scout: Scout) => {
        if (!activeCareer || activeCareer.scouts.length >= 5) {
            alert("Atingiu o limite máximo de 5 olheiros.");
            return;
        }
        const newCareerState = { ...activeCareer };
        const newScout = { ...scout, status: 'Disponível' as const };
        newCareerState.scouts.push(newScout);

        newCareerState.news.unshift({
            title: `O olheiro ${scout.name} foi contratado para a sua equipa!`,
            date: new Date().toISOString(),
            type: 'positive'
        });
        saveCareerProgress(newCareerState);
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