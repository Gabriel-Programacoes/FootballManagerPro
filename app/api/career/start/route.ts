
import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
    try {
        const { clubId, saveName } = await request.json();

        if (!clubId || !saveName) {
            return NextResponse.json({ message: 'Dados de carreira incompletos.' }, { status: 400 });
        }

        // Gera um ID único para o save (por exemplo, usando o timestamp)
        const saveId = `career_${Date.now()}`;
        const saveFileName = `${saveId}.db`;
        const savePath = path.join(process.cwd(), 'saves', saveFileName);
        const masterDbPath = path.join(process.cwd(), 'master_data.db');

        // Garante que o diretório 'saves' existe
        await fs.mkdir(path.join(process.cwd(), 'saves'), { recursive: true });

        // Copia o banco de dados mestre para o novo arquivo de save
        await fs.copyFile(masterDbPath, savePath);

        // Abre o novo banco de dados para inicializar a carreira
        const db = await open({ filename: savePath, driver: sqlite3.Database });

        // Lógica para inicializar a carreira (ex: definir o orçamento, criar as tabelas de notícias/objetivos)
        await db.run('UPDATE clubs SET budget = ? WHERE club_team_id = ?', [10000000, clubId]);
        // Adicione outras inicializações necessárias aqui...

        await db.close();

        return NextResponse.json({ saveId });
    } catch (error) {
        console.error('Erro ao iniciar nova carreira:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}