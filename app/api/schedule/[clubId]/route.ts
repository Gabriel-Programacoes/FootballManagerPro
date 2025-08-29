// app/api/schedule/[clubId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

// Interface para definir a estrutura de um jogo no calendário
export interface ScheduleMatch {
    matchId: number;
    season: string;
    leagueName: string;
    matchDate: string;
    homeTeam: { id: number; name: string; };
    awayTeam: { id: number; name: string; };
    isHomeGame: boolean;
}


export async function GET(request: NextRequest) {
    const clubId = request.nextUrl.pathname.split('/').pop();

    if (!clubId) {
        return NextResponse.json({ message: 'ID do clube não fornecido.' }, { status: 400 });
    }
    const numericClubId = parseInt(clubId, 10);

    try {
        if (!db) {
            const dbPath = path.join(process.cwd(), 'master_data.db');
            // CORREÇÃO APLICADA AQUI
            const sqlite3Verbose = sqlite3.verbose();
            db = await open({
                filename: dbPath,
                driver: sqlite3Verbose.Database, // Usamos o driver "verbose"
                mode: sqlite3.OPEN_READONLY
            });
        }

        // Query que busca todos os jogos do clube, seja em casa ou fora
        // e junta com a tabela de clubes para obter os nomes das equipas
        const matches = await db.all(`
            SELECT
                s.match_id as matchId,
                s.season,
                s.league_name as leagueName,
                s.match_date as matchDate,
                s.home_team_id as homeTeamId,
                home_club.club_name as homeTeamName,
                s.away_team_id as awayTeamId,
                away_club.club_name as awayTeamName
            FROM schedules s
            JOIN clubs home_club ON s.home_team_id = home_club.club_team_id
            JOIN clubs away_club ON s.away_team_id = away_club.club_team_id
            WHERE s.home_team_id = ? OR s.away_team_id = ?
            ORDER BY s.match_date ASC
        `, [numericClubId, numericClubId]);

        if (!matches) {
            return NextResponse.json([], { status: 200 });
        }

        // Formata a resposta para ser mais amigável para o frontend
        const formattedMatches: ScheduleMatch[] = matches.map(m => ({
            matchId: m.matchId,
            season: m.season,
            leagueName: m.leagueName,
            matchDate: m.matchDate,
            homeTeam: { id: m.homeTeamId, name: m.homeTeamName },
            awayTeam: { id: m.awayTeamId, name: m.awayTeamName },
            isHomeGame: m.homeTeamId === numericClubId,
        }));

        return NextResponse.json(formattedMatches);

    } catch (error) {
        console.error(`Erro ao buscar calendário para o clube ${clubId}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}