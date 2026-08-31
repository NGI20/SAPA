"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth-layout";

function PortalLoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, remember: rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk.");
      } else {
        router.push("/portal");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Email Staf/Admin</label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="admin@sapa.id"
          required
        />
      </div>
      <div className="field">
        <label>Kata sandi</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan kata sandi"
            required
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#fff', fontWeight: 400 }}>
          <input 
            type="checkbox" 
            checked={rememberMe} 
            onChange={e => setRememberMe(e.target.checked)} 
            style={{ width: '16px', height: '16px', accentColor: '#0868a9', cursor: 'pointer' }}
          />
          Ingat saya
        </label>
        <Link href="/lupa-password" style={{ color: '#fff', fontSize: '14px', textDecoration: 'underline', opacity: 0.8 }}>
          Lupa password?
        </Link>
      </div>
      {error && <p className="form-note error-note">{error}</p>}
      <button className="button button-gold wide" style={{ marginTop: "24px" }} disabled={loading} type="submit">
        {loading ? "Memproses..." : "Masuk Internal"}
      </button>
    </form>
  );
}

export default function PortalLoginPage() {
  return (
    <AuthLayout
      title="Sistem Internal SAPA"
      subtitle="Masuk sebagai Staf TU atau Admin BWS Bali Penida."
      hideHomeLink={true}
    >
      <Suspense fallback={<p>Memuat...</p>}>
        <PortalLoginForm />
      </Suspense>
    </AuthLayout>
  );
}
