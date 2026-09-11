import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";

const questionSchema = z.object({
  eixo: z.string(),
  pergunta: z.string(),
  gabarito: z.string(),
  diretriz: z.string(),
});

const inputSchema = z.object({
  logId: z.string().nullable().optional(),
  tema: z.string().max(4000).optional().default(""),
  resumo: z.string().max(4000).optional().default(""),
  eixos: z.array(z.string()).max(30).optional().default([]),
  perguntas: z.array(questionSchema).min(1).max(10),
});

const falaSchema = z.object({
  locutor: z.enum(["ana", "bruno"]),
  texto: z.string(),
});

const dialogoSchema = z.object({
  falas: z.array(falaSchema).min(4).max(22),
});

export interface PodcastSegment {
  locutor: "ana" | "bruno";
  texto: string;
  audioBase64: string;
}

export interface PodcastResult {
  segments: PodcastSegment[];
}

const VOZES: Record<"ana" | "bruno", string> = {
  ana: "alloy",
  bruno: "onyx",
};

const DIALOGO_PROMPT = `Você é um roteirista de podcasts institucionais da Fundação Gestão Hospitalar (FGH), do Hospital de Pronto Socorro (HPS).
Escreva um episódio curto (2 a 3 minutos de fala, entre 8 e 16 falas curtas) em português do Brasil, no formato de conversa entre dois apresentadores:
- "ana": apresentadora, conduz a conversa, faz perguntas e resume.
- "bruno": especialista em qualidade e acreditação ONA, explica os pontos técnicos.

Regras:
- Baseie-se ESTRITAMENTE no roteiro de auditoria fornecido. Não invente dados, números, normas ou fatos que não estejam nele.
- Cubra: o tema do treinamento, os eixos abordados, de 3 a 5 pontos de atenção (com base nos gabaritos) e um fechamento curto e motivacional para a equipe.
- Tom de conversa profissional, frases curtas e naturais para leitura em voz alta. Sem marcações de cena, sem "[risos]", sem indicar nomes dentro do texto da fala.
- Responda APENAS com um objeto JSON válido no formato:
{"falas":[{"locutor":"ana","texto":"..."},{"locutor":"bruno","texto":"..."}]}`;

function parseJsonOutput(text: string) {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return dialogoSchema.parse(JSON.parse(slice));
}

function mapAiError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Podcast AI error", msg);
  if (msg.includes("429")) return new Error("Muitas solicitações agora. Aguarde um instante e tente novamente.");
  if (msg.includes("402")) return new Error("Os créditos de IA acabaram. Fale com o administrador do sistema.");
  if (msg.includes("403")) return new Error("A geração de áudio está indisponível nesta conta.");
  return new Error("Não foi possível gerar o áudio do resumo agora.");
}

async function gerarDialogo(contexto: string) {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new Error("Serviço de IA indisponível: chave não configurada.");
  const { createGroqProvider } = await import("./ai-gateway.server");
  const groq = createGroqProvider(apiKey);
  try {
    const result = await generateText({
      model: groq("openai/gpt-oss-120b"),
      temperature: 0.7,
      system: DIALOGO_PROMPT,
      messages: [{ role: "user", content: contexto }],
    });
    return parseJsonOutput(result.text);
  } catch (err) {
    throw mapAiError(err);
  }
}

async function sintetizarFala(texto: string, locutor: "ana" | "bruno", apiKey: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-tts",
      input: texto,
      voice: VOZES[locutor],
      response_format: "mp3",
      stream_format: "audio",
      instructions:
        locutor === "ana"
          ? "Fale em português do Brasil, tom de apresentadora de podcast: acolhedor, claro e com ritmo natural."
          : "Fale em português do Brasil, tom de especialista em qualidade hospitalar: calmo, seguro e didático.",
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("TTS falhou", response.status, body.slice(0, 500));
    throw mapAiError(new Error(`${response.status}`));
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export const gerarPodcastRoteiro = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<PodcastResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Serviço de áudio indisponível: configuração ausente.");

    const contexto = [
      data.tema?.trim() ? `Tema do treinamento: ${data.tema.trim()}` : "Treinamento baseado em documento institucional.",
      data.resumo?.trim() ? `Resumo do roteiro: ${data.resumo.trim()}` : "",
      data.eixos.length ? `Eixos abordados: ${data.eixos.join(", ")}` : "",
      `Roteiro de auditoria (JSON):\n${JSON.stringify(data.perguntas)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const dialogo = await gerarDialogo(contexto);
    const falas = dialogo.falas.filter((f) => f.texto.trim()).slice(0, 20);

    const segments: PodcastSegment[] = [];
    for (const fala of falas) {
      const audioBase64 = await sintetizarFala(fala.texto.trim().slice(0, 3000), fala.locutor, apiKey);
      segments.push({ locutor: fala.locutor, texto: fala.texto.trim(), audioBase64 });
    }

    if (data.logId) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: current } = await supabaseAdmin
          .from("roteiro_logs")
          .select("historico")
          .eq("id", data.logId)
          .single();
        const historico = Array.isArray(current?.historico) ? current.historico : [];
        historico.push({ tipo: "podcast", em: new Date().toISOString(), falas: segments.length });
        await supabaseAdmin.from("roteiro_logs").update({ historico }).eq("id", data.logId);
      } catch (e) {
        console.error("Falha ao registrar geração de podcast", e);
      }
    }

    return { segments };
  });
