
"use client";

import {createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo} from 'react';
import { useRouter } from 'next/navigation';
import type { Club, League, Country } from '@/app/team-select/page';
import { simulateMatch } from '@/lib/simulation/match-engine';
import { Player } from '@/app/squad/page';
import { MatchResult, NewsItem, SeasonObjective, TransferListing, LoanListing } from "@/lib/game-data";
import {formatCompactNumber} from "@/lib/utils";

// --- INTERFACE DO "SAVE GAME" ---
export interface CareerSave {
    saveName: string;
    clubId: string;
    clubName: string;
    currentSeason: string;
    currentDate: string;
    results: MatchResult[];
    news: NewsItem[];
    objectives: SeasonObjective[];
    transferList: TransferListing[];
    loanList: LoanListing[];
}

// --- TIPO DO CONTEXTO ---
interface CareerContextType {
    // Estado
    managedClub: Club | null;
    managedLeague: League | null;
    activeCareer: CareerSave | null;
    hasCareer: boolean;
    isLoading: boolean;
    careers: CareerSave[];

    // Ações
    loadCareer: (index: number) => void;
    startNewCareer: (club: Club) => void;
    deleteCareer: (index: number) => void;
    saveCareerProgress: (updatedCareer: CareerSave) => void;
    advanceTime: () => Promise<void>;
    getPlayerSquad: () => Promise<Player[]>;

    listPlayerForTransfer: (playerId: string, askingPrice: number) => void;
    unlistPlayerForTransfer: (playerId: string) => void;


    listPlayerForLoan: (playerId: string, conditions: Omit<LoanListing, 'playerId' | 'isListed'>) => void;
    unlistPlayerForLoan: (playerId: string) => void;

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

    // Efeito para carregar dados do localStorage e das ligas na inicialização
    useEffect(() => {
        async function loadInitialData() {
            try {
                // Carregar carreiras salvas
                const savedCareers = localStorage.getItem('careers');
                const savedActiveIndex = localStorage.getItem('activeCareerIndex');

                if (savedCareers) {
                    const parsedCareers: CareerSave[] = JSON.parse(savedCareers);
                    setCareers(parsedCareers);

                    if (savedActiveIndex !== null) {
                        const index = JSON.parse(savedActiveIndex);
                        setActiveCareerIndex(index);
                        setActiveCareer(parsedCareers[index] || null);
                    }
                }

                // Carregar dados estáticos das ligas
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

    const saveCareerProgress = useCallback((updatedCareer: CareerSave) => {
        if (activeCareerIndex !== null) {
            const updatedCareers = [...careers];
            updatedCareers[activeCareerIndex] = updatedCareer;

            setCareers(updatedCareers);
            setActiveCareer(updatedCareer);
            localStorage.setItem('careers', JSON.stringify(updatedCareers));
            console.log("Progresso da carreira guardado!");
        }
    }, [activeCareerIndex, careers]);

    const advanceTime = useCallback(async () => {
        if (!activeCareer) return;

        const newCareerState: CareerSave = JSON.parse(JSON.stringify(activeCareer));
        const currentDate = new Date(newCareerState.currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
        newCareerState.currentDate = currentDate.toISOString();

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

        saveCareerProgress(newCareerState);
    }, [activeCareer, getPlayerSquad, saveCareerProgress]);

    const startNewCareer = (club: Club) => {
        const saveName = prompt("Dê um nome para sua nova carreira:", `Carreira com ${club.name}`);
        if (!saveName) return;

        const newCareer: CareerSave = {
            saveName,
            clubId: club.id,
            clubName: club.name,
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