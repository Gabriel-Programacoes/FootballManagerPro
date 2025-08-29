
import { NextResponse, NextRequest } from 'next/server';
import { YouthPlayer } from '@/lib/game-data';
import { NAMES_BY_COUNTRY } from '@/name-database';


const POSITIONS = ["GOL", "ZAG", "LD", "LE", "VOL", "MC", "MAT", "PE", "PD", "ATA"];
const TRAITS = ["Velocista", "Forte no Desarme", "Passador Longo", "Técnico", "Finalizador Nato", "Liderança", "Driblador"];

// --- FUNÇÕES AUXILIARES DE GERAÇÃO ---
const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Função principal que cria um único jogador jovem
function createYouthPlayer(scoutRating: number, country: string): YouthPlayer {
    const position = getRandomItem(POSITIONS);
    const age = getRandomNumber(15, 19);

    let potentialMin, potentialMax;
    const randomChance = Math.random();
    const ratingBonus = scoutRating / 50; // Olheiro 5 estrelas dá um bónus de 2.5%

    if (randomChance < 0.02 + ratingBonus) { // Apenas 2% a 7% de chance de ser um talento geracional
        potentialMin = getRandomNumber(88, 92);
        potentialMax = getRandomNumber(93, 95);
    } else if (randomChance < 0.15 + ratingBonus) { // 15% a 20% de chance de ser um talento de alta qualidade
        potentialMin = getRandomNumber(82, 87);
        potentialMax = getRandomNumber(88, 92);
    } else if (randomChance < 0.50 + ratingBonus) { // 50% a 55% de chance de ser um bom jogador
        potentialMin = getRandomNumber(75, 81);
        potentialMax = getRandomNumber(82, 87);
    } else { // O resto são jogadores medianos
        potentialMin = getRandomNumber(70, 74);
        potentialMax = getRandomNumber(75, 81);
    }

    const overall = getRandomNumber(Math.max(45, potentialMin - 25), Math.min(65, potentialMax - 20));

    const nameData = NAMES_BY_COUNTRY[country] || NAMES_BY_COUNTRY["Padrão"];

    const baseAttrs = { pace: 0, shooting: 0, passing: 0, dribbling: 0, defending: 0, physical: 0 };
    let pointsToDistribute = overall * 3;

    switch(position) {
        case 'GOL':
            baseAttrs.defending += 40; baseAttrs.physical += 20; break;
        case 'ZAG':
            baseAttrs.defending += 40; baseAttrs.physical += 20; break;
        case 'LD': case 'LE':
            baseAttrs.pace += 30; baseAttrs.defending += 30; break;
        case 'VOL':
            baseAttrs.passing += 30; baseAttrs.defending += 30; break;
        case 'MC':
            baseAttrs.passing += 40; baseAttrs.dribbling += 20; break;
        case 'MAT':
            baseAttrs.shooting += 30; baseAttrs.passing += 30; break;
        case 'PE': case 'PD':
            baseAttrs.pace += 40; baseAttrs.dribbling += 20; break;
        case 'ATA':
            baseAttrs.shooting += 40; baseAttrs.pace += 20; break;
    }

    pointsToDistribute -= Object.values(baseAttrs).reduce((a, b) => a + b, 0);

    while (pointsToDistribute > 0) {
        const attr = getRandomItem(Object.keys(baseAttrs));
        baseAttrs[attr as keyof typeof baseAttrs] += 1;
        pointsToDistribute--;
    }

    const finalAttributes = (Object.fromEntries(
        Object.entries(baseAttrs).map(([key, value]) => [key, Math.min(99, Math.round(value / 60 * 70))])
    ) as YouthPlayer['attributes']);

    const playerTraits = [getRandomItem(TRAITS)];
    if (Math.random() > 0.85) { // 15% de chance de ter uma segunda característica
        playerTraits.push(getRandomItem(TRAITS.filter(t => t !== playerTraits[0])));
    }

    return {
        id: `youth_${Date.now()}_${getRandomNumber(1000, 9999)}`,
        name: `${getRandomItem(nameData.firstNames)} ${getRandomItem(nameData.lastNames)}`,
        nationality: country,
        age,
        position,
        overall,
        potential: [potentialMin, potentialMax],
        attributes: finalAttributes,
        traits: playerTraits,
    };
}

// --- O ENDPOINT DA API ---
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const scoutRating = parseInt(searchParams.get('scoutRating') || '3', 10);
    const country = searchParams.get('country') || "Padrão";

    try {
        const youthIntakeCount = getRandomNumber(scoutRating * 2, scoutRating * 3);
        const newPlayers: YouthPlayer[] = [];
        // NOVO: Usamos um Set para guardar os nomes completos já gerados nesta leva
        const generatedNames = new Set<string>();

        while (newPlayers.length < youthIntakeCount) {
            const newPlayer = createYouthPlayer(scoutRating, country);

            // Verifica se o nome completo já foi usado nesta geração
            if (!generatedNames.has(newPlayer.name)) {
                // Se for único, adiciona o nome ao registro e o jogador à lista
                generatedNames.add(newPlayer.name);
                newPlayers.push(newPlayer);
            }
            // Se o nome já foi usado, o loop continua e tenta gerar outro jogador
        }

        return NextResponse.json(newPlayers);

    } catch (error) {
        console.error('Erro ao gerar jovens jogadores:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}