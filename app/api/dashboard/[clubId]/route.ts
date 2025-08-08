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
            db = await open({
                filename: dbPath,
                driver: sqlite3.Database,
                mode: sqlite3.OPEN_READONLY
            });
        }

        // 1. Busca as estatísticas agregadas do elenco em uma única consulta
        const clubStats = await db.get(`
            SELECT
                COUNT(id) as totalPlayers,
                AVG(age) as averageAge,
                SUM(value) as totalValue,
                SUM(wage) as totalWages
            FROM players
            WHERE club_id = ?
        `, clubId);

        // 2. Busca os detalhes do clube para pegar a reputação
        const clubDetails = await db.get('SELECT reputation FROM club_details WHERE club_id = ?', clubId);

        if (!clubStats) {
            return NextResponse.json({ message: 'Não foi possível calcular as estatísticas do clube.' }, { status: 404 });
        }

        // 3. Monta o objeto de resposta
        const responseData = {
            totalPlayers: clubStats.totalPlayers || 0,
            averageAge: (clubStats.averageAge || 0).toFixed(1),
            teamValue: clubStats.totalValue || 0,
            weeklyWages: clubStats.totalWages || 0,
            transferBudget: (clubStats.totalValue || 0) * 0.30,
            reputation: clubDetails?.reputation || 'Nacional' // Usa a reputação ou um padrão
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error(`Erro ao buscar dados do dashboard para o clube ${clubId}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}