"use client";

import { useState, FormEvent } from "react";
import { AuthLayout } from "@/components/auth-layout";

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Simulate API call for forgot password
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      setMessage("Tautan reset kata sandi telah dikirim ke email Anda.");
    }, 1500);
  }

  return (
    <AuthLayout
      title="Lupa kata sandi?"
      subtitle="Masukkan email Anda dan kami akan mengirimkan instruksi untuk mengatur ulang kata sandi."
      switchText="Sudah ingat kata sandi?"
      switchHref="/masuk"
      switchLabel="Masuk kembali"
    >
      {!isSuccess ? (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email yang terdaftar</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@email.com"
              required
            />
          </div>
          {message && <p className="form-note error-note">{message}</p>}
          <button className="button button-gold wide" disabled={loading} type="submit">
            {loading ? "Mengirim tautan..." : "Kirim Tautan Reset"}
          </button>
        </form>
      ) : (
        <div className="auth-form">
          <div className="alert-success" style={{ marginBottom: "20px" }}>
            <b>Tautan berhasil dikirim</b>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
          <p style={{ fontSize: "14px", color: "var(--line)" }}>Silakan periksa kotak masuk atau folder spam Anda. Jika belum menerima, silakan coba lagi beberapa saat.</p>
        </div>
      )}
    </AuthLayout>
  );
}
