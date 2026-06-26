import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Printer,
  LogOut,
  Loader2,
  Paperclip,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminDashboard, type DashboardData } from "@/lib/roteiro.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard de Gestão | Minuto ONA" }] }),
  component: Dashboard,
});

function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-3xl font-extrabold text-foreground">
        {value}
        {suffix && <span className="ml-0.5 text-lg">{suffix}</span>}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar dados."))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const maxTema = data?.temas.reduce((m, t) => Math.max(m, t.total), 0) ?? 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-tight">Dashboard de Gestão</h1>
              <p className="text-xs text-white/70">Minuto ONA · Indicadores do HPS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => navigate({ to: "/" })}
            >
              Gerar roteiro
            </Button>
            <Button variant="secondary" size="sm" className="rounded-xl" onClick={handleLogout}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando indicadores...
          </div>
        )}
        {erro && !loading && (
          <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {erro}
          </div>
        )}
        {data && !loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                icon={<FileText className="h-5 w-5" />}
                label="Total de Roteiros Gerados"
                value={data.totalRoteiros}
              />
              <StatCard
                icon={<Sparkles className="h-5 w-5" />}
                label="Taxa de Refinamento de IA"
                value={data.taxaRefinamento}
                suffix="%"
              />
              <StatCard
                icon={<Printer className="h-5 w-5" />}
                label="Roteiros Exportados em PDF"
                value={data.totalExportados}
              />
              <StatCard
                icon={<Layers className="h-5 w-5" />}
                label="Refinamentos Totais"
                value={data.totalRefinamentos}
              />
            </div>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-foreground">Temas / Eixos mais Auditados</h2>
              {data.temas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não há dados suficientes.</p>
              ) : (
                <div className="space-y-3">
                  {data.temas.map((t) => (
                    <div key={t.eixo} className="flex items-center gap-3">
                      <div className="w-44 shrink-0 truncate text-sm font-medium text-foreground" title={t.eixo}>
                        {t.eixo}
                      </div>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${maxTema ? (t.total / maxTema) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-bold text-foreground">{t.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-foreground">Logs Recentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-4 font-semibold">Data/Hora</th>
                      <th className="py-2 pr-4 font-semibold">Tema</th>
                      <th className="py-2 pr-4 font-semibold">Perguntas</th>
                      <th className="py-2 pr-4 font-semibold">Refin.</th>
                      <th className="py-2 pr-4 font-semibold">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                          Nenhum roteiro registrado ainda.
                        </td>
                      </tr>
                    )}
                    {data.logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/60">
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2.5 pr-4 font-medium text-foreground">{log.tema}</td>
                        <td className="py-2.5 pr-4">{log.quantidade}</td>
                        <td className="py-2.5 pr-4">{log.refinamentos}</td>
                        <td className="py-2.5 pr-4">
                          {log.tem_pdf ? (
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Paperclip className="h-3.5 w-3.5" /> Sim
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Não</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
