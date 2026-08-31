"use client";

import { useState, FormEvent } from "react";
import { AuthLayout } from "@/components/auth-layout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengirim tautan.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Lupa kata sandi?"
      subtitle="Masukkan email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda."
      switchText="Ingat kata sandi Anda?"
      switchHref="/masuk"
      switchLabel="Masuk"
    >
      {sent ? (
        <div className="forgot-success">
          <div className="forgot-success-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
          <h3>Tautan terkirim!</h3>
          <p>
            Jika email <strong>{email}</strong> terdaftar di SAPA, Anda akan
            menerima tautan untuk mengatur ulang kata sandi.
          </p>
          <p className="forgot-note">
            Periksa folder spam jika tidak menemukan email dalam beberapa menit.
          </p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email terdaftar</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              required
            />
          </div>
          {error && <p className="form-note error-note">{error}</p>}
          <button className="button button-gold wide" disabled={loading} type="submit">
            {loading ? "Mengirim..." : "Kirim tautan reset"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
