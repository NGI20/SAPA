"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const nav = [
  ["Beranda", "/"],
  ["Ajukan Surat", "/ajukan-surat"],
  ["Lacak Surat", "/lacak-surat"],
  ["Riwayat Surat", "/riwayat-surat"],
];

export function SapaLogo() {
  return (
    <Link href="/" className="brand">
      <span className="sapa-mark">S</span>
      <span>SAPA</span>
    </Link>
  );
}

export function SiteHeader({ active }: { active?: string }) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="site-header">
      <SapaLogo />
      <nav className={mobileOpen ? "nav-open" : ""}>
        {nav.map(([label, href]) => (
          <Link
            className={active === label ? "active" : ""}
            href={href}
            key={label}
            onClick={() => setMobileOpen(false)}
          >
            {label}
          </Link>
        ))}
        {/* Mobile Auth/Profile Section */}
        <div className="mobile-auth">
          <hr />
          {user ? (
            <>
              <div className="mobile-profile-info">
                <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <div>
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </div>
              </div>
              <button className="dropdown-item logout" onClick={logout} style={{ paddingLeft: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Keluar
              </button>
            </>
          ) : (
            <div className="mobile-auth-links">
              <Link className="button button-ghost" href="/masuk" onClick={() => setMobileOpen(false)}>Masuk</Link>
              <Link className="button button-gold" href="/daftar" onClick={() => setMobileOpen(false)}>Daftar</Link>
            </div>
          )}
        </div>
      </nav>
      <div className="nav-actions desktop-only">
        {user ? (
          <div className="profile-wrap">
            <button
              className="profile-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu profil"
            >
              <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="profile-name">{user.name.split(" ")[0]}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="profile-overlay" onClick={() => setMenuOpen(false)} />
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <span className="user-avatar lg">{user.name.charAt(0).toUpperCase()}</span>
                    <div>
                      <b>{user.name}</b>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <hr />
                  <Link href="/riwayat-surat" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Riwayat Surat
                  </Link>
                  <button className="dropdown-item logout" onClick={logout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <Link className="text-link" href="/masuk">Masuk</Link>
            <Link className="button button-gold small-button" href="/daftar">Daftar</Link>
          </>
        )}
      </div>
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
        {mobileOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        )}
      </button>
    </header>
  );
}
