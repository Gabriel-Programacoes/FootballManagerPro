// app/api/countries/route.ts

import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Estrutura de dados que a nossa API vai retornar
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
    playerCount: number; // Adicionamos a contagem de jogadores
}

// Variável para armazenar a conexão e evitar reabri-la a cada requisição
let db: Database | null = null;

export async function GET() {
    try {
        // Se o banco de dados ainda não foi aberto, abra-o
        if (!db) {
            // Encontra o caminho para o arquivo do banco de dados na raiz do projeto
            const dbPath = path.join(process.cwd(), 'master_data.db');

            db = await open({
                filename: dbPath,
                driver: sqlite3.Database,
                mode: sqlite3.OPEN_READONLY // Abre em modo "somente leitura" para segurança
            });
        }

        // --- BUSCA OS DADOS DO BANCO ---
        const clubsData = await db.all(`
            SELECT 
                c.id, 
                c.name, 
                c.leagueName,
                p.profile_nation AS countryName,
                (SELECT COUNT(*) FROM players WHERE club_id = c.id) AS playerCount
            FROM clubs c
            JOIN (
                -- Pega a nação dominante de cada clube para definir o país da liga
                SELECT club_id, profile_nation FROM (
                    SELECT 
                        club_id, 
                        profile_nation, 
                        ROW_NUMBER() OVER(PARTITION BY club_id ORDER BY COUNT(*) DESC) as rn
                    FROM players
                    WHERE profile_nation IS NOT NULL
                    GROUP BY club_id, profile_nation
                ) WHERE rn = 1
            ) p ON p.club_id = c.id
            ORDER BY countryName, c.leagueName, c.name
        `);

        // --- ESTRUTURA OS DADOS NO FORMATO JSON ESPERADO PELO FRONT-END ---
        const countriesMap: Record<string, Country> = {};

        for (const row of clubsData) {
            const countryName = row.countryName || 'Resto do mundo';

            // Cria o país se ele não existir no nosso mapa
            if (!countriesMap[countryName]) {
                countriesMap[countryName] = { name: countryName, leagues: [], clubCount: 0 };
            }

            // Encontra ou cria a liga dentro do país
            let league = countriesMap[countryName].leagues.find(l => l.name === row.leagueName);
            if (!league) {
                league = { name: row.leagueName, clubs: [] };
                countriesMap[countryName].leagues.push(league);
            }

            // Adiciona o clube à liga
            league.clubs.push({
                id: row.id,
                name: row.name,
                leagueName: row.leagueName,
                playerCount: row.playerCount
            });

            countriesMap[countryName].clubCount++;
        }

        // Converte o mapa em uma lista e ordena
        const result = Object.values(countriesMap).sort((a, b) => a.name.localeCompare(b.name));

        // Retorna a resposta com sucesso
        return NextResponse.json(result);

    } catch (error) {
        console.error('Erro ao buscar dados do banco:', error);
        // Retorna um erro 500 se algo der errado
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}