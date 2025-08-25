import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { Player } from '@/app/squad/page';

let db: Database | null = null;

// Função auxiliar para formatar os dados do jogador
const formatDbPlayer = (p: any, isFreeAgent = false): Player => {
    // Se for um agente livre, simulamos os dados do "clube" e do contrato
    if (isFreeAgent) {
        // Gera um valor de mercado e salário baseados no overall e potencial
        const baseValue = (p.overall * 5000) + (p.potential * 2500);
        p.value_eur = Math.round((baseValue * (1 + (Math.random() * 0.2))) / 1000) * 1000; // Adiciona variação
        p.wage_eur = Math.round((p.value_eur / 100 * (1 + (Math.random() * 0.5))) / 100) * 100;
        p.club_name = "Agentes Livres FC"; // O nosso clube virtual
        p.club_jersey_number = Math.floor(Math.random() * 98) + 1; // Número de camisola aleatório
    }

    return {
        id: p.player_id,
        name: p.short_name,
        age: p.age,
        jerseyNumber: p.club_jersey_number,
        position: p.player_positions.split(',')[0].trim(),
        overall: p.overall,
        potential: p.potential,
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
            profile: { height: `${p.height_cm}cm`, weight: `${p.weight_kg}kg`, nation: p.nationality_name, league: p.leagueName, team: p.club_name }
        }
    };
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    // Parâmetros existentes
    const excludeClubId = searchParams.get('excludeClubId');
    const freeAgentsOnly = searchParams.get('freeAgentsOnly') === 'true';
    const limit = searchParams.get('limit');
    const minPotential = searchParams.get('minPotential');
    const country = searchParams.get('country');
    const leagueName = searchParams.get('leagueName');
    const position = searchParams.get('position');

    if (!excludeClubId) {
        return NextResponse.json({ message: 'ID do clube a ser excluído não fornecido.' }, { status: 400 });
    }

    try {
        if (!db) {
            const dbPath = path.join(process.cwd(), 'master_data.db');
            db = await open({ filename: dbPath, driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
        }

        // Base da query
        let query = `
            SELECT p.*, c.club_name, c.league_name as leagueName, c.countryName
            FROM players p
                     LEFT JOIN clubs c ON p.club_team_id = c.club_team_id
            WHERE p.club_team_id != ?
        `;
        const params: any[] = [excludeClubId];



        // Adiciona filtros dinamicamente
        if (freeAgentsOnly) {
            query += ' AND p.value_eur = 0';
        } else {
            query += ' AND p.value_eur > 0';
        }
        if (minPotential) {
            query += ' AND p.potential >= ?';
            params.push(minPotential);
        }
        if (country) {
            query += ' AND c.countryName = ?';
            params.push(country);
        }
        if (leagueName) {
            query += ' AND c.league_name = ?';
            params.push(leagueName);
        }
        if (position) {
            query += ' AND p.player_positions LIKE ?';
            params.push(`%${position}%`);
        }

        if (limit) {
            query += ` ORDER BY RANDOM() LIMIT ?`;
            params.push(limit);
        }

        const players = await db.all(query, params);
        const formattedPlayers = players.map(p => ({...formatDbPlayer(p)}));

        return NextResponse.json(formattedPlayers);

    } catch (error) {
        console.error('Erro ao buscar jogadores do mercado:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}