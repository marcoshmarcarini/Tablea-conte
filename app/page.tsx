"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  PlusCircle, 
  Search, 
  BarChart3, 
  FileSpreadsheet, 
  DollarSign, 
  Layers, 
  TrendingUp, 
  Palette, 
  Trash2, 
  ExternalLink,
  Filter,
  RefreshCw,
  FolderOpen,
  UploadCloud,
  Loader2,
  Database,
  ArrowRight,
  Sparkles,
  Info,
  Calendar
} from "lucide-react";
import { 
  getStoredBudgets, 
  saveStoredBudgets, 
  getStoredCatalog, 
  saveStoredCatalog,
  resetStoredCatalog,
  formatCurrency 
} from "@/lib/utils";
import { 
  CampaignBudget, 
  PUBLIC_AGENCIES, 
  SinaProItem,
  calculatePieceTotal 
} from "@/lib/sinaproData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

export default function DashboardPage() {
  const [budgets, setBudgets] = useState<CampaignBudget[]>([]);
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("Todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"charts" | "list">("charts");
  const [loadingFirebase, setLoadingFirebase] = useState(false);

  useEffect(() => {
    // Load local storage immediately for fast offline rendering
    setBudgets(getStoredBudgets());
    setMounted(true);
    setLoadingFirebase(true);

    // Fetch dynamic real-time budgets from Firestore
    import("@/lib/firebaseService")
      .then(({ getBudgetsFromFirestore }) => getBudgetsFromFirestore())
      .then((remoteBudgets) => {
        if (remoteBudgets && remoteBudgets.length > 0) {
          setBudgets(remoteBudgets);
          saveStoredBudgets(remoteBudgets); // sync back to offline cache
        }
      })
      .catch((err) => console.error("Erro ao sincronizar com Firestore:", err))
      .finally(() => setLoadingFirebase(false));
  }, []);

  // Aggregated calculations
  const totalCampaigns = budgets.length;

  const totalValue = budgets.reduce((acc, budget) => {
    return acc + budget.pieces.reduce((sum, p) => sum + p.totalValue, 0);
  }, 0);

  const totalPiecesCreated = budgets.reduce((acc, budget) => {
    return acc + budget.pieces
      .filter(p => p.type === "Criada")
      .reduce((sum, p) => sum + p.quantity, 0);
  }, 0);

  const totalPiecesAdapted = budgets.reduce((acc, budget) => {
    return acc + budget.pieces
      .filter(p => p.type === "Adaptada")
      .reduce((sum, p) => sum + p.quantity, 0);
  }, 0);

  const totalPieces = totalPiecesCreated + totalPiecesAdapted;

  // Filter campaigns
  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch = 
      b.projectName.toLowerCase().includes(search.toLowerCase()) || 
      b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.publicAgency.toLowerCase().includes(search.toLowerCase());
    
    const matchesAgency = 
      agencyFilter === "Todos" || b.publicAgency === agencyFilter;

    let matchesDate = true;
    if (b.date) {
      if (startDate && b.date < startDate) matchesDate = false;
      if (endDate && b.date > endDate) matchesDate = false;
    } else if (startDate || endDate) {
      matchesDate = false;
    }

    return matchesSearch && matchesAgency && matchesDate;
  });

  // Recharts Monthly Data Processing
  const getMonthlyChartData = () => {
    const monthsMap: { 
      [key: string]: { 
        rawMonth: string; 
        formattedMonth: string; 
        criadas: number; 
        adaptadas: number; 
        faturamento: number 
      } 
    } = {
      "2026-01": { rawMonth: "2026-01", formattedMonth: "Jan / 26", criadas: 0, adaptadas: 0, faturamento: 0 },
      "2026-02": { rawMonth: "2026-02", formattedMonth: "Fev / 26", criadas: 0, adaptadas: 0, faturamento: 0 },
      "2026-03": { rawMonth: "2026-03", formattedMonth: "Mar / 26", criadas: 0, adaptadas: 0, faturamento: 0 },
      "2026-04": { rawMonth: "2026-04", formattedMonth: "Abr / 26", criadas: 0, adaptadas: 0, faturamento: 0 },
      "2026-05": { rawMonth: "2026-05", formattedMonth: "Mai / 26", criadas: 0, adaptadas: 0, faturamento: 0 },
      "2026-06": { rawMonth: "2026-06", formattedMonth: "Jun / 26", criadas: 0, adaptadas: 0, faturamento: 0 },
    };

    budgets.forEach((budget) => {
      if (!budget.date) return;
      const yearMonth = budget.date.substring(0, 7); // e.g. "2026-03"

      if (!monthsMap[yearMonth]) {
        const parts = yearMonth.split("-");
        const monthNum = parseInt(parts[1], 10);
        const year = parts[0];
        const monthNames = [
          "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
          "Jul", "Ago", "Set", "Out", "Nov", "Dez"
        ];
        monthsMap[yearMonth] = {
          rawMonth: yearMonth,
          formattedMonth: `${monthNames[monthNum] || parts[1]} / ${year.substring(2)}`,
          criadas: 0,
          adaptadas: 0,
          faturamento: 0
        };
      }

      const budgetTotal = budget.pieces.reduce((sum, p) => sum + p.totalValue, 0);
      monthsMap[yearMonth].faturamento += budgetTotal;

      budget.pieces.forEach((p) => {
        const qty = p.quantity || 1;
        if (p.type === "Criada") {
          monthsMap[yearMonth].criadas += qty;
        } else {
          monthsMap[yearMonth].adaptadas += qty;
        }
      });
    });

    return Object.values(monthsMap).sort((a, b) => a.rawMonth.localeCompare(b.rawMonth));
  };

  // Recharts Municipality Share Data Processing
  const getAgencyChartData = () => {
    // Brand agency colors aligning with the requested shades
    const agencyColors = {
      "Cachoeiro": "#6204bd", // Roxo Cor 1
      "Presidente Kennedy": "#f07507", // Laranja Cor 1
      "Marataízes": "#8036ca", // Roxo Cor 2
      "Venda Nova do Imigrante": "#f39039" // Laranja Cor 2
    };

    const map: { [key: string]: { name: string; value: number; fill: string; piecesCount: number } } = {
      "Cachoeiro": { name: "Cachoeiro", value: 0, fill: agencyColors["Cachoeiro"], piecesCount: 0 },
      "Presidente Kennedy": { name: "Presidente Kennedy", value: 0, fill: agencyColors["Presidente Kennedy"], piecesCount: 0 },
      "Marataízes": { name: "Marataízes", value: 0, fill: agencyColors["Marataízes"], piecesCount: 0 },
      "Venda Nova do Imigrante": { name: "Venda Nova do Imigrante", value: 0, fill: agencyColors["Venda Nova do Imigrante"], piecesCount: 0 }
    };

    budgets.forEach(budget => {
      const rawAgency = budget.publicAgency || "Cachoeiro";
      if (map[rawAgency]) {
        const bTotal = budget.pieces.reduce((sum, p) => sum + p.totalValue, 0);
        const pCount = budget.pieces.reduce((sum, p) => sum + p.quantity, 0);
        map[rawAgency].value += bTotal;
        map[rawAgency].piecesCount += pCount;
      }
    });

    return Object.values(map).filter(item => item.value > 0 || item.piecesCount > 0);
  };

  const monthlyChartData = getMonthlyChartData();
  const agencyChartData = getAgencyChartData();

  const handleExportCSV = () => {
    // CSV Header row with comprehensive campaign and piece properties
    const headers = [
      "Data de Emissão",
      "Código do Documento",
      "Cliente/Anunciante (Órgão Público)",
      "Nome do Projeto/Campanha",
      "Desconto da Campanha (%)",
      "Código da Peça",
      "Peça Publicitária",
      "Categoria da Peça",
      "Tipo de Produção",
      "Quantidade",
      "Preco Base Unitario (R$)",
      "Desconto Individual (%)",
      "Faturamento Liquido (R$)"
    ];

    const rows: string[][] = [];

    filteredBudgets.forEach(b => {
      if (b.pieces && b.pieces.length > 0) {
        b.pieces.forEach(p => {
          rows.push([
            b.date || "",
            b.invoiceNumber,
            `Prefeitura de ${b.publicAgency}`,
            b.projectName,
            String(b.discountPercentage),
            p.code || "S/C",
            p.name,
            p.category,
            p.type,
            String(p.quantity),
            p.basePrice.toFixed(2),
            String(p.discountApplied),
            p.totalValue.toFixed(2)
          ]);
        });
      } else {
        // Fallback row if campaign has no items/pieces
        rows.push([
          b.date || "",
          b.invoiceNumber,
          `Prefeitura de ${b.publicAgency}`,
          b.projectName,
          String(b.discountPercentage),
          "",
          "",
          "",
          "",
          "0",
          "0.00",
          "0",
          "0.00"
        ]);
      }
    });

    // Excel-friendly CSV with BOM for UTF-8 characters and semicolon separator
    const escapeCsvField = (field: string) => {
      const escaped = field.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const csvContent = "\uFEFF" + [
      headers.map(escapeCsvField).join(";"),
      ...rows.map(row => row.map(escapeCsvField).join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.className = "hidden";
    link.setAttribute("href", url);
    link.setAttribute("download", `exportacao_orcamentos_${btoa(Math.random().toString()).substring(0, 5)}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen pb-16 flex flex-col font-sans">
      
      {/* Dynamic Header branded as Agência Conteúdo */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 select-none animate-fade-in">
            {/* Elegant SVG Logo of Agência Conteúdo */}
            <div className="relative p-2.5 bg-gradient-to-tr from-[#6204bd] to-[#f07507] rounded-2xl text-white shadow-lg shadow-[#6204bd]/20 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Agência Conteúdo
              </h1>
              <p className="text-[10px] text-[#f07507] font-extrabold tracking-widest uppercase">
                Mídia Executiva & Gestão Governamental
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link 
              href="/admin" 
              className="px-5 py-2.5 bg-[#6204bd] text-white hover:bg-[#8036ca] font-bold text-sm rounded-xl transition duration-150 flex items-center gap-2 shadow-md shadow-[#6204bd]/10 focus:ring-2 focus:ring-[#6204bd]/20 focus:outline-hidden font-sans"
              id="dashboard-new-proposal"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              Área Administrativa
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 flex-1 w-full animate-fade-in">
        
        {/* KPI Row Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* KPI: Total Faturamento */}
          <div className="bg-white border border-slate-250 p-6 rounded-3xl shadow-xs flex items-center gap-5">
            <div className="p-4 bg-[#dfccf1]/50 rounded-2xl text-[#6204bd]">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Faturamento Indenizado</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(totalValue)}</h3>
              <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#f07507]" strokeWidth={3} />
                Líquido com descontos
              </p>
            </div>
          </div>

          {/* KPI: Total Campanhas */}
          <div className="bg-white border border-slate-250 p-6 rounded-3xl shadow-xs flex items-center gap-5">
            <div className="p-4 bg-[#fbe2cc] rounded-2xl text-[#f07507]">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Propostas Executadas</p>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalCampaigns}</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Cachoeiro, PK, MZ e Venda Nova</p>
            </div>
          </div>

          {/* KPI: Peças Criadas */}
          <div className="bg-white border border-slate-250 p-6 rounded-3xl shadow-xs flex items-center gap-5">
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
              <Palette className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Peças Criadas</p>
              <h3 className="text-xl font-black text-emerald-700 mt-0.5">{totalPiecesCreated}</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {totalPieces > 0 ? `${Math.round((totalPiecesCreated / totalPieces) * 100)}%` : "0%"} da produção total
              </p>
            </div>
          </div>

          {/* KPI: Peças Adaptadas */}
          <div className="bg-white border border-slate-250 p-6 rounded-3xl shadow-xs flex items-center gap-5">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Peças Adaptadas</p>
              <h3 className="text-xl font-black text-blue-700 mt-0.5">{totalPiecesAdapted}</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {totalPieces > 0 ? `${Math.round((totalPiecesAdapted / totalPieces) * 100)}%` : "0%"} adaptadas
              </p>
            </div>
          </div>
        </div>

        {/* Charts Board */}
        <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 select-none">
                <BarChart3 className="w-4.5 h-4.5 text-[#6204bd]" />
                Análises e Métricas de Produção Publicitária
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Comparativo mensal de mídias por eixos de criação e adaptações homologados pela Agência Conteúdo.
              </p>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setTab("charts")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition duration-150 ${tab === "charts" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Gráficos Interativos
              </button>
              <button
                onClick={() => setTab("list")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition duration-150 ${tab === "list" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Sumário Consolidado
              </button>
            </div>
          </div>

          {!mounted ? (
            <div className="h-80 flex items-center justify-center text-slate-400 font-semibold animate-pulse text-sm">
              Carregando gráficos de auditoria...
            </div>
          ) : tab === "charts" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Plot 1: Monthly distribution */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  Volume mensal de peças desenvolvidas (Criadas x Adaptadas)
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyChartData}
                      margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="formattedMonth" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        fontWeight="bold" 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        fontWeight="bold" 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: "#fff", 
                          borderColor: "#e2e8f0", 
                          borderRadius: "12px", 
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" 
                        }}
                      />
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: 11, fontWeight: "bold", paddingTop: 10 }}
                      />
                      <Bar 
                        dataKey="criadas" 
                        name="Peças Criadas" 
                        fill="#6204bd" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={45}
                      />
                      <Bar 
                        dataKey="adaptadas" 
                        name="Peças Adaptadas" 
                        fill="#f07507" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={45} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plot 2: Pie distribution */}
              <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-6">
                <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  Investimento Governamental por Município (Líquido)
                </h3>
                {agencyChartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 p-4">
                    <p className="text-xs font-semibold">Sem faturamento no período.</p>
                    <p className="text-[10px] text-slate-350 mt-1">Crie investimentos via propostas para alimentar o mapa financeiro.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={agencyChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                          >
                            {agencyChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => formatCurrency(Number(value))}
                            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 select-none">
                      {agencyChartData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="font-bold text-slate-650">{item.name}</span>
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-800">{formatCurrency(item.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sparkline trend lines */}
              <div className="lg:col-span-3 border-t border-slate-100 pt-5 space-y-3">
                <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  Linha de Tendência de Faturamento Mensal
                </h3>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyChartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                      <XAxis dataKey="formattedMonth" stroke="#ccd6e0" fontSize={10} fontWeight="bold" tickLine={false} />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Line 
                        type="monotone" 
                        dataKey="faturamento" 
                        stroke="#6204bd" 
                        strokeWidth={3} 
                        dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Período de Referência</th>
                    <th className="px-5 py-3 text-center">Nº Peças Criadas</th>
                    <th className="px-5 py-3 text-center">Nº Peças Adaptadas</th>
                    <th className="px-5 py-3 text-center">Disponibilidade Geral (Peças)</th>
                    <th className="px-5 py-3 text-right">Faturamento Consolidado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-705">
                  {monthlyChartData.map((row) => (
                    <tr key={row.rawMonth} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-800">{row.formattedMonth}</td>
                      <td className="px-5 py-3 text-center text-emerald-600 font-mono font-bold">{row.criadas}</td>
                      <td className="px-5 py-3 text-center text-blue-600 font-mono font-bold">{row.adaptadas}</td>
                      <td className="px-5 py-3 text-center text-slate-650 font-mono">{row.criadas + row.adaptadas} peças</td>
                      <td className="px-5 py-3 text-right font-mono font-black text-[#6204bd]">{formatCurrency(row.faturamento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SinaPro Administrative redirection card helper */}
        <div className="bg-gradient-to-r from-slate-100 to-white border border-slate-200 p-6 rounded-3xl select-none flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6204bd]" />
              Painel de Controle SinaPro Homologado
            </h3>
            <p className="text-xs text-slate-500 font-semibold">
              Para atualizar o catálogo de referências de preços e mídias via PDF ou gerenciar propostas e dados, acesse o portal administrativo.
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-[#6204bd] text-xs font-black rounded-xl transition duration-150 inline-flex items-center gap-1.5 shrink-0"
          >
            Acessar Área Administrativa
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* SEARCH, FILTER & CAMPAIGNS REGISTER SECTION */}
        <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4.5 h-4.5 text-[#f07507]" />
                Propostas e Orçamentos Registrados
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Emissão de propostas públicas para Cachoeiro, Presidente Kennedy, Marataízes e Venda Nova do Imigrante.
              </p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col xl:flex-row items-center gap-3 w-full xl:w-auto">
              {/* CSV Export Button */}
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-800 text-xs font-black rounded-xl transition duration-150 shadow-xs h-9 w-full xl:w-auto justify-center select-none cursor-pointer"
                id="export-csv-btn"
                title="Exportar orçamento para planilha CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Exportar para CSV
              </button>

              {/* Keyword query */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar código, projeto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#6204bd] focus:bg-white text-slate-800 placeholder-slate-400 text-xs font-semibold rounded-xl pl-9 pr-4 py-2 focus:outline-hidden focus:ring-1 focus:ring-[#6204bd]"
                  id="search-campaign"
                />
              </div>

              {/* Date Range Filters */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto border border-slate-250 px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-500 font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#f07507] shrink-0" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">De</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-slate-850 font-bold focus:outline-hidden border-none text-[11px] w-24"
                    style={{ colorScheme: "light" }}
                  />
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">Até</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-slate-850 font-bold focus:outline-hidden border-none text-[11px] w-24"
                    style={{ colorScheme: "light" }}
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => { setStartDate(""); setEndDate(""); }}
                      className="text-slate-400 hover:text-red-600 font-black text-[10px] ml-1 cursor-pointer"
                      title="Limpar Intervalo"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Public Body select input query filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto border border-slate-250 pl-3 pr-2 py-2 rounded-xl bg-slate-50 text-xs text-slate-500 font-bold">
                <Filter className="w-3.5 h-3.5 text-[#6204bd]" />
                <select
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-extrabold cursor-pointer focus:outline-hidden"
                  id="filter-public-agency"
                >
                  <option value="Todos">Órgão Público: Todos</option>
                  {PUBLIC_AGENCIES.map(agency => (
                    <option key={agency} value={agency}>PREFEITURA DE {agency.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Area */}
          {filteredBudgets.length === 0 ? (
            <div className="py-12 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-650 text-sm">Nenhum orçamento encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Gere propostas personalizadas para as prefeituras associadas.</p>
              <Link 
                href="/admin" 
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#6204bd] font-extrabold hover:underline"
              >
                Criar proposta inicial <PlusCircle className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#dfccf1]/10 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-150 select-none">
                  <tr>
                    <th className="px-6 py-4">Data de Emissão</th>
                    <th className="px-6 py-4">Código do Documento</th>
                    <th className="px-6 py-4">Cliente / Anunciante (Órgão Público)</th>
                    <th className="px-6 py-4">Nome do Projeto / Campanha</th>
                    <th className="px-6 py-4 text-center">Nº Peças</th>
                    <th className="px-6 py-4 text-right">Resultado Global</th>
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-705">
                  {filteredBudgets.map((b) => {
                    const budgetSum = b.pieces.reduce((sum, p) => sum + p.totalValue, 0);
                    const piecesCount = b.pieces.reduce((sum, p) => sum + p.quantity, 0);

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition duration-75">
                        
                        {/* Issued date */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-slate-500 font-bold">{b.date}</span>
                        </td>

                        {/* Invoice document code */}
                        <td className="px-6 py-4">
                          <span className="font-mono bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-[11px]">
                            {b.invoiceNumber}
                          </span>
                        </td>

                        {/* Public agency (município) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{
                              backgroundColor: b.publicAgency === "Cachoeiro" ? "#6204bd" :
                                             b.publicAgency === "Presidente Kennedy" ? "#f07507" :
                                             b.publicAgency === "Marataízes" ? "#8036ca" : "#f39039"
                            }} />
                            <span className="text-slate-800 font-black">Prefeitura de {b.publicAgency}</span>
                          </div>
                        </td>

                        {/* Project / Campaign title */}
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-900 leading-tight md:max-w-xs xl:max-w-md truncate">
                            {b.projectName}
                          </p>
                        </td>

                        {/* Total items compiled */}
                        <td className="px-6 py-4 text-center font-mono">
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px]">
                            {piecesCount} {piecesCount === 1 ? "peça" : "peças"}
                          </span>
                        </td>

                        {/* Overall campaign financial result */}
                        <td className="px-6 py-4 text-right text-[#6204bd] font-black font-mono">
                          {formatCurrency(budgetSum)}
                        </td>

                        {/* Actions buttons */}
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/visualizar/${b.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#dfccf1]/40 hover:bg-[#dfccf1]/70 text-[#6204bd] text-[10px] font-black rounded-xl transition duration-150 select-none uppercase tracking-wider"
                            title="Visualizar e Imprimir PDF"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Visualizar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
