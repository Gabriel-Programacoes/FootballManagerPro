// app/api/squad/[clubId]/route.ts

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

        const players = await db.all('SELECT * FROM players WHERE club_team_id = ?', [clubId]);

        if (!players || players.length === 0) {
            return NextResponse.json([], { status: 200 }); // Retorna um array vazio se não houver jogadores
        }

        // Mapeamento cuidadoso dos dados do DB para a interface do frontend
        const formattedPlayers = players.map(p => ({
            id: p.player_id,
            name: p.short_name,
            age: p.age,
            jerseyNumber: p.club_jersey_number,
            position: p.player_positions.split(',')[0], // Pega a primeira posição como principal
            overall: p.overall,
            contract: {
                value: p.value_eur,
                wage: p.wage_eur,
                ends: p.club_contract_valid_until_year
            },
            attributes: {
                pace: { acceleration: p.movement_acceleration, sprintSpeed: p.movement_sprint_speed },
                shooting: { finishing: p.attacking_finishing, penalties: p.mentality_penalties },
                passing: { crossing: p.passing, shortPassing: p.attacking_short_passing, longPassing: p.skill_long_passing, freeKickAccuracy: p.skill_fk_accuracy },
                dribbling: { dribbling: p.skill_dribbling },
                defending: { defAwareness: p.defending_marking_awareness, standingTackle: p.defending_standing_tackle, slidingTackle: p.defending_sliding_tackle },
                physical: { stamina: p.power_stamina, strength: p.power_strength, aggression: p.physic },
                goalkeeping: { gkPositioning: p.goalkeeping_positioning, gkReflexes: p.goalkeeping_reflexes, gkDiving: p.goalkeeping_diving },
                mentality: { weakFoot: p.weak_foot, preferredFoot: p.preferred_foot },
                profile: { height: `${p.height_cm}cm`, weight: `${p.weight_kg}kg`, nation: p.nationality_name, league: '', team: '' }
            }
        }));

        return NextResponse.json(formattedPlayers);

    } catch (error) {
        console.error(`Erro ao buscar elenco para o clube ${clubId}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}