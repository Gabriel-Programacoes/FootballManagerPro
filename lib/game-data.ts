import {Player} from "@/app/squad/page";

export interface MatchResult {
    opponent: string;
    result: string; // Ex: "2-1"
    competition: string;
    home: boolean;
    points: 0 | 1 | 3;
}

export interface NewsItem {
    title: string;
    date: string;
    type: 'positive' | 'negative' | 'neutral';
}

export interface SeasonObjective {
    id: string;
    title: string;
    progress: number;
    reward: string;
    isCompleted: boolean;
}

export interface TransferListing {
    playerId: string;
    askingPrice: number;
    isListed: boolean;
}

export interface LoanListing {
    playerId: string;
    isListed: boolean;
    durationInYears: 1 | 2;
    hasOptionToBuy: boolean;
    hasObligationToBuy: boolean;
}

export interface ScoutMission {
    scoutId: number;
    endDate: string;
    region?: string;
    country?: string;
    leagueName?: string;
    position?: string;
}

export interface ScoutingReport {
    playerId: string;
    scoutId: number;
    dateFound: string;
    notes: string;
    playerDetails: Player;
}

export interface Scout {
    id: number;
    name: string;
    rating: number;
    specialty: string;
    status: 'Disponível' | 'Observando';
}

export interface Offer {
    value: number;
    swapPlayerId?: string;
    sellOnClause?: number;
    date: string;
    offeredBy: 'user' | 'ai';
}

export interface Negotiation {
    id: string;
    initiatedBy: 'user' | 'ai';
    playerId: string;
    playerName: string;
    playerOverall: number;
    myClubId: string;
    aiClub: {
        id: string;
        name: string;
    };
    status: 'Enviada' | 'Recebida' | 'Aceite' | 'Rejeitada' | 'Contraproposta';
    offerHistory: Offer[];
    deadline: string;
}

export interface CareerSave {
    saveName: string;
    clubId: string;
    clubName: string;
    budget: number;
    currentSeason: string;
    currentDate: string;
    results: MatchResult[];
    news: NewsItem[];
    objectives: SeasonObjective[];
    transferList: TransferListing[];
    loanList: LoanListing[];
    negotiations: Negotiation[];
    scouts: Scout[];
    scoutMissions: ScoutMission[];
    scoutingReports: ScoutingReport[];
}