import { marca } from "@/lib/marca";
import type { Clinica } from "@/types/database";
import type { ClinicaPdf } from "./base";

/** Dados da clínica para o cabeçalho dos PDFs (a logo é carregada no navegador). */
export const clinicaParaPdf = (c: Clinica): ClinicaPdf => ({
  nome: c.nome,
  marca: marca.nome,
  subtitulo: marca.subtitulo,
  cnpj: c.cnpj,
  endereco: c.endereco,
  cidade: c.cidade,
  estado: c.estado,
  telefone: c.telefone,
  corPrimaria: marca.corPrimaria,
  logo: null,
});
