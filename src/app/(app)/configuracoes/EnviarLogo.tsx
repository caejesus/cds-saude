"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { salvarLogo } from "./actions";

/** Reduz para no máximo 800px mantendo a transparência (PNG). */
async function preparar(arquivo: File): Promise<Blob> {
  const img = await createImageBitmap(arquivo);
  const escala = Math.min(1, 800 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * escala);
  c.height = Math.round(img.height * escala);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((ok, erro) => c.toBlob((b) => (b ? ok(b) : erro(new Error("Falha ao processar a imagem"))), "image/png"));
}

export function EnviarLogo({ clinicaId, logoUrl, podeEditar }: { clinicaId: string; logoUrl: string | null; podeEditar: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro("");
    if (!/^image\/(png|jpeg|webp)$/.test(arquivo.type)) return setErro("Use uma imagem PNG, JPG ou WEBP (PNG com fundo transparente fica melhor).");
    setEnviando(true);
    try {
      const supabase = createClient();
      const path = `${clinicaId}/logo-${Date.now()}.png`;
      const { error } = await supabase.storage.from("marca").upload(path, await preparar(arquivo), { contentType: "image/png", upsert: true });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("marca").getPublicUrl(path);
      const e = await salvarLogo(data.publicUrl);
      if (e) throw new Error(e);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar a logo.");
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-20 w-44 items-center justify-center rounded-xl border border-dashed border-vinho-borda bg-[repeating-conic-gradient(#f6eef2_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logoUrl ? <img src={logoUrl} alt="Logo da clínica" className="max-h-16 max-w-40 object-contain" /> : <span className="text-xs text-vinho-muted">Sem logo</span>}
      </div>
      {podeEditar && (
        <div className="space-y-2">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => enviar(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} disabled={enviando} className="botao">
              <ImageUp size={16} /> {enviando ? "Enviando..." : logoUrl ? "Trocar logo" : "Enviar logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                disabled={enviando}
                className="botao-sec text-red-700"
                onClick={async () => {
                  if (!window.confirm("Remover a logo? O sistema volta a mostrar o nome em texto.")) return;
                  const e = await salvarLogo(null);
                  if (e) setErro(e);
                  else router.refresh();
                }}
              >
                <Trash2 size={16} /> Remover
              </button>
            )}
          </div>
          <p className="text-xs text-vinho-muted">PNG com fundo transparente, de preferência horizontal. Aparece no menu, no login, na assinatura por link e nos PDFs.</p>
          {erro && <p className="text-sm text-red-700">{erro}</p>}
        </div>
      )}
    </div>
  );
}
