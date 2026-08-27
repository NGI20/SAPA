"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function ApplicationForm() {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [receiptCode, setReceiptCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function selectFile(file?: File) {
    setError("");
    if (!file) return setFileName("");
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Dokumen harus berformat PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran dokumen maksimal 5 MB.");
      return;
    }
    setFileName(file.name);
  }

  function clearFile() {
    const input = document.getElementById("file") as HTMLInputElement;
    if (input) input.value = "";
    setFileName("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = event.currentTarget;
    const fd = new FormData(form);
    try {
      const response = await fetch("/api/submissions", { method: "POST", body: fd });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Permohonan belum dapat dikirim.");
      } else {
        form.reset();
        setFileName("");
        setReceiptCode(data.receiptCode);
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  async function copyReceipt() {
    await navigator.clipboard.writeText(receiptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <form className="application-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="name">Nama lengkap pemohon <span className="required">*</span></label>
            <input id="name" name="name" required placeholder="Masukkan nama lengkap Anda" />
          </div>
          <div className="field">
            <label htmlFor="institution">Nama instansi pemohon <em className="optional">(opsional)</em></label>
            <input id="institution" name="institution" placeholder="Masukkan nama instansi Anda" />
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="email">Email aktif <span className="required">*</span></label>
            <input id="email" name="email" type="email" required placeholder="contoh@email.com" />
          </div>
          <div className="field">
            <label htmlFor="phone">Nomor HP / WhatsApp <span className="required">*</span></label>
            <input id="phone" name="phone" type="tel" required placeholder="08xx xxxx xxxx" />
            <small>Digunakan untuk informasi status permohonan.</small>
          </div>
        </div>

        <div className="field">
          <label htmlFor="destination">Instansi tujuan <span className="required">*</span></label>
          <input id="destination" name="destination" defaultValue="BWS Bali Penida" required placeholder="Instansi tujuan surat" />
        </div>

        <div className="field">
          <label htmlFor="category">Kategori surat <span className="required">*</span></label>
          <div className="select-wrap">
            <select id="category" name="category" defaultValue="" required>
              <option value="" disabled>Pilih kategori surat</option>
              <option>Permohonan rekomendasi</option>
              <option>Permohonan data</option>
              <option>Permohonan izin</option>
              <option>Permohonan kerja sama</option>
              <option>Lainnya</option>
            </select>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>

        <div className="field">
          <label htmlFor="perihal">Perihal surat <span className="required">*</span></label>
          <input id="perihal" name="perihal" required placeholder="Contoh: Permohonan data debit sungai" />
        </div>

        <div className="field">
          <label htmlFor="subject">Isi atau maksud surat <span className="required">*</span></label>
          <textarea id="subject" name="subject" required placeholder="Jelaskan secara lengkap maksud dan tujuan permohonan Anda" />
        </div>

        <div className="field">
          <label htmlFor="file">Dokumen pendukung (PDF) <span className="required">*</span></label>
          {fileName ? (
            <div className="file-selected">
              <div className="file-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0868a9" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>{fileName}</span>
              </div>
              <button type="button" className="file-remove" onClick={clearFile}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Hapus
              </button>
            </div>
          ) : (
            <label className="upload-box" htmlFor="file">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <b>Klik untuk memilih file PDF</b>
              <small>atau seret file ke sini · Maksimal 5 MB</small>
            </label>
          )}
          <input
            id="file"
            name="file"
            accept="application/pdf"
            type="file"
            required
            onChange={(e) => selectFile(e.target.files?.[0])}
            style={{ display: "none" }}
          />
        </div>

        {error && <p className="form-note error-note" role="alert">{error}</p>}

        <button className="button button-primary wide" disabled={loading} type="submit">
          {loading ? "Mengirim permohonan..." : "Kirim permohonan"}
        </button>
      </form>

      {receiptCode && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setReceiptCode(""); }}>
          <section className="success-modal" role="dialog" aria-modal="true">
            <div className="success-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Permohonan berhasil dikirim!</h2>
            <p>Simpan kode resi berikut untuk melacak perkembangan surat Anda.</p>
            <div className="receipt-box">
              <span className="receipt-label">Kode Resi</span>
              <b className="receipt-code-text">{receiptCode}</b>
              <button className="copy-btn" onClick={copyReceipt} type="button">
                {copied ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Tersalin!</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Salin kode resi</>
                )}
              </button>
            </div>
            <div className="success-actions">
              <Link className="button button-primary" href={`/lacak-surat?resi=${encodeURIComponent(receiptCode)}`}>Lacak surat</Link>
              <button className="button button-ghost" onClick={() => setReceiptCode("")} type="button">Ajukan permohonan baru</button>
            </div>
            <p className="success-hint">
              Buat akun atau masuk untuk menyimpan dan mengelola riwayat permohonan Anda di satu tempat.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
