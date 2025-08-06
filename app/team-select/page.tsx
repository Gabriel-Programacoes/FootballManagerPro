"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Search, Users, ArrowLeft, ChevronRight, Award } from "lucide-react";
import { useCareer } from "@/contexts/career-context";
import {Club, countries} from "@/data/club-data";
import {ClubDetailModal} from "@/components/club-detail-modal";

type Step = "country" | "league" | "club";

export default function SelectTeamPage() {
    const { selectManagedClub } = useCareer();
    const [currentStep, setCurrentStep] = useState<Step>("country");
    const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
    const [selectedLeagueName, setSelectedLeagueName] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [modalClub, setModalClub] = useState<Club | null>(null);

    // A LÓGICA AGORA USA DIRETAMENTE a constante 'countries' importada.
    const countriesData = useMemo(() => {
        // Apenas filtramos a lista importada para remover a Argentina.
        return countries.filter(country => country.name !== 'Argentina');
    }, []);


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

    return (
        <>
            <div className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
                    <header className="text-center space-y-4">
                        <Trophy className="mx-auto h-10 w-10 text-primary"/>
                        <h1 className="text-4xl font-bold">Inicie sua Carreira</h1>
                        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                            <span
                                className={currentStep === "country" ? "font-semibold text-primary" : ""}>1. Região</span>
                            <ChevronRight className="h-4 w-4"/>
                            <span
                                className={currentStep === "league" ? "font-semibold text-primary" : ""}>2. Liga</span>
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
                                    // 3. ONCLICK AGORA ABRE O MODAL
                                    <Card key={club.id} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setModalClub(club)}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-lg font-bold">
                                                    {club.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold">{club.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{club.playerIds.length} jogadores</p>
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
            <ClubDetailModal
                club={modalClub}
                isOpen={!!modalClub}
                onOpenChange={(isOpen) => !isOpen && setModalClub(null)}
                onConfirm={selectManagedClub}/>
        </>
    );
}