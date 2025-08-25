
import { Player } from "@/app/squad/page";
import { Offer } from "@/lib/game-data";
import { CareerSave } from "@/lib/game-data";

interface AiOfferDecision {
    shouldMakeOffer: boolean;
    offer?: Omit<Offer, 'date' | 'offeredBy'>;
    aiClub?: { id: string; name: string };
}

export async function generateAiOffer(player: Player, activeCareer: CareerSave): Promise<AiOfferDecision> {
    // A IA só faz propostas por jogadores com valor
    if (player.contract.value <= 0) {
        return { shouldMakeOffer: false };
    }

    // A cada dia, há uma chance de 15% de um jogador listado receber uma proposta
    if (Math.random() > 0.15) {
        return { shouldMakeOffer: false };
    }

    // Simula um clube interessado aleatório
    // Numa versão futura, isto pode ser mais complexo (baseado em orçamento, necessidade, etc.)
    const interestedClub = { id: "1", name: "FC Dynamo" };

    const marketValue = player.contract.value;
    // A IA propõe entre 70% e 95% do valor de mercado
    let offerValue = marketValue * (0.7 + Math.random() * 0.25);
    offerValue = Math.round(offerValue / 100000) * 100000;

    return {
        shouldMakeOffer: true,
        offer: {
            value: offerValue,
        },
        aiClub: interestedClub,
    };
}