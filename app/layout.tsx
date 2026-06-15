import "./globals.css";
import React from "react";

export const metadata = {
  title: "SinaPro Mídia - Gestão de Contratação Pública",
  description: "Gestão e controle de orçamentos de mídias e peças publicitárias municipais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-slate-55 flex flex-col text-slate-800 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
