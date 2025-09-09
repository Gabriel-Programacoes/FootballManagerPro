// lib/simulation/negotiation-engine.ts

import { Player } from "@/app/squad/page";
import { Negotiation, Offer, YouthPlayer } from "@/lib/game-data";

// O resultado do processamento da IA
interface NegotiationUpdate {
    status: 'Aceite' | 'Rejeitada' | 'Contraproposta';
    counterOffer?: number;
    reason: string;
}

interface YouthNegotiationUpdate {
    status: 'Aceite' | 'Rejeitada' | 'Contraproposta';
    counterOffer?: Partial<Offer>;
    reason: string;
}
export function processNegotiation(negotiation: Negotiation, player: Player): NegotiationUpdate {
    const lastOffer = negotiation.offerHistory[negotiation.offerHistory.length - 1];

    if (!lastOffer || negotiation.negotiationType !== 'transfer' || typeof lastOffer.value !== 'number') {
        // Se alguma condição falhar, rejeita a negociação como uma medida de segurança.
        return {
            status: 'Rejeitada',
            reason: `A proposta por ${player.name} era inválida ou não era uma oferta de transferência.`
        };
    }

    const offerValue = lastOffer.value;
    const marketValue = player.contract.value;

    // Fator 1: A oferta vs. o valor de mercado
    const offerRatio = offerValue / marketValue;

    // Fator 2: Importância do jogador para o clube (Overall)
    const isKeyPlayer = player.overall > 82;
    const isImportantPlayer = player.overall > 78;

    // Fator 3: Potencial do jogador
    const hasHighPotential = player.potential > 85;

    // --- LÓGICA DE DECISÃO DA IA ---

    // 1. Aceitação Imediata (Oferta muito alta)
    if (offerRatio > 1.8 || (offerRatio > 1.5 && !isKeyPlayer)) {
        return {
            status: 'Aceite',
            reason: `${player.name} foi vendido por um valor irrecusável.`
        };
    }

    // 2. Rejeição Imediata (Oferta muito baixa)
    if (offerRatio < 0.6) {
        return {
            status: 'Rejeitada',
            reason: `A proposta por ${player.name} foi considerada muito baixa.`
        };
    }

    // 3. Negociação com base nos fatores
    let fairValue = marketValue;

    if (isKeyPlayer) fairValue *= 1.6; // Jogadores chave são caros
    else if (isImportantPlayer) fairValue *= 1.3;

    if (hasHighPotential) fairValue *= 1.4; // Potencial custa caro
    if (player.age < 21) fairValue *= 1.2; // Jovens são mais valorizados

    // Adiciona uma pequena variação para não ser sempre o mesmo valor
    fairValue *= (1 + (Math.random() * 0.1 - 0.05)); // Variação de +/- 5%

    // Se a última oferta for maior ou igual à contra-proposta calculada, aceita.
    if (offerValue >= fairValue) {
        return {
            status: 'Aceite',
            reason: `Após negociação, a proposta por ${player.name} foi aceita.`
        };
    }

    // Se a oferta é boa mas não o suficiente, faz uma contra-proposta
    if (offerRatio > 0.8) {

        const clubName = negotiation.aiClub ? negotiation.aiClub.name : 'O jogador';

        return {
            status: 'Contraproposta', // USA O NOVO PADRÃO
            counterOffer: Math.ceil(player.contract.value * 1.1),
            reason: `${clubName} fez uma contraproposta por ${player.name}.`
        };
    }

    // Se a oferta não é boa o suficiente, rejeita.
    return {
        status: 'Rejeitada',
        reason: `A proposta por ${player.name} não agradou a direção.`
    };
}

export function processYouthContractNegotiation(negotiation: Negotiation, player: YouthPlayer): YouthNegotiationUpdate {
    const lastOffer = negotiation.offerHistory[negotiation.offerHistory.length - 1];
    if (!lastOffer || typeof lastOffer.wage !== 'number') {
        return { status: 'Rejeitada', reason: "Proposta inválida recebida.", counterOffer: undefined };
    }

    // Calcula a bolsa-auxílio "esperada" pelo jovem com base no seu potencial e overall
    const potentialMidPoint = (player.potential[0] + player.potential[1]) / 2;
    const expectedWage = Math.floor((potentialMidPoint * 15) + (player.overall * 5));

    const offeredWage = lastOffer.wage;
    const wageDifferenceRatio = offeredWage / expectedWage;
    const randomFactor = Math.random();

    // Se a oferta for generosa (100% ou mais do esperado)
    if (wageDifferenceRatio >= 1.0) {
        if (randomFactor < 0.9) { // 90% de chance de aceitar
            return { status: 'Aceite', reason: `${player.name} aceitou os termos e está feliz por se juntar à academia.` };
        }
    }

    // Se a oferta for razoável (entre 75% e 100% do esperado)
    if (wageDifferenceRatio >= 0.75) {
        if (randomFactor < 0.7) { // 70% de chance de fazer contraproposta
            // Pede um pouco mais, arredondando para o múltiplo de 50 mais próximo
            const counterWage = Math.ceil((expectedWage * (1 + (Math.random() * 0.1))) / 50) * 50;
            return {
                status: 'Contraproposta',
                reason: `${player.name} está interessado, mas gostaria de uma bolsa-auxílio de €${counterWage}.`,
                counterOffer: { wage: counterWage }
            };
        }
        // 30% de chance de aceitar mesmo assim
        return { status: 'Aceite', reason: `${player.name} decidiu aceitar a sua proposta.` };
    }

    // Se a oferta for baixa (menos de 75% do esperado)
    if (wageDifferenceRatio < 0.75) {
        if (randomFactor < 0.8) { // 80% de chance de rejeitar diretamente
            return { status: 'Rejeitada', reason: `A proposta para ${player.name} foi considerada muito baixa e foi rejeitada.` };
        }
        // 20% de chance de ainda fazer uma contraproposta pedindo o que acha justo
        const counterWage = Math.ceil(expectedWage / 50) * 50;
        return {
            status: 'Contraproposta',
            reason: `${player.name} acredita que o seu valor é maior e pede €${counterWage}.`,
            counterOffer: { wage: counterWage }
        };
    }

    // Resposta padrão caso nenhuma condição seja satisfeita (fallback de segurança)
    return { status: 'Rejeitada', reason: `Após considerar a proposta, ${player.name} decidiu procurar outras oportunidades.` };
}