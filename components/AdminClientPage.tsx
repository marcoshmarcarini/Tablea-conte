"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Percent, 
  Plus, 
  Trash2, 
  FolderLock, 
  FileCheck, 
  Compass, 
  LayoutGrid, 
  Sliders, 
  HelpCircle,
  FileSpreadsheet,
  UploadCloud,
  Loader2,
  Database,
  Sparkles,
  Info,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { 
  CampaignBudget, 
  SelectedPiece, 
  PUBLIC_AGENCIES, 
  SinaProItem, 
  PieceType, 
  calculatePieceTotal 
} from "@/lib/sinaproData";
import { 
  getStoredBudgets, 
  saveStoredBudgets, 
  getStoredCatalog, 
  saveStoredCatalog,
  resetStoredCatalog,
  formatCurrency 
} from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();

  // Primary states
  const [publicAgency, setPublicAgency] = useState<'Cachoeiro' | 'Presidente Kennedy' | 'Marataízes' | 'Venda Nova do Imigrante'>("Cachoeiro");
  const [projectName, setProjectName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [campaignDate, setCampaignDate] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(15);
  const [pieces, setPieces] = useState<SelectedPiece[]>([]);
  const [catalog, setCatalog] = useState<SinaProItem[]>([]);

  // Draft Piece States
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [customPieceName, setCustomPieceName] = useState("");
  const [pieceCode, setPieceCode] = useState("");
  const [pieceCategory, setPieceCategory] = useState("Mídia Digital");
  const [pieceType, setPieceType] = useState<PieceType>("Criada");
  const [pieceBasePrice, setPieceBasePrice] = useState(0);
  const [pieceQuantity, setPieceQuantity] = useState(1);
  const [pieceDiscount, setPieceDiscount] = useState(15);

  // Administrative tools & catalog search states
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("Todos");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [budgets, setBudgets] = useState<CampaignBudget[]>([]);

  const [loadingFirebase, setLoadingFirebase] = useState(false);

  useEffect(() => {
    // Generate default invoice code & date on load
    const today = new Date().toISOString().split("T")[0];
    setCampaignDate(today);
    generateInvoicePrefix("Cachoeiro");
    
    // Offline fallbacks for instant render
    setCatalog(getStoredCatalog());
    setBudgets(getStoredBudgets());
    setLoadingFirebase(true);

    // Dynamic fetch from Firestore
    import("@/lib/firebaseService")
      .then(({ getBudgetsFromFirestore, getCatalogFromFirestore }) => {
        return Promise.all([
          getBudgetsFromFirestore(),
          getCatalogFromFirestore()
        ]);
      })
      .then(([remoteBudgets, remoteCatalog]) => {
        if (remoteBudgets && remoteBudgets.length > 0) {
          setBudgets(remoteBudgets);
          saveStoredBudgets(remoteBudgets);
        }
        if (remoteCatalog && remoteCatalog.length > 0) {
          setCatalog(remoteCatalog);
          saveStoredCatalog(remoteCatalog);
        }
      })
      .catch((err) => console.error("Erro ao sincronizar com Firebase:", err))
      .finally(() => setLoadingFirebase(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateInvoicePrefix = (agency: typeof publicAgency) => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    let prefix = "CI";
    if (agency === "Presidente Kennedy") prefix = "PK";
    else if (agency === "Marataízes") prefix = "MZ";
    else if (agency === "Venda Nova do Imigrante") prefix = "VN";

    setInvoiceNumber(`${prefix}-2026-${randomNum}`);
  };

  const handleAgencyChange = (agency: typeof publicAgency) => {
    setPublicAgency(agency);
    generateInvoicePrefix(agency);
  };

  // Synchronize base price and code when selecting catalog item or changing piece type
  const handleCatalogSelection = (id: string, currentType: PieceType) => {
    setSelectedCatalogId(id);
    const item = catalog.find(i => i.id === id);
    if (item) {
      setCustomPieceName(item.name);
      setPieceCode(item.code);
      setPieceCategory(item.category);
      setPieceBasePrice(currentType === "Criada" ? item.basePriceCreated : item.basePriceAdapted);
    }
  };

  const handlePieceTypeChange = (type: PieceType) => {
    setPieceType(type);
    if (selectedCatalogId) {
      const item = catalog.find(i => i.id === selectedCatalogId);
      if (item) {
        setPieceBasePrice(type === "Criada" ? item.basePriceCreated : item.basePriceAdapted);
      }
    }
  };

  const handleAddPiece = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customPieceName.trim()) {
      alert("Por favor, selecione ou digite o nome da peça publicitária.");
      return;
    }

    if (pieceBasePrice <= 0) {
      alert("Informe um valor base válido para a peça de mídia.");
      return;
    }

    if (pieceQuantity <= 0) {
      alert("A quantidade de peças deve ser de pelo menos 1 unidade.");
      return;
    }

    const calculatedValue = calculatePieceTotal(pieceBasePrice, pieceQuantity, pieceDiscount);

    const newPiece: SelectedPiece = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      catalogId: selectedCatalogId || undefined,
      code: pieceCode.trim() || "S/C",
      name: customPieceName,
      category: pieceCategory,
      type: pieceType,
      basePrice: pieceBasePrice,
      quantity: pieceQuantity,
      discountApplied: pieceDiscount,
      totalValue: calculatedValue
    };

    setPieces([...pieces, newPiece]);

    // Reset Piece inputs except individual discount / catalog link
    setCustomPieceName("");
    setSelectedCatalogId("");
    setPieceCode("");
    setPieceQuantity(1);
    // Keep individual discount synced or reset to default state
    setPieTypeAndReset();
  };

  const setPieTypeAndReset = () => {
    setPieceBasePrice(0);
    setPieceCode("");
  };

  const removePiece = (id: string) => {
    setPieces(pieces.filter(p => p.id !== id));
  };

  const draftCampaignTotal = pieces.reduce((acc, p) => acc + p.totalValue, 0);

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      alert("Por favor, preencha o Nome do Projeto / Campanha.");
      return;
    }

    if (!invoiceNumber.trim()) {
      alert("Por favor, insira o Código do Documento de Mídia.");
      return;
    }

    if (pieces.length === 0) {
      alert("Alerta: É obrigatório adicionar pelo menos uma peça dentro do catálogo de orçamento.");
      return;
    }

    const newCampaign: CampaignBudget = {
      id: `camp-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim(),
      publicAgency,
      clientName: publicAgency, // Synced as requested
      projectName: projectName.trim(),
      date: campaignDate,
      discountPercentage,
      pieces,
      createdAt: new Date().toISOString()
    };

    const currentList = getStoredBudgets();
    
    // Check if code already exists
    const codeExists = currentList.some(item => item.invoiceNumber.toLowerCase() === invoiceNumber.trim().toLowerCase());
    if (codeExists) {
      if (!confirm("O código deste documento já foi utilizado. Deseja salvá-lo mesmo assim?")) {
        return;
      }
    }

    const updatedList = [newCampaign, ...currentList];
    saveStoredBudgets(updatedList);

    // Call async Firestore save
    import("@/lib/firebaseService").then(({ saveBudgetToFirestore }) => {
      saveBudgetToFirestore(newCampaign).catch((err) => console.error("Erro ao salvar no Firestore:", err));
    });

    router.push("/");
  };

  // Quick helper to pre-fill campaign settings with actual municipal ideas
  const applyQuickTemplate = (projectNameVal: string) => {
    setProjectName(projectNameVal);
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta proposta de orçamento?")) {
      const updated = budgets.filter((b) => b.id !== id);
      setBudgets(updated);
      saveStoredBudgets(updated);

      // Async Firestore delete
      import("@/lib/firebaseService").then(({ deleteBudgetFromFirestore }) => {
        deleteBudgetFromFirestore(id).catch((err) => console.error("Erro ao deletar no Firestore:", err));
      });
    }
  };

  const handleResetData = () => {
    if (confirm("Deseja restaurar as demonstrações de orçamento iniciais e a base de dados padrão no Firebase também?")) {
      localStorage.removeItem("sinapro_campaign_budgets");
      resetStoredCatalog();
      
      import("@/lib/firebaseService").then(({ resetFirestoreToDefaults }) => {
        resetFirestoreToDefaults().then(({ budgets: newBudgets, catalog: newCatalog }) => {
          setBudgets(newBudgets);
          setCatalog(newCatalog);
          saveStoredBudgets(newBudgets);
          saveStoredCatalog(newCatalog);
          alert("Demonstrações e catálogo restaurados no Firebase e localmente!");
        }).catch((err) => {
          console.error("Erro no reset do Firestore:", err);
          setBudgets(getStoredBudgets());
          setCatalog(getStoredCatalog());
          alert("Demonstrações e base de dados restauradas localmente devido a um erro de conexão.");
        });
      });
    }
  };

  const handleResetCatalog = () => {
    if (confirm("Deseja redefinir a tabela de preços referenciais para os valores padrão do SinaPro?")) {
      resetStoredCatalog();
      const defaultCatalog = getStoredCatalog();
      setCatalog(defaultCatalog);

      import("@/lib/firebaseService").then(({ saveCatalogToFirestore }) => {
        saveCatalogToFirestore(defaultCatalog).catch((err) => console.error("Erro ao resetar catálogo no Firestore:", err));
      });
      alert("Tabela de referências redefinida!");
    }
  };

  // Convert uploaded PDF file to Base64 and send to Gemini server extraction
  const handlePdfFile = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadErrorMessage("Por favor, envie um arquivo de formato PDF válido.");
      setUploadSuccessMessage("");
      return;
    }

    setUploadLoading(true);
    setUploadErrorMessage("");
    setUploadSuccessMessage("");

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Raw = reader.result as string;
        // Strip data prefix: e.g. "data:application/pdf;base64,"
        const base64Data = base64Raw.split(",")[1];

        // Fetch server API for extraction
        const res = await fetch("/api/extract-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64Pdf: base64Data }),
        });

        const result = await res.json();
        
        if (!res.ok || result.error) {
          throw new Error(result.error || "Houve uma falha na análise do PDF pelo Gemini.");
        }

        if (result.items && Array.isArray(result.items)) {
          // Format successfully extracted items
          const formattedItems = result.items.map((item: any, index: number) => ({
            id: `extracted-${Date.now()}-${index}`,
            name: item.name || "Serviço Não Identificado",
            category: item.category || "Mídia Digital",
            basePriceCreated: Number(item.basePriceCreated) || 0,
            basePriceAdapted: Number(item.basePriceAdapted) || 0,
          }));

          // Merge with current catalog
          const currentCatalog = getStoredCatalog();
          
          // Remove duplicates or prefix new ones
          const mergedCatalog = [...formattedItems, ...currentCatalog];
          saveStoredCatalog(mergedCatalog);
          setCatalog(mergedCatalog);

          // Upload updated merged catalog reference to Firestore
          import("@/lib/firebaseService").then(({ saveCatalogToFirestore }) => {
            saveCatalogToFirestore(mergedCatalog).catch((err) => console.error("Erro ao salvar catálogo atualizado no Firestore:", err));
          });

          setUploadSuccessMessage(
            `Sucesso! Extraímos perfeitamente ${formattedItems.length} peças/serviços de publicidade das tabelas do PDF e atualizamos o catálogo de referências de preços e o banco de dados nuvem do Firebase.`
          );
        } else {
          throw new Error("Nenhum dado tabular foi identificado no PDF.");
        }
      };
      
      reader.onerror = () => {
        throw new Error("Erro ao carregar o arquivo.");
      };

    } catch (err: any) {
      console.error(err);
      setUploadErrorMessage(err.message || "Não foi possível finalizar a importação.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handlePdfFile(e.target.files[0]);
    }
  };

  // Filter catalog items
  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesCategory = catalogCategoryFilter === "Todos" || item.category === catalogCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 w-full bg-slate-55 pb-16 font-sans">
      {/* Navigation Line */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#6204bd] transition duration-150">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard Principal
          </Link>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Módulos Administrativos | Agência Conteúdo</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <form onSubmit={handleSaveCampaign} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Project Settings Card & Metadata */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-[#dfccf1]/40 rounded-xl text-[#6204bd]">
                  <FolderLock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-800">1. Credenciais da Campanha</h2>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Dados Básicos Públicos</p>
                </div>
              </div>

              {/* Input: Select Public Body (Municipio) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#6204bd] uppercase tracking-wider">
                  Órgão Público (Município)
                </label>
                <select
                  value={publicAgency}
                  onChange={(e) => handleAgencyChange(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] focus:bg-white rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-[#6204bd] cursor-pointer"
                  id="admin_select_agency"
                >
                  {PUBLIC_AGENCIES.map((agency) => (
                    <option key={agency} value={agency}>
                      Prefeitura de {agency}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">Tudo será consolidado sob o órgão público selecionado.</p>
              </div>

              {/* Input: Project Name (Nome do Projeto / Campanha) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nome do Projeto / Campanha
                </label>
                <input
                  type="text"
                  placeholder="Ex: Campanha de Agasalho ou IPTU Premiado 2026"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] focus:bg-white rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-hidden focus:ring-1 focus:ring-[#6204bd]"
                  id="admin_input_project"
                  required
                />
                
                {/* Suggestions Pills to speed up testing */}
                <div className="pt-1 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate("Combate à Dengue e Zica vírus")}
                    className="text-[9px] bg-slate-100 font-bold hover:bg-slate-200 text-slate-550 px-2 py-0.5 rounded cursor-pointer"
                  >
                    + Dengue
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate("Conscientização e Trânsito Seguro")}
                    className="text-[9px] bg-slate-100 font-bold hover:bg-slate-200 text-slate-550 px-2 py-0.5 rounded cursor-pointer"
                  >
                    + Trânsito
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickTemplate("Inauguração do Pronto Atendimento")}
                    className="text-[9px] bg-slate-100 font-bold hover:bg-slate-200 text-slate-550 px-2 py-0.5 rounded cursor-pointer"
                  >
                    + Inauguração PA
                  </button>
                </div>
              </div>

              {/* Input: Code (Código do Documento) */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Código (Mídia/Invoice)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CI-2026-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] focus:bg-white rounded-xl px-3 py-2.5 text-xs text-slate-800 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-[#6204bd]"
                  id="admin_input_code"
                  required
                />
                <p className="text-[10px] text-slate-400">Gerado automaticamente ao alterar o município.</p>
              </div>

              {/* Input: Percentage of Discount (Comissão / Desconto Padrão) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Percentual de Desconto Geral (%)
                  </label>
                  <span className="text-[10px] font-bold text-[#6204bd] bg-[#dfccf1]/35 px-2 py-0.5 rounded-full">
                    {discountPercentage}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={discountPercentage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setDiscountPercentage(val);
                      setPieceDiscount(val); // Sync newly added piece defaults
                    }}
                    className="flex-1 accent-[#6204bd] cursor-pointer"
                  />
                  <div className="relative w-16">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                      className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-xs text-slate-800 font-black focus:outline-hidden"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">Percentual padrão descontado do valor de tabela padrão da Agência Conteúdo.</p>
              </div>

              {/* Date of emission */}
              <div className="space-y-1.5 border-t border-slate-100 pt-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Data de Emissão
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={campaignDate}
                    onChange={(e) => setCampaignDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Real-time Draft Aggregates Box */}
            <div className="bg-[#6204bd] text-white rounded-3xl p-6 shadow-md shadow-[#6204bd]/10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#dfccf1]">Resumo do Orçamento</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>Município Alvo:</span>
                  <span className="font-bold text-white">{publicAgency}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>Quantidade de Peças:</span>
                  <span className="font-bold text-white">{pieces.reduce((sum, p) => sum + p.quantity, 0)} itens</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-200">
                  <span>Desconto Padrão Aplicado:</span>
                  <span className="font-bold text-white">{discountPercentage}%</span>
                </div>
              </div>
              <div className="border-t border-[#dfccf1]/25 pt-4 text-right">
                <p className="text-[10px] uppercase font-bold text-[#dfccf1]">Valor Total Líquido</p>
                <p className="text-2xl font-black font-mono tracking-tight mt-1">
                  {formatCurrency(draftCampaignTotal)}
                </p>
              </div>
              
              <button
                type="submit"
                disabled={pieces.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  pieces.length > 0
                    ? "bg-[#f07507] text-white hover:bg-[#d66503] shadow-md shadow-black/10"
                    : "bg-white/10 text-[#dfccf1] cursor-not-allowed border border-white/20"
                }`}
              >
                <FileCheck className="w-4.5 h-4.5" />
                Salvar Orçamento
              </button>
            </div>
          </div>

          {/* RIGHT: Add Catalog Piece Form & List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Adding the piece within the catalog (Adição de Peças no Catálogo) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#fbe2cc]/60 rounded-xl text-[#f07507]">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800">2. Adição da Peça no Catálogo de Mídia</h2>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Tabela de Preços Referenciais | Agência Conteúdo</p>
                  </div>
                </div>
                <span className="hidden sm:inline bg-slate-100 text-slate-500 font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Agência Conteúdo Homologado
                </span>
              </div>

              {/* Interactive select catalog structure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Passo A: Modelo do Catálogo Base
                  </label>
                  <select
                    value={selectedCatalogId}
                    onChange={(e) => handleCatalogSelection(e.target.value, pieceType)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] focus:bg-white rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-hidden"
                  >
                    <option value="">Selecione para popular dados...</option>
                    {/* Groups by Category */}
                    {Array.from(new Set(catalog.map(i => i.category))).map(cat => (
                      <optgroup key={cat} label={cat}>
                        {catalog.filter(i => i.category === cat).map(item => (
                          <option key={item.id} value={item.id}>
                            [{item.code}] {item.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Código de Referência da Peça
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1.1 ou 4.2"
                    value={pieceCode}
                    onChange={(e) => setPieceCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] focus:bg-white rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-[#6204bd] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Passo B: Nome Personalizado da Peça
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Anúncio do Verso do Encarte"
                    value={customPieceName}
                    onChange={(e) => setCustomPieceName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] focus:bg-white rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Category, Type (Criada vs Adaptada) and Base Value Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                
                {/* Category select */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Categoria Mídia
                  </label>
                  <select
                    value={pieceCategory}
                    onChange={(e) => setPieceCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-hidden"
                  >
                    <option value="Mídia Digital">Mídia Digital</option>
                    <option value="Mídia Impressa">Mídia Impressa</option>
                    <option value="Áudio & Vídeo">Áudio & Vídeo</option>
                    <option value="Identidade Visual">Identidade Visual</option>
                    <option value="OOH & Sinalização">OOH & Sinalização</option>
                  </select>
                </div>

                {/* Type Selection (Criada vs Adaptada) */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tipo de Peça
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handlePieceTypeChange("Criada")}
                      className={`text-[10px] py-1.5 font-black rounded-lg text-center transition duration-150 cursor-pointer ${
                        pieceType === "Criada"
                          ? "bg-[#6204bd] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Criada
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePieceTypeChange("Adaptada")}
                      className={`text-[10px] py-1.5 font-black rounded-lg text-center transition duration-150 cursor-pointer ${
                        pieceType === "Adaptada"
                          ? "bg-[#f07507] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Adaptada
                    </button>
                  </div>
                </div>

                {/* Base price (Valor da Peça) populated from catalog or customized */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Preço Unitário Tabela (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">R$</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={pieceBasePrice || ""}
                      onChange={(e) => setPieceBasePrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] focus:bg-white rounded-xl pl-8 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quantidade total (un)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={pieceQuantity}
                    onChange={(e) => setPieceQuantity(Math.max(1, parseInt(e.target.value, 10)))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] focus:bg-white rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Piece discount & compilation calculations */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 bg-slate-50/50 p-4 rounded-2xl">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Desconto Individual Peça (%)</span>
                    <div className="flex items-center gap-2">
                      <Percent className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={pieceDiscount}
                        onChange={(e) => setPieceDiscount(Number(e.target.value))}
                        className="w-16 text-center bg-white border border-slate-250 rounded-lg py-1 text-xs font-black text-slate-800"
                      />
                    </div>
                  </div>
                  
                  <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Investimento Desta Peça (Líquido)</span>
                    <span className="text-sm font-black font-mono text-[#6204bd]">
                      {formatCurrency(calculatePieceTotal(pieceBasePrice, pieceQuantity, pieceDiscount))}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddPiece}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#6204bd] hover:bg-[#50039c] text-white text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xs focus:ring-2 focus:ring-[#6204bd]/20"
                >
                  <Plus className="w-4 h-4" />
                  Incluir Peça no Rol
                </button>
              </div>
            </div>

            {/* List Table of Items already draft-added */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#6204bd]" />
                Peças Integrantes do Orçamento ({pieces.length})
              </h3>

              {pieces.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-200 bg-slate-50 rounded-2xl text-center">
                  <LayoutGrid className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">Nenhuma peça inserida para esta campanha.</p>
                  <p className="text-[10px] text-slate-350 mt-1">Use a seção acima para pesquisar e adicionar peças do catálogo SinaPro.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-center">Código</th>
                        <th className="px-4 py-3">Peça Publicitária</th>
                        <th className="px-4 py-3">Categoria</th>
                        <th className="px-4 py-3 text-center">Tipo</th>
                        <th className="px-4 py-3 text-right">Preço Unitário</th>
                        <th className="px-4 py-3 text-center">Qtd</th>
                        <th className="px-4 py-3 text-center">Desconto</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-755">
                      {pieces.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-[#6204bd]/10 text-[#6204bd] font-black px-2 py-0.5 rounded text-[10px] font-mono">
                              {p.code}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-850 leading-tight">
                            {p.name}
                          </td>
                          <td className="px-4 py-3 text-[10px] text-slate-450 uppercase">{p.category}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              p.type === "Criada"
                                ? "bg-[#dfccf1]/40 text-[#6204bd]"
                                : "bg-[#fbe2cc]/40 text-[#f07507]"
                            }`}>
                              {p.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.basePrice)}</td>
                          <td className="px-4 py-3 text-center font-mono">{p.quantity}</td>
                          <td className="px-4 py-3 text-center font-mono font-normal text-slate-500">{p.discountApplied}%</td>
                          <td className="px-4 py-3 text-right font-mono text-[#6204bd]">{formatCurrency(p.totalValue)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removePiece(p.id)}
                              className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition duration-150 cursor-pointer"
                              title="Remover peça"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

        </form>

        {/* Central de Gerenciamento e Importação da Base */}
        <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-8 select-none">
          <div className="border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Database className="w-5.5 h-5.5 text-[#6204bd]" />
                Central de Gerenciamento e Importação da Base (SinaPro)
              </h2>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">
                Área de controle exclusivo da Agência Conteúdo para calibração, redefinição, histórico de orçamentos e importação de tabelas de preços de referências.
              </p>
            </div>
            
            <button
              onClick={handleResetData}
              className="px-4 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs rounded-xl transition duration-150 flex items-center gap-2 cursor-pointer border border-slate-200"
              id="admin-factory-reset"
            >
              <RefreshCw className="w-4 h-4" />
              Restaurar Dados de Fábrica (Geral)
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Card 1: PDF Extractor via IA */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#fbe2cc] text-[#f07507] rounded-xl">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-850">Atualizador de Base (PDF Table Extractor via IA)</h3>
                  <p className="text-[10px] text-[#f07507] font-bold uppercase tracking-wider">Gemini Multimodal Parser</p>
                </div>
              </div>
              
              <p className="text-xs text-slate-450 leading-relaxed">
                Faça o upload do documento PDF do SinaPro com as tabelas de referências. O modelo multimodal do Gemini processará todas as páginas do relatório de custos, extraindo no ato todas as descrições de criação/adaptação e atualizando o catálogo de serviços.
              </p>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition duration-155 flex flex-col items-center justify-center space-y-3 relative ${
                  dragActive ? "border-[#6204bd] bg-[#6204bd]/5" : "border-slate-200 bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  id="admin-pdf-upload"
                  onChange={handleFileChange}
                  disabled={uploadLoading}
                  className="hidden"
                />
                {uploadLoading ? (
                  <div className="py-4 space-y-2 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-[#6204bd] animate-spin" />
                    <p className="text-xs font-bold text-slate-700">Analisando e Extraindo Tabelas do PDF...</p>
                    <p className="text-[10px] text-slate-400">Processando documentos com o Gemini 3.5-Flash</p>
                  </div>
                ) : (
                  <label htmlFor="admin-pdf-upload" className="cursor-pointer flex flex-col items-center space-y-2 w-full h-full py-2">
                    <div className="p-3 bg-white border border-slate-200 shadow-xs rounded-full text-[#6204bd]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-xs font-black text-slate-850">Arraste o PDF de referências aqui ou clique para selecionar</p>
                    <p className="text-[10px] text-slate-400">Tamanho sugerido de até 15MB • Suporta tabelas de até 100 páginas</p>
                  </label>
                )}
              </div>

              {/* Extract Feedback Alerts */}
              {uploadSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2.5 text-xs leading-relaxed animate-fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-emerald-800">Base Atualizada com Sucesso!</p>
                    <p className="mt-0.5 text-emerald-700 font-semibold">{uploadSuccessMessage}</p>
                  </div>
                </div>
              )}

              {uploadErrorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-220 text-rose-800 rounded-xl flex items-start gap-2.5 text-xs leading-relaxed animate-fade-in">
                  <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-rose-800">Falha no Processamento</p>
                    <p className="mt-0.5 text-rose-700 font-semibold">{uploadErrorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Catalog Lookup Database list & Redefine option */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#dfccf1]/60 text-[#6204bd] rounded-xl">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-850">Consulta Rápida na Base do Catálogo</h3>
                    <p className="text-[10px] text-[#6204bd] font-bold uppercase tracking-wider">Tabela de Preços Ativos</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleResetCatalog}
                  className="text-xs text-[#6204bd] font-extrabold hover:underline cursor-pointer select-none"
                >
                  Restaurar Valores Padrão (SinaPro)
                </button>
              </div>

              {/* Filtering & Search Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar peça na base..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#6204bd] focus:bg-white text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-8.5 pr-3 py-2 focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-1 w-full border border-slate-200 pl-2 pr-2 py-1.5 rounded-xl bg-slate-50 text-[10px] text-slate-600 font-bold">
                  <Filter className="w-3.5 h-3.5 text-[#6204bd]" />
                  <select
                    value={catalogCategoryFilter}
                    onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                    className="bg-transparent text-slate-800 font-black cursor-pointer focus:outline-hidden w-full"
                  >
                    <option value="Todos">Todas as Categorias</option>
                    <option value="Mídia Digital">Mídia Digital</option>
                    <option value="Mídia Impressa">Mídia Impressa</option>
                    <option value="Áudio & Vídeo">Áudio & Vídeo</option>
                    <option value="Identidade Visual">Identidade Visual</option>
                    <option value="OOH & Sinalização">OOH & Sinalização</option>
                  </select>
                </div>
              </div>

              {/* Browse Catalog Table */}
              <div className="border border-slate-150 rounded-2xl overflow-y-auto max-h-56 select-none shadow-inner">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead className="bg-[#dfccf1]/15 sticky top-0 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 text-center">Código</th>
                      <th className="px-4 py-2.5">Nome do Serviço / Peça</th>
                      <th className="px-4 py-2.5 text-right">Preço Criação</th>
                      <th className="px-4 py-2.5 text-right">Preço Adapt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-705 font-bold font-mono">
                    {filteredCatalog.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-bold font-sans">
                          Nenhuma peça correspondente na base de referências.
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition duration-75">
                          <td className="px-4 py-2.5 text-center">
                            <span className="bg-[#6204bd]/10 text-[#6204bd] font-black px-2 py-0.5 rounded text-[10px] font-mono">
                              {item.code}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 shadow-xs font-sans font-black text-slate-855 text-[11px] leading-tight">
                            <p>{item.name}</p>
                            <span className="text-[8px] uppercase text-slate-400 font-bold">{item.category}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-black text-xs">
                            {formatCurrency(item.basePriceCreated)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-blue-600 font-black text-xs">
                            {formatCurrency(item.basePriceAdapted)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Row Card 3: Histórico e Exclusão de Orçamentos de Campanha */}
            <div className="xl:col-span-2 border-t border-slate-150 pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-850">Histórico de Orçamentos e Controle de Exclusão</h3>
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Modificações e Auditoria Operacional</p>
                </div>
              </div>

              <p className="text-xs text-slate-450 leading-relaxed font-sans">
                Delete orçamentos ou propostas emitidas diretamente desta central de gerenciamento administrativo para manter o relatório unificado do painel de controle principal perfeitamente sincronizado.
              </p>

              {budgets.length === 0 ? (
                <div className="py-8 bg-slate-50 border border-dashed border-slate-250 rounded-2xl text-center text-xs text-slate-400 font-bold">
                  Nenhum orçamento registrado no histórico no momento.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                  <table className="w-full text-left border-collapse text-xs select-none">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-150">
                      <tr>
                        <th className="px-4 py-3">Emissão</th>
                        <th className="px-4 py-3">Código</th>
                        <th className="px-4 py-3">Órgão Público (Anunciante)</th>
                        <th className="px-4 py-3">Projeto / Campanha</th>
                        <th className="px-4 py-3 text-right">Investimento Geral</th>
                        <th className="px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-705">
                      {budgets.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition duration-75">
                          <td className="px-4 py-3 font-mono">{b.date}</td>
                          <td className="px-4 py-3 font-mono font-bold text-[#6204bd]">{b.invoiceNumber}</td>
                          <td className="px-4 py-3 font-black text-slate-800">Prefeitura de {b.publicAgency}</td>
                          <td className="px-4 py-3 text-slate-900 font-bold truncate max-w-xs">{b.projectName}</td>
                          <td className="px-4 py-3 text-right font-mono font-black text-[#6204bd]">
                            {formatCurrency(b.pieces.reduce((sum, p) => sum + p.totalValue, 0))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteCampaign(b.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition duration-150 cursor-pointer"
                              title="Deletar Orçamento Permanentemente"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
