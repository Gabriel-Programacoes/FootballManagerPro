// app/api/countries/route.ts

import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// As interfaces que o seu frontend espera
interface Country {
    name: string;
    leagues: League[];
    clubCount: number;
}
interface League {
    name: string;
    clubs: Club[];
}
interface Club {
    id: string; // O frontend espera 'id', o DB tem 'club_team_id'
    name: string;
    leagueName: string;
    playerCount: number;
}

let db: Database | null = null;

export async function GET() {
    try {
        if (!db) {
            const dbPath = path.join(process.cwd(), 'master_data.db');
            db = await open({
                filename: dbPath,
                driver: sqlite3.Database,
                mode: sqlite3.OPEN_READONLY
            });
        }

        // Consulta SQL otimizada que já obtém a contagem de jogadores por clube
        const clubsData = await db.all(`
            SELECT
                c.club_team_id,
                c.club_name,
                c.league_name,
                c.countryName,
                (SELECT COUNT(p.player_id) FROM players p WHERE p.club_team_id = c.club_team_id) AS playerCount
            FROM clubs c
            WHERE c.countryName IS NOT NULL AND c.countryName != '' AND c.club_name IS NOT NULL
            ORDER BY c.countryName, c.league_name, c.club_name
        `);

        const countriesMap: Record<string, Country> = {};

        // A lógica de agregação permanece, mas agora é mais simples e direta
        for (const row of clubsData) {
            const countryName = row.countryName;

            if (!countriesMap[countryName]) {
                countriesMap[countryName] = { name: countryName, leagues: [], clubCount: 0 };
            }

            let league = countriesMap[countryName].leagues.find(l => l.name === row.league_name);
            if (!league) {
                league = { name: row.league_name, clubs: [] };
                countriesMap[countryName].leagues.push(league);
            }

            // Mapeamento dos nomes das colunas do DB para a interface do frontend
            league.clubs.push({
                id: row.club_team_id,
                name: row.club_name,
                leagueName: row.league_name,
                playerCount: row.playerCount
            });

            countriesMap[countryName].clubCount++;
        }

        // Ordena os países, colocando "Resto do mundo" por último
        const result = Object.values(countriesMap).sort((a, b) => {
            if (a.name === 'Resto do Mundo') return 1;
            if (b.name === 'Resto do Mundo') return -1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao buscar dados de países/clubes:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}