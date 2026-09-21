import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { 
  title: "SAPA", 
  description: "Sistem Administrasi Permohonan Antar Instansi - BWS Bali Penida" 
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { 
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  ); 
}
