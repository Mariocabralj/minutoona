import { useEffect, useRef, useState } from "react";
import { Headphones, Loader2, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PodcastSegment } from "@/lib/podcast.functions";

interface Props {
  segments: PodcastSegment[] | null;
  gerando: boolean;
  erro: string | null;
  onGerar: () => void;
}

const NOMES: Record<string, string> = { ana: "Ana (apresentadora)", bruno: "Bruno (especialista ONA)" };

export function PodcastPlayer({ segments, gerando, erro, onGerar }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [indice, setIndice] = useState(0);
  const [tocando, setTocando] = useState(false);

  useEffect(() => {
    setIndice(0);
    setTocando(false);
  }, [segments]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !segments?.length) return;
    audio.src = `data:audio/mpeg;base64,${segments[indice]!.audioBase64}`;
    if (tocando) void audio.play().catch(() => setTocando(false));
  }, [indice, segments, tocando]);

  const parar = () => {
    audioRef.current?.pause();
    setTocando(false);
    setIndice(0);
  };

  const alternar = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (tocando) {
      audio.pause();
      setTocando(false);
    } else {
      setTocando(true);
      void audio.play().catch(() => setTocando(false));
    }
  };

  const aoTerminar = () => {
    if (!segments) return;
    if (indice < segments.length - 1) {
      setIndice(indice + 1);
    } else {
      setTocando(false);
      setIndice(0);
    }
  };

  const progresso = segments?.length ? ((indice + (tocando ? 1 : 0)) / segments.length) * 100 : 0;

  return (
    <div className="mt-4 rounded-2xl border border-primary/20 bg-card p-5 shadow-sm print:hidden">
      <div className="mb-3 flex items-center gap-2">
        <Headphones className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Resumo em áudio (podcast)</h3>
      </div>

      {!segments ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            Ouça um resumo de 2 a 3 minutos deste treinamento, em formato de conversa entre dois
            apresentadores.
          </p>
          <Button
            onClick={onGerar}
            disabled={gerando}
            variant="outline"
            className="w-full rounded-xl border-primary/30 py-5 font-bold text-primary hover:bg-secondary"
          >
            {gerando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparando o áudio... isso leva alguns segundos
              </>
            ) : (
              <>
                <Headphones className="h-4 w-4" />
                Ouvir resumo (podcast)
              </>
            )}
          </Button>
        </>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <Button onClick={alternar} className="rounded-xl font-bold">
              {tocando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {tocando ? "Pausar" : "Tocar"}
            </Button>
            <Button onClick={parar} variant="ghost" className="rounded-xl">
              <Square className="h-4 w-4" />
              Parar
            </Button>
            <span className="ml-auto text-xs font-medium text-muted-foreground">
              Fala {indice + 1} de {segments.length}
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-primary">
            {NOMES[segments[indice]!.locutor] ?? segments[indice]!.locutor}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{segments[indice]!.texto}</p>
        </div>
      )}

      {erro && <p className="mt-3 text-sm font-medium text-destructive">{erro}</p>}

      <audio ref={audioRef} onEnded={aoTerminar} className="hidden" />
    </div>
  );
}
