"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, RotateCw, X } from "lucide-react";

/** Exporta a assinatura em PNG com no máximo 1200px de largura (arquivo leve). */
function exportar(c: HTMLCanvasElement) {
  const escala = Math.min(1, 1200 / c.width);
  const out = document.createElement("canvas");
  out.width = Math.round(c.width * escala);
  out.height = Math.round(c.height * escala);
  out.getContext("2d")!.drawImage(c, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

function useCanvasAssinatura(ativo: boolean) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const desenhando = useRef(false);
  const [vazio, setVazio] = useState(true);
  const [elemento, setElemento] = useState<HTMLCanvasElement | null>(null);

  const ajustar = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    setVazio(true);
  }, []);

  // Reajusta sempre que a área muda de tamanho (inclusive ao girar o celular).
  useEffect(() => {
    if (!ativo || !elemento) return;
    const obs = new ResizeObserver(() => ajustar());
    obs.observe(elemento);
    return () => obs.disconnect();
  }, [ativo, elemento, ajustar]);

  const ref = useCallback((el: HTMLCanvasElement | null) => {
    canvas.current = el;
    setElemento(el);
  }, []);

  const ponto = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const eventos = {
    onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      desenhando.current = true;
      const ctx = canvas.current!.getContext("2d")!;
      const p = ponto(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.1, p.y + 0.1);
      ctx.stroke();
    },
    onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!desenhando.current) return;
      const ctx = canvas.current!.getContext("2d")!;
      const p = ponto(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      setVazio(false);
    },
    onPointerUp: () => (desenhando.current = false),
    onPointerCancel: () => (desenhando.current = false),
  };
  const limpar = () => {
    const c = canvas.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setVazio(true);
  };
  return { canvas: ref, vazio, eventos, limpar, png: () => exportar(canvas.current!) };
}

/** Assinatura dentro da página (tablet da clínica, computador). */
export function AssinaturaInline({ onEnviar, rotulo = "Confirmar assinatura" }: {
  onEnviar: (png: string) => Promise<string | void>;
  rotulo?: string;
}) {
  const { canvas, vazio, eventos, limpar, png } = useCanvasAssinatura(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  return (
    <div className="space-y-3">
      <canvas ref={canvas} {...eventos} className="h-48 w-full touch-none rounded-xl border-2 border-dashed border-vinho-medio bg-white" aria-label="Área para assinar" />
      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={limpar} className="botao-sec"><Eraser size={16} /> Limpar</button>
        <button
          type="button"
          disabled={vazio || enviando}
          className="botao"
          onClick={async () => {
            setErro("");
            setEnviando(true);
            const e = await onEnviar(png());
            if (e) {
              setErro(e);
              setEnviando(false);
            }
          }}
        >
          {enviando ? "Salvando..." : rotulo}
        </button>
      </div>
    </div>
  );
}

/**
 * Assinatura em tela cheia e deitada (celular do cliente). Tenta girar a tela sozinha
 * (Android); onde o navegador não deixa (iPhone), pede para girar e espera.
 */
export function AssinaturaTelaCheia({ aberto, onFechar, onEnviar, nome }: {
  aberto: boolean;
  onFechar: () => void;
  onEnviar: (png: string) => Promise<string | void>;
  nome: string;
}) {
  const { canvas, vazio, eventos, limpar, png } = useCanvasAssinatura(aberto);
  const [retrato, setRetrato] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
    const atualizar = () => setRetrato(mq.matches);
    atualizar();
    mq.addEventListener("change", atualizar);
    document.body.style.overflow = "hidden";
    (async () => {
      try {
        await document.documentElement.requestFullscreen?.();
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        await o.lock?.("landscape");
      } catch {
        /* iPhone e alguns navegadores não deixam: mostramos o aviso para girar */
      }
    })();
    return () => {
      mq.removeEventListener("change", atualizar);
      document.body.style.overflow = "";
      try {
        (screen.orientation as ScreenOrientation & { unlock?: () => void }).unlock?.();
        if (document.fullscreenElement) document.exitFullscreen();
      } catch {
        /* nada */
      }
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {retrato ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <RotateCw size={56} className="animate-spin text-vinho-acao [animation-duration:2.5s]" />
          <p className="font-titulo text-2xl font-semibold">Gire o celular</p>
          <p className="text-sm text-vinho-muted">Com o celular deitado fica mais fácil assinar. Se a tela não girar, desative o bloqueio de rotação.</p>
          <button type="button" onClick={onFechar} className="botao-sec mt-4">Voltar</button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 px-4 py-2">
            <p className="text-sm text-vinho-muted">Assine com o dedo no espaço abaixo</p>
            <button type="button" onClick={onFechar} className="rounded-full p-2 text-vinho-muted hover:bg-vinho-fundo" aria-label="Fechar"><X size={20} /></button>
          </div>
          <div className="relative mx-4 flex-1">
            <canvas ref={canvas} {...eventos} className="absolute inset-0 h-full w-full touch-none rounded-xl border-2 border-dashed border-vinho-medio" aria-label="Área para assinar" />
            <div className="pointer-events-none absolute inset-x-10 bottom-10 border-t border-gray-400 pt-1 text-center text-xs text-gray-500">{nome}</div>
          </div>
          {erro && <p className="mx-4 mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>}
          <div className="flex justify-end gap-2 px-4 py-3">
            <button type="button" onClick={limpar} className="botao-sec"><Eraser size={16} /> Limpar</button>
            <button
              type="button"
              disabled={vazio || enviando}
              className="botao"
              onClick={async () => {
                setErro("");
                setEnviando(true);
                const e = await onEnviar(png());
                setEnviando(false);
                if (e) setErro(e);
              }}
            >
              {enviando ? "Enviando..." : "Enviar assinatura"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
