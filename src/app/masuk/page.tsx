"use client";

import Link from "next/link";
import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
        const redirect = searchParams.get("redirect") || "/riwayat-surat";
        router.push(redirect);
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
        <label>Email atau nomor HP</label>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="contoh@email.com"
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
      {error && <p className="form-note error-note">{error}</p>}
      
      <div className="auth-options" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#ffffff', fontWeight: 500 }}>
          <input 
            type="checkbox" 
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#f4b81a', cursor: 'pointer', borderRadius: '4px' }}
          />
          Ingat saya
        </label>
        <Link href="/lupa-password" style={{ color: '#ffffff', fontSize: '14px', textDecoration: 'underline', opacity: 0.9 }}>
          Lupa kata sandi?
        </Link>
      </div>

      <button className="button button-gold wide" disabled={loading} type="submit">
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Selamat datang kembali"
      subtitle="Masuk untuk mengelola permohonan surat Anda."
      switchText="Belum memiliki akun?"
      switchHref="/daftar"
      switchLabel="Daftar sekarang"
    >
      <Suspense fallback={<p>Memuat...</p>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
