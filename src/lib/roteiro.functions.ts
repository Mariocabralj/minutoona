import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  tema: z.string().min(1).max(4000),
  documentoTexto: z.string().max(200000).optional(),
  pdfBase64: z.string().optional(),
  pdfNome: z.string().optional(),
  quantidade: z.number().int().min(3).max(10).optional(),
});

export interface RoteiroQuestion {
  eixo: string;
  pergunta: string;
  gabarito: string;
  diretriz: string;
}

export interface RoteiroResult {
  perguntas: RoteiroQuestion[];
  eixos: string[];
  resumo: string;
}

const SYSTEM_PROMPT = `Você é um especialista em qualidade hospitalar e acreditação ONA (Organização Nacional de Acreditação) da Fundação Gestão Hospitalar (FGH).
Sua função é apoiar LÍDERES e GESTORES na preparação de colaboradores para auditorias ONA, gerando roteiros de perguntas de simulação de entrevista.

Regras:
- Baseie-se ESTRITAMENTE no conteúdo do documento institucional fornecido (quando houver) e no tema que o líder quer treinar.
- Cada pergunta deve ser direta, aplicável presencialmente a um colaborador antes da auditoria real.
- Para cada pergunta, escreva o GABARITO (resposta esperada/institucional) e a DIRETRIZ ONA correspondente (cite a seção/requisito quando possível, ex.: "Requisito ONA Seção 2 - Atenção ao Paciente").
- Agrupe por eixo assistencial (ex.: Medicamentos, Identificação do Paciente, Higienização das Mãos, Quedas, Prontuário, etc.).
- Use português do Brasil, linguagem clara e técnica.
- Se o documento não cobrir o tema, gere perguntas de alinhamento geral ONA pertinentes ao tema.`;

function buildParts(data: z.infer<typeof inputSchema>) {
  const parts: Array<Record<string, unknown>> = [];
  const quantidade = data.quantidade ?? 7;

  let instrucao = `Tema que o líder deseja treinar com a equipe:\n"""${data.tema}"""\n\nGere ${quantidade} perguntas de simulação de auditoria ONA.`;

  if (data.documentoTexto && data.documentoTexto.trim()) {
    instrucao += `\n\nDocumento institucional (texto):\n"""${data.documentoTexto.slice(0, 180000)}"""`;
  }

  if (data.pdfBase64) {
    instrucao +=
      "\n\nAnalise o PDF anexado e correlacione seu conteúdo com o tema informado para gerar as perguntas.";
  }

  parts.push({ text: instrucao });

  if (data.pdfBase64) {
    parts.push({
      inline_data: {
        mime_type: "application/pdf",
        data: data.pdfBase64,
      },
    });
  }

  return parts;
}

export const gerarRoteiroIA = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<RoteiroResult> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Serviço de IA indisponível: chave Gemini não configurada.");
    }

    const body = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: buildParts(data),
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            resumo: { type: "string" },
            perguntas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  eixo: { type: "string" },
                  pergunta: { type: "string" },
                  gabarito: { type: "string" },
                  diretriz: { type: "string" },
                },
                required: ["eixo", "pergunta", "gabarito", "diretriz"],
              },
            },
          },
          required: ["resumo", "perguntas"],
        },
      },
    };

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      },
    );

    if (res.status === 429) {
      throw new Error("Limite de requisições da API Gemini atingido. Aguarde e tente novamente.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Chave Gemini inválida ou sem permissão. Verifique a chave configurada.");
    }
    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error", res.status, errText);
      throw new Error("Não foi possível gerar o roteiro no momento.");
    }

    const json = await res.json();
    const textOut = json?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p?.text ?? "")
      .join("");
    if (!textOut) {
      throw new Error("Resposta da IA em formato inesperado.");
    }

    let parsed: { resumo?: string; perguntas?: RoteiroQuestion[] };
    try {
      parsed = JSON.parse(textOut);
    } catch {
      throw new Error("Falha ao interpretar a resposta da IA.");
    }

    const perguntas = (parsed.perguntas ?? []).filter(
      (p) => p && p.pergunta && p.gabarito,
    );
    const eixos = Array.from(new Set(perguntas.map((p) => p.eixo).filter(Boolean)));

    return {
      perguntas,
      eixos,
      resumo: parsed.resumo ?? "",
    };
  });