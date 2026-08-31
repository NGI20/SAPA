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
      <span className="sapa-mark small">S</span>
      <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>SAPA</span>
    </Link>
  );
}

export function SiteHeader({ active }: { active?: string }) {
  
  const [user, setUser] = useState<{ name: string; email: string; phone: string; institution: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Profile form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formInst, setFormInst] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { 
        if (d.user) {
          setUser(d.user);
          setFormName(d.user.name || "");
          setFormEmail(d.user.email || "");
          setFormPhone(d.user.phone || "");
          setFormInst(d.user.institution || "");
        }
      })
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const actions = await import("@/app/portal/actions");
      await actions.updateProfile({ 
        name: formName, 
        email: formEmail, 
        phone: formPhone, 
        institution: formInst 
      });
      alert("Profil berhasil diperbarui!");
      setIsProfileModalOpen(false);
      
      // Update local state
      if (user) {
        setUser({ ...user, name: formName, email: formEmail, phone: formPhone, institution: formInst });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui profil.");
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <header className="site-header">
      
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
        {mobileOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        )}
      </button>

      <div className="header-logo-center">
        <SapaLogo />
      </div>
      
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
        {!user && (
          <div className="mobile-auth">
            <hr />
            <div className="mobile-auth-links">
              <Link className="button button-ghost" href="/masuk" onClick={() => setMobileOpen(false)}>Masuk</Link>
              <Link className="button button-gold" href="/daftar" onClick={() => setMobileOpen(false)}>Daftar</Link>
            </div>
          </div>
        )}
      </nav>
      
      <div className="nav-actions">
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
                  <button className="dropdown-item" onClick={() => { setIsProfileModalOpen(true); setMenuOpen(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profil Saya
                  </button>
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
          <div className="desktop-only" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link className="text-link" href="/masuk">Masuk</Link>
            <Link className="button button-gold small-button" href="/daftar">Daftar</Link>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <section className="bg-white rounded-[24px] p-8 w-full max-w-[500px] shadow-2xl relative" role="dialog" aria-modal="true">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Pengaturan Profil</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} required className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-[#0868a9] focus:ring-1 focus:ring-[#0868a9] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Instansi</label>
                <input value={formInst} onChange={e => setFormInst(e.target.value)} placeholder="Opsional" className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-[#0868a9] focus:ring-1 focus:ring-[#0868a9] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input value={formEmail} onChange={e => setFormEmail(e.target.value)} type="email" required className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-[#0868a9] focus:ring-1 focus:ring-[#0868a9] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">No HP</label>
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)} type="tel" required className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:border-[#0868a9] focus:ring-1 focus:ring-[#0868a9] outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Batal</button>
                <button type="submit" disabled={loadingProfile} className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#0868a9] hover:bg-blue-800 disabled:opacity-50">
                  {loadingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

    </header>
  );
}

