// lib/simulation/negotiation-engine.ts

import { Player } from "@/app/squad/page";
import { Negotiation } from "@/lib/game-data";

// O resultado do processamento da IA
interface NegotiationUpdate {
    status: 'Aceite' | 'Rejeitada' | 'Contraproposta';
    counterOffer?: number;
    reason: string;
}

/**
 * Simula a resposta de um clube de IA a uma proposta de transferência.
 * @param negotiation O estado atual da negociação.
 * @param player O jogador que está a ser negociado.
 * @returns Uma atualização para o estado da negociação.
 */
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
    let counterOfferValue = marketValue;

    if (isKeyPlayer) counterOfferValue *= 1.6; // Jogadores chave são caros
    else if (isImportantPlayer) counterOfferValue *= 1.3;

    if (hasHighPotential) counterOfferValue *= 1.4; // Potencial custa caro
    if (player.age < 21) counterOfferValue *= 1.2; // Jovens são mais valorizados

    // Adiciona uma pequena variação para não ser sempre o mesmo valor
    counterOfferValue *= (1 + (Math.random() * 0.1 - 0.05)); // Variação de +/- 5%

    // Se a última oferta for maior ou igual à contra-proposta calculada, aceita.
    if (offerValue >= counterOfferValue) {
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