// scripts/generate-schedule.mjs
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Função para embaralhar um array (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


async function generateAllSchedules() {
    console.log('Abrindo o banco de dados...');
    const dbPath = path.join(process.cwd(), 'master_data.db');
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READWRITE
    });

    const SEASON = '2024/25';
    const SEASON_START_DATE = new Date('2024-08-10');
    const DAYS_BETWEEN_ROUNDS = 7;

    console.log(`Limpando todos os calendários para a temporada ${SEASON}...`);
    await db.run('DELETE FROM schedules WHERE season = ?', SEASON);

    console.log('Buscando todas as ligas do banco de dados...');
    const leagues = await db.all(`
        SELECT league_name
        FROM clubs
        WHERE league_name IS NOT NULL AND league_name != ''
        GROUP BY league_name
        HAVING COUNT(club_team_id) >= 2
    `);

    console.log(`Encontradas ${leagues.length} ligas para gerar calendários.`);

    await db.run('BEGIN TRANSACTION;');

    for (const league of leagues) {
        const leagueName = league.league_name;
        console.log(`--- Gerando calendário para: ${leagueName} ---`);

        const clubs = await db.all('SELECT club_team_id as id, club_name as name FROM clubs WHERE league_name = ?', leagueName);

        let teams = [...clubs];
        if (teams.length % 2 !== 0) {
            teams.push({ id: null, name: 'BYE' });
        }

        const numTeams = teams.length;
        const gamesPerRound = numTeams / 2;
        const numRounds = (numTeams - 1) * 2;

        const firstHalfFixtures = [];
        const secondHalfFixtures = [];

        // 1. Gera todos os confrontos possíveis, de ida e volta
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const teamA = teams[i];
                const teamB = teams[j];
                if (teamA.id && teamB.id) {
                    firstHalfFixtures.push({ home: teamA, away: teamB });
                    secondHalfFixtures.push({ home: teamB, away: teamA });
                }
            }
        }

        // 2. Embaralha a ordem dos jogos de cada turno independentemente
        shuffleArray(firstHalfFixtures);
        shuffleArray(secondHalfFixtures);

        const allFixtures = [...firstHalfFixtures, ...secondHalfFixtures];
        const seasonSchedule = [];

        // 3. Distribui os jogos em rodadas, garantindo que nenhum time jogue duas vezes na mesma rodada
        for (let round = 0; round < numRounds; round++) {
            const roundFixtures = [];
            const teamsInRound = new Set();

            for (let i = allFixtures.length - 1; i >= 0; i--) {
                const fixture = allFixtures[i];
                if (!teamsInRound.has(fixture.home.id) && !teamsInRound.has(fixture.away.id)) {
                    roundFixtures.push(fixture);
                    teamsInRound.add(fixture.home.id);
                    teamsInRound.add(fixture.away.id);
                    allFixtures.splice(i, 1); // Remove o jogo da lista principal
                }
            }
            seasonSchedule.push(roundFixtures);
        }

        // 4. Insere no banco de dados com as datas corretas
        const stmt = await db.prepare('INSERT INTO schedules (season, league_name, match_date, home_team_id, away_team_id) VALUES (?, ?, ?, ?, ?)');
        let totalGamesInserted = 0;
        seasonSchedule.forEach((roundFixtures, roundIndex) => {
            const matchDate = new Date(SEASON_START_DATE);
            matchDate.setDate(matchDate.getDate() + (roundIndex * DAYS_BETWEEN_ROUNDS));

            roundFixtures.forEach(async (fixture) => {
                await stmt.run(SEASON, leagueName, matchDate.toISOString(), fixture.home.id, fixture.away.id);
                totalGamesInserted++;
            });
        });
        await stmt.finalize();

        console.log(`Inseridos ${totalGamesInserted} jogos (${numRounds} rodadas) para ${leagueName}.`);
    }

    await db.run('COMMIT;');
    console.log('\nTodos os calendários realistas e embaralhados foram gerados com sucesso!');
    await db.close();
}

generateAllSchedules().catch(console.error);