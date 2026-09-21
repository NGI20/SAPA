"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Camera, RefreshCw } from "lucide-react";
import AvatarCropperModal from "@/components/AvatarCropperModal";
import { uploadAvatarBase64 } from "@/app/portal/actions";

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
  const [user, setUser] = useState<{ id: string; name: string; email: string; phone?: string; institution?: string; role?: string; nip?: string; avatarUrl?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formInst, setFormInst] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  // Avatar upload & Cropper state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setFormName(d.user.name || "");
          setFormInst(d.user.institution || "");
          setFormEmail(d.user.email || "");
          setFormPhone(d.user.phone || "");
          setAvatarUrl(d.user.avatarUrl || "");
        }
      })
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  }

  async function handleCropComplete(croppedDataUrl: string) {
    setCropperImageSrc(null);
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatarBase64(croppedDataUrl);
      setAvatarUrl(res.url);
      if (user) setUser({ ...user, avatarUrl: res.url });
      alert("Foto profil berhasil diperbarui!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengunggah foto profil.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();

    if (formPassword && formPassword !== formConfirmPassword) {
      alert("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setLoadingProfile(true);
    try {
      const actions = await import("@/app/portal/actions");
      await actions.updateProfile({ 
        name: formName, 
        email: formEmail, 
        phone: formPhone, 
        institution: formInst,
        password: formPassword.trim() ? formPassword : undefined,
        avatarUrl: avatarUrl || undefined
      });
      alert("Profil berhasil diperbarui!");
      setIsProfileModalOpen(false);
      setFormPassword("");
      setFormConfirmPassword("");
      
      // Update local state
      if (user) {
        setUser({ ...user, name: formName, email: formEmail, phone: formPhone, institution: formInst, avatarUrl });
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
              <span className="user-avatar overflow-hidden">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </span>
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
                    <span className="user-avatar lg overflow-hidden">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div>
                      <b>{user.name}</b>
                      <small>{user.email}</small>
                    </div>
                  </div>
                  <hr />
                  <button className="dropdown-item" onClick={() => { setIsProfileModalOpen(true); setMenuOpen(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Pengaturan Profil
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

      {/* Clean Profile Settings Modal for Public User */}
      {isProfileModalOpen && user && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              const isUnchanged = formName === user.name && formEmail === user.email && formPhone === (user.phone || "") && formInst === (user.institution || "") && !formPassword;
              if (isUnchanged) setIsProfileModalOpen(false);
            }
          }}
        >
          <section className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-xl shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Pengaturan Akun & Profil</h2>
                <p className="text-xs font-semibold text-slate-500">Pemohon Publik</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Avatar Profile Card */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-[#0868a9] text-white flex items-center justify-center font-bold text-xl shadow-xs border border-white overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-5 h-5 bg-[#f4b81a] text-[#084f86] rounded-full flex items-center justify-center border border-white shadow-xs cursor-pointer hover:scale-105 transition-transform"
                  title="Ganti Foto"
                >
                  <Camera className="w-2.5 h-2.5" />
                </button>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">{user.name}</h3>
                <p className="text-xs text-slate-500">{user.institution || "Masyarakat / Instansi Pemohon"}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#0868a9] text-[11px] font-semibold rounded border border-blue-200">
                    ID: {user.id.slice(0, 10)}
                  </span>
                  <input 
                    type="file" 
                    ref={avatarInputRef} 
                    onChange={handleAvatarFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    {uploadingAvatar ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Camera className="w-2.5 h-2.5" />}
                    {uploadingAvatar ? "Mengunggah..." : "Pilih Foto Baru"}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              
              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                
                {/* NIK / ID Identitas (Locked) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Identitas (NIK/ID) <span className="text-red-500 font-normal">(Terkunci)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input 
                      disabled
                      value={user.id.slice(0, 16)} 
                      className="w-full h-10 pl-9 pr-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg font-medium cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                {/* Level User (Locked) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Level User <span className="text-red-500 font-normal">(Terkunci)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input 
                      disabled
                      value="Pemohon Publik" 
                      className="w-full h-10 pl-9 pr-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg font-bold cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <input 
                      value={formName} 
                      onChange={e => setFormName(e.target.value)} 
                      required 
                      className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                    />
                  </div>
                </div>

                {/* Nama Instansi */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Instansi / Lembaga</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/><path d="M14 9h1"/><path d="M14 13h1"/><path d="M14 17h1"/></svg>
                    </div>
                    <input 
                      value={formInst} 
                      onChange={e => setFormInst(e.target.value)} 
                      placeholder="Contoh: Desa Adat / Swasta" 
                      className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Terdaftar</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <input 
                      value={formEmail} 
                      onChange={e => setFormEmail(e.target.value)} 
                      type="email" 
                      required 
                      className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                    />
                  </div>
                </div>

                {/* No Telepon / WhatsApp */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Telepon / WhatsApp</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <input 
                      value={formPhone} 
                      onChange={e => setFormPhone(e.target.value)} 
                      type="tel" 
                      required 
                      placeholder="08xxxxxxxxxx"
                      className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                    />
                  </div>
                </div>

              </div>

              {/* Password change section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                    Ganti Kata Sandi <span className="font-normal normal-case text-slate-400">(Kosongkan jika tidak diubah)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input 
                      type="password"
                      autoComplete="new-password"
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder="Kata Sandi Baru"
                      className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input 
                      type="password"
                      autoComplete="new-password"
                      value={formConfirmPassword}
                      onChange={e => setFormConfirmPassword(e.target.value)}
                      placeholder="Ulangi Kata Sandi Baru"
                      className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-lg font-medium focus:border-[#0868a9] outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsProfileModalOpen(false)} 
                  className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loadingProfile} 
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg font-bold text-white bg-[#0868a9] hover:bg-[#084f86] shadow-xs disabled:opacity-50 text-xs transition-all cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  {loadingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>

            </form>
          </section>
        </div>
      )}

      {/* Cropper Modal */}
      {cropperImageSrc && (
        <AvatarCropperModal
          imageSrc={cropperImageSrc}
          onClose={() => setCropperImageSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}

    </header>
  );
}
