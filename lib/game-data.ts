// O resultado de uma partida simulada
export interface MatchResult {
    opponent: string;
    result: string; // Ex: "2-1"
    competition: string;
    home: boolean;
    points: 0 | 1 | 3;
}

// Uma notícia gerada no jogo
export interface NewsItem {
    title: string;
    date: string;
    type: 'positive' | 'negative' | 'neutral';
}

// Um objetivo definido pela direção do clube
export interface SeasonObjective {
    id: string;
    title: string;
    progress: number; // 0-100
    reward: string;
    isCompleted: boolean;
}

export interface TransferListing {
    playerId: string;
    askingPrice: number;
    isListed: boolean;
}

// Um jogador que foi colocado na lista de empréstimos
export interface LoanListing {
    playerId: string;
    isListed: boolean;
    durationInYears: 1 | 2;
    hasOptionToBuy: boolean;
    hasObligationToBuy: boolean;
    // Futuramente, pode adicionar condições como: wageSplit, loanFee, etc.
}
