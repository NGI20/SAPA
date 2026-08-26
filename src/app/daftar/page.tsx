"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mendaftar.");
      } else {
        router.push("/riwayat-surat");
      }
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Buat akun SAPA"
      subtitle="Daftarkan akun untuk mulai mengajukan permohonan surat."
      switchText="Sudah memiliki akun?"
      switchHref="/masuk"
      switchLabel="Masuk sekarang"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Nama lengkap</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap"
            required
          />
        </div>
        <div className="field">
          <label>Nama instansi</label>
          <input
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            placeholder="Masukkan nama instansi"
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="contoh@email.com"
            required
          />
        </div>
        <div className="field">
          <label>Nomor HP / WhatsApp</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="08xx xxxx xxxx"
            required
          />
        </div>
        <div className="field">
          <label>Kata sandi</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Buat kata sandi"
            required
          />
        </div>
        <div className="field">
          <label>Konfirmasi kata sandi</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Ulangi kata sandi"
            required
          />
        </div>
        {error && <p className="form-note error-note">{error}</p>}
        <label className="agreement">
          <input type="checkbox" required /> Saya menyetujui kebijakan privasi SAPA.
        </label>
        <button className="button button-gold wide" disabled={loading} type="submit">
          {loading ? "Memproses..." : "Daftar"}
        </button>
      </form>
    </AuthLayout>
  );
}
