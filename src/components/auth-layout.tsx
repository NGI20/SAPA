import Link from "next/link";
import { ReactNode } from "react";

export function AuthLayout({
  children,
  title,
  subtitle,
  switchText,
  switchHref,
  switchLabel,
  hideHomeLink,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  switchText?: string;
  switchHref?: string;
  switchLabel?: string;
  hideHomeLink?: boolean;
}) {
  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <div className="auth-panel-inner">
          {!hideHomeLink && (
            <Link href="/" className="auth-back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Kembali ke beranda
            </Link>
          )}
          <div className="auth-form-wrap">
            <span className="eyebrow light">BWS BALI PENIDA</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
            {children}
            {switchText && switchHref && switchLabel && (
              <p className="auth-switch">
                {switchText}{" "}
                <Link href={switchHref}>{switchLabel}</Link>
              </p>
            )}
          </div>
        </div>
        <div className="auth-curve" aria-hidden="true" />
      </section>
      <aside className="auth-aside">
        <span className="large-mark">S</span>
        <h2>SAPA</h2>
        <p>
          Sistem Administrasi
          <br />
          Permohonan Antar Instansi
        </p>
        <div className="aside-note">
          Proses surat yang lebih mudah, terarah, dan transparan.
        </div>
      </aside>
    </main>
  );
}
