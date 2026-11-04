import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { marca } from "@/lib/marca";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: marca.subtitulo ? `${marca.nome} · ${marca.subtitulo}` : marca.nome,
  description: "Agenda, prontuário, financeiro e WhatsApp da clínica.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${dmSans.variable} h-full antialiased`}
      style={{ "--vinho-acao": marca.corPrimaria, "--vinho-escuro": marca.corEscura } as React.CSSProperties}
    >
      <body className="min-h-full font-corpo">{children}</body>
    </html>
  );
}
