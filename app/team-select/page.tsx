// app/team-select/page.tsx

"use client";

// Importamos useEffect e mais alguns tipos que serão úteis.
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Search, Users, ArrowLeft, ChevronRight, Award, Loader2 } from "lucide-react"; // Importamos um ícone de Loading
import { useCareer } from "@/contexts/career-context";
import { ClubDetailModal } from "@/components/club-detail-modal";
import { toast } from "sonner";

// --- NOVAS INTERFACES ---
// Definimos a "forma" dos dados que esperamos receber da nossa API.
// Isso ajuda o TypeScript a entender a estrutura dos nossos dados.
export interface Country {
    name: string;
    leagues: League[];
    clubCount: number;
}
export interface League {
    name: string;
    clubs: Club[];
}
export interface Club {
    id: string;
    name: string;
    leagueName: string;
    playerCount: number;
}
// --- FIM DAS NOVAS INTERFACES ---


type Step = "country" | "league" | "club";

export default function SelectTeamPage() {
    const { startNewCareer } = useCareer();
    const [currentStep, setCurrentStep] = useState<Step>("country");
    const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
    const [selectedLeagueName, setSelectedLeagueName] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [modalClub, setModalClub] = useState<Club | null>(null);

    // --- LÓGICA DE BUSCA DE DADOS (DATA FETCHING) ---
    const [countriesData, setCountriesData] = useState<Country[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Estado para controlar o loading
    const [error, setError] = useState<string | null>(null); // Estado para armazenar erros

    useEffect(() => {
        // Esta função será executada assim que o componente for montado no navegador.
        async function fetchCountries() {
            try {
                // Faz a requisição para a nossa nova API.
                const response = await fetch('/api/countries');
                if (!response.ok) {
                    throw new Error('Falha ao buscar os dados do servidor.');
                }
                const data: Country[] = await response.json();

                // Filtramos a Argentina aqui, como era feito antes.
                setCountriesData(data.filter(country => country.name !== 'Argentina'));

            } catch (err: any) {
                setError(err.message); // Armazena a mensagem de erro.
                console.error(err);
            } finally {
                setIsLoading(false); // Para de carregar, independentemente de sucesso ou erro.
            }
        }

        fetchCountries();
    }, []); // O array vazio [] garante que esta função execute apenas uma vez.
    // --- FIM DA LÓGICA DE BUSCA DE DADOS ---


    const handleGoBack = () => {
        if (currentStep === "league") {
            setCurrentStep("country");
            setSelectedCountryName(null);
        } else if (currentStep === "club") {
            setCurrentStep("league");
            setSelectedLeagueName(null);
            setSearchTerm("");
        }
    };

    const selectedCountryData = countriesData.find(c => c.name === selectedCountryName);
    const selectedLeagueData = selectedCountryData?.leagues.find(l => l.name === selectedLeagueName);

    const filteredClubs = useMemo(() => {
        if (!selectedLeagueData) return [];
        return selectedLeagueData.clubs.filter(club =>
            club.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [selectedLeagueData, searchTerm]);

    // --- RENDERIZAÇÃO CONDICIONAL ---
    // Mostra mensagens de loading ou erro enquanto os dados não estão prontos.
    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando banco de dados...</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
                <h2 className="text-2xl font-bold text-destructive">Ocorreu um Erro</h2>
                <p className="text-muted-foreground">{error}</p>
                <p>Verifique o console do terminal (onde você rodou `npm run dev`) para mais detalhes.</p>
            </div>
        );
    }
    // --- FIM DA RENDERIZAÇÃO CONDICIONAL ---


    return (
        <>
            <div className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
                    <header className="text-center space-y-4">
                        <Trophy className="mx-auto h-10 w-10 text-primary"/>
                        <h1 className="text-4xl font-bold">Inicie sua Carreira</h1>
                        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                            <span className={currentStep === "country" ? "font-semibold text-primary" : ""}>1. Região</span>
                            <ChevronRight className="h-4 w-4"/>
                            <span className={currentStep === "league" ? "font-semibold text-primary" : ""}>2. Liga</span>
                            <ChevronRight className="h-4 w-4"/>
                            <span className={currentStep === "club" ? "font-semibold text-primary" : ""}>3. Clube</span>
                        </div>
                    </header>

                    {currentStep !== "country" && (
                        <Button variant="outline" onClick={handleGoBack}>
                            <ArrowLeft className="h-4 w-4 mr-2"/>
                            Voltar
                        </Button>
                    )}

                    {/* Etapa 1: Seleção de País/Região */}
                    {currentStep === "country" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {countriesData.map((country) => (
                                <Card key={country.name}
                                      className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                                    setSelectedCountryName(country.name);
                                    setCurrentStep("league");
                                }}>
                                    <CardContent className="p-6 text-center space-y-4">
                                        <h3 className="text-xl font-bold">{country.name}</h3>
                                        <div className="flex justify-center gap-6 pt-4 border-t">
                                            <div>
                                                <p className="font-bold text-lg">{country.leagues.length}</p>
                                                <p className="text-xs text-muted-foreground">Ligas</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg">{country.clubCount}</p>
                                                <p className="text-xs text-muted-foreground">Clubes</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Etapa 2: Seleção de Liga */}
                    {currentStep === "league" && selectedCountryData && (
                        <div className="space-y-4 pt-4">
                            <h2 className="text-2xl font-semibold text-center">{selectedCountryData.name}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {selectedCountryData.leagues.map((league) => (
                                    <Card key={league.name}
                                          className="cursor-pointer hover:border-primary transition-colors"
                                          onClick={() => {
                                              setSelectedLeagueName(league.name);
                                              setCurrentStep("club");
                                          }}>
                                        <CardContent className="p-6">
                                            <h3 className="text-xl font-bold mb-2">{league.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Users className="h-4 w-4"/>
                                                <span>{league.clubs.length} Clubes</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Etapa 3: Seleção de Clube */}
                    {currentStep === "club" && selectedLeagueData && (
                        <div className="space-y-4 pt-4">
                            <h2 className="text-2xl font-semibold text-center flex items-center justify-center gap-2">
                                <Award className="h-6 w-6"/>
                                {selectedLeagueData.name}
                            </h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar clube na liga..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredClubs.map((club) => (
                                    <Card key={club.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setModalClub(club)}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-lg font-bold">
                                                    {club.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">{club.name}</h3>
                                                    {/* Agora usamos playerCount que vem da API */}
                                                    <p className="text-sm text-muted-foreground">{club.playerCount} jogadores</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline">Ver Detalhes</Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* O Modal continua funcionando, mas agora precisa ser ajustado para os novos dados */}
            <ClubDetailModal
                club={modalClub}
                isOpen={!!modalClub}
                onOpenChange={(isOpen) => !isOpen && setModalClub(null)}
                onConfirm={startNewCareer}
            />
        </>
    );
}