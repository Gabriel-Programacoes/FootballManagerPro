"use client";

import {createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo} from 'react';
import { useRouter } from 'next/navigation';
import type { Club, League, Country } from '@/app/team-select/page';
import { simulateMatch } from '@/lib/simulation/match-engine';
import { Player } from '@/app/squad/page';
import {
    MatchResult,
    LoanListing,
    Negotiation,
    CareerSave, ScoutingReport, ScoutMission, Scout, Offer, YouthPlayer, AvailableScout,
} from "@/lib/game-data";
import {formatCompactNumber} from "@/lib/utils";
import {processNegotiation, processYouthContractNegotiation} from "@/lib/simulation/negotiation-engine";
import {generateAiOffer} from "@/lib/simulation/ai-offer-engine";
import { ScheduleMatch } from '@/app/api/schedule/[clubId]/route';
import {Formation} from "@/app/tactics/page";
import { toast } from "sonner";

// Função para diferenciar um YouthPlayer de um Player convencional
function isYouthPlayer(player: Player | YouthPlayer): player is YouthPlayer {
    // A forma mais fiável de diferenciar é verificar se 'potential' é um array.
    return Array.isArray(player.potential);
}

export const SCOUT_NAMES_BY_NATIONALITY: Record<string, { firstNames: string[]; lastNames: string[] }> = {
    "Brasileiro": {
        firstNames: ["Ricardo", "Eduardo", "Alexandre", "Caio", "Felipe", "Beto", "Júlio"],
        lastNames: ["Gomes", "Pereira", "Lima", "Alves", "Ribeiro", "Azevedo", "Siqueira"]
    },
    "Argentino": {
        firstNames: ["Javier", "Horacio", "Mateo", "Sergio", "Leandro", "Esteban", "Carlos"],
        lastNames: ["Rojas", "Quintana", "Fernández", "Romero", "Díaz", "Guzmán", "Acosta"]
    },
    "Italiano": {
        firstNames: ["Matteo", "Marco", "Giovanni", "Luca", "Fabio", "Paolo", "Giorgio"],
        lastNames: ["Rossi", "Ricci", "Conti", "Gallo", "Marino", "Ferrari", "Esposito"]
    },
    "Alemão": {
        firstNames: ["Klaus", "Jurgen", "Lars", "Stefan", "Andreas", "Michael", "Thomas"],
        lastNames: ["Schmidt", "Bauer", "Weber", "Wolf", "Zimmermann", "Müller", "Schneider"]
    },
    "Escandinavo": { // Agrupa nomes suecos, noruegueses, etc.
        firstNames: ["Sven", "Erik", "Lars", "Bjorn", "Olaf", "Magnus", "Henrik"],
        lastNames: ["Eriksson", "Johansson", "Hansen", "Lund", "Nielsen", "Jensen", "Andersen"]
    },
    "Britânico": { // Agrupa nomes do Reino Unido e Irlanda
        firstNames: ["Liam", "Owen", "Caleb", "David", "Chris", "Sean", "Declan"],
        lastNames: ["O'Sullivan", "Jones", "Williams", "Smith", "Taylor", "Brown", "Wilson"]
    }
};

const specialties = ["Defesa", "Meio-campo", "Ataque", "Guarda-Redes", "Jovens Promessas", "Mercado Sul-Americano", "Técnica", "Velocidade"];

const generateScouts = (): AvailableScout[] => {
    const generatedScouts: AvailableScout[] = [];
    const usedNames = new Set<string>();
    const nationalities = Object.keys(SCOUT_NAMES_BY_NATIONALITY); // Obtém a lista de nacionalidades disponíveis

    while (generatedScouts.length < 5) {
        // 1. Primeiro, escolhe uma nacionalidade aleatória
        const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];

        // 2. Obtém a lista de nomes correta para essa nacionalidade
        const nameData = SCOUT_NAMES_BY_NATIONALITY[nationality];

        // 3. Escolhe um nome e apelido dessa lista específica
        const firstName = nameData.firstNames[Math.floor(Math.random() * nameData.firstNames.length)];
        const lastName = nameData.lastNames[Math.floor(Math.random() * nameData.lastNames.length)];
        const fullName = `${firstName} ${lastName}`;

        if (!usedNames.has(fullName)) {
            usedNames.add(fullName);

            const rating = Math.floor(Math.random() * 5) + 1;
            const type = Math.random() > 0.5 ? 'youth' : 'senior';
            const specialty = specialties[Math.floor(Math.random() * specialties.length)];

            generatedScouts.push({
                id: Date.now() + Math.random(),
                name: fullName,
                rating: rating,
                specialty: specialty,
                nationality: nationality, // A nacionalidade agora corresponde ao nome
                cost: 50000 * rating + Math.floor(Math.random() * 10000),
                type: type,
            });
        }
    }
    return generatedScouts;
};


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
    startContractNegotiation: (player: Player | YouthPlayer, initialOffer?: Partial<Offer>) => void;
    youthSquad: YouthPlayer[];
    scouts: Scout[];
    availableScouts: AvailableScout[];

    // Carreira
    loadCareer: (index: number) => void;
    startNewCareer: (club: Club) => void;
    deleteCareer: (index: number) => void;
    saveCareerProgress: (updatedCareer: CareerSave) => void;
    advanceTime: () => Promise<void>;
    getPlayerSquad: () => Promise<Player[]>;

    // Ações de transferência
    listPlayerForTransfer: (playerId: string, askingPrice: number, player: Player) => void;
    unlistPlayerForTransfer: (playerId: string, player: Player) => void;

    // Ações de empréstimo
    listPlayerForLoan: (playerId: string, conditions: Omit<LoanListing, 'playerId' | 'isListed'>, player: Player) => void;
    unlistPlayerForLoan: (playerId: string, player: Player) => void;

    // Ações de negociação
    startNegotiation: (player: Player, initialOffer: Omit<Offer, 'date' | 'offeredBy'>) => void;
    updateNegotiation: (negotiationId: string, newOffer: Omit<Offer, 'date' | 'offeredBy'>) => void;
    negotiateAiOffer: (negotiationId: string, counterOffer: Omit<Offer, 'date' | 'offeredBy'>) => void;
    cancelNegotiation: (negotiationId: string) => void;
    acceptCounterOffer: (negotiationId: string) => void;
    acceptAiOffer: (negotiationId: string) => void;
    rejectAiOffer: (negotiationId: string) => void;
    rejectScoutedPlayer: (reportId: string) => void;

    // Ações de scout
    sendScoutOnMission: (mission: Omit<ScoutMission, 'endDate' | 'scoutId'> & { scoutId: number }) => void;
    recallScout: (scoutId: number) => void;
    fireScout: (scoutId: number) => void;
    hireScout: (scout: AvailableScout) => void;
}

const CareerContext = createContext<CareerContextType | undefined>(undefined);

// --- HOOK DE ESTADO INTERNO ---
function useCareerState(): CareerContextType {

    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);

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
    const [scoutingReports, setScoutingReports] = useState<ScoutingReport[]>([]);

    const availableScouts = useMemo(() => activeCareer?.availableScouts || [], [activeCareer]);

    const getPlayerSquad = useCallback(async (): Promise<Player[]> => {
        if (!activeCareer) return [];
        try {
            const response = await fetch(`/api/squad/${activeCareer.clubId}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            toast.error("Falha ao buscar plantel. Por favor, entre em contato com o suporte.");
            return [];
        }
    }, [activeCareer]);

    useEffect(() => {
        if (activeCareer?.clubId) {
            getPlayerSquad().then(setSquad);
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
                        squad: career.squad || [],
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
                toast.error("Falha ao carregar dados iniciais. Por favor, entre em contato com o suporte.");
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

        setScoutingReports(activeCareer?.scoutingReports || [])
        setActiveCareer(updatedCareer);
    }, [activeCareerIndex]);

    const listPlayerForLoan = (playerId: string, conditions: Omit<LoanListing, 'playerId' | 'isListed'>, player: Player) => {
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
            title: `${managedClub?.name} colocou o jogador  ${player.name} na lista de empréstimos.`,
            date: new Date().toISOString(),
            type: 'neutral'
        });
        toast.info(`${player.name} está disponível para receber propostas de empréstimo.`);

        saveCareerProgress(newCareerState);
    };

    const unlistPlayerForLoan = (playerId: string, player: Player) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        newCareerState.loanList = newCareerState.loanList.filter(p => p.playerId !== playerId);
        newCareerState.news.unshift({
            title: `${player.name} não está mais disponível para empréstimos.`,
            date: new Date().toISOString(),
            type: 'neutral'
        });
        saveCareerProgress(newCareerState);
        toast.info(`Você removeu o jogador ${player.name} da lista de empréstimos.`)
    };

    const listPlayerForTransfer = (playerId: string, askingPrice: number) => {
        if (!activeCareer) return;

        // CORREÇÃO: Encontra o jogador dentro do contexto usando o 'squad' state.
        const playerToList = squad.find(p => p.id === playerId);

        // Se o jogador não for encontrado, pára a execução para evitar erros.
        if (!playerToList) {
            toast.error("Erro: Jogador não encontrado no plantel.");
            return;
        }

        const newCareerState = { ...activeCareer };
        const { transferList } = newCareerState;

        const existingListingIndex = transferList.findIndex(p => p.playerId === playerId);

        if (existingListingIndex > -1) {
            transferList[existingListingIndex].askingPrice = askingPrice;
            transferList[existingListingIndex].isListed = true;
        } else {
            transferList.push({ playerId, askingPrice, isListed: true });
        }

        // Agora é seguro usar o nome do jogador.
        newCareerState.news.unshift({
            title: `${playerToList.name} está disponível no mercado por €${formatCompactNumber(askingPrice)}.`,
            date: new Date().toISOString(),
            type: 'neutral'
        });
        saveCareerProgress(newCareerState);
    };

    const unlistPlayerForTransfer = (playerId: string) => {
        if (!activeCareer) return;

        // CORREÇÃO: Encontra o jogador dentro do contexto.
        const playerToUnlist = squad.find(p => p.id === playerId);

        if (!playerToUnlist) {
            toast.error("Erro: Jogador não encontrado no plantel.");
            return;
        }

        const newCareerState: CareerSave = JSON.parse(JSON.stringify(activeCareer));

        newCareerState.transferList = newCareerState.transferList.filter(p => p.playerId !== playerId);

        // Agora é seguro usar o nome do jogador.
        newCareerState.news.unshift({
            title: `${managedClub?.name} desistiu de vender o jogador ${playerToUnlist.name}.`,
            date: new Date().toISOString(),
            type: 'neutral'
        });
        toast.info(`O jogador ${playerToUnlist.name} não está mais disponível para receber proposta de transferências.`);

        saveCareerProgress(newCareerState);
    };

    const startNegotiation = (player: Player, initialOffer: Omit<Offer, 'date' | 'offeredBy'>) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 14);
        newCareerState.negotiations.push({
            id: `neg_${Date.now()}`, negotiationType: 'transfer', initiatedBy: 'user', playerId: player.id, playerName: player.name, playerOverall: player.overall,
            myClubId: activeCareer.clubId, aiClub: { id: player.attributes.profile.team, name: player.attributes.profile.team },
            status: 'Enviada', offerHistory: [{ ...initialOffer, date: new Date().toISOString(), offeredBy: 'user' }],
            deadline: deadline.toISOString(),
        });
        newCareerState.news.unshift({ title: `O clube ${managedClub?.name} iniciou uma negociação por ${player.name}.`, date: new Date().toISOString(), type: 'neutral' });
        toast.info(`Proposta enviada por ${player.name}`)
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
                title: `Uma nova proposta foi enviada por ${negotiation.playerName}.`,
                date: new Date().toISOString(),
                type: 'neutral'
            });
            toast.info(`Uma nova proposta foi enviada por ${negotiation.playerName}`)
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
            toast.info(`O clube ${managedClub?.name} cancelou a negociação por ${negotiation.playerName}`)
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

        if (activeCareer.budget < signingCost) {
            toast.warning(`Você não possui orçamento suficiente! Contratar ${report.player.name} custa €${signingCost.toLocaleString()}.`);
            return;
        }

        // Cria um novo objeto de carreira em vez de modificar o antigo
        const newCareerState: CareerSave = {
            ...activeCareer,
            budget: activeCareer.budget - signingCost, // Deduz o custo
            // Cria um novo array para a academia com o novo jogador
            youthSquad: [...activeCareer.youthSquad, report.player],
            // Cria um novo array de relatórios sem o que foi usado
            scoutingReports: activeCareer.scoutingReports.filter(r => r.reportId !== reportId),
            news: [
                {
                    title: `${report.player.name} foi contratado para a academia por €${formatCompactNumber(signingCost)}.`,
                    date: new Date().toISOString(),
                    type: 'positive'
                },
                ...activeCareer.news
            ]
        };

        saveCareerProgress(newCareerState);
        // Atualiza o estado local para a UI refletir a mudança imediatamente
        setYouthSquad(newCareerState.youthSquad);
        setScoutingReports(newCareerState.scoutingReports);
    };

    const rejectScoutedPlayer = (reportId: string) => {
        if (!activeCareer) return;

        const reportToReject = activeCareer.scoutingReports.find(r => r.reportId === reportId);
        if (!reportToReject) {
            return toast.error("Não foi possível encontrar o relatório para rejeitar.");
        }

        const updatedReports = activeCareer.scoutingReports.filter(report => report.reportId !== reportId);

        const newCareerState: CareerSave = {
            ...activeCareer,
            scoutingReports: updatedReports,
        };

        saveCareerProgress(newCareerState);
        toast.info(`${reportToReject.player.name} foi removido da sua lista de observação.`);
    };

    const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    const startContractNegotiation = (player: Player | YouthPlayer, initialOffer?: Partial<Offer>) => {
        if (!activeCareer) return;

        // Criamos uma cópia do estado para modificar com segurança
        const newCareerState: CareerSave = JSON.parse(JSON.stringify(activeCareer));

        // Lógica para deduzir o custo da assinatura e adicionar à lista de pendentes
        if (isYouthPlayer(player)) {
            // Verificamos se o jogador está a vir de um relatório (não está na academia de jovens ainda)
            const isFromScoutingReport = !newCareerState.youthSquad.some(p => p.id === player.id);

            if (isFromScoutingReport) {
                const potentialMidPoint = (player.potential[0] + player.potential[1]) / 2;
                const signingCost = Math.floor((potentialMidPoint * 1000) + (player.overall * 500));

                if (newCareerState.budget < signingCost) {
                    toast.error("Orçamento insuficiente para a taxa de assinatura.");
                    return;
                }
                newCareerState.budget -= signingCost;
                newCareerState.pendingYouthSignings.push(player);
            }
        }

        // Cria a nova negociação
        const newNegotiation: Negotiation = {
            id: `neg_${Date.now()}_${player.id}`,
            negotiationType: 'contract',
            initiatedBy: 'user',
            playerId: player.id,
            playerName: player.name,
            playerOverall: player.overall,
            myClubId: activeCareer.clubId,
            status: 'Enviada',
            deadline: new Date(new Date(newCareerState.currentDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            offerHistory: [{
                offeredBy: 'user',
                date: newCareerState.currentDate,
                wage: initialOffer?.wage ?? player.overall * 100,
                contractLength: initialOffer?.contractLength ?? 3,
                squadRole: initialOffer?.squadRole ?? 'Jovem Promessa'
            }]
        };

        // Atualiza as listas no estado
        newCareerState.negotiations.push(newNegotiation);
        newCareerState.scoutingReports = newCareerState.scoutingReports.filter(r => r.player.id !== player.id);

        // Salva o estado atualizado de uma só vez
        saveCareerProgress(newCareerState);
    };

    const advanceTime = useCallback(async () => {
        if (!activeCareer) return;

        // Usamos um único objeto de estado que é modificado ao longo de toda a função.
        // Isto garante que nenhuma atualização se perde.
        const newCareerState: CareerSave = JSON.parse(JSON.stringify(activeCareer));
        const currentDate = new Date(newCareerState.currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
        newCareerState.currentDate = currentDate.toISOString();

        // LÓGICA DE ATUALIZAÇÃO DO MERCADO DE OLHEIROS
        const lastRefresh = new Date(newCareerState.lastScoutMarketRefresh);

        const daysSinceRefresh = Math.floor((currentDate.getTime() - lastRefresh.getTime()) / (1000 * 3600 * 24));

        if (daysSinceRefresh >= 14) {
            newCareerState.availableScouts = generateScouts();
            newCareerState.lastScoutMarketRefresh = newCareerState.currentDate;
            newCareerState.news.unshift({ title: "Novos olheiros estão disponíveis no mercado.", date: newCareerState.currentDate, type: 'neutral' });
            toast.info("Novos olheiros estão disponíveis no mercado, não se esqueça de conferir as novas oportunidades.")
        }

        // --- 1. PROCESSAR CONTRATOS DE JOVENS ---
        const signedYouthPlayerIds: string[] = [];
        for (const neg of newCareerState.negotiations) {
            if (neg.negotiationType === 'contract' && neg.status === 'Enviada') {
                const pendingPlayer = newCareerState.pendingYouthSignings.find(p => p.id === neg.playerId);
                if (pendingPlayer) {
                    neg.status = 'Aceite';
                    newCareerState.youthSquad.push(pendingPlayer);
                    signedYouthPlayerIds.push(pendingPlayer.id);
                    newCareerState.news.unshift({ title: `${pendingPlayer.name} junta-se à academia de jovens.`, date: newCareerState.currentDate, type: 'positive' });
                    toast.success(`O jogador ${pendingPlayer.name} juntou-se à sua academia de jovens `)
                }
            }
        }
        // Remove os jogadores contratados da lista de pendentes de forma segura
        newCareerState.pendingYouthSignings = newCareerState.pendingYouthSignings.filter(p => !signedYouthPlayerIds.includes(p.id));

        // --- 2. PROCESSAR MISSÕES DE OLHEIROS ---
        const completedMissions = newCareerState.scoutMissions.filter(m => new Date(m.endDate) <= currentDate);
        for (const mission of completedMissions) {
            const scout = newCareerState.scouts.find(s => s.id === mission.scoutId);
            if (!scout) continue;
            scout.status = 'Disponível';

            if (mission.type === 'youth') {
                try {
                    const response = await fetch(`/api/youth/generate?scoutRating=${scout.rating}&country=${encodeURIComponent(mission.country || 'any')}`);
                    if (response.ok) {
                        const newPlayers: YouthPlayer[] = await response.json();
                        newPlayers.forEach(player => {
                            newCareerState.scoutingReports.unshift({
                                reportId: `rep_${player.id}`,
                                scoutId: scout.id,
                                dateFound: newCareerState.currentDate,
                                notes: `Jovem talento encontrado por ${scout.name}.`,
                                player: player,
                            });
                        });
                        newCareerState.news.unshift({ title: `Relatório de ${scout.name} chegou com ${newPlayers.length} novas promessas.`, date: newCareerState.currentDate, type: 'neutral' });
                        toast.info(`Novos relatórios de ${scout.name}`, {
                            description: `${newPlayers.length} jovens talentos foram encontrados.`
                        });
                    }
                } catch (error) { toast.error("Falha ao processar missão de jovens:"); }
            }
            else if (mission.type === 'senior') {
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
                        const playerForReport: YouthPlayer = {
                            id: foundPlayer.id, name: foundPlayer.name, age: foundPlayer.age, position: foundPlayer.position,
                            overall: foundPlayer.overall, potential: [foundPlayer.potential, foundPlayer.potential],
                            attributes: {
                                pace: Math.round((foundPlayer.attributes.pace.acceleration + foundPlayer.attributes.pace.sprintSpeed) / 2),
                                shooting: foundPlayer.attributes.shooting.finishing,
                                passing: foundPlayer.attributes.passing.shortPassing,
                                dribbling: foundPlayer.attributes.dribbling.dribbling,
                                defending: foundPlayer.attributes.defending.standingTackle,
                                physical: foundPlayer.attributes.physical.strength,
                            },
                            traits: [], nationality: foundPlayer.attributes.profile.nation,
                        };

                        if (!newCareerState.scoutingReports.some(r => r.player.id === playerForReport.id)) {
                            newCareerState.scoutingReports.unshift({
                                reportId: `rep_${playerForReport.id}`, scoutId: scout.id,
                                dateFound: newCareerState.currentDate,
                                notes: `Observado por ${scout.name} no ${foundPlayer.attributes.profile.team}.`,
                                player: playerForReport,
                            });
                            newCareerState.news.unshift({ title: `Relatório de ${scout.name}: ${foundPlayer.name} parece promissor.`, date: newCareerState.currentDate, type: 'positive' });
                        }
                    }
                } catch (error) { toast.error("Falha ao processar missão sênior."); }
            }
        }
        newCareerState.scoutMissions = newCareerState.scoutMissions.filter(m => !completedMissions.includes(m));

        // --- 3. SIMULAR PARTIDA DO DIA ---
        const todayString = currentDate.toISOString().split('T')[0];
        const matchForToday = schedule.find(m => m.matchDate.startsWith(todayString));

        if (matchForToday) {
            const opponentSquadRes = await fetch(`/api/squad/${matchForToday.isHomeGame ? matchForToday.awayTeam.id : matchForToday.homeTeam.id}`);
            const opponentSquad = opponentSquadRes.ok ? await opponentSquadRes.json() : [];

            const homeTeam = { name: matchForToday.homeTeam.name, players: matchForToday.isHomeGame ? squad : opponentSquad, formation: matchForToday.isHomeGame ? newCareerState.activeFormation : null };
            const awayTeam = { name: matchForToday.awayTeam.name, players: matchForToday.isHomeGame ? opponentSquad : squad, formation: !matchForToday.isHomeGame ? newCareerState.activeFormation : null };

            const matchSimulation = simulateMatch(homeTeam, awayTeam);
            const points = (matchForToday.isHomeGame ? matchSimulation.homeGoals > matchSimulation.awayGoals : matchSimulation.awayGoals > matchSimulation.homeGoals) ? 3 : matchSimulation.homeGoals === matchSimulation.awayGoals ? 1 : 0;

            const matchResult: MatchResult = { opponent: matchForToday.isHomeGame ? awayTeam.name : homeTeam.name, result: `${matchSimulation.homeGoals}-${matchSimulation.awayGoals}`, competition: matchForToday.leagueName, home: matchForToday.isHomeGame, points };

            newCareerState.results.unshift(matchResult);
            newCareerState.news.unshift({ title: `Resultado: ${homeTeam.name} ${matchSimulation.homeGoals} - ${matchSimulation.awayGoals} ${awayTeam.name}`, date: newCareerState.currentDate, type: points === 3 ? 'positive' : points === 1 ? 'neutral' : 'negative'});
        }

        // --- 4. IA FAZ PROPOSTAS POR JOGADORES ---
        const listedPlayers = squad.filter(p => newCareerState.transferList.some(item => item.playerId === p.id && item.isListed));
        for (const player of listedPlayers) {
            if (newCareerState.negotiations.some(n => n.playerId === player.id)) continue;
            const decision = await generateAiOffer(player, newCareerState);
            if (decision.shouldMakeOffer && decision.offer && decision.aiClub) {
                const deadline = new Date(newCareerState.currentDate);
                deadline.setDate(deadline.getDate() + 7);
                newCareerState.negotiations.push({
                    id: `neg_${Date.now()}_${player.id}`, negotiationType: 'transfer', initiatedBy: 'ai',
                    playerId: player.id, playerName: player.name, playerOverall: player.overall,
                    myClubId: activeCareer.clubId, aiClub: decision.aiClub, status: 'Recebida',
                    offerHistory: [{ ...decision.offer, date: newCareerState.currentDate, offeredBy: 'ai' }],
                    deadline: deadline.toISOString(),
                });
                newCareerState.news.unshift({ title: `Proposta recebida por ${player.name} de ${decision.aiClub.name}.`, date: newCareerState.currentDate, type: 'neutral' });
                toast.info(`Proposta recebida por ${player.name} de ${decision.aiClub.name}.`)
            }
        }

        // --- 5. IA RESPONDE A PROPOSTAS ---
        for (const negotiation of newCareerState.negotiations) {
            // Processa apenas propostas enviadas pelo utilizador que estão à espera de resposta
            if (negotiation.status === 'Enviada' && negotiation.initiatedBy === 'user') {
                const lastOffer = negotiation.offerHistory[negotiation.offerHistory.length - 1];
                const daysSinceOffer = (currentDate.getTime() - new Date(lastOffer.date).getTime()) / (1000 * 3600 * 24);

                if (daysSinceOffer > 1 + Math.random() * 2) {

                    // --- Lógica para Contratos de Jovens ---
                    const pendingPlayer = newCareerState.pendingYouthSignings.find(p => p.id === negotiation.playerId);
                    if (pendingPlayer) {
                        // Chama a nova função para obter a resposta do jovem
                        const result = processYouthContractNegotiation(negotiation, pendingPlayer);

                        negotiation.status = result.status;
                        newCareerState.news.unshift({
                            title: result.reason,
                            date: newCareerState.currentDate,
                            type: result.status === 'Aceite' ? 'positive' : result.status === 'Rejeitada' ? 'negative' : 'neutral'
                        });

                        if (result.status === 'Aceite') {
                            // Se aceitar, move o jogador para a academia
                            newCareerState.youthSquad.push(pendingPlayer);
                            // E remove-o da lista de pendentes
                            newCareerState.pendingYouthSignings = newCareerState.pendingYouthSignings.filter(p => p.id !== pendingPlayer.id);
                        } else if (result.status === 'Contraproposta' && result.counterOffer) {
                            // Se fizer contraproposta, adiciona-a ao histórico para o utilizador ver
                            negotiation.offerHistory.push({
                                ...result.counterOffer,
                                date: currentDate.toISOString(),
                                offeredBy: 'ai'
                            });
                        }
                        // Se for 'Rejeitada', o estado já foi atualizado e uma notícia foi criada.
                        // O jogador permanecerá na lista de pendentes até a negociação expirar ou ser cancelada.

                        continue; // Passa para a próxima negociação, pois esta já foi processada
                    }

                    if (daysSinceOffer > 2 + Math.random() * 2) {
                        // Trata negociações de transferência com clubes
                        if (negotiation.negotiationType === 'transfer' && negotiation.aiClub) {
                            try {
                                const playerRes = await fetch(`/api/squad/${negotiation.aiClub.id}`);
                                if (playerRes.ok) {
                                    const clubSquad: Player[] = await playerRes.json();
                                    const playerToProcess = clubSquad.find(p => p.id === negotiation.playerId);
                                    if (playerToProcess) {
                                        const result = processNegotiation(negotiation, playerToProcess);
                                        negotiation.status = result.status;
                                        if (result.status === 'Contraproposta' && result.counterOffer) {
                                            negotiation.offerHistory.push({
                                                value: result.counterOffer,
                                                date: currentDate.toISOString(),
                                                offeredBy: 'ai'
                                            });
                                        }
                                        newCareerState.news.unshift({
                                            title: result.reason,
                                            date: currentDate.toISOString(),
                                            type: result.status === 'Aceite' ? 'positive' : 'neutral'
                                        });
                                    }
                                }
                            } catch (error) {
                                // toast.error("Falha ao processar resposta da IA para transferência");
                            }
                        }
                        // Trata negociações de contrato com agentes livres
                        else if (negotiation.negotiationType === 'contract' && negotiation.aiClub?.id === 'free_agent') {
                            negotiation.status = 'Aceite';
                            newCareerState.news.unshift({
                                title: `${negotiation.playerName} aceitou os termos do seu contrato.`,
                                date: newCareerState.currentDate,
                                type: 'positive'
                            });
                        }
                    }
                }
            }

            // --- FINALIZAÇÃO ---
            // Remove a notícia "Dia de treino" se houver outra notícia mais importante
            if (newCareerState.news.length > activeCareer.news.length + 1) {
                const trainingNewsIndex = newCareerState.news.findIndex(n => n.title === "Dia de treino concluído.");
                if (trainingNewsIndex > -1) {
                    newCareerState.news.splice(trainingNewsIndex, 1);
                }
            } else if (!matchForToday) {
                newCareerState.news.unshift({
                    title: `Dia de treino concluído.`,
                    date: newCareerState.currentDate,
                    type: 'neutral'
                });
            }
        }
        // Salva todas as alterações de uma só vez
            saveCareerProgress(newCareerState);
        }, [activeCareer, squad, schedule, saveCareerProgress]);

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

        // Guarda a data de início numa variável para ser reutilizada
        const startDate = new Date('2024-07-01').toISOString();

        const newCareer: CareerSave = {
            saveName,
            clubId: club.id,
            clubName: club.name,
            budget: 10000000,
            currentSeason: "2024/25",
            currentDate: startDate, // Usa a variável aqui
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
            availableScouts: generateScouts(),
            lastScoutMarketRefresh: startDate,
            scoutMissions: [],
            scoutingReports: [],
            negotiations: [],
            pendingYouthSignings: [],
            activeFormation: null,
            squad: [],
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

        // Garante que a negociação existe, foi iniciada pela IA e é uma transferência
        if (negotiation && negotiation.initiatedBy === 'ai' && negotiation.negotiationType === 'transfer') {
            const lastOffer = negotiation.offerHistory[negotiation.offerHistory.length - 1];

            // CORREÇÃO APLICADA AQUI:
            // Verifica se a última oferta existe e se a propriedade 'value' é um número válido.
            if (lastOffer && typeof lastOffer.value === 'number') {
                // 1. Adiciona o valor da venda ao orçamento
                newCareerState.budget += lastOffer.value;

                // 2. Remove o jogador do seu plantel
                // (Esta lógica precisa ser aprimorada para remover de 'newCareerState.squad')
                const updatedSquad = newCareerState.squad.filter(p => p.id !== negotiation.playerId);
                newCareerState.squad = updatedSquad;

                // 3. Remove a negociação da lista de ativas
                newCareerState.negotiations = newCareerState.negotiations.filter(n => n.id !== negotiationId);

                // 4. Cria a notícia da transferência
                newCareerState.news.unshift({
                    title: `${negotiation.playerName} foi transferido para ${negotiation.aiClub?.name || 'outro clube'} por €${formatCompactNumber(lastOffer.value)}.`,
                    date: new Date().toISOString(),
                    type: 'positive'
                });

                // 5. Remove o jogador da sua lista de transferências
                newCareerState.transferList = newCareerState.transferList.filter(item => item.playerId !== negotiation.playerId);

                saveCareerProgress(newCareerState);
                // Atualiza o estado local do plantel
                setSquad(updatedSquad);
            }
        }
    };

    const rejectAiOffer = (negotiationId: string) => {
        if (!activeCareer) return;
        const newCareerState = { ...activeCareer };
        const negotiation = newCareerState.negotiations.find(n => n.id === negotiationId);

        if (negotiation) {
            // Apenas remove a negociação da lista
            newCareerState.negotiations = newCareerState.negotiations.filter(n => n.id !== negotiationId);

            const clubName = negotiation.aiClub ? negotiation.aiClub.name : 'A proposta';


            // Adiciona uma notícia a informar da rejeição
            newCareerState.news.unshift({
                title: `Proposta de ${clubName} por ${negotiation.playerName} foi rejeitada.`,
                date: new Date().toISOString(),
                type: 'neutral'
            });

            saveCareerProgress(newCareerState);
            setNegotiations(newCareerState.negotiations);
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
            toast.info(`${scout.name} foi chamado de volta e está agora disponível.`);
            return { ...scout, status: 'Disponível' as const };
        });


        const updatedMissions = activeCareer.scoutMissions.filter(m => m.scoutId !== scoutId);

        const newCareerState: CareerSave = {
            ...activeCareer,
            scouts: updatedScouts,
            scoutMissions: updatedMissions
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
            scoutMissions: updatedMissions
        };

        toast.success(`${scout.name} foi demitido.`, {
            description: "O seu contrato foi terminado."
        });

        saveCareerProgress(newCareerState);
        setScouts(newCareerState.scouts);
    };

    const hireScout = (scoutToHire: AvailableScout) => {
        if (!activeCareer) return;

        // 1. Verifica o limite de olheiros contratados
        if (activeCareer.scouts.length >= 5) {
            toast.warning("Você atingiu o limite máximo de 5 olheiros.");
            return;
        }

        // 2. Verifica se há orçamento suficiente para o custo do olheiro
        if (activeCareer.budget < scoutToHire.cost) {
            toast.error("Orçamento insuficiente para contratar este olheiro.");
            return;
        }

        const newCareerState: CareerSave = JSON.parse(JSON.stringify(activeCareer));

        // 3. Remove o olheiro da lista de disponíveis no mercado
        newCareerState.availableScouts = newCareerState.availableScouts.filter(s => s.id !== scoutToHire.id);

        // 4. Cria o olheiro "permanente" para a sua equipa (sem a propriedade 'cost')
        const newScout: Scout = {
            id: scoutToHire.id,
            name: scoutToHire.name,
            rating: scoutToHire.rating,
            specialty: scoutToHire.specialty,
            status: 'Disponível',
            type: scoutToHire.type,
            cost: scoutToHire.cost,
            nationality: scoutToHire.nationality,
        };

        // 5. Adiciona o novo olheiro à sua lista de contratados
        newCareerState.scouts.push(newScout);

        // 6. Deduz o custo do orçamento
        newCareerState.budget -= scoutToHire.cost;

        // 7. Adiciona uma notícia e um toast de sucesso
        newCareerState.news.unshift({
            title: `O olheiro ${scoutToHire.name} foi contratado para a sua equipa!`,
            date: new Date().toISOString(),
            type: 'positive' as const
        });
        toast.success(`${scoutToHire.name} juntou-se à sua equipa de observação!`);

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
        schedule,
        youthSquad,
        loadCareer,
        startNewCareer,
        availableScouts,
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
        startContractNegotiation,
        rejectScoutedPlayer,
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
        toast.error("Failed to fetch leagues. Entre em contato com o suporte!!");
        return [];
    }
}