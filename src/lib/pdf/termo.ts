import { A4, cabecalho, MARGEM, novoDocumento, paragrafos, rodape, titulo, limpar, type ClinicaPdf } from "./base";

export type DadosTermoPdf = {
  clinica: ClinicaPdf;
  titulo: string;
  texto: string;
  cliente: string;
  cpf: string | null;
  assinatura: string | null; // dataURL PNG
  assinadoEm: string | null; // "04/11/2026 às 13:21"
  registro?: string | null; // "Assinado pelo link · Android, Chrome · IP ..."
  codigo: string;
};

export async function gerarTermoPdf(d: DadosTermoPdf) {
  const doc = await novoDocumento();
  const topo = () => cabecalho(doc, d.clinica);
  let y = topo();
  y = titulo(doc, d.titulo, y);
  y = paragrafos(doc, d.texto, y, topo);

  // Bloco de assinatura: nunca separa da linha; se não couber, vai para a próxima página.
  if (y > A4.altura - 75) {
    doc.addPage();
    y = topo();
  }
  y += 12;
  const centro = A4.largura / 2;
  if (d.assinatura) {
    try {
      const p = doc.getImageProperties(d.assinatura);
      const h = 24;
      const w = Math.min(90, (p.width / p.height) * h);
      doc.addImage(d.assinatura, "PNG", centro - w / 2, y, w, h);
    } catch {
      /* sem imagem */
    }
  }
  y += 26;
  doc.setLineWidth(0.3);
  doc.line(centro - 45, y, centro + 45, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(limpar(d.cliente), centro, y + 5, { align: "center" });
  if (d.cpf) {
    doc.setFontSize(8.5);
    doc.text(`CPF ${d.cpf}`, centro, y + 9.5, { align: "center" });
  }
  if (d.assinadoEm) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Assinado eletronicamente em ${d.assinadoEm}`, centro, y + 15, { align: "center" });
    if (d.registro) doc.text(limpar(d.registro), centro, y + 19, { align: "center" });
    doc.setTextColor(30, 30, 30);
  }

  rodape(doc, `${d.clinica.nome}  ·  Termo de consentimento  ·  Código ${d.codigo}`);
  void MARGEM;
  return doc;
}
