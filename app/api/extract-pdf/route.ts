import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Ensure Gemini client is instantiated on the server side with proper User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { base64Pdf } = await req.json();

    if (!base64Pdf) {
      return NextResponse.json(
        { error: "Nenhum PDF inserido. Por favor, envie o documento convertido." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "A chave de API GEMINI_API_KEY não está configurada no servidor." },
        { status: 500 }
      );
    }

    // Call Gemini with application/pdf inlineData
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: base64Pdf,
            mimeType: "application/pdf"
          }
        },
        `Você é um assistente especialista em extrair dados tabulares de documentos oficiais do SinaPro (Sindicato das Agências de Propaganda do ES).
Sua tarefa é analisar todas as páginas das tabelas de valores referenciais de serviços do SinaPro contidas no orçamento/PDF anexado.
Extraia TODOS os itens e peças de publicidade que encontrar no PDF, sem pular nenhum.

Para cada item de mídia ou peça publicitária identificada, extraia:
1. "code": O código numérico oficial ou identificador do subitem da tabela SinaPro (ex: '1.1', '2.3', '4.1'). Se o documento não possuir códigos explícitos, invente um código sequencial representativo com base na categoria dele (ex: se for mídia digital, use '4.X').
2. "category": Classifique estritamente em uma destas cinco categorias oficiais:
   - "Mídia Digital"
   - "Mídia Impressa"
   - "Áudio & Vídeo"
   - "Identidade Visual"
   - "OOH & Sinalização"
3. "name": O nome oficial do serviço ou peça publicitária.
4. "basePriceCreated": O preço base de criação (Peça Criada / Criação). Caso não exista, assume 0.
5. "basePriceAdapted": O preço base de adaptação (Peça Adaptada / Adaptação). Caso não exista, assume 0.

Retorne uma lista exaustiva com TODOS os itens encontrados. O retorno deve ser exclusivamente um array JSON contendo objetos com os campos mencionados. Se houver dezenas ou centenas de linhas, extraia todas para que a agência tenha a base de dados 100% atualizada.`
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: {
                type: Type.STRING,
                description: "Código numérico/identificador do item do SinaPro (ex: '1.1', '2.4', '4.1')"
              },
              category: { 
                type: Type.STRING,
                description: "Categoria estrita de mídia: 'Mídia Digital', 'Mídia Impressa', 'Áudio & Vídeo', 'Identidade Visual' ou 'OOH & Sinalização'"
              },
              name: { 
                type: Type.STRING,
                description: "Nome completo do serviço ou peça de mídia" 
              },
              basePriceCreated: { 
                type: Type.NUMBER,
                description: "Valor correspondente à peça criada (R$)" 
              },
              basePriceAdapted: { 
                type: Type.NUMBER,
                description: "Valor correspondente à peça adaptada (R$)" 
              }
            },
            required: ["code", "category", "name", "basePriceCreated", "basePriceAdapted"]
          }
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      return NextResponse.json(
        { error: "O modelo Gemini não retornou nenhum dado estruturado." },
        { status: 500 }
      );
    }

    const items = JSON.parse(textOutput.trim());
    return NextResponse.json({ success: true, items });

  } catch (err: any) {
    console.error("Erro na extração de PDF:", err);
    return NextResponse.json(
      { error: err.message || "Erro desconhecido ao processar o PDF com o Gemini" },
      { status: 500 }
    );
  }
}
