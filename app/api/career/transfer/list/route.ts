import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const { saveId, playerId, askingPrice } = await request.json();

        if (!saveId || !playerId || askingPrice === undefined) {
            return NextResponse.json({ message: 'Dados incompletos para a listagem de transferência.' }, { status: 400 });
        }

        const savePath = path.join(process.cwd(), 'saves', `${saveId}.db`);
        const db = await open({ filename: savePath, driver: sqlite3.Database });

        // Verifica se o jogador já está na lista de transferências
        const existingListing = await db.get(
            `SELECT * FROM transferList WHERE playerId = ?`,
            [playerId]
        );

        if (existingListing) {
            // Se já existe, atualiza o preço
            await db.run(
                `UPDATE transferList SET askingPrice = ?, isListed = 1 WHERE playerId = ?`,
                [askingPrice, playerId]
            );
        } else {
            // Se não existe, insere um novo registo
            await db.run(
                `INSERT INTO transferList (playerId, askingPrice, isListed) VALUES (?, ?, ?)`,
                [playerId, askingPrice, 1]
            );
        }

        await db.close();

        return NextResponse.json({ success: true, message: 'Jogador listado para transferência com sucesso.' });
    } catch (error) {
        console.error('Erro na API de listagem de transferência:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}