// contexts/career-context.tsx

"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Club, League, Country } from '@/app/team-select/page';

// Estrutura de um "save" de carreira
interface CareerSave {
    saveName: string;
    clubId: string;
    clubName: string; // Guardamos o nome para facilitar a exibição
}

interface CareerContextType {
    // Estado atual
    managedClub: Club | null;
    managedLeague: League | null;
    hasCareer: boolean;
    isLoading: boolean;

    // Lista de saves
    careers: CareerSave[];

    // Ações
    loadCareer: (index: number) => void;
    startNewCareer: (club: Club) => void;
    deleteCareer: (index: number) => void;
}

const CareerContext = createContext<CareerContextType | undefined>(undefined);

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

export function CareerProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const [careers, setCareers] = useState<CareerSave[]>([]);
    const [activeCareerIndex, setActiveCareerIndex] = useState<number | null>(null);

    const [leagues, setLeagues] = useState<League[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Efeito para carregar tudo do localStorage na inicialização
    useEffect(() => {
        async function loadInitialData() {
            const savedCareers = localStorage.getItem('careers');
            const savedActiveIndex = localStorage.getItem('activeCareerIndex');

            if (savedCareers) {
                setCareers(JSON.parse(savedCareers));
            }
            if (savedActiveIndex) {
                setActiveCareerIndex(JSON.parse(savedActiveIndex));
            }

            const allLeagues = await fetchAllLeagues();
            setLeagues(allLeagues);
            setIsLoading(false);
        }
        loadInitialData();
    }, []);

    const startNewCareer = (club: Club) => {
        const saveName = prompt("Dê um nome para sua nova carreira:", `Carreira com ${club.name}`);
        if (!saveName) return; // Usuário cancelou

        const newCareer: CareerSave = {
            saveName,
            clubId: club.id,
            clubName: club.name,
        };
        const updatedCareers = [...careers, newCareer];
        const newIndex = updatedCareers.length - 1;

        setCareers(updatedCareers);
        setActiveCareerIndex(newIndex);
        localStorage.setItem('careers', JSON.stringify(updatedCareers));
        localStorage.setItem('activeCareerIndex', JSON.stringify(newIndex));

        router.push('/dashboard');
    };

    const loadCareer = (index: number) => {
        setActiveCareerIndex(index);
        localStorage.setItem('activeCareerIndex', JSON.stringify(index));
        router.push('/dashboard');
    };

    const deleteCareer = (index: number) => {
        if (!confirm("Tem certeza que deseja apagar esta carreira? Essa ação não pode ser desfeita.")) {
            return;
        }

        const updatedCareers = careers.filter((_, i) => i !== index);
        setCareers(updatedCareers);
        localStorage.setItem('careers', JSON.stringify(updatedCareers));

        // Se a carreira deletada era a ativa, desativa
        if(activeCareerIndex === index) {
            setActiveCareerIndex(null);
            localStorage.removeItem('activeCareerIndex');
        }
    };

    let managedClub: Club | null = null;
    let managedLeague: League | null = null;
    const hasCareer = activeCareerIndex !== null;

    if (hasCareer && leagues.length > 0) {
        const activeClubId = careers[activeCareerIndex!].clubId;
        for (const league of leagues) {
            const foundClub = league.clubs.find(club => club.id === activeClubId);
            if (foundClub) {
                managedClub = foundClub;
                managedLeague = league;
                break;
            }
        }
    }

    const value = {
        managedClub,
        managedLeague,
        hasCareer,
        isLoading,
        careers,
        loadCareer,
        startNewCareer,
        deleteCareer
    };

    return (
        <CareerContext.Provider value={value}>
            {children}
        </CareerContext.Provider>
    );
}

export function useCareer() {
    const context = useContext(CareerContext);
    if (context === undefined) {
        throw new Error('useCareer deve ser usado dentro de um CareerProvider');
    }
    return context;
}