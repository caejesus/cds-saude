"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { sair } from "@/lib/acoes";
import type { TipoClinica } from "@/types/database";

type Item = { href: string; rotulo: string; icone: typeof Users };

function itensPara(tipo: TipoClinica): Item[] {
  const extras: Item[] =
    tipo === "odonto"
      ? [{ href: "/tratamentos", rotulo: "Tratamentos", icone: ClipboardList }]
      : tipo === "estetica"
        ? [{ href: "/pacotes", rotulo: "Pacotes", icone: Package }]
        : [];
  return [
    { href: "/dashboard", rotulo: "Dashboard", icone: LayoutDashboard },
    { href: "/agenda", rotulo: "Agenda", icone: CalendarDays },
    { href: "/clientes", rotulo: "Clientes", icone: Users },
    ...extras,
    { href: "/financeiro", rotulo: "Financeiro", icone: Wallet },
    { href: "/whatsapp", rotulo: "WhatsApp", icone: MessageCircle },
    { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
  ];
}

export function Sidebar({ tipo, nomeClinica, nomeUsuario }: { tipo: TipoClinica; nomeClinica: string; nomeUsuario: string }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const itens = itensPara(tipo);

  const conteudo = (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="mb-1 px-2">
        <Logo claro />
      </div>
      <p className="mb-6 truncate px-2 text-xs text-white/50">{nomeClinica}</p>
      <nav className="flex-1 space-y-1">
        {itens.map(({ href, rotulo, icone: Icone }) => {
          const ativo = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setAberto(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                ativo ? "bg-[rgba(160,40,80,0.35)] text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icone size={18} />
              {rotulo}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 pt-4">
        <p className="truncate px-3 text-xs text-white/50">{nomeUsuario}</p>
        <form action={sair}>
          <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/55 hover:bg-white/5 hover:text-white">
            <LogOut size={18} /> Sair
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-vinho-escuro px-4 py-3 md:hidden">
        <Logo claro />
        <button aria-label="Abrir menu" onClick={() => setAberto(true)} className="text-white">
          <Menu />
        </button>
      </header>

      {aberto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-vinho-escuro">
            <button aria-label="Fechar menu" onClick={() => setAberto(false)} className="absolute right-3 top-3 text-white/70">
              <X />
            </button>
            {conteudo}
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 hidden w-[220px] bg-vinho-escuro md:block">{conteudo}</aside>
    </>
  );
}
