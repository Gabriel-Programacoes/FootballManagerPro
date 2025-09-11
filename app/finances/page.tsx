"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Mail,
    Target,
    PieChart,
    BarChart3,
    Calendar,
    Users,
    Trophy,
    Building,
    Wallet,
    Send,
    FileText,
    Clock,
    Star,
} from "lucide-react"
import { useCareer } from "@/contexts/career-context"
import { toast } from "sonner"

// Interface local para os motivos pré-definidos
interface PredefinedReason {
    id: string
    type: "transfer" | "wage" | "facilities"
    title: string
    description: string
    suggestedAmount: number
    justification: string
    requirements?: string[]
}

export default function FinancesPage() {
    const { activeCareer, updateBudgetAllocation, submitBoardRequest } = useCareer()
    const [activeTab, setActiveTab] = useState("overview")

    // Motivos pré-definidos para pedidos à diretoria
    const predefinedReasons: PredefinedReason[] = [
        { id: "champions-reinforcement", type: "transfer", title: "Reforços para Champions League", description: "Contratações para competir no mais alto nível europeu", suggestedAmount: 50000000, justification: "A classificação para a Champions League aumentou nossa receita significativamente. Precisamos de reforços de qualidade para competir e avançar nas fases eliminatórias.", requirements: ["Classificação Champions League"] },
        { id: "injury-crisis", type: "transfer", title: "Emergência por Lesões", description: "Contratações urgentes devido a lesões", suggestedAmount: 25000000, justification: "Temos múltiplas lesões de longa duração em posições-chave. Sem reforços imediatos, corremos o risco de não atingir nossos objetivos na temporada.", requirements: ["3+ jogadores lesionados"] },
        { id: "young-talents", type: "transfer", title: "Investimento em Jovens Talentos", description: "Contratação de promessas para o futuro", suggestedAmount: 30000000, justification: "Investir em jovens talentos é essencial para o futuro do clube. Estes jogadores podem se valorizar significativamente e gerar lucro em vendas futuras." },
        { id: "title-push", type: "transfer", title: "Investida pelo Título", description: "Reforços para conquistar o campeonato", suggestedAmount: 40000000, justification: "Estamos em excelente posição para conquistar o título da liga. Um investimento estratégico agora pode garantir a conquista, que trará receitas substanciais.", requirements: ["Top 3 na liga"] },
        { id: "key-renewals", type: "wage", title: "Renovações de Jogadores-Chave", description: "Renovar contratos de jogadores importantes", suggestedAmount: 15000000, justification: "Temos jogadores fundamentais com contratos expirando. Perdê-los gratuitamente seria um desastre financeiro e esportivo. O investimento é menor que o custo de substituí-los.", requirements: ["Jogadores com contrato expirando"] },
        { id: "performance-bonuses", type: "wage", title: "Bônus por Performance", description: "Pagamento de bônus por metas atingidas", suggestedAmount: 8000000, justification: "A equipe superou as expectativas e atingiu metas importantes. Os bônus são obrigatórios contratualmente e motivam os jogadores." },
        { id: "training-facilities", type: "facilities", title: "Modernização do CT", description: "Melhorias no centro de treinamento", suggestedAmount: 20000000, justification: "Instalações modernas são essenciais para atrair e desenvolver talentos, reduzindo lesões e aumentando o valor de revenda dos atletas." },
        { id: "stadium-improvements", type: "facilities", title: "Melhorias no Estádio", description: "Reformas para aumentar receita e experiência", suggestedAmount: 35000000, justification: "Melhorias no estádio aumentam a capacidade, a experiência dos torcedores e as receitas de bilheteria. O retorno do investimento é garantido." },
        { id: "youth-academy", type: "facilities", title: "Expansão da Academia", description: "Investimento nas categorias de base", suggestedAmount: 15000000, justification: "Uma academia de ponta é fundamental para desenvolver talentos próprios e reduzir custos de transferências." },
    ]

    // Estados locais para o formulário de pedido
    const [selectedRequestType, setSelectedRequestType] = useState<"transfer" | "wage" | "facilities" | "">("")
    const [selectedReason, setSelectedReason] = useState<PredefinedReason | null>(null)
    const [customAmount, setCustomAmount] = useState<number>(0)

    const formatCurrency = (amount: number) => {
        const absAmount = Math.abs(amount)
        if (absAmount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`
        if (absAmount >= 1000) return `€${(amount / 1000).toFixed(0)}K`
        return `€${amount}`
    }

    const getBalanceColor = (amount: number) => {
        if (amount < 0) return "text-red-600"
        if (amount < 5000000) return "text-yellow-600"
        return "text-green-600"
    }

    const getBudgetStatus = (used: number, total: number) => {
        const percentage = (used / total) * 100
        if (percentage > 100) return { color: "bg-red-500", status: "Excedido" }
        if (percentage > 90) return { color: "bg-orange-500", status: "Crítico" }
        if (percentage > 75) return { color: "bg-yellow-500", status: "Alto" }
        return { color: "bg-green-500", status: "Saudável" }
    }

    const handleSubmitRequest = () => {
        if (!selectedReason || customAmount <= 0) {
            toast.error("Pedido inválido", { description: "Por favor, preencha todos os campos corretamente." })
            return
        }
        submitBoardRequest({
            type: selectedReason.type,
            amount: customAmount,
            reason: selectedReason.title,
            justification: selectedReason.justification,
        })
        // Limpa o formulário
        setSelectedRequestType("")
        setSelectedReason(null)
        setCustomAmount(0)
    }

    if (!activeCareer) {
        return <div>Carregando finanças...</div>
    }

    // --- DADOS E CÁLCULOS DERIVADOS DO CONTEXTO ---
    const { totalBudget, transferBudget, wageBudget, transactions, boardRequests, squad } = activeCareer;

    const transferSpent = transactions.filter(t => t.category === 'transfers' && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const currentWages = squad.reduce((sum, p) => sum + (p.contract.wage || 0), 0) * 52; // Salário anualizado

    const revenue = {
        matchday: transactions.filter(t => t.category === 'match_day' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        broadcasting: transactions.filter(t => t.category === 'sponsors' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        commercial: 65000000, // Mantido como mock por enquanto
        transfers: transactions.filter(t => t.category === 'transfers' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    };

    const expenses = {
        wages: transactions.filter(t => t.category === 'wages' && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        transfers: transferSpent,
        operations: 12000000, // Mantido como mock
        facilities: 8000000, // Mantido como mock
    };

    const remainingTransferBudget = transferBudget - transferSpent
    const remainingWageBudget = wageBudget - currentWages
    const totalRevenue = Object.values(revenue).reduce((a, b) => a + b, 0)
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0)
    const netIncome = totalRevenue - totalExpenses

    return (
        <div className="space-y-6">
            {/* Cabeçalho com estilo do primeiro código */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Centro Financeiro</h1>
                    <p className="text-muted-foreground">Gerencie orçamentos, receitas e comunicação com a diretoria</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant={netIncome >= 0 ? "default" : "destructive"} className="text-lg px-3 py-1">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Saldo: {formatCurrency(netIncome)}
                    </Badge>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
                    <TabsTrigger value="board">Diretoria</TabsTrigger>
                    <TabsTrigger value="reports">Relatórios</TabsTrigger>
                </TabsList>

                {/* Visão Geral */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Cards de Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-blue-600" />
                                    Orçamento Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
                                <div className="text-sm text-muted-foreground">Para esta temporada</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    Receita Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
                                <div className="text-sm text-muted-foreground">+12% vs ano anterior</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                    Gastos Totais
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                                <div className="text-sm text-muted-foreground">+8% vs ano anterior</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-purple-600" />
                                    Resultado Líquido
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${getBalanceColor(netIncome)}`}>{formatCurrency(netIncome)}</div>
                                <div className="text-sm text-muted-foreground">
                                    {netIncome >= 0 ? "Lucro" : "Prejuízo"} da temporada
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Status dos Orçamentos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Status dos Orçamentos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">Transferências</span>
                                        <span className={`text-sm font-bold ${getBalanceColor(remainingTransferBudget)}`}>
                      {formatCurrency(remainingTransferBudget)} restante
                    </span>
                                    </div>
                                    <Progress
                                        value={(transferSpent / transferBudget) * 100}
                                        className="h-3"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>Usado: {formatCurrency(transferSpent)}</span>
                                        <span>Total: {formatCurrency(transferBudget)}</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">Salários</span>
                                        <span className={`text-sm font-bold ${getBalanceColor(remainingWageBudget)}`}>
                      {formatCurrency(remainingWageBudget)} restante
                    </span>
                                    </div>
                                    <Progress value={(currentWages / wageBudget) * 100} className="h-3" />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>Usado: {formatCurrency(currentWages)}</span>
                                        <span>Total: {formatCurrency(wageBudget)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="h-5 w-5" />
                                    Distribuição de Receitas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <span className="text-sm">Transmissão</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(revenue.broadcasting)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-sm">Comercial</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(revenue.commercial)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <span className="text-sm">Bilheteria</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(revenue.matchday)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                            <span className="text-sm">Transferências</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(revenue.transfers)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Alertas Financeiros */}
                    {(remainingTransferBudget < 0 || remainingWageBudget < 0) && (
                        <Card className="border-red-200 bg-red-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-800">
                                    <AlertTriangle className="h-5 w-5" />
                                    Alertas Financeiros
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {remainingTransferBudget < 0 && (
                                        <div className="flex items-center space-x-2 text-red-700">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>
                        Orçamento de transferências excedido em {formatCurrency(Math.abs(remainingTransferBudget))}
                      </span>
                                        </div>
                                    )}
                                    {remainingWageBudget < 0 && (
                                        <div className="flex items-center space-x-2 text-red-700">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Orçamento salarial excedido em {formatCurrency(Math.abs(remainingWageBudget))}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Gestão de Orçamentos */}
                <TabsContent value="budgets" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Alocação de Orçamento
                            </CardTitle>
                            <CardDescription>Ajuste a distribuição do orçamento entre transferências e salários</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <Label className="text-base font-medium">Orçamento de Transferências</Label>
                                            <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(transferBudget)}
                      </span>
                                        </div>
                                        <Slider
                                            value={[transferBudget]}
                                            onValueChange={([value]) => updateBudgetAllocation(value, totalBudget - value)}
                                            max={totalBudget}
                                            min={0}
                                            step={1000000}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                            <span>€10M</span>
                                            <span>{formatCurrency(totalBudget - 10000000)}</span>
                                        </div>
                                        <div className="mt-3 p-3 border rounded-lg">
                                            <div className="text-sm">
                                                <div className="flex justify-between">
                                                    <span>Gasto atual:</span>
                                                    <span className="font-medium">{formatCurrency(transferSpent)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Disponível:</span>
                                                    <span className={`font-medium ${getBalanceColor(remainingTransferBudget)}`}>
                            {formatCurrency(remainingTransferBudget)}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <Label className="text-base font-medium">Orçamento Salarial</Label>
                                            <span className="text-lg font-bold text-green-600">
                        {formatCurrency(wageBudget)}
                      </span>
                                        </div>
                                        <Slider
                                            value={[wageBudget]}
                                            onValueChange={([value]) => updateBudgetAllocation(totalBudget - value, value)}
                                            max={totalBudget}
                                            min={0}
                                            step={1000000}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                            <span>€10M</span>
                                            <span>{formatCurrency(totalBudget - 10000000)}</span>
                                        </div>
                                        <div className="mt-3 p-3 border rounded-lg">
                                            <div className="text-sm">
                                                <div className="flex justify-between">
                                                    <span>Gasto atual:</span>
                                                    <span className="font-medium">{formatCurrency(currentWages)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Disponível:</span>
                                                    <span className={`font-medium ${getBalanceColor(remainingWageBudget)}`}>
                            {formatCurrency(remainingWageBudget)}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Resumo da Alocação</h3>

                                    <div className="p-4 rounded-lg border">
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span>Orçamento Total:</span>
                                                <span className="font-bold">{formatCurrency(totalBudget)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Transferências:</span>
                                                <span className="font-medium text-blue-600">
                          {formatCurrency(transferBudget)}
                        </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Salários:</span>
                                                <span className="font-medium text-green-600">{formatCurrency(wageBudget)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Comunicação com a Diretoria */}
                <TabsContent value="board" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Novo Pedido */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5" />
                                    Novo Pedido
                                </CardTitle>
                                <CardDescription>Solicite orçamento adicional à diretoria</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Tipo de Pedido</Label>
                                    <Select
                                        value={selectedRequestType}
                                        onValueChange={(value: any) => {
                                            setSelectedRequestType(value)
                                            setSelectedReason(null)
                                        }}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transfer">Transferências</SelectItem>
                                            <SelectItem value="wage">Salários</SelectItem>
                                            <SelectItem value="facilities">Instalações</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedRequestType && (
                                    <div>
                                        <Label>Motivo do Pedido</Label>
                                        <Select
                                            value={selectedReason?.id || ""}
                                            onValueChange={(value) => {
                                                const reason = predefinedReasons.find((r) => r.id === value)
                                                setSelectedReason(reason || null)
                                                setCustomAmount(reason?.suggestedAmount || 0)
                                            }}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Selecione o motivo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {predefinedReasons
                                                    .filter((r) => r.type === selectedRequestType)
                                                    .map((reason) => (
                                                        <SelectItem key={reason.id} value={reason.id}>
                                                            <div>
                                                                <div className="font-medium">{reason.title}</div>
                                                                <div className="text-xs text-muted-foreground">{reason.description}</div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedReason && (
                                    <>
                                        <div className="p-3 rounded-lg border bg-white">
                                            <h4 className="font-medium text-blue-800 mb-2">{selectedReason.title}</h4>
                                            <p className="text-sm text-blue-700 mb-3">{selectedReason.description}</p>

                                            {selectedReason.requirements && (
                                                <div className="mb-3">
                                                    <div className="text-xs font-medium text-blue-800 mb-1">Requisitos:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {selectedReason.requirements.map((req, index) => (
                                                            <Badge key={index} variant="outline" className="text-xs border-blue-200 text-blue-700">
                                                                {req}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-sm">
                                                <span className="font-medium text-blue-800">Valor sugerido: </span>
                                                <span className="font-bold text-green-600">
                          {formatCurrency(selectedReason.suggestedAmount)}
                        </span>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Valor Solicitado</Label>
                                            <div className="flex space-x-2 mt-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCustomAmount(selectedReason.suggestedAmount)}
                                                    className="text-xs"
                                                >
                                                    Usar Sugerido
                                                </Button>
                                                <Input
                                                    type="number"
                                                    placeholder="Valor personalizado"
                                                    value={customAmount || ""}
                                                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                                                    className="flex-1"
                                                />
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {customAmount > 0 && formatCurrency(customAmount)}
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Justificativa</Label>
                                            <Textarea value={selectedReason.justification} readOnly className="mt-1 bg-gray-50" rows={4} />
                                        </div>

                                        <Button
                                            onClick={handleSubmitRequest}
                                            disabled={!selectedReason || customAmount <= 0}
                                            className="w-full"
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            Enviar Pedido
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Histórico de Pedidos */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Histórico de Pedidos
                                </CardTitle>
                                <CardDescription>Acompanhe suas solicitações à diretoria</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {boardRequests.map((request) => (
                                        <div key={request.id} className="p-4 rounded-lg border">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold">{request.reason}</h4>
                                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                                {new Date(request.date).toLocaleDateString("pt-BR")}
                            </span>
                                                        <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                                                            {formatCurrency(request.amount)}
                            </span>
                                                        <Badge variant="outline" className="capitalize">
                                                            {request.type === "transfer"
                                                                ? "Transferências"
                                                                : request.type === "wage"
                                                                    ? "Salários"
                                                                    : "Instalações"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Badge
                                                    className={
                                                        request.status === "approved"
                                                            ? "bg-green-100 text-green-400"
                                                            : request.status === "rejected"
                                                                ? "bg-red-100 text-red-400"
                                                                : "bg-yellow-100 text-yellow-400"
                                                    }
                                                >
                                                    {request.status === "approved" ? (
                                                        <>
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Aprovado
                                                        </>
                                                    ) : request.status === "rejected" ? (
                                                        <>
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Rejeitado
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            Pendente
                                                        </>
                                                    )}
                                                </Badge>
                                            </div>

                                            <p className="text-sm text-muted-foreground mb-3">{request.justification}</p>

                                            {request.response && (
                                                <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Building className="h-4 w-4 text-blue-600" />
                                                        <span className="font-medium text-blue-800">Resposta da Diretoria:</span>
                                                    </div>
                                                    <p className="text-sm text-blue-700">{request.response}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Relatórios */}
                <TabsContent value="reports" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Evolução Financeira
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-blue-500 rounded">
                                        <span>Receita Mensal Média</span>
                                        <span className="font-bold text-blue-100">{formatCurrency(totalRevenue / 12)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-red-500 rounded">
                                        <span>Gasto Mensal Médio</span>
                                        <span className="font-bold text-red-100">{formatCurrency(totalExpenses / 12)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-green-500 rounded">
                                        <span>Lucro Mensal Médio</span>
                                        <span className={`font-bold text-green-100`}>
                      {formatCurrency(netIncome / 12)}
                    </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Projeções
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm">Projeção de Receita Anual</span>
                                            <span className="font-medium text-green-600">{formatCurrency(totalRevenue * 1.1)}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Baseado no crescimento atual (+10%)</div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm">Economia Potencial</span>
                                            <span className="font-medium text-blue-600">{formatCurrency(5000000)}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Com otimização de gastos operacionais</div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm">Investimento Recomendado</span>
                                            <span className="font-medium text-purple-600">{formatCurrency(15000000)}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Para melhorias de infraestrutura</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5" />
                                    Conquistas da Temporada
                                </CardTitle>
                                <CardDescription>Use suas conquistas para justificar pedidos de orçamento</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {predefinedReasons.map((reason) => (
                                        <div
                                            key={reason.id}
                                            className={`p-4 rounded-lg border ${
                                                reason.type === "facilities" ? "border" : ""
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">{reason.title}</h4>
                                                {reason.type === "facilities" ? (
                                                    <Target className="h-5 w-5 text-gray-500" />
                                                ) : (
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Valor adicional: {formatCurrency(reason.suggestedAmount)}
                                            </div>
                                            {reason.type !== "facilities" && (
                                                <Badge className="mt-2 bg-green-300 text-green-800">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Conquistado
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}