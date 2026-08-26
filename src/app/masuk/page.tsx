"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk.");
      } else {
        const redirect = searchParams.get("redirect") || "/riwayat-surat";
        router.push(redirect);
      }
    } catch {
      setError("Terjadi kesalahan.");
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
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan kata sandi"
          required
        />
      </div>
      {error && <p className="form-note error-note">{error}</p>}
      <div className="auth-options">
        <label>
          <input type="checkbox" /> Ingat saya
        </label>
        <Link href="/lupa-password">Lupa kata sandi?</Link>
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
