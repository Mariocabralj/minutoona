import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

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

type ContentPart =
  | { type: "text"; text: string }
  | { type: "file"; data: string; mediaType: string };

function buildContent(data: z.infer<typeof inputSchema>): ContentPart[] {
  const content: ContentPart[] = [];
  const quantidade = data.quantidade ?? 7;

  let instrucao = `Tema que o líder deseja treinar com a equipe:\n"""${data.tema}"""\n\nGere ${quantidade} perguntas de simulação de auditoria ONA.`;

  if (data.documentoTexto && data.documentoTexto.trim()) {
    instrucao += `\n\nDocumento institucional (texto):\n"""${data.documentoTexto.slice(0, 180000)}"""`;
  }

  if (data.pdfBase64) {
    instrucao +=
      "\n\nAnalise o PDF anexado e correlacione seu conteúdo com o tema informado para gerar as perguntas.";
  }

  content.push({ type: "text", text: instrucao });

  if (data.pdfBase64) {
    content.push({
      type: "file",
      data: `data:application/pdf;base64,${data.pdfBase64}`,
      mediaType: "application/pdf",
    });
  }

  return content;
}

export const gerarRoteiroIA = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<RoteiroResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Serviço de IA indisponível: chave não configurada.");
    }

    const gateway = createLovableAiGatewayProvider(apiKey);

    let output: { resumo?: string; perguntas?: RoteiroQuestion[] };
    try {
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildContent(data) }],
        output: Output.object({
          schema: z.object({
            resumo: z.string(),
            perguntas: z.array(
              z.object({
                eixo: z.string(),
                pergunta: z.string(),
                gabarito: z.string(),
                diretriz: z.string(),
              }),
            ),
          }),
        }),
      });
      output = result.output;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Lovable AI error", msg);
      if (msg.includes("429")) {
        throw new Error("Limite de requisições atingido. Aguarde e tente novamente.");
      }
      if (msg.includes("402")) {
        throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      }
      throw new Error("Não foi possível gerar o roteiro no momento.");
    }

    const perguntas = (output.perguntas ?? []).filter(
      (p) => p && p.pergunta && p.gabarito,
    );
    const eixos = Array.from(new Set(perguntas.map((p) => p.eixo).filter(Boolean)));

    return {
      perguntas,
      eixos,
      resumo: output.resumo ?? "",
    };
  });