export interface MatchResult {
    opponent: string;
    result: string; // "2-1"
    competition: string;
    home: boolean;
    points: 0 | 1 | 3;
}

export interface NewsItem {
    title: string;
    date: string; // Usaremos o formato ISO "YYYY-MM-DD" para facilitar a ordenação
    type: 'positive' | 'negative' | 'neutral';
}

export interface SeasonObjective {
    id: string;
    title: string;
    progress: number; // 0-100
    reward: string;
    isCompleted: boolean;
}