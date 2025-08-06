// app/api/clubs/[clubId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

const defaultDetails = {
    reputation: 'Nacional',
    difficulty: 'Médio',
    objectives_league: 'Terminar no meio da tabela',
    objectives_cup: 'Fazer uma boa campanha',
    objectives_continental: null,
    strengths: '["Jogo Coletivo"]',
    weaknesses: '["Orçamento Limitado"]',
    challenges: '["Surpreender os grandes e se estabelecer na liga."]'
};

export async function GET(
    request: NextRequest,
    { params }: { params: { clubId: string } }
) {
    const clubId = params.clubId;

    if (!clubId) {
        return NextResponse.json({ message: 'ID do clube não fornecido.' }, { status: 400 });
    }

    try {
        if (!db) {
            const dbPath = path.join(process.cwd(), 'master_data.db');
            db = await open({
                filename: dbPath,
                driver: sqlite3.Database,
                mode: sqlite3.OPEN_READONLY
            });
        }

        // 1. Busca os detalhes do clube
        let details = await db.get('SELECT * FROM club_details WHERE club_id = ?', clubId);
        if (!details) {
            details = defaultDetails; // Usa o perfil padrão se não encontrar detalhes específicos
        }

        // 2. Busca os 3 melhores jogadores
        const keyPlayers = await db.all(
            'SELECT name, position, overall FROM players WHERE club_id = ? ORDER BY overall DESC LIMIT 3',
            clubId
        );

        // 3. Calcula o valor total do elenco para o orçamento
        const squadValue = await db.get(
            'SELECT SUM(value) as totalValue FROM players WHERE club_id = ?',
            clubId
        );
        const transferBudget = (squadValue?.totalValue || 0) * 0.30;

        // 4. Combina tudo em uma única resposta
        const responseData = {
            details: {
                reputation: details.reputation,
                difficulty: details.difficulty,
                objectives: {
                    league: details.objectives_league,
                    cup: details.objectives_cup,
                    continental: details.objectives_continental
                },
                // JSON.parse para transformar as strings de volta em arrays
                strengths: JSON.parse(details.strengths || '[]'),
                weaknesses: JSON.parse(details.weaknesses || '[]'),
                challenges: JSON.parse(details.challenges || '[]')
            },
            keyPlayers,
            transferBudget
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Erro ao buscar detalhes para o clube ${clubId}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}