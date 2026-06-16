"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building, 
  Calendar, 
  ArrowLeft, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Palette,
  Calculator,
  Barcode,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { getStoredBudgets, formatCurrency } from "@/lib/utils";
import { CampaignBudget } from "@/lib/sinaproData";
import { jsPDF } from "jspdf";

export default function VisualizarCampanhaPage() {
  const params = useParams();
  const router = useRouter();
  const [budget, setBudget] = useState<CampaignBudget | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      // Local storage offline-first fallback
      const localList = getStoredBudgets();
      const localFound = localList.find((item) => item.id === id);
      if (localFound) {
        setBudget(localFound);
      }

      // Fetch active up-to-date from Firestore
      import("@/lib/firebaseService")
        .then(({ getBudgetsFromFirestore }) => getBudgetsFromFirestore())
        .then((remoteBudgets) => {
          const found = remoteBudgets.find((item) => item.id === id);
          if (found) {
            setBudget(found);
          }
        })
        .catch((err) => console.error("Erro de sincronização:", err))
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 bg-slate-50">
        <div className="w-10 h-10 border-4 border-[#6204bd] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-wider">Buscando orçamento no acervo municipal...</p>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 bg-slate-50 text-center">
        <div className="p-4 bg-amber-50 rounded-full text-amber-600 mb-4 border border-amber-250">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-lg font-black text-slate-800">Orçamento não localizado</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">O link de publicação municipal pode estar expirado ou o orçamento foi removido do banco local.</p>
        <Link 
          href="/" 
          className="mt-6 px-6 py-2.5 bg-[#6204bd] hover:bg-[#50039c] text-white text-xs font-bold rounded-xl transition duration-150 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </Link>
      </div>
    );
  }

  // Calculate gross and discounts
  const grossSum = budget.pieces.reduce((sum, p) => sum + (p.basePrice * p.quantity), 0);
  const totalValue = budget.pieces.reduce((sum, p) => sum + p.totalValue, 0);
  const totalDisc = grossSum - totalValue;

  const totalPiecesCount = budget.pieces.reduce((sum, p) => sum + p.quantity, 0);
  const createdCount = budget.pieces.filter(p => p.type === "Criada").reduce((sum, p) => sum + p.quantity, 0);
  const adaptedCount = budget.pieces.filter(p => p.type === "Adaptada").reduce((sum, p) => sum + p.quantity, 0);

  const downloadPDFFile = () => {
    const doc = new jsPDF();
    
    // Header Style Banner
    doc.setFillColor(98, 4, 189); // brand purple
    doc.rect(0, 0, 210, 32, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("PROPOSTA DE INVESTIMENTO PUBLICITÁRIO - AGÊNCIA CONTEÚDO", 15, 16);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`SISTEMA DE GESTÃO DE CONTRATAÇÃO MUNICIPAL DE PUBLICIDADE - PREFEITURA DE ${budget.publicAgency.toUpperCase()}`, 15, 23);

    let y = 44;
    
    // Details Section
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DO PROJETO", 15, y);
    y += 5;
    doc.setDrawColor(220, 225, 230);
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    
    doc.text("ÓRGÃO PÚBLICO:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(`Prefeitura Municipal de ${budget.publicAgency}`, 65, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("CÓDIGO DE DOCUMENTO:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(budget.invoiceNumber, 65, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("DATA DE REGISTRO:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(budget.date, 65, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("PROJETO / CAMPANHA:", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(budget.projectName, 65, y, { maxWidth: 125 });
    
    // Estimate bounds height of text wrap
    const textLines = doc.splitTextToSize(budget.projectName, 125);
    y += (textLines.length * 4) + 6;

    // Pieces Table Header
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 4, 180, 8, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("CÓD.", 17, y + 1);
    doc.text("PEÇA PUBLICITÁRIA", 35, y + 1);
    doc.text("TIPO", 95, y + 1);
    doc.text("QTD", 115, y + 1);
    doc.text("TABELA UNITÁRIA", 130, y + 1);
    doc.text("VALOR LÍQUIDO", 165, y + 1);
    y += 7;

    doc.setFont("helvetica", "normal");
    budget.pieces.forEach(p => {
      doc.setFont("helvetica", "bold");
      doc.text(p.code || "S/C", 17, y);
      doc.setFont("helvetica", "normal");
      doc.text(p.name, 35, y, { maxWidth: 56 });
      doc.text(p.type, 95, y);
      doc.text(String(p.quantity), 117, y);
      doc.text(formatCurrency(p.basePrice), 130, y);
      doc.text(formatCurrency(p.totalValue), 165, y);
      
      const wrappedItemLines = doc.splitTextToSize(p.name, 56);
      y += (wrappedItemLines.length * 4.2) + 2;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 4;
    doc.setDrawColor(220, 225, 230);
    doc.line(15, y, 195, y);
    y += 10;

    // Totals Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("RESUMO DE VALORES ADJUDICADOS", 110, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.text("Total Bruto (Tabela SinaPro):", 110, y);
    doc.text(formatCurrency(grossSum), 165, y);
    y += 5.5;

    doc.text(`Desconto Global Aplicado (${budget.discountPercentage}%):`, 110, y);
    doc.text(`- ${formatCurrency(totalDisc)}`, 165, y);
    y += 7;

    // Final Adjudicated Total Highlight
    doc.setFillColor(98, 4, 189);
    doc.rect(110, y - 4, 85, 8.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("VALOR INDENIZADO TOTAL:", 112, y + 1.5);
    doc.text(formatCurrency(totalValue), 165, y + 1.5);

    y += 20;
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Espaço para auditoria governamental. Documento gerado sob o ID: ${budget.id}`, 15, y);
    doc.text("Os preços aqui representados constatam anuência prévia com a diretiva homologada da Agência Conteúdo.", 15, y + 3.5);

    doc.save(`Relatorio_Publico_${budget.publicAgency}_${budget.invoiceNumber}.pdf`);
  };

  return (
    <div className="flex-1 w-full bg-slate-55 pb-16 font-sans">
      
      {/* Top navbar section */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-[#6204bd] transition duration-150">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Portfólio
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={downloadPDFFile}
              className="px-5 py-2.5 bg-[#6204bd] text-white hover:bg-[#50039c] font-black text-xs rounded-xl transition duration-150 inline-flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PDF da Proposta
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto p-4 lg:p-6 space-y-6 flex-1">
        
        {/* Campaign Credentials Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none leading-relaxed print:hidden">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#dfccf1]/50 rounded-2xl text-[#6204bd]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Órgão Público (Município)</p>
              <p className="text-xs font-black text-slate-800 mt-0.5">Prefeitura de {budget.publicAgency}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#fbe2cc] rounded-2xl text-[#f07507]">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Código de Mídia</p>
              <p className="text-xs font-black text-slate-800 mt-0.5 font-mono">{budget.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Data de Emissão</p>
              <p className="text-xs font-black text-slate-800 mt-0.5 font-mono">{budget.date}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Desconto Geral</p>
              <p className="text-xs font-black text-slate-800 mt-0.5 text-[#6204bd]">{budget.discountPercentage}% aplicado</p>
            </div>
          </div>
        </div>

        {/* Dynamic pieces statistics boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total de Peças no Rol</span>
              <span className="text-lg font-black font-mono text-slate-800">{totalPiecesCount} unidades</span>
            </div>
            <Sparkles className="w-5 h-5 text-indigo-500/50" />
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Peças Criadas</span>
              <span className="text-lg font-black font-mono text-[#6204bd]">{createdCount} itens</span>
            </div>
            <Palette className="w-5 h-5 text-[#6204bd]/40" />
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Peças Adaptadas</span>
              <span className="text-lg font-black font-mono text-[#f07507]">{adaptedCount} itens</span>
            </div>
            <Layers className="w-5 h-5 text-[#f07507]/40" />
          </div>
        </div>

        {/* Proposal Body Sheet content (Voucher look) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-xs space-y-8 print-proposal-card">
          
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-[9px] font-black text-white bg-[#6204bd] px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">Proposta Homologada</span>
              <h2 className="text-lg font-black text-slate-900 mt-2">{budget.projectName}</h2>
              <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Órgão Público Solicitante: Prefeitura Municipal de {budget.publicAgency}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Código Unificado</span>
              <span className="text-base font-black font-mono text-slate-800">{budget.invoiceNumber}</span>
            </div>
          </div>

          {/* Table representing all media catalog inside budget */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-l-2 border-[#6204bd] pl-2">
              Demonstração de Linhas de Peças
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#dfccf1]/10 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-150">
                  <tr>
                    <th className="px-5 py-3 text-center">Código</th>
                    <th className="px-5 py-3">Peça Publicitária</th>
                    <th className="px-5 py-3">Categoria</th>
                    <th className="px-5 py-3 text-center">Tipo</th>
                    <th className="px-5 py-3 text-right">Preço Unitário (Tabela)</th>
                    <th className="px-5 py-3 text-center">Quantidade</th>
                    <th className="px-5 py-3 text-center">Desconto Aplicado</th>
                    <th className="px-5 py-3 text-right">Faturamento Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-755">
                  {budget.pieces.map((p) => {
                    const lineGross = p.basePrice * p.quantity;

                    return (
                      <tr key={p.id} className="hover:bg-slate-55/40">
                        {/* Piece Code */}
                        <td className="px-5 py-4 text-center">
                          <span className="bg-[#6204bd]/10 text-[#6204bd] font-black px-2 pb-0.5 pt-1 rounded text-[10px] font-mono whitespace-nowrap">
                            {p.code}
                          </span>
                        </td>

                        {/* Piece Name */}
                        <td className="px-5 py-4 text-slate-900 leading-snug">
                          {p.name}
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4 font-semibold text-slate-400 text-[10px] uppercase">{p.category}</td>

                        {/* Created vs Adapted badge */}
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            p.type === "Criada"
                              ? "bg-[#dfccf1]/40 text-[#6204bd]"
                              : "bg-[#fbe2cc]/40 text-[#f07507]"
                          }`}>
                            {p.type}
                          </span>
                        </td>

                        {/* Standard Base Price */}
                        <td className="px-5 py-4 text-right font-mono font-medium text-slate-650">{formatCurrency(p.basePrice)}</td>

                        {/* Quantity */}
                        <td className="px-5 py-4 text-center font-mono text-slate-800">{p.quantity}</td>

                        {/* Applied discount rate */}
                        <td className="px-5 py-4 text-center font-mono font-normal text-slate-450">{p.discountApplied}%</td>

                        {/* Final calculated price */}
                        <td className="px-5 py-4 text-right font-mono text-[#6204bd] font-black">{formatCurrency(p.totalValue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance analysis breakdown and stamping footer */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6 border-t border-slate-100">
            
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 max-w-sm w-full space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Auditoria & Veracidade</span>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Este relatório atesta que o investimento global apresentado foi formulado de acordo com a tabela homologada da Agência Conteúdo, considerando descontos fiscais acordados administrativamente.
              </p>
            </div>

            <div className="text-right space-y-2.5 w-full md:w-80 font-semibold">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Total Bruto de Mídia:</span>
                <span className="font-mono">{formatCurrency(grossSum)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Descontos / Bonificações ({budget.discountPercentage}%):</span>
                <span className="font-mono text-rose-500">-{formatCurrency(totalDisc)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-xs font-black text-slate-800">Custo Geral Homologado:</span>
                <span className="text-xl font-black font-mono text-[#6204bd] tracking-tight">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
