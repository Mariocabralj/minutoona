import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const gestorSchema = z.object({
  nome: z.string().min(2).max(120),
  matricula: z.string().min(1).max(40),
  setor: z.string().min(2).max(120),
});

const inputSchema = z
  .object({
    tema: z.string().max(4000).optional().default(""),
    documentoTexto: z.string().max(200000).optional(),
    pdfNome: z.string().optional(),
    quantidade: z.number().int().min(3).max(10).optional(),
    gestor: gestorSchema,
  })
  .refine(
    (d) => (d.tema && d.tema.trim().length > 0) || (d.documentoTexto && d.documentoTexto.trim().length > 0),
    { message: "Informe um tema ou anexe um documento." },
  );


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
  logId: string | null;
}

const SYSTEM_PROMPT = `Você é um especialista em qualidade hospitalar e acreditação ONA (Organização Nacional de Acreditação) da Fundação Gestão Hospitalar (FGH), atuando no Hospital de Pronto Socorro (HPS).
Sua função é apoiar LÍDERES e GESTORES na preparação de colaboradores para auditorias ONA, gerando roteiros de perguntas de simulação de entrevista.

Regras:
- Baseie-se ESTRITAMENTE no conteúdo do documento institucional fornecido (quando houver) e no tema que o líder quer treinar.
- Quando APENAS o documento for fornecido (sem tema), extraia os pontos auditáveis mais relevantes do próprio documento.
- Cada pergunta deve ser direta, aplicável presencialmente a um colaborador antes da auditoria real.
- Para cada pergunta, escreva o GABARITO (resposta esperada/institucional) e a DIRETRIZ ONA correspondente (cite a seção/requisito quando possível, ex.: "Requisito ONA Seção 2 - Atenção ao Paciente").
- Agrupe por eixo assistencial (ex.: Medicamentos, Identificação do Paciente, Higienização das Mãos, Quedas, Prontuário, etc.).
- Use português do Brasil, linguagem clara e técnica.
- Responda SEMPRE em formato JSON com os campos: resumo (string) e perguntas (array de objetos com eixo, pergunta, gabarito, diretriz).`;

const outputSchema = z.object({
  resumo: z.string(),
  perguntas: z.array(
    z.object({
      eixo: z.string(),
      pergunta: z.string(),
      gabarito: z.string(),
      diretriz: z.string(),
    }),
  ),
});

function mapGroqError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Groq AI error", msg);
  if (msg.includes("429")) return new Error("Limite de requisições atingido. Aguarde e tente novamente.");
  if (msg.includes("402")) return new Error("Créditos de IA esgotados.");
  return new Error("Não foi possível gerar o roteiro no momento.");
}

function parseJsonOutput(text: string): z.infer<typeof outputSchema> {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return outputSchema.parse(JSON.parse(slice));
}

async function runGroq(messages: { role: "user" | "assistant"; content: string }[]) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Serviço de IA indisponível: chave Groq não configurada.");
  const { createGroqProvider } = await import("./ai-gateway.server");
  const groq = createGroqProvider(apiKey);
  try {
    const result = await generateText({
      model: groq("openai/gpt-oss-120b"),
      temperature: 0.7,
      system:
        SYSTEM_PROMPT +
        `\n\nIMPORTANTE: responda APENAS com um objeto JSON válido, sem texto antes ou depois, exatamente no formato: {"resumo": "...", "perguntas": [{"eixo": "...", "pergunta": "...", "gabarito": "...", "diretriz": "..."}]}`,
      messages,
    });
    return parseJsonOutput(result.text);
  } catch (err) {
    throw mapGroqError(err);
  }
}

function cleanResult(output: z.infer<typeof outputSchema>) {
  const perguntas = (output.perguntas ?? []).filter((p) => p && p.pergunta && p.gabarito);
  const eixos = Array.from(new Set(perguntas.map((p) => p.eixo).filter(Boolean)));
  return { perguntas, eixos, resumo: output.resumo ?? "" };
}

export const gerarRoteiroIA = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<RoteiroResult> => {
    const quantidade = data.quantidade ?? 7;
    let instrucao = "";
    if (data.tema && data.tema.trim()) {
      instrucao += `Tema que o líder deseja treinar com a equipe:\n"""${data.tema}"""\n\n`;
    } else {
      instrucao += `O líder não informou um tema específico. Baseie o roteiro inteiramente no documento institucional anexado.\n\n`;
    }
    instrucao += `Gere ${quantidade} perguntas de simulação de auditoria ONA.`;
    if (data.documentoTexto && data.documentoTexto.trim()) {
      instrucao += `\n\nDocumento institucional (texto extraído do PDF):\n"""${data.documentoTexto.slice(0, 180000)}"""`;
    }

    const output = await runGroq([{ role: "user", content: instrucao }]);
    const result = cleanResult(output);

    let logId: string | null = null;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: inserted } = await supabaseAdmin
        .from("roteiro_logs")
        .insert({
          tema: data.tema?.trim() || (data.pdfNome ? `Documento: ${data.pdfNome}` : "(somente documento)"),
          quantidade,
          tem_pdf: Boolean(data.documentoTexto && data.documentoTexto.trim()),
          pdf_nome: data.pdfNome ?? null,
          eixos: result.eixos,
          gestor_nome: data.gestor.nome.trim(),
          gestor_matricula: data.gestor.matricula.trim(),
          gestor_setor: data.gestor.setor.trim(),
          checkin_em: new Date().toISOString(),
          historico: [{ tipo: "geracao", em: new Date().toISOString(), resumo: result.resumo }],
        })
        .select("id")
        .single();
      logId = inserted?.id ?? null;
    } catch (e) {
      console.error("Falha ao registrar log do roteiro", e);
    }

    return { ...result, logId };
  });

const refineSchema = z.object({
  logId: z.string().nullable().optional(),
  tema: z.string().max(4000).optional().default(""),
  documentoTexto: z.string().max(200000).optional(),
  roteiroAtual: z.array(
    z.object({
      eixo: z.string(),
      pergunta: z.string(),
      gabarito: z.string(),
      diretriz: z.string(),
    }),
  ),
  feedback: z.string().min(1).max(4000),
});

export const refinarRoteiroIA = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => refineSchema.parse(data))
  .handler(async ({ data }): Promise<RoteiroResult> => {
    let ctx = "";
    if (data.tema && data.tema.trim()) ctx += `Tema original: """${data.tema}"""\n\n`;
    if (data.documentoTexto && data.documentoTexto.trim()) {
      ctx += `Documento institucional (texto):\n"""${data.documentoTexto.slice(0, 120000)}"""\n\n`;
    }

    const output = await runGroq([
      {
        role: "user",
        content:
          ctx +
          `Roteiro de auditoria gerado anteriormente (JSON):\n${JSON.stringify(data.roteiroAtual)}`,
      },
      {
        role: "assistant",
        content: "Roteiro anterior registrado. Aguardando ajustes do líder.",
      },
      {
        role: "user",
        content: `Ajuste o roteiro acima de acordo com o seguinte pedido do líder do HPS, mantendo o formato JSON e a qualidade técnica ONA:\n"""${data.feedback}"""`,
      },
    ]);

    const result = cleanResult(output);

    let logId: string | null = data.logId ?? null;
    if (data.logId) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: current } = await supabaseAdmin
          .from("roteiro_logs")
          .select("refinamentos, historico")
          .eq("id", data.logId)
          .single();
        const historico = Array.isArray(current?.historico) ? current!.historico : [];
        historico.push({
          tipo: "refinamento",
          em: new Date().toISOString(),
          feedback: data.feedback,
          resumo: result.resumo,
        });
        await supabaseAdmin
          .from("roteiro_logs")
          .update({
            refinamentos: (current?.refinamentos ?? 0) + 1,
            eixos: result.eixos,
            historico,
          })
          .eq("id", data.logId);
      } catch (e) {
        console.error("Falha ao registrar refinamento", e);
      }
    }

    return { ...result, logId };
  });

export const marcarRoteiroExportado = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ logId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("roteiro_logs").update({ exportado_pdf: true }).eq("id", data.logId);
    } catch (e) {
      console.error("Falha ao marcar exportação", e);
    }
    return { ok: true };
  });

export interface DashboardLog {
  id: string;
  created_at: string;
  tema: string;
  quantidade: number;
  tem_pdf: boolean;
  pdf_nome: string | null;
  eixos: string[];
  refinamentos: number;
  exportado_pdf: boolean;
  gestor_nome: string | null;
  gestor_matricula: string | null;
  gestor_setor: string | null;
  checkin_em: string | null;
}

export interface DashboardData {
  totalRoteiros: number;
  totalRefinamentos: number;
  totalExportados: number;
  taxaRefinamento: number;
  temas: { eixo: string; total: number }[];
  logs: DashboardLog[];
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabase, userId } = context;
    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) throw new Error("Acesso restrito a administradores.");

    const { data: logs, error } = await supabase
      .from("roteiro_logs")
      .select(
        "id, created_at, tema, quantidade, tem_pdf, pdf_nome, eixos, refinamentos, exportado_pdf, gestor_nome, gestor_matricula, gestor_setor, checkin_em",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = (logs ?? []) as DashboardLog[];
    const totalRoteiros = rows.length;
    const totalRefinamentos = rows.reduce((s, r) => s + (r.refinamentos ?? 0), 0);
    const totalExportados = rows.filter((r) => r.exportado_pdf).length;
    const roteirosRefinados = rows.filter((r) => (r.refinamentos ?? 0) > 0).length;
    const taxaRefinamento = totalRoteiros ? Math.round((roteirosRefinados / totalRoteiros) * 100) : 0;

    const eixoCount = new Map<string, number>();
    for (const r of rows) {
      for (const e of r.eixos ?? []) eixoCount.set(e, (eixoCount.get(e) ?? 0) + 1);
    }
    const temas = Array.from(eixoCount.entries())
      .map(([eixo, total]) => ({ eixo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    return {
      totalRoteiros,
      totalRefinamentos,
      totalExportados,
      taxaRefinamento,
      temas,
      logs: rows.slice(0, 50),
    };
  });
