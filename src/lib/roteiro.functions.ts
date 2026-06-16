import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  tema: z.string().min(1).max(4000),
  documentoTexto: z.string().max(200000).optional(),
  pdfBase64: z.string().optional(),
  pdfNome: z.string().optional(),
  quantidade: z.number().int().min(3).max(15).optional(),
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

function buildContentBlocks(data: z.infer<typeof inputSchema>) {
  const blocks: Array<Record<string, unknown>> = [];
  const quantidade = data.quantidade ?? 7;

  let instrucao = `Tema que o líder deseja treinar com a equipe:\n"""${data.tema}"""\n\nGere ${quantidade} perguntas de simulação de auditoria ONA.`;

  if (data.documentoTexto && data.documentoTexto.trim()) {
    instrucao += `\n\nDocumento institucional (texto):\n"""${data.documentoTexto.slice(0, 180000)}"""`;
  }

  blocks.push({ type: "text", text: instrucao });

  if (data.pdfBase64) {
    blocks.push({
      type: "file",
      file: {
        filename: data.pdfNome || "documento.pdf",
        file_data: `data:application/pdf;base64,${data.pdfBase64}`,
      },
    });
    blocks.push({
      type: "text",
      text: "Analise o PDF anexado acima e correlacione seu conteúdo com o tema informado para gerar as perguntas.",
    });
  }

  return blocks;
}

export const gerarRoteiroIA = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<RoteiroResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Serviço de IA indisponível: chave não configurada.");
    }

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildContentBlocks(data) },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "entregar_roteiro",
            description: "Entrega o roteiro de auditoria ONA estruturado.",
            parameters: {
              type: "object",
              properties: {
                resumo: {
                  type: "string",
                  description: "Resumo de 1-2 frases sobre o foco do roteiro gerado.",
                },
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
                    additionalProperties: false,
                  },
                },
              },
              required: ["resumo", "perguntas"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "entregar_roteiro" },
      },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      throw new Error("Limite de requisições atingido. Aguarde alguns instantes e tente novamente.");
    }
    if (res.status === 402) {
      throw new Error("Créditos de IA esgotados. Adicione créditos no workspace para continuar.");
    }
    if (!res.ok) {
      const errText = await res.text();
      console.error("AI gateway error", res.status, errText);
      throw new Error("Não foi possível gerar o roteiro no momento.");
    }

    const json = await res.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;
    if (!argsRaw) {
      throw new Error("Resposta da IA em formato inesperado.");
    }

    let parsed: { resumo?: string; perguntas?: RoteiroQuestion[] };
    try {
      parsed = JSON.parse(argsRaw);
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