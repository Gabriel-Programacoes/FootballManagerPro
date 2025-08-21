// app/api/dashboard/[clubId]/route.ts

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

        // Consulta na tabela 'players' com os novos nomes de colunas
        const clubStats = await db.get(`
            SELECT
                COUNT(player_id) as totalPlayers,
                AVG(age) as averageAge,
                SUM(value_eur) as totalValue,
                SUM(wage_eur) as totalWages
            FROM players
            WHERE club_team_id = ?
        `, clubId);

        // Busca a reputação da tabela 'club_details'
        const clubDetails = await db.get('SELECT reputation FROM club_details WHERE club_id = ?', clubId);

        if (!clubStats) {
            return NextResponse.json({ message: 'Não foi possível calcular as estatísticas do clube.' }, { status: 404 });
        }

        const responseData = {
            totalPlayers: clubStats.totalPlayers || 0,
            averageAge: (clubStats.averageAge || 0).toFixed(1),
            teamValue: clubStats.totalValue || 0,
            weeklyWages: clubStats.totalWages || 0,
            transferBudget: (clubStats.totalValue || 0) * 0.30, // Exemplo de cálculo
            reputation: clubDetails?.reputation || 'Nacional'
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Erro ao buscar dados do dashboard para o clube ${clubId}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}