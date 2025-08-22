// lib/simulation/ai-offer-engine.ts

import { Player } from "@/app/squad/page";
import { Offer, Negotiation, CareerSave } from "@/lib/game-data";

// O resultado da deliberação da IA
interface AiOfferDecision {
    shouldMakeOffer: boolean;
    offer?: Omit<Offer, 'date' | 'offeredBy'>;
    reason?: string;
    aiClub?: { id: string; name: string };
}

/**
 * Simula a decisão de um clube de IA sobre fazer uma proposta por um jogador do utilizador.
 * @param player O jogador do utilizador que está na lista de transferências.
 * @param activeCareer O estado atual da carreira.
 * @returns Uma decisão sobre se deve fazer uma proposta e os detalhes da mesma.
 */
export async function generateAiOffer(player: Player, activeCareer: CareerSave): Promise<AiOfferDecision> {
    // A IA só faz propostas por jogadores com valor superior a 0
    if (player.contract.value <= 0) {
        return { shouldMakeOffer: false };
    }

    // Probabilidade base de receber uma proposta (ex: 20% de chance por jogador listado a cada poucos dias)
    if (Math.random() > 0.2) {
        return { shouldMakeOffer: false };
    }

    // Simula um clube interessado aleatório (que não seja o nosso)
    // NOTA: Numa versão futura, isto viria de uma lista de clubes com orçamento e necessidades
    const interestedClub = { id: "1", name: "FC Dynamo" }; // Clube fictício para o exemplo

    const marketValue = player.contract.value;
    let offerValue = marketValue * (0.7 + Math.random() * 0.25); // Propõe entre 70% e 95% do valor

    // Arredonda o valor da proposta para ser mais realista
    offerValue = Math.round(offerValue / 100000) * 100000;

    return {
        shouldMakeOffer: true,
        offer: {
            value: offerValue,
        },
        aiClub: interestedClub,
        reason: `${interestedClub.name} está interessado em contratar ${player.name}.`
    };
}