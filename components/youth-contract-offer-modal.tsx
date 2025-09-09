// components/youth-contract-offer-modal.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ScoutingReport, Offer } from '@/lib/game-data';

interface YouthContractOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: ScoutingReport | null;
    onSendOffer: (offer: Pick<Offer, 'wage' | 'contractLength' | 'squadRole'>) => void;
}

export function YouthContractOfferModal({ isOpen, onClose, report, onSendOffer }: YouthContractOfferModalProps) {
    const [wage, setWage] = React.useState(500); // Salário/Bolsa padrão
    const [contractLength, setContractLength] = React.useState(3); // Duração padrão

    if (!report) return null;

    const handleSendOffer = () => {
        onSendOffer({
            wage,
            contractLength,
            squadRole: 'Jovem Promessa', // Fixo para jovens
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Oferecer Contrato de Base</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="text-center">
                        <p className="text-xl font-bold">{report.player.name}</p>
                        <p className="text-sm text-muted-foreground">Posição: {report.player.position} | Overall: {report.player.overall}</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wage">Bolsa-Auxílio Semanal (€)</Label>
                        <Input
                            id="wage"
                            type="number"
                            value={wage}
                            onChange={(e) => setWage(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contractLength">Duração do Vínculo (anos)</Label>
                        <Select value={String(contractLength)} onValueChange={(val) => setContractLength(Number(val))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 ano</SelectItem>
                                <SelectItem value="2">2 anos</SelectItem>
                                <SelectItem value="3">3 anos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSendOffer}>Enviar Oferta</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}