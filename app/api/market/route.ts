// app/api/market/route.ts

import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { Player } from '@/app/squad/page'; // Importa a interface Player

let db: Database | null = null;

// Função auxiliar para formatar os dados do jogador (evita repetição de código)
const formatDbPlayer = (p: any): Player => ({
    id: p.player_id,
    name: p.short_name,
    age: p.age,
    jerseyNumber: p.club_jersey_number,
    position: p.player_positions.split(',')[0].trim(),
    overall: p.overall,
    potential: p.potential, // Adicionando o potencial
    contract: {
        value: p.value_eur,
        wage: p.wage_eur,
        ends: p.club_contract_valid_until_year
    },
    attributes: {
        pace: { acceleration: p.movement_acceleration, sprintSpeed: p.movement_sprint_speed },
        shooting: { finishing: p.attacking_finishing, penalties: p.mentality_penalties },
        passing: { crossing: p.passing, freeKickAccuracy: p.skill_fk_accuracy, shortPassing: p.attacking_short_passing, longPassing: p.skill_long_passing },
        dribbling: { dribbling: p.skill_dribbling },
        defending: { defAwareness: p.defending_marking_awareness, standingTackle: p.defending_standing_tackle, slidingTackle: p.defending_sliding_tackle },
        physical: { stamina: p.power_stamina, strength: p.power_strength, aggression: p.physic },
        goalkeeping: { gkPositioning: p.goalkeeping_positioning, gkReflexes: p.goalkeeping_reflexes, gkDiving: p.goalkeeping_diving },
        mentality: { weakFoot: p.weak_foot, preferredFoot: p.preferred_foot },
        profile: { height: `${p.height_cm}cm`, weight: `${p.weight_kg}kg`, nation: p.nationality_name, league: '', team: p.club_name }
    }
});

export async function GET(request: NextRequest) {
    // Obtém o ID do clube do utilizador a partir dos parâmetros da URL para o excluir da busca
    const { searchParams } = new URL(request.url);
    const excludeClubId = searchParams.get('excludeClubId');

    if (!excludeClubId) {
        return NextResponse.json({ message: 'ID do clube a ser excluído não fornecido.' }, { status: 400 });
    }

    try {
        if (!db) {
            const dbPath = path.join(process.cwd(), 'master_data.db');
            db = await open({ filename: dbPath, driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
        }

        const players = await db.all(`
            SELECT p.*, c.club_name
            FROM players p
                     LEFT JOIN clubs c ON p.club_team_id = c.club_team_id
            WHERE p.club_team_id != ? AND p.value_eur = 0
        `, [excludeClubId]);

        const formattedPlayers = players.map(formatDbPlayer);

        return NextResponse.json(formattedPlayers);

    } catch (error) {
        console.error('Erro ao buscar jogadores do mercado:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}