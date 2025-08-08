// app/api/squad/[clubId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

// A função GET agora recebe 'request' e 'context' para acessar os parâmetros da URL
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

        // Busca todos os jogadores que pertencem ao club_id fornecido
        const players = await db.all('SELECT * FROM players WHERE club_id = ?', [clubId]);

        if (!players) {
            return NextResponse.json({ message: 'Nenhum jogador encontrado para este clube.' }, { status: 404 });
        }

        // O banco de dados armazena tudo achatado. Precisamos reestruturar para o formato que o front-end espera.
        const formattedPlayers = players.map(p => ({
            id: p.id,
            name: p.name,
            age: p.age,
            jerseyNumber: p.jerseyNumber,
            position: p.position,
            overall: p.overall,
            contract: {
                value: p.value,
                wage: p.wage,
                ends: p.contract_ends
            },
            attributes: { // Reconstruindo o objeto de atributos
                pace: { acceleration: p.pace_acceleration, sprintSpeed: p.pace_sprintSpeed },
                shooting: { finishing: p.shooting_finishing, penalties: p.shooting_penalties },
                passing: { crossing: p.passing_crossing, freeKickAccuracy: p.passing_freeKickAccuracy, shortPassing: p.passing_shortPassing, longPassing: p.passing_longPassing },
                dribbling: { dribbling: p.dribbling_dribbling },
                defending: { defAwareness: p.defending_defAwareness, standingTackle: p.defending_standingTackle, slidingTackle: p.defending_slidingTackle },
                physical: { stamina: p.physical_stamina, strength: p.physical_strength, aggression: p.physical_aggression },
                goalkeeping: { gkPositioning: p.goalkeeping_gkPositioning, gkReflexes: p.goalkeeping_gkReflexes },
                mentality: { weakFoot: p.mentality_weakFoot, preferredFoot: p.mentality_preferredFoot },
                profile: { height: p.profile_height, weight: p.profile_weight, nation: p.profile_nation, league: '', team: '' } // league e team podem ser preenchidos se necessário
            }
        }));

        return NextResponse.json(formattedPlayers);

    } catch (error) {
        console.error(`Erro ao buscar elenco para o clube ${clubId}:`, error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}