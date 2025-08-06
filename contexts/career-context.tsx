"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { countries, Club, League } from '@/data/club-data';
import { mockPlayers, Player } from '@/data/player-data';
import { useRouter } from 'next/navigation';

interface CareerContextType {
    managedClub: Club | null;
    managedLeague: League | null;
    playersInClub: Player[];
    selectManagedClub: (clubId: string) => void;
    hasCareer: boolean;
    isLoading: boolean;
}

const CareerContext = createContext<CareerContextType | undefined>(undefined);

export function CareerProvider({ children }: { children: ReactNode }) {
    const router = useRouter();

    const [managedClubId, setManagedClubId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedClubId = localStorage.getItem('managedClubId');
        if (savedClubId) {
            setManagedClubId(savedClubId);
        }
        setIsLoading(false);
    }, []);

    const selectManagedClub = (clubId: string) => {
        localStorage.setItem('managedClubId', clubId);
        setManagedClubId(clubId);
        router.push('/');
    };

    let managedClub: Club | null = null;
    let managedLeague: League | null = null;

    if (managedClubId) {
        for (const country of countries) {
            for (const league of country.leagues) {
                const foundClub = league.clubs.find(club => club.id === managedClubId);
                if (foundClub) {
                    managedClub = foundClub;
                    managedLeague = league;
                    break; // Encontrou o clube, pode parar o loop interno
                }
            }
            if (managedClub) {
                break; // Encontrou o clube, pode parar o loop externo também
            }
        }
    }

    const playersInClub = managedClub
        ? mockPlayers.filter(player => managedClub!.playerIds.includes(player.id))
        : [];

    const value = { managedClub, managedLeague, playersInClub, selectManagedClub, hasCareer: !!managedClubId, isLoading };

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