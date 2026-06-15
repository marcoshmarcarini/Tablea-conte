export type PieceType = 'Criada' | 'Adaptada';

export interface SinaProItem {
  id: string;
  code: string; // SinaPro standard classification code
  name: string;
  category: string;
  basePriceCreated: number;
  basePriceAdapted: number;
}

export interface SelectedPiece {
  id: string; // unique instance ID
  catalogId?: string; // reference to SinaProItem
  code: string; // SinaPro classification code saved in the proposal
  name: string;
  category: string;
  type: PieceType;
  basePrice: number; // Price from SinaPro table
  quantity: number;
  discountApplied: number; // Specific overall discount % 
  totalValue: number;
}

export interface CampaignBudget {
  id: string;
  invoiceNumber: string; // Código do documento
  publicAgency: 'Cachoeiro' | 'Presidente Kennedy' | 'Marataízes' | 'Venda Nova do Imigrante';
  clientName: string; // Synced with publicAgency as requested
  projectName: string;
  date: string; // YYYY-MM-DD
  discountPercentage: number; // Default discount for campaign (comissão/desconto)
  pieces: SelectedPiece[];
  createdAt: string;
}

export const SINAPRO_CATALOG: SinaProItem[] = [
  // 1. Identidade Visual
  { id: "iv-logo", code: "1.1", name: "Logotipo / Assinatura Visual", category: "Identidade Visual", basePriceCreated: 3500, basePriceAdapted: 1200 },
  { id: "iv-manual", code: "1.2", name: "Manual de Identidade Visual", category: "Identidade Visual", basePriceCreated: 5000, basePriceAdapted: 1800 },
  { id: "iv-papelaria", code: "1.3", name: "Papelaria Corporativa (Kit)", category: "Identidade Visual", basePriceCreated: 1500, basePriceAdapted: 600 },
  { id: "iv-sinalizacao", code: "1.4", name: "Manual de Sinalização Corp.", category: "Identidade Visual", basePriceCreated: 4200, basePriceAdapted: 1400 },
  { id: "iv-embalagem", code: "1.5", name: "Lote/Layout de Embalagem", category: "Identidade Visual", basePriceCreated: 2800, basePriceAdapted: 1100 },
  { id: "iv-mascote", code: "1.6", name: "Mascote / Personagem 2D/3D", category: "Identidade Visual", basePriceCreated: 4500, basePriceAdapted: 1550 },
  { id: "iv-foton", code: "1.7", name: "Manual de Frota / Envelopamento Manual", category: "Identidade Visual", basePriceCreated: 2200, basePriceAdapted: 850 },
  { id: "iv-marca-camp", code: "1.8", name: "Marca de Campanha Institucional", category: "Identidade Visual", basePriceCreated: 3100, basePriceAdapted: 1050 },
  
  // 2. Mídia Impressa
  { id: "pr-revista", code: "2.1", name: "Anúncio de Revista", category: "Mídia Impressa", basePriceCreated: 1800, basePriceAdapted: 600 },
  { id: "pr-jornal", code: "2.2", name: "Anúncio de Jornal", category: "Mídia Impressa", basePriceCreated: 1500, basePriceAdapted: 500 },
  { id: "pr-panfleto", code: "2.3", name: "Panfleto / Flyer frente e verso", category: "Mídia Impressa", basePriceCreated: 800, basePriceAdapted: 300 },
  { id: "pr-cartaz", code: "2.4", name: "Cartaz Informativo / Poster", category: "Mídia Impressa", basePriceCreated: 1000, basePriceAdapted: 400 },
  { id: "pr-outdoor", code: "2.5", name: "Outdoor clássico (Layout)", category: "Mídia Impressa", basePriceCreated: 1200, basePriceAdapted: 400 },
  { id: "pr-folder", code: "2.6", name: "Folder de 2 a 3 dobras", category: "Mídia Impressa", basePriceCreated: 1900, basePriceAdapted: 700 },
  { id: "pr-relatorio", code: "2.7", name: "Relatório de Gestão / Livreto", category: "Mídia Impressa", basePriceCreated: 5500, basePriceAdapted: 2000 },
  { id: "pr-placa", code: "2.8", name: "Placa de Obra / Painel Informativo", category: "Mídia Impressa", basePriceCreated: 1100, basePriceAdapted: 380 },
  { id: "pr-mural", code: "2.9", name: "Muralismo / Painel Ilustrado", category: "Mídia Impressa", basePriceCreated: 3300, basePriceAdapted: 1200 },
  { id: "pr-cartilha", code: "2.10", name: "Cartilha Educativa (até 8 págs)", category: "Mídia Impressa", basePriceCreated: 4800, basePriceAdapted: 1700 },
  
  // 3. Áudio & Vídeo
  { id: "av-roteiro-tv", code: "3.1", name: "Roteiro VT Comercial TV (30s)", category: "Áudio & Vídeo", basePriceCreated: 2500, basePriceAdapted: 900 },
  { id: "av-roteiro-radio", code: "3.2", name: "Roteiro Spot ou Jingle Rádio (30s)", category: "Áudio & Vídeo", basePriceCreated: 1200, basePriceAdapted: 400 },
  { id: "av-producao-reel", code: "3.3", name: "Vídeo Promocional Reels/TikTok", category: "Áudio & Vídeo", basePriceCreated: 1500, basePriceAdapted: 600 },
  { id: "av-institucional", code: "3.4", name: "Roteiro Espetáculo / Vídeo Institucional (até 5 min)", category: "Áudio & Vídeo", basePriceCreated: 4500, basePriceAdapted: 1600 },
  { id: "av-vt-animado", code: "3.5", name: "Roteiro e Storyboard de VT Animado", category: "Áudio & Vídeo", basePriceCreated: 3105, basePriceAdapted: 1150 },
  { id: "av-spot-prod", code: "3.6", name: "Produção de Spot Comercial (Áudio até 30s)", category: "Áudio & Vídeo", basePriceCreated: 1800, basePriceAdapted: 650 },
  { id: "av-jingle-prod", code: "3.7", name: "Produção / Arranjo de Jingle de Campanha", category: "Áudio & Vídeo", basePriceCreated: 4200, basePriceAdapted: 1500 },
  { id: "av-locucao", code: "3.8", name: "Casting & Direção de Locução / Voz", category: "Áudio & Vídeo", basePriceCreated: 1100, basePriceAdapted: 400 },
  
  // 4. Mídia Digital
  { id: "dg-card", code: "4.1", name: "Card Estático Redes Sociais", category: "Mídia Digital", basePriceCreated: 450, basePriceAdapted: 180 },
  { id: "dg-carrossel", code: "4.2", name: "Post Carrossel Redes (até 5 telas)", category: "Mídia Digital", basePriceCreated: 900, basePriceAdapted: 350 },
  { id: "dg-banner", code: "4.3", name: "Banner Digital para Portal", category: "Mídia Digital", basePriceCreated: 350, basePriceAdapted: 130 },
  { id: "dg-landing", code: "4.4", name: "Layout de Landing Page", category: "Mídia Digital", basePriceCreated: 4000, basePriceAdapted: 1500 },
  { id: "dg-filtro", code: "4.5", name: "Filtro Instagram / Realidade Aumentada", category: "Mídia Digital", basePriceCreated: 3200, basePriceAdapted: 1200 },
  { id: "dg-email", code: "4.6", name: "Layout de E-mail Marketing", category: "Mídia Digital", basePriceCreated: 750, basePriceAdapted: 280 },
  { id: "dg-gif", code: "4.7", name: "Gif Animado / Post Animado", category: "Mídia Digital", basePriceCreated: 650, basePriceAdapted: 250 },
  { id: "dg-story", code: "4.8", name: "Story Interativo (Kit com 3)", category: "Mídia Digital", basePriceCreated: 950, basePriceAdapted: 380 },
  { id: "dg-site-compl", code: "4.9", name: "Layout Completo Website Responsivo", category: "Mídia Digital", basePriceCreated: 8500, basePriceAdapted: 3200 },
  { id: "dg-app-layout", code: "4.10", name: "Arquitetura e Interface UI/UX Mobile App", category: "Mídia Digital", basePriceCreated: 12000, basePriceAdapted: 4500 },
  { id: "dg-capas", code: "4.11", name: "Capa e Identidade de Canal Digital Youtube/Linkedin", category: "Mídia Digital", basePriceCreated: 1100, basePriceAdapted: 400 },
  { id: "dg-midia-ad", code: "4.12", name: "Planejamento e Otimização de Anúncios Online", category: "Mídia Digital", basePriceCreated: 2400, basePriceAdapted: 900 },
  
  // 5. OOH & Sinalização
  { id: "oh-busdoor", code: "5.1", name: "Envelopamento Busdoor", category: "OOH & Sinalização", basePriceCreated: 1100, basePriceAdapted: 400 },
  { id: "oh-paineled", code: "5.2", name: "Vídeo Animado Painel de LED", category: "OOH & Sinalização", basePriceCreated: 1600, basePriceAdapted: 600 },
  { id: "oh-faixa", code: "5.3", name: "Faixa de Rua / Banner de Lona", category: "OOH & Sinalização", basePriceCreated: 500, basePriceAdapted: 200 },
  { id: "oh-veiculo", code: "5.4", name: "Desenho de Envelopamento de Veículo Oficial", category: "OOH & Sinalização", basePriceCreated: 1800, basePriceAdapted: 650 },
  { id: "oh-totem", code: "5.5", name: "Totem Digital / Painel Interativo OOH", category: "OOH & Sinalização", basePriceCreated: 2500, basePriceAdapted: 950 },
  { id: "oh-frontlight", code: "5.6", name: "Painel Frontlight / Backlight Rodoviário", category: "OOH & Sinalização", basePriceCreated: 1400, basePriceAdapted: 500 },
  { id: "oh-placa-rua", code: "5.7", name: "Placas de Sinalização Logística Urbana (Kit)", category: "OOH & Sinalização", basePriceCreated: 3200, basePriceAdapted: 1100 },
  
  // 6. Projetos Especiais & Branding
  { id: "pe-campanha", code: "6.1", name: "Planejamento de Campanha Integrada", category: "Projetos Especiais & Branding", basePriceCreated: 9500, basePriceAdapted: 3500 },
  { id: "pe-pesquisa", code: "6.2", name: "Desenho de Pesquisa de Opinião Pública", category: "Projetos Especiais & Branding", basePriceCreated: 4800, basePriceAdapted: 1900 },
  { id: "pe-ambientacao", code: "6.3", name: "Projeto Cenográfico para Evento Governamental", category: "Projetos Especiais & Branding", basePriceCreated: 6500, basePriceAdapted: 2500 },
  { id: "pe-brinde", code: "6.4", name: "Projeto de Brinde Promocional Especial", category: "Projetos Especiais & Branding", basePriceCreated: 1200, basePriceAdapted: 450 },
  { id: "pe-assessoria", code: "6.5", name: "Diretrizes de Assessoria de Imprensa & RP", category: "Projetos Especiais & Branding", basePriceCreated: 5000, basePriceAdapted: 1800 },
  { id: "pe-crisis", code: "6.6", name: "Desenho de Protocolo de Crise e Gestão Protocolar", category: "Projetos Especiais & Branding", basePriceCreated: 7200, basePriceAdapted: 2700 }
];

export const PUBLIC_AGENCIES = [
  "Cachoeiro",
  "Presidente Kennedy",
  "Marataízes",
  "Venda Nova do Imigrante"
] as const;

export function calculatePieceTotal(basePrice: number, quantity: number, discountPercentage: number): number {
  const discountFactor = (100 - discountPercentage) / 100;
  return Number((basePrice * quantity * discountFactor).toFixed(2));
}

export function getInitialBudgets(): CampaignBudget[] {
  return [
    {
      id: "camp-001",
      invoiceNumber: "CI-2026-001",
      publicAgency: "Cachoeiro",
      clientName: "Cachoeiro",
      projectName: "Vacinação Contra a Gripe 2026",
      date: "2026-01-15",
      discountPercentage: 15,
      createdAt: "2026-01-15T09:00:00Z",
      pieces: [
        {
          id: "p1",
          catalogId: "dg-card",
          code: "4.1",
          name: "Card Estático Redes Sociais",
          category: "Mídia Digital",
          type: "Criada",
          basePrice: 450,
          quantity: 4,
          discountApplied: 15,
          totalValue: 1530 // 450 * 4 * 0.85
        },
        {
          id: "p2",
          catalogId: "av-roteiro-radio",
          code: "3.2",
          name: "Roteiro Spot ou Jingle Rádio (30s)",
          category: "Áudio & Vídeo",
          type: "Criada",
          basePrice: 1200,
          quantity: 1,
          discountApplied: 15,
          totalValue: 1020 // 1200 * 1 * 0.85
        },
        {
          id: "p3",
          catalogId: "pr-panfleto",
          code: "2.3",
          name: "Panfleto / Flyer frente e verso",
          category: "Mídia Impressa",
          type: "Adaptada",
          basePrice: 300,
          quantity: 2,
          discountApplied: 15,
          totalValue: 510 // 300 * 2 * 0.85
        }
      ]
    },
    {
      id: "camp-002",
      invoiceNumber: "PK-2026-042",
      publicAgency: "Presidente Kennedy",
      clientName: "Presidente Kennedy",
      projectName: "Campanha de IPTU Premiado",
      date: "2026-02-12",
      discountPercentage: 20,
      createdAt: "2026-02-12T14:30:00Z",
      pieces: [
        {
          id: "p4",
          catalogId: "pr-jornal",
          code: "2.2",
          name: "Anúncio de Jornal",
          category: "Mídia Impressa",
          type: "Criada",
          basePrice: 1500,
          quantity: 1,
          discountApplied: 20,
          totalValue: 1200 // 1500 * 0.8
        },
        {
          id: "p5",
          catalogId: "pr-outdoor",
          code: "2.5",
          name: "Outdoor clássico (Layout)",
          category: "Mídia Impressa",
          type: "Criada",
          basePrice: 1200,
          quantity: 2,
          discountApplied: 20,
          totalValue: 1920 // 2400 * 0.8
        },
        {
          id: "p6",
          catalogId: "dg-card",
          code: "4.1",
          name: "Card Estático Redes Sociais",
          category: "Mídia Digital",
          type: "Adaptada",
          basePrice: 180,
          quantity: 5,
          discountApplied: 20,
          totalValue: 720 // 900 * 0.8
        }
      ]
    }
  ];
}
