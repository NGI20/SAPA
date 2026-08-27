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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }
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
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  const EyeIcon = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" className="toggle-password" onClick={onToggle} aria-label={show ? "Sembunyikan" : "Tampilkan"}>
      {show ? (
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
  );

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
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Masukkan nama lengkap" required />
        </div>
        <div className="field">
          <label>Nama instansi <em style={{fontWeight:400,opacity:0.6}}>(opsional)</em></label>
          <input name="institution" value={formData.institution} onChange={handleChange} placeholder="Masukkan nama instansi" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contoh@email.com" required />
        </div>
        <div className="field">
          <label>Nomor HP / WhatsApp</label>
          <input name="phone" value={formData.phone} onChange={handleChange} placeholder="08xx xxxx xxxx" required />
        </div>
        <div className="field">
          <label>Kata sandi</label>
          <div className="password-field">
            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Buat kata sandi (min. 8 karakter)" required />
            <EyeIcon show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          </div>
        </div>
        <div className="field">
          <label>Konfirmasi kata sandi</label>
          <div className="password-field">
            <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Ulangi kata sandi" required />
            <EyeIcon show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
          </div>
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
