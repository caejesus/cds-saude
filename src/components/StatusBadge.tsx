import type { StatusAgendamento } from "@/types/database";

export const STATUS: Record<StatusAgendamento, { rotulo: string; cor: string }> = {
  agendado: { rotulo: "Agendado", cor: "bg-amber-50 text-amber-800" },
  confirmado: { rotulo: "Confirmado", cor: "bg-green-50 text-green-800" },
  em_atendimento: { rotulo: "Atendendo", cor: "bg-blue-50 text-blue-800" },
  concluido: { rotulo: "Concluído", cor: "bg-gray-100 text-gray-700" },
  faltou: { rotulo: "Faltou", cor: "bg-red-50 text-red-800" },
  cancelado: { rotulo: "Cancelado", cor: "bg-gray-100 text-gray-500 line-through" },
};

export function StatusBadge({ status }: { status: StatusAgendamento }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS[status].cor}`}>
      {STATUS[status].rotulo}
    </span>
  );
}
