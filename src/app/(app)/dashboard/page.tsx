import { format, startOfDay, endOfDay, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, CalendarCheck, Users, Wallet } from "lucide-react";
import { getContexto } from "@/lib/contexto";
import { brl } from "@/lib/formato";
import type { StatusAgendamento } from "@/types/database";

const STATUS: Record<StatusAgendamento, { rotulo: string; cor: string }> = {
  agendado: { rotulo: "Agendado", cor: "bg-amber-50 text-amber-800" },
  confirmado: { rotulo: "Confirmado", cor: "bg-green-50 text-green-800" },
  em_atendimento: { rotulo: "Em atendimento", cor: "bg-blue-50 text-blue-800" },
  concluido: { rotulo: "Concluído", cor: "bg-gray-100 text-gray-700" },
  faltou: { rotulo: "Faltou", cor: "bg-red-50 text-red-800" },
  cancelado: { rotulo: "Cancelado", cor: "bg-gray-100 text-gray-500 line-through" },
};

type AgendaHoje = {
  id: string;
  inicio: string;
  status: StatusAgendamento;
  clientes: { nome: string } | null;
  profissionais: { nome: string } | null;
  procedimentos: { nome: string } | null;
};

export default async function DashboardPage() {
  const { supabase, usuario } = await getContexto();
  const agora = new Date();
  const hojeISO = format(agora, "yyyy-MM-dd");

  const [consultas, clientes, recebidos, vencidos] = await Promise.all([
    supabase
      .from("agendamentos")
      .select("id, inicio, status, clientes(nome), profissionais(nome), procedimentos(nome)")
      .gte("inicio", startOfDay(agora).toISOString())
      .lte("inicio", endOfDay(agora).toISOString())
      .neq("status", "cancelado")
      .order("inicio")
      .returns<AgendaHoje[]>(),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("ativo", true),
    supabase
      .from("lancamentos")
      .select("valor")
      .eq("tipo", "entrada")
      .eq("status", "pago")
      .gte("pago_em", format(startOfMonth(agora), "yyyy-MM-dd")),
    supabase
      .from("lancamentos")
      .select("valor")
      .eq("tipo", "entrada")
      .eq("status", "pendente")
      .lt("vencimento", hojeISO),
  ]);

  const soma = (linhas: { valor: number }[] | null) =>
    (linhas ?? []).reduce((t, l) => t + Number(l.valor), 0);

  const agenda = consultas.data ?? [];
  const cards = [
    { rotulo: "Consultas hoje", valor: String(agenda.length), icone: CalendarCheck },
    { rotulo: "Clientes ativos", valor: String(clientes.count ?? 0), icone: Users },
    { rotulo: "Recebido no mês", valor: brl(soma(recebidos.data)), icone: Wallet },
    { rotulo: "A receber vencido", valor: brl(soma(vencidos.data)), icone: AlertCircle },
  ];

  const primeiroNome = usuario.nome.split(" ")[0];
  const saudacao = agora.getHours() < 12 ? "Bom dia" : agora.getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-titulo text-3xl font-semibold sm:text-4xl">
          {saudacao}, {primeiroNome}
        </h1>
        <p className="mt-1 text-sm capitalize text-vinho-muted">
          {format(agora, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map(({ rotulo, valor, icone: Icone }) => (
          <div key={rotulo} className="cartao">
            <Icone size={18} className="text-vinho-medio" />
            <p className="mt-3 font-titulo text-2xl font-semibold sm:text-3xl">{valor}</p>
            <p className="text-xs text-vinho-muted">{rotulo}</p>
          </div>
        ))}
      </section>

      <section className="cartao">
        <h2 className="mb-4 font-titulo text-xl font-semibold">Agenda de hoje</h2>
        {agenda.length === 0 ? (
          <p className="py-6 text-center text-sm text-vinho-muted">Nenhuma consulta marcada para hoje.</p>
        ) : (
          <ul className="divide-y divide-vinho-borda">
            {agenda.map((a) => (
              <li key={a.id} className="flex items-center gap-4 py-3">
                <span className="w-12 font-titulo text-lg font-semibold">{format(new Date(a.inicio), "HH:mm")}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.clientes?.nome ?? "—"}</p>
                  <p className="truncate text-xs text-vinho-muted">
                    {[a.procedimentos?.nome, a.profissionais?.nome].filter(Boolean).join(" · ") || "Sem procedimento"}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS[a.status].cor}`}>
                  {STATUS[a.status].rotulo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
