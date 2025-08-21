// app/api/clubs/[clubId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function GET(request: NextRequest) {
    const clubId = request.nextUrl.pathname.split('/').pop();

    if (!clubId) {
        return NextResponse.json({ message: 'ID do clube não fornecido.' }, { status: 400 });
    }

    try {
        if (!db) {
            const dbPath = path.join(process.cwd(), 'master_data.db');
            db = await open({ filename: dbPath, driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
        }

        // Consulta que une as tabelas 'clubs' e 'club_details'
        const details = await db.get(`
            SELECT * FROM club_details
            WHERE club_id = ?
        `, clubId);

        // Se não houver detalhes, retorna um erro amigável
        if (!details) {
            return NextResponse.json({ message: 'Detalhes para este clube não encontrados.' }, { status: 404 });
        }

        // Busca os 3 melhores jogadores do clube
        const keyPlayers = await db.all(`
            SELECT short_name as name, player_positions as position, overall FROM players
            WHERE club_team_id = ? ORDER BY overall DESC LIMIT 3
        `, clubId);

        // Calcula o orçamento de transferência (ex: 30% do valor total do elenco)
        const squadValue = await db.get(
            'SELECT SUM(value_eur) as totalValue FROM players WHERE club_team_id = ?', clubId
        );
        const transferBudget = (squadValue?.totalValue || 0) * 0.30;

        // Monta o objeto de resposta no formato esperado pelo frontend
        const responseData = {
            details: {
                reputation: details.reputation,
                difficulty: details.difficulty,
                objectives: {
                    league: details.objectives_league,
                    cup: details.objectives_cup,
                    continental: details.objectives_continental
                },
                strengths: JSON.parse(details.strengths || '[]'),
                weaknesses: JSON.parse(details.weaknesses || '[]'),
                challenges: JSON.parse(details.challenges || '[]')
            },
            keyPlayers: keyPlayers.map(p => ({...p, position: p.position.split(',')[0]})),
            transferBudget
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Erro ao buscar detalhes para o clube ${clubId}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}