import {Player} from "@/app/squad/page";
import {Formation} from "@/app/tactics/page";

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

export interface BoardRequest {
    id: string;
    type: "transfer" | "wage" | "facilities";
    amount: number;
    reason: string;
    justification: string;
    status: "pending" | "approved" | "rejected";
    date: string;
    response?: string;
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
export interface AvailableScout {
    id: number;
    name: string;
    rating: number;
    specialty: string;
    nationality: string;
    cost: number;
    type: 'youth' | 'senior';
}

export interface Scout {
    id: number;
    name: string;
    rating: number;
    specialty: string;
    status: 'Disponível' | 'Observando';
    type: 'youth' | 'senior';
    nationality: string,
    cost: number,
}

export interface ScoutMission {
    scoutId: number;
    endDate: string;
    type: 'youth' | 'senior';
    country?: string;
    leagueName?: string;
    position?: string;
}

export interface ScoutingReport {
    reportId: string;
    scoutId: number;
    dateFound: string;
    notes: string;
    player: YouthPlayer;
}

export interface Offer {
    value?: number;
    swapPlayerId?: string;
    sellOnClause?: number;
    date: string;
    offeredBy: 'user' | 'ai';
    wage?: number;
    contractLength?: number;
    squadRole?: 'Estrela' | 'Titular' | 'Rotação' | 'Jovem Promessa';
}

export interface Negotiation {
    id: string;
    negotiationType: 'transfer' | 'contract';
    initiatedBy: 'user' | 'ai';

    playerId: string;
    playerName: string;
    playerOverall: number;

    myClubId: string;
    aiClub?: {
        id: string;
        name: string;
    };
    status: 'Enviada' | 'Recebida' | 'Aceite' | 'Rejeitada' | 'Contraproposta';
    offerHistory: Offer[];
    deadline: string;
}

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: 'transfers' | 'wages' | 'scouting' | 'match_day' | 'sponsors' | 'other';
}

export interface Finances {
    weeklySummary: {
        income: number;
        expenses: number;
    };
    transactions: Transaction[];
}

export interface CareerSave {
    saveName: string;
    clubId: string;
    clubName: string;
    budget: number;
    totalBudget: number;
    transferBudget: number;
    wageBudget: number;
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
    pendingYouthSignings: YouthPlayer[];
    scoutingReports: ScoutingReport[];
    activeFormation: Formation | null;
    youthSquad: YouthPlayer[];
    squad: Player[];
    availableScouts: AvailableScout[];
    lastScoutMarketRefresh: string;
    finances: Finances;
    transactions: Transaction[];
    boardRequests: BoardRequest[];
}

export interface YouthPlayer {
    id: string;
    name: string;
    nationality: string;
    age: number;
    position: string;
    overall: number;
    potential: [number, number];
    attributes: { pace: number; shooting: number; passing: number; dribbling: number; defending: number; physical: number; };
    traits: string[];
}