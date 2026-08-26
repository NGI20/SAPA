import Link from "next/link";
import { ReactNode } from "react";

export function AuthLayout({ children, title, subtitle, switchText, switchHref, switchLabel }: { children: ReactNode; title: string; subtitle: string; switchText: string; switchHref: string; switchLabel: string; }) { 
  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <Link href="/" className="auth-back">
          <span>←</span> Kembali ke Beranda
        </Link>
        <div className="auth-form-wrap">
          <span className="eyebrow light">BWS BALI PENIDA</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {children}
          <p className="auth-switch">{switchText} <Link href={switchHref}>{switchLabel}</Link></p>
        </div>
      </section>
      <aside className="auth-aside">
        <span className="large-mark">S</span>
        <h2>SAPA</h2>
        <p>Sistem Administrasi<br/>Permohonan Antar Instansi</p>
        <div className="aside-note">Proses surat yang lebih mudah, terarah, dan transparan.</div>
      </aside>
    </main>
  ); 
}
