import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  FileText,
  Printer,
  Sparkles,
  ShieldCheck,
  Upload,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  gerarRoteiroIA,
  type RoteiroQuestion,
} from "@/lib/roteiro.functions";

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

function Index() {
  const [assunto, setAssunto] = useState("");
  const [perguntas, setPerguntas] = useState<RoteiroQuestion[] | null>(null);
  const [eixos, setEixos] = useState<string[]>([]);
  const [resumo, setResumo] = useState("");
  const [quantidade, setQuantidade] = useState(7);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pdfNome, setPdfNome] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gerar = useServerFn(gerarRoteiroIA);

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      setPdfBase64(base64);
      setPdfNome(file.name);
    };
    reader.readAsDataURL(file);
  }

  function removePdf() {
    setPdfBase64(null);
    setPdfNome(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGerar() {
    if (!assunto.trim()) return;
    setLoading(true);
    setErro(null);
    try {
      const r = await gerar({
        data: {
          tema: assunto,
          quantidade,
          ...(pdfBase64
            ? { pdfBase64, pdfNome: pdfNome ?? "documento.pdf" }
            : {}),
        },
      });
      if (!r.perguntas.length) {
        setErro("A IA não retornou perguntas. Tente detalhar melhor o tema.");
        return;
      }
      setPerguntas(r.perguntas);
      setEixos(r.eixos);
      setResumo(r.resumo);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Erro ao gerar o roteiro. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header institucional */}
      <header className="print:hidden border-b border-border bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
            <Activity className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
              Minuto ONA
            </h1>
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
                <h2 className="text-base font-bold text-foreground">
                  Configuração do Líder
                </h2>
              </div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                O que você deseja treinar com a equipe?
              </label>
              <Textarea
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Ex.: Administração segura de medicamentos na UTI; ou cole o procedimento institucional que quer auditar."
                className="min-h-44 resize-y rounded-xl text-sm"
              />

              {/* Upload de PDF */}
              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Documento institucional (PDF) — opcional
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
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
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

              {/* Quantidade de perguntas */}
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
                disabled={!assunto.trim() || loading}
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
                A IA lê o PDF anexado e correlaciona o conteúdo com o tema escolhido,
                gerando perguntas, gabaritos e diretrizes ONA personalizadas.
              </p>
            </div>
          </section>

          {/* Painel de Exibição do Roteiro */}
          <section>
            {!perguntas ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Seu roteiro aparecerá aqui
                </h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Descreva o tema da rotina ou cole o documento institucional no painel ao
                  lado e clique em <span className="font-semibold text-foreground">Gerar Roteiro</span> para
                  criar perguntas de auditoria ONA prontas para aplicar à equipe.
                </p>
              </div>
            ) : (
              <div>
                {/* Cabeçalho do roteiro */}
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:mb-3">
                  <div className="min-w-0">
                    <div className="hidden print:block">
                      <p className="text-sm font-bold text-primary">Minuto ONA</p>
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                      Roteiro de Auditoria ONA
                    </h2>
                    {resumo && (
                      <p className="mt-1 text-sm text-muted-foreground">{resumo}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {eixos.map((e) => (
                        <Badge key={e} variant="secondary" className="font-medium">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="print:hidden shrink-0 rounded-xl border-primary/30 font-semibold text-primary hover:bg-secondary"
                  >
                    <Printer className="h-4 w-4" />
                    Exportar PDF
                  </Button>
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
                        <p className="text-sm leading-relaxed text-foreground">
                          {q.gabarito}
                        </p>
                      </div>

                      <p className="mt-3 text-xs font-medium text-muted-foreground">
                        <span className="font-semibold text-foreground">Diretriz ONA:</span>{" "}
                        {q.diretriz}
                      </p>
                    </article>
                  ))}
                </div>

                {/* Rodapé técnico (apenas impressão) */}
                <footer className="mt-8 hidden border-t border-border pt-3 text-center text-xs text-muted-foreground print:block">
                  Fundação Gestão Hospitalar (FGH) — Documento gerado pelo Minuto ONA.
                </footer>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
