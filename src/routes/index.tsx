import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, FileText, Printer, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { gerarRoteiro, type GeneratedQuestion } from "@/lib/auditData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FGH Prepara | Simulador de Auditoria ONA" },
      {
        name: "description",
        content:
          "Gere roteiros de perguntas rápidos e personalizados para preparar colaboradores antes da auditoria ONA. Módulo do Entrevistador da FGH.",
      },
      { property: "og:title", content: "FGH Prepara | Simulador de Auditoria ONA" },
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
  const [perguntas, setPerguntas] = useState<GeneratedQuestion[] | null>(null);
  const [eixos, setEixos] = useState<string[]>([]);
  const [generico, setGenerico] = useState(false);

  function handleGerar() {
    if (!assunto.trim()) return;
    const r = gerarRoteiro(assunto);
    setPerguntas(r.perguntas);
    setEixos(r.eixos);
    setGenerico(r.generico);
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
              FGH Prepara
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
                Assunto ou documento institucional
              </label>
              <Textarea
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Cole aqui o assunto que você deseja tratar ou o documento institucional!"
                className="min-h-44 resize-y rounded-xl text-sm"
              />
              <Button
                onClick={handleGerar}
                disabled={!assunto.trim()}
                className="mt-4 w-full rounded-xl py-6 text-sm font-bold"
              >
                <ShieldCheck className="h-5 w-5" />
                Gerar Roteiro de Auditoria (Máx. 3 Minutos)
              </Button>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                A ferramenta identifica eixos assistenciais críticos (medicamentos,
                identificação, higienização, quedas, prontuário) e seleciona perguntas
                ONA direcionadas.
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
                      <p className="text-sm font-bold text-primary">FGH Prepara</p>
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                      Roteiro de Auditoria ONA
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {generico ? (
                        <Badge variant="secondary" className="font-medium">
                          Alinhamento Geral ONA
                        </Badge>
                      ) : (
                        eixos.map((e) => (
                          <Badge key={e} variant="secondary" className="font-medium">
                            {e}
                          </Badge>
                        ))
                      )}
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
                  Fundação Gestão Hospitalar (FGH) — Documento gerado pelo FGH Prepara.
                </footer>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
