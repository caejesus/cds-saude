import { redirect } from "next/navigation";

// Cadastro público desativado: clínicas são instaladas pela Caetano Digital Systems.
export default function CadastroPage() {
  redirect("/login");
}
