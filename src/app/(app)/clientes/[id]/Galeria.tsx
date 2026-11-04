"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { excluirFoto, registrarFoto } from "./acoes-midia";

export type Foto = { id: string; url: string | null; regiao: string | null; momento: string | null; criado_em: string; data: string };

const REGIOES = ["Rosto", "Testa", "Olhos", "Lábios", "Pescoço", "Colo", "Braços", "Abdômen", "Costas", "Glúteos", "Coxas", "Pernas"];

/** Reduz a foto para no máximo 1600px (JPEG ~85%) antes de enviar: celular tira fotos de 5–10 MB. */
async function reduzir(arquivo: File): Promise<Blob> {
  const img = await createImageBitmap(arquivo);
  const escala = Math.min(1, 1600 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error("Falha ao processar a imagem"))), "image/jpeg", 0.85));
}

export function Galeria({ clinicaId, clienteId, fotos }: { clinicaId: string; clienteId: string; fotos: Foto[] }) {
  const router = useRouter();
  const arquivo = useRef<HTMLInputElement>(null);
  const [momento, setMomento] = useState("antes");
  const [regiao, setRegiao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [, iniciar] = useTransition();

  async function enviar(lista: FileList | null) {
    if (!lista?.length) return;
    setErro("");
    setEnviando(true);
    try {
      const supabase = createClient();
      for (const f of Array.from(lista)) {
        if (!f.type.startsWith("image/")) continue;
        const blob = await reduzir(f);
        const path = `${clinicaId}/${clienteId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from("fotos").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw new Error(error.message);
        const r = await registrarFoto(clienteId, path, momento, regiao);
        if (r?.erro) throw new Error(r.erro);
      }
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviando(false);
      if (arquivo.current) arquivo.current.value = "";
    }
  }

  // Agrupa por região; dentro de cada uma, antes → depois por data.
  const grupos = new Map<string, Foto[]>();
  for (const f of fotos) {
    const k = f.regiao || "Sem região";
    grupos.set(k, [...(grupos.get(k) ?? []), f]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex overflow-hidden rounded-lg border border-vinho-borda">
          {["antes", "depois"].map((m) => (
            <button key={m} type="button" onClick={() => setMomento(m)}
              className={`px-3 py-2 text-sm capitalize ${momento === m ? "bg-vinho-acao text-white" : "bg-white text-vinho-muted"}`}>
              {m}
            </button>
          ))}
        </div>
        <input list="regioes" value={regiao} onChange={(e) => setRegiao(e.target.value)} placeholder="Região (ex.: Rosto)" className="campo w-44" />
        <datalist id="regioes">{REGIOES.map((r) => <option key={r} value={r} />)}</datalist>
        <input ref={arquivo} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => enviar(e.target.files)} />
        <button type="button" onClick={() => arquivo.current?.click()} disabled={enviando} className="botao">
          <Camera size={16} /> {enviando ? "Enviando..." : "Adicionar foto"}
        </button>
      </div>
      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>}

      {fotos.length === 0 ? (
        <p className="text-sm text-vinho-muted">Nenhuma foto ainda. Registre o &quot;antes&quot; no primeiro atendimento para mostrar o resultado depois.</p>
      ) : (
        [...grupos.entries()].map(([nome, lista]) => {
          const antes = lista.filter((f) => f.momento === "antes").at(-1);
          const depois = lista.filter((f) => f.momento === "depois").at(0);
          return (
            <div key={nome}>
              <h3 className="mb-2 text-sm font-medium">{nome}</h3>
              {antes && depois && (
                <div className="mb-3 grid max-w-lg grid-cols-2 gap-2 rounded-xl bg-vinho-fundo p-2">
                  {[antes, depois].map((f) => (
                    <figure key={f.id} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {f.url && <img src={f.url} alt={`${nome} ${f.momento}`} className="aspect-[3/4] w-full rounded-lg object-cover" />}
                      <figcaption className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] capitalize text-white">
                        {f.momento} · {f.data}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {lista.map((f) => (
                  <div key={f.id} className="group relative">
                    <a href={f.url ?? "#"} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {f.url && <img src={f.url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />}
                    </a>
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] capitalize text-white">{f.momento ?? ""} {f.data}</span>
                    <button
                      type="button"
                      aria-label="Excluir foto"
                      onClick={() => confirmarExclusao(f.id)}
                      className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-700 opacity-0 shadow group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  function confirmarExclusao(id: string) {
    if (!window.confirm("Excluir esta foto? Não dá para desfazer.")) return;
    iniciar(async () => {
      await excluirFoto(id);
      router.refresh();
    });
  }
}
