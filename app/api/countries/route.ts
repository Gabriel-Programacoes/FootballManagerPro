import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Estrutura de dados que a nossa API vai retornar (sem alterações)
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
    id: string;
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

        // --- CORREÇÃO PRINCIPAL AQUI ---
        // A consulta SQL foi simplificada para usar a coluna 'countryName' que já processamos.
        const clubsData = await db.all(`
            SELECT
                c.id,
                c.name,
                c.leagueName,
                c.countryName,
                (SELECT COUNT(*) FROM players WHERE club_id = c.id) AS playerCount
            FROM clubs c
            WHERE c.countryName IS NOT NULL AND c.countryName != ''
            ORDER BY c.countryName, c.leagueName, c.name
        `);

        // --- A LÓGICA DE ESTRUTURAÇÃO ABAIXO CONTINUA A MESMA ---
        const countriesMap: Record<string, Country> = {};

        for (const row of clubsData) {
            const countryName = row.countryName;

            if (!countriesMap[countryName]) {
                countriesMap[countryName] = { name: countryName, leagues: [], clubCount: 0 };
            }

            let league = countriesMap[countryName].leagues.find(l => l.name === row.leagueName);
            if (!league) {
                league = { name: row.leagueName, clubs: [] };
                countriesMap[countryName].leagues.push(league);
            }

            league.clubs.push({
                id: row.id,
                name: row.name,
                leagueName: row.leagueName,
                playerCount: row.playerCount
            });

            countriesMap[countryName].clubCount++;
        }

        // Ordena os países, colocando "Resto do mundo" por último
        const result = Object.values(countriesMap).sort((a, b) => {
            if (a.name === 'Resto do mundo') return 1;
            if (b.name === 'Resto do mundo') return -1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao buscar dados do banco:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}