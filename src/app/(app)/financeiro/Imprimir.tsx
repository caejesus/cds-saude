"use client";
import { Printer } from "lucide-react";

export function Imprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="botao-sec py-1.5 no-print">
      <Printer size={15} /> Imprimir
    </button>
  );
}
