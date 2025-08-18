"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, GraduationCap, Eye, Globe, Star, Plus, Send, AlertCircle, Clock } from "lucide-react";
import { useCareer } from "@/contexts/career-context";
import { YouthPlayerDetailModal } from "@/components/youth-player-detail-modal";
import { HireScoutModal } from "@/components/hire-scout-modal";
import { cn } from "@/lib/utils";

// --- TIPOS DE DADOS ---
interface Scout {
    id: number;
    name: string;
    rating: number;
    specialty: string;
    region: string;
    status: 'Disponível' | 'Observando' | 'Retornando' | 'Descansando';
    mission?: {
        region: string;
        country?: string;
        positionType?: string;
        trait?: string;
        duration: string;
    };
}

// --- DADOS DE PROTÓTIPO (MOCK DATA) ---
const regionsAndCountries = {
    "América do Sul": ["Argentina", "Brasil", "Colômbia", "Uruguai"],
    "Europa Ocidental": ["Espanha", "Portugal", "França", "Inglaterra"],
    "Europa Central": ["Alemanha", "Itália", "Holanda", "Bélgica"],
    "Norte de África": ["Marrocos", "Argélia", "Egito"],
};
const positionTypes = ["Goleiros", "Defensores", "Meio-campistas", "Atacantes"];
const traitsByPositionType = {
    "Goleiros": ["Reflexos Rápidos", "Bom com os Pés"],
    "Defensores": ["Forte no Desarme", "Velocista", "Liderança"],
    "Meio-campistas": ["Técnico", "Passador Longo", "Criatividade"],
    "Atacantes": ["Finalizador Nato", "Velocista", "Driblador"],
};
const durationOptions = ["1 mês", "3 meses", "6 meses"];
const initialScoutNetwork: Scout[] = [
    { id: 1, name: "João Pereira", rating: 4, specialty: "Atacantes", region: "América do Sul", status: "Observando" },
    { id: 2, name: "David Smith", rating: 3, specialty: "Defensores", region: "Descansando", status: "Disponível" },
];
const scoutedPlayers: any[] = [
    { id: 101, name: "Felipe Andrade", age: 15, position: "ATA", potentialRange: "85-92", region: "Brasil" },
    { id: 102, name: "Lars Jansen", age: 16, position: "ZAG", potentialRange: "78-85", region: "Holanda" },
];
const youthSquad: any[] = [
    { name: "Tiago Alves", age: 17, position: "AE", overall: 65, potential: 87, growth: "+3", traits: ["Velocista"], attributes: { Pace: 82, Shooting: 68, Passing: 60, Dribbling: 75, Defending: 30, Physical: 55 } },
    { name: "Ben Carter", age: 18, position: "MC", overall: 68, potential: 82, growth: "+2", traits: ["Passador Longo"], attributes: { Pace: 65, Shooting: 62, Passing: 78, Dribbling: 70, Defending: 55, Physical: 60 } },
];


export default function YouthAcademyPage() {
    // --- GESTÃO DE ESTADO (State Management) ---
    const { managedClub } = useCareer();
    const [scoutNetwork, setScoutNetwork] = useState<Scout[]>(initialScoutNetwork);
    const [selectedYouthPlayer, setSelectedYouthPlayer] = useState<any>(null);
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);

    // Estado do formulário de envio de olheiro
    const [formState, setFormState] = useState({
        scoutId: undefined as string | undefined,
        region: undefined as string | undefined,
        country: undefined as string | undefined,
        positionType: undefined as string | undefined,
        trait: undefined as string | undefined,
        duration: undefined as string | undefined,
    });
    const [scoutError, setScoutError] = useState<string | null>(null);

    // --- MANIPULADORES DE EVENTOS (Event Handlers) ---
    const handleHireScout = (scoutToHire: any) => {
        if (scoutNetwork.length >= 5) {
            alert("Você atingiu o limite máximo de 5 olheiros.");
            return;
        }
        const newScout: Scout = { ...scoutToHire, status: "Disponível", region: "Descansando" };
        setScoutNetwork(prevNetwork => [...prevNetwork, newScout]);
        setIsHireModalOpen(false);
        alert(`Olheiro ${scoutToHire.name} contratado com sucesso!`);
    };

    const handleSendScout = () => {
        setScoutError(null);
        const { scoutId, region, duration } = formState;
        if (!scoutId || !region || !duration) {
            setScoutError("Por favor, selecione um olheiro, uma região e a duração.");
            return;
        }
        const scoutsInRegionCount = scoutNetwork.filter(s => s.mission?.region === region).length;
        if (scoutsInRegionCount >= 2) {
            setScoutError(`Você já tem o máximo de 2 olheiros na região: ${region}.`);
            return;
        }
        setScoutNetwork(prevNetwork =>
            prevNetwork.map(scout =>
                scout.id === parseInt(scoutId)
                    ? { ...scout, status: 'Observando', region, mission: { ...formState, region, duration } }
                    : scout
            )
        );
        setFormState({ scoutId: undefined, region: undefined, country: undefined, positionType: undefined, trait: undefined, duration: undefined });
        alert(`Missão iniciada!`);
    };

    const updateFormField = (field: keyof typeof formState, value: string) => {
        const newState = { ...formState, [field]: value };
        if (field === 'region') newState.country = undefined;
        if (field === 'positionType') newState.trait = undefined;
        setFormState(newState);
    };

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Categorias de Base</h1>
                    <p className="text-muted-foreground">Desenvolva os futuros talentos do {managedClub?.name}</p>
                </div>

                <Tabs defaultValue="scouting">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="squad">Elenco da Base ({youthSquad.length})</TabsTrigger>
                        <TabsTrigger value="scouting">Observação ({scoutNetwork.length})</TabsTrigger>
                    </TabsList>

                    {/* Aba do Elenco da Base */}
                    <TabsContent value="squad" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Elenco da Base</CardTitle>
                                <CardDescription>Acompanhe e gira o desenvolvimento dos seus jovens talentos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {youthSquad.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground"><p>A sua academia está vazia. Contrate olheiros para encontrar novos talentos.</p></div>
                                ) : (
                                    <div className="space-y-4">
                                        {youthSquad.map((player, index) => (
                                            <div key={index} className="p-4 rounded-lg border">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center space-x-4">
                                                        <Avatar className="h-12 w-12"><AvatarFallback>{player.name.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback></Avatar>
                                                        <div>
                                                            <div className="flex items-center space-x-2"><h3 className="font-semibold">{player.name}</h3><Badge variant="outline">{player.position}</Badge><span className="text-sm text-muted-foreground">{player.age} anos</span></div>
                                                            <div className="flex items-center space-x-4 mt-1">
                                                                <div className="text-sm">Overall: <span className="font-bold text-green-500">{player.overall}</span></div>
                                                                <div className="text-sm">Potencial: <span className="font-bold text-blue-500">{player.potential}</span></div>
                                                                <Badge><TrendingUp className="h-3 w-3 mr-1" />{player.growth}</Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => setSelectedYouthPlayer(player)}><Eye className="h-4 w-4 mr-1"/> Ver Análise</Button>
                                                        <Button size="sm">Promover</Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs text-muted-foreground"><span>{player.overall} --&gt; {player.overall + 1}</span></div>
                                                    <Progress value={(player.overall / player.potential) * 100} className="h-2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="scouting" className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rede de Olheiros ({scoutNetwork.length}/5)</CardTitle>
                                    <CardDescription>Gira a sua equipa de até 5 olheiros</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {scoutNetwork.map(scout => (
                                        <div key={scout.id} className="p-3 rounded-lg border flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{scout.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <div className="flex items-center">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn("h-3 w-3", i < scout.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30")} />)}</div>
                                                    <span>• {scout.specialty}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={scout.status === 'Disponível' ? 'default' : 'secondary'}>{scout.status}</Badge>
                                                <p className="text-xs text-muted-foreground mt-1">Região: {scout.region}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {scoutNetwork.length < 5 && (
                                        <Button variant="outline" className="w-full" onClick={() => setIsHireModalOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2"/>Contratar Olheiro
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Enviar Olheiro</CardTitle>
                                    <CardDescription>Defina os parâmetros da sua missão</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Select value={formState.scoutId} onValueChange={(val) => updateFormField('scoutId', val)}>
                                        <SelectTrigger><SelectValue placeholder="Escolha um olheiro disponível..." /></SelectTrigger>
                                        <SelectContent>{scoutNetwork.filter(s => s.status === 'Disponível').map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.rating} estrelas)</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={formState.region} onValueChange={(val) => updateFormField('region', val)}>
                                        <SelectTrigger><SelectValue placeholder="Escolha uma região..." /></SelectTrigger>
                                        <SelectContent>{Object.keys(regionsAndCountries).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {formState.region && (
                                        <Select value={formState.country} onValueChange={(val) => updateFormField('country', val)}>
                                            <SelectTrigger><SelectValue placeholder="País específico (opcional)..." /></SelectTrigger>
                                            <SelectContent>{regionsAndCountries[formState.region as keyof typeof regionsAndCountries].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                    )}
                                    <Select value={formState.positionType} onValueChange={(val) => updateFormField('positionType', val)}>
                                        <SelectTrigger><SelectValue placeholder="Tipo de Posição (opcional)..." /></SelectTrigger>
                                        <SelectContent>{positionTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {formState.positionType && (
                                        <Select value={formState.trait} onValueChange={(val) => updateFormField('trait', val)}>
                                            <SelectTrigger><SelectValue placeholder="Característica principal (opcional)..." /></SelectTrigger>
                                            <SelectContent>{(traitsByPositionType[formState.positionType as keyof typeof traitsByPositionType] || []).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                        </Select>
                                    )}
                                    <Select value={formState.duration} onValueChange={(val) => updateFormField('duration', val)}>
                                        <SelectTrigger><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Duração da missão..." /></div></SelectTrigger>
                                        <SelectContent>{durationOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                    {scoutError && (<div className="flex items-center gap-2 text-sm text-destructive p-2 bg-destructive/10 rounded-lg"><AlertCircle className="h-4 w-4" /><p>{scoutError}</p></div>)}
                                    <Button className="w-full" onClick={handleSendScout}><Send className="h-4 w-4 mr-2"/>Enviar em Missão</Button>
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader><CardTitle>Relatórios de Jovens</CardTitle><CardDescription>Jogadores encontrados pelos seus olheiros</CardDescription></CardHeader>
                            <CardContent className="space-y-3">
                                {scoutedPlayers.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground"><p>Nenhum relatório de jogador disponível.</p></div>
                                ) : (scoutedPlayers.map(player => (
                                    <div key={player.id} className="p-3 rounded-lg border flex items-center justify-between">
                                        <div className="flex items-center gap-3"><Avatar><AvatarFallback>{player.name.split(" ").map((n:string) => n[0]).join("")}</AvatarFallback></Avatar><div><p className="font-semibold">{player.name} ({player.age})</p><div className="flex items-center gap-2 text-xs text-muted-foreground"><Badge variant="outline">{player.position}</Badge><span className="flex items-center"><Globe className="h-3 w-3 mr-1"/>{player.region}</span></div></div></div>
                                        <div className="flex items-center gap-4"><div className="text-right"><p className="font-bold text-blue-500">{player.potentialRange}</p><p className="text-xs text-muted-foreground">Potencial Estimado</p></div><Button size="sm">Assinar para a Base</Button></div>
                                    </div>
                                )))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            <YouthPlayerDetailModal player={selectedYouthPlayer} isOpen={!!selectedYouthPlayer} onOpenChange={(isOpen) => !isOpen && setSelectedYouthPlayer(null)} />
            <HireScoutModal isOpen={isHireModalOpen} onOpenChange={setIsHireModalOpen} onHire={handleHireScout} />
        </>
    );
}