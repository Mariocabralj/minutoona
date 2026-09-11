import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import hpsLogo from "@/assets/hps-logomarca.png.asset.json";
import {
  FileText,
  Printer,
  Sparkles,
  ShieldCheck,
  Upload,
  Loader2,
  X,
  Send,
  Lock,
  MessagesSquare,
  UserCheck,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  gerarRoteiroIA,
  refinarRoteiroIA,
  marcarRoteiroExportado,
  type RoteiroQuestion,
} from "@/lib/roteiro.functions";
import { gerarPodcastRoteiro, type PodcastSegment } from "@/lib/podcast.functions";
import { PodcastPlayer } from "@/components/PodcastPlayer";

const CHECKIN_KEY = "minutoona.checkin";

interface Gestor {
  nome: string;
  matricula: string;
  setor: string;
}


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minuto ONA | Simulador de Auditoria ONA" },
      {
        name: "description",
        content:
          "Gere roteiros de perguntas rápidos e personalizados para preparar colaboradores antes da auditoria ONA. Módulo do Entrevistador da FGH.",
      },
      { property: "og:title", content: "Minuto ONA | Simulador de Auditoria ONA" },
      {
        property: "og:description",
        content: "Roteiros de auditoria ONA personalizados em menos de 3 minutos.",
      },
    ],
  }),
  component: Index,
});

function SkeletonRoteiro() {
  return (
    <div className="print:hidden">
      <div className="mb-5 h-7 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="mb-6 flex items-center gap-2 text-sm font-medium text-primary">
        <Loader2 className="h-4 w-4 animate-spin" />
        Escrevendo roteiro com IA do Groq...
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-7 w-10 animate-pulse rounded-lg bg-muted" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2 rounded-xl bg-secondary/50 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-3 h-3 w-2/5 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Index() {
  const [assunto, setAssunto] = useState("");
  const [perguntas, setPerguntas] = useState<RoteiroQuestion[] | null>(null);
  const [eixos, setEixos] = useState<string[]>([]);
  const [resumo, setResumo] = useState("");
  const [quantidade, setQuantidade] = useState(7);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pdfNome, setPdfNome] = useState<string | null>(null);
  const [pdfTexto, setPdfTexto] = useState<string | null>(null);
  const [lendoPdf, setLendoPdf] = useState(false);
  const [logId, setLogId] = useState<string | null>(null);

  const [gestor, setGestor] = useState<Gestor | null>(null);
  const [checkinAberto, setCheckinAberto] = useState(false);
  const [form, setForm] = useState<Gestor>({ nome: "", matricula: "", setor: "" });

  const [chatAberto, setChatAberto] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [refinando, setRefinando] = useState(false);

  const [podcast, setPodcast] = useState<PodcastSegment[] | null>(null);
  const [gerandoPodcast, setGerandoPodcast] = useState(false);
  const [erroPodcast, setErroPodcast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const gerar = useServerFn(gerarRoteiroIA);
  const refinar = useServerFn(refinarRoteiroIA);
  const marcarExportado = useServerFn(marcarRoteiroExportado);
  const gerarPodcast = useServerFn(gerarPodcastRoteiro);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKIN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Gestor;
        if (parsed?.nome && parsed?.matricula && parsed?.setor) {
          setGestor(parsed);
          setForm(parsed);
          return;
        }
      }
    } catch {
      /* ignora */
    }
    setCheckinAberto(true);
  }, []);

  const formValido =
    form.nome.trim().length >= 2 && form.matricula.trim().length >= 1 && form.setor.trim().length >= 2;

  function confirmarCheckin() {
    if (!formValido) return;
    const limpo: Gestor = {
      nome: form.nome.trim(),
      matricula: form.matricula.trim(),
      setor: form.setor.trim(),
    };
    setGestor(limpo);
    try {
      localStorage.setItem(CHECKIN_KEY, JSON.stringify(limpo));
    } catch {
      /* ignora */
    }
    setCheckinAberto(false);
  }

  const podeGerar =
    Boolean(gestor) && (assunto.trim().length > 0 || Boolean(pdfTexto)) && !loading && !lendoPdf;


  async function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErro("Envie um arquivo PDF válido.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErro("O PDF deve ter no máximo 15 MB.");
      return;
    }
    setErro(null);
    setLendoPdf(true);
    setPdfNome(file.name);
    try {
      const { extractPdfText } = await import("@/lib/pdf-extract");
      const texto = await extractPdfText(file);
      if (!texto || texto.length < 20) {
        setErro(
          "Não consegui extrair texto deste PDF (pode ser digitalizado/imagem). Tente outro arquivo ou descreva o tema.",
        );
        setPdfTexto(null);
        setPdfNome(null);
      } else {
        setPdfTexto(texto);
      }
    } catch {
      setErro("Falha ao ler o PDF. Tente novamente.");
      setPdfTexto(null);
      setPdfNome(null);
    } finally {
      setLendoPdf(false);
    }
  }

  function removePdf() {
    setPdfTexto(null);
    setPdfNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGerar() {
    if (!gestor) {
      setCheckinAberto(true);
      setErro("Faça o check-in com nome, matrícula e setor antes de gerar o roteiro.");
      return;
    }
    if (!podeGerar) return;
    setLoading(true);
    setErro(null);
    setPerguntas(null);
    setChatAberto(false);
    try {
      const r = await gerar({
        data: {
          tema: assunto,
          quantidade,
          gestor,
          ...(pdfTexto ? { documentoTexto: pdfTexto, pdfNome: pdfNome ?? "documento.pdf" } : {}),
        },
      });
      if (!r.perguntas.length) {
        setErro("A IA não retornou perguntas. Tente detalhar melhor o tema.");
        return;
      }
      setPerguntas(r.perguntas);
      setEixos(r.eixos);
      setResumo(r.resumo);
      setLogId(r.logId);
      setPodcast(null);
      setErroPodcast(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar o roteiro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefinar() {
    if (!feedback.trim() || !perguntas) return;
    setRefinando(true);
    setErro(null);
    try {
      const r = await refinar({
        data: {
          logId,
          tema: assunto,
          ...(pdfTexto ? { documentoTexto: pdfTexto } : {}),
          roteiroAtual: perguntas,
          feedback: feedback.trim(),
        },
      });
      if (r.perguntas.length) {
        setPerguntas(r.perguntas);
        setEixos(r.eixos);
        setResumo(r.resumo);
        setFeedback("");
        setChatAberto(false);
        setPodcast(null);
        setErroPodcast(null);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao refinar o roteiro.");
    } finally {
      setRefinando(false);
    }
  }

  async function handleGerarPodcast() {
    if (!perguntas) return;
    setGerandoPodcast(true);
    setErroPodcast(null);
    try {
      const r = await gerarPodcast({
        data: { logId, tema: assunto, resumo, eixos, perguntas },
      });
      if (!r.segments.length) {
        setErroPodcast("Não foi possível preparar o áudio. Tente novamente.");
        return;
      }
      setPodcast(r.segments);
    } catch (err) {
      setErroPodcast(
        err instanceof Error ? err.message : "Não foi possível preparar o áudio agora.",
      );
    } finally {
      setGerandoPodcast(false);
    }
  }


  function handlePrint() {
    if (logId) marcarExportado({ data: { logId } }).catch(() => {});
    window.print();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="print:hidden border-b border-border bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6">
          <div className="grid h-12 shrink-0 place-items-center rounded-xl bg-primary-foreground/10 px-2.5 ring-1 ring-primary-foreground/20">
            <img
              src={hpsLogo.url}
              alt="Logomarca do Hospital Pelópidas Silveira"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">Minuto ONA</h1>
            <p className="truncate text-xs font-medium text-primary-foreground/70 sm:text-sm">
              Simulador de Auditoria ONA — Módulo do Entrevistador
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* Painel de Configuração do Líder */}
          <section className="print:hidden lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">Configuração do Líder</h2>
              </div>

              {/* Check-in do gestor */}
              {gestor ? (
                <div className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-primary/25 bg-secondary/50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Check-in realizado
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-foreground">{gestor.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Matrícula {gestor.matricula} · {gestor.setor}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckinAberto(true)}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-background"
                  >
                    Alterar
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCheckinAberto(true)}
                  className="mb-4 w-full rounded-xl border-primary/40 py-5 font-bold text-primary hover:bg-secondary"
                >
                  <UserCheck className="h-4 w-4" />
                  Fazer Check-in
                </Button>
              )}

              <label className="mb-2 block text-sm font-semibold text-foreground">
                O que você deseja treinar com a equipe?{" "}
                <span className="font-normal text-muted-foreground">(opcional se anexar PDF)</span>
              </label>
              <Textarea
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Ex.: Administração segura de medicamentos na UTI; ou cole o procedimento institucional que quer auditar."
                className="min-h-44 resize-y rounded-xl text-sm"
              />

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Documento institucional (PDF)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfChange}
                  className="hidden"
                />
                {pdfNome ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                      {lendoPdf ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <span className="truncate">{pdfNome}</span>
                    </span>
                    <button
                      type="button"
                      onClick={removePdf}
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-background"
                      aria-label="Remover PDF"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-3 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    <Upload className="h-4 w-4" />
                    Anexar PDF para a IA analisar
                  </button>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Quantidade de perguntas: {quantidade}
                </label>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <Button
                onClick={handleGerar}
                disabled={!podeGerar}
                className="mt-5 w-full rounded-xl py-6 text-sm font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Gerando com IA...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Gerar Roteiro de Auditoria com IA
                  </>
                )}
              </Button>

              {erro && (
                <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {erro}
                </p>
              )}

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                A IA lê o PDF anexado e correlaciona o conteúdo com o tema escolhido, gerando
                perguntas, gabaritos e diretrizes ONA personalizadas. Você pode gerar apenas a partir
                do PDF, sem digitar nada.
              </p>

              <Link
                to="/auth"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                <Lock className="h-3.5 w-3.5" />
                Área Administrativa
              </Link>
            </div>
          </section>

          {/* Painel de Exibição do Roteiro */}
          <section className="relative">
            {loading ? (
              <SkeletonRoteiro />
            ) : !perguntas ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center print:hidden">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Seu roteiro aparecerá aqui</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Descreva o tema da rotina ou anexe o documento institucional no painel ao lado e
                  clique em <span className="font-semibold text-foreground">Gerar Roteiro</span> para
                  criar perguntas de auditoria ONA prontas para aplicar à equipe.
                </p>
              </div>
            ) : (
              <div>
                {/* Botão Exportar fixo no topo do painel */}
                <div className="sticky top-0 z-10 -mx-1 mb-4 flex justify-end px-1 py-2 print:hidden">
                  <Button
                    onClick={handlePrint}
                    className="rounded-xl font-bold shadow-md"
                  >
                    <Printer className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>

                <div className="mb-5 print:mb-3">
                  <div className="hidden print:block">
                    <p className="text-sm font-bold text-primary">Minuto ONA</p>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                    Roteiro de Auditoria ONA
                  </h2>
                  {resumo && <p className="mt-1 text-sm text-muted-foreground">{resumo}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {eixos.map((e) => (
                      <Badge key={e} variant="secondary" className="font-medium">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {perguntas.map((q, i) => (
                    <article
                      key={i}
                      className="rounded-2xl border border-border bg-card p-5 shadow-sm print:break-inside-avoid print:shadow-none"
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <Badge className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold">
                          Q{i + 1}
                        </Badge>
                        <h3 className="text-base font-bold leading-snug text-foreground">
                          {q.pergunta}
                        </h3>
                      </div>

                      <div className="rounded-xl border-l-4 border-emerald-500 bg-secondary/60 p-4">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Resposta Esperada / Gabarito Institucional
                        </p>
                        <p className="text-sm leading-relaxed text-foreground">{q.gabarito}</p>
                      </div>

                      <p className="mt-3 text-xs font-medium text-muted-foreground">
                        <span className="font-semibold text-foreground">Diretriz ONA:</span>{" "}
                        {q.diretriz}
                      </p>
                    </article>
                  ))}
                </div>

                {/* Refinamento por chat */}
                <div className="mt-6 print:hidden">
                  {!chatAberto ? (
                    <Button
                      onClick={() => setChatAberto(true)}
                      variant="outline"
                      className="w-full rounded-xl border-primary/30 py-5 font-bold text-primary hover:bg-secondary"
                    >
                      <Sparkles className="h-4 w-4" />
                      Refinar Roteiro com IA
                    </Button>
                  ) : (
                    <div className="rounded-2xl border border-primary/20 bg-card p-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <MessagesSquare className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">
                          Ajustar com a IA do Groq
                        </h3>
                      </div>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Diga à IA o que ajustar (Ex: 'Simplifique a pergunta 3', 'Foque mais na rotina do plantão noturno do HPS' ou 'Adapte para a equipe de enfermagem')."
                        className="min-h-28 resize-y rounded-xl text-sm"
                      />
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={handleRefinar}
                          disabled={!feedback.trim() || refinando}
                          className="flex-1 rounded-xl font-bold"
                        >
                          {refinando ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Refinando...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Enviar ajuste
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setChatAberto(false);
                            setFeedback("");
                          }}
                          className="rounded-xl"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <footer className="mt-8 hidden border-t border-border pt-3 text-center text-xs text-muted-foreground print:block">
                  Fundação Gestão Hospitalar (FGH) — Documento gerado pelo Minuto ONA.
                </footer>
              </div>
            )}
          </section>
        </div>
      </main>

      {checkinAberto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 print:hidden">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-1 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Check-in do Gestor</h2>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Identifique-se para registrar o acesso. Estes dados ficam vinculados a cada roteiro
              gerado e são visíveis para a gestão.
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">
                  Nome completo
                </label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex.: Maria Souza"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Matrícula</label>
                <Input
                  value={form.matricula}
                  onChange={(e) => setForm((f) => ({ ...f, matricula: e.target.value }))}
                  placeholder="Ex.: 123456"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-foreground">Setor</label>
                <Input
                  value={form.setor}
                  onChange={(e) => setForm((f) => ({ ...f, setor: e.target.value }))}
                  placeholder="Ex.: UTI Adulto"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                onClick={confirmarCheckin}
                disabled={!formValido}
                className="flex-1 rounded-xl py-5 font-bold"
              >
                <BadgeCheck className="h-4 w-4" />
                Confirmar Check-in
              </Button>
              {gestor && (
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => {
                    setForm(gestor);
                    setCheckinAberto(false);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
