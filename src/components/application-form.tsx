"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";

export function ApplicationForm() {
  const [error, setError] = useState("");
  const [receiptCode, setReceiptCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [user, setUser] = useState<{name: string, email: string, phone: string, institution: string} | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  function selectFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    const totalSize = newFiles.reduce((acc, f) => acc + f.size, 0) + files.reduce((acc, f) => acc + f.size, 0);
    
    if (totalSize > 10 * 1024 * 1024) {
      alert("Total ukuran semua dokumen tidak boleh melebihi 10 MB.");
      return;
    }
    
    const validFiles = newFiles.filter(f => f.type === "application/pdf");
    if (validFiles.length !== newFiles.length) {
      alert("Hanya file PDF yang diizinkan.");
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
    const input = document.getElementById("file") as HTMLInputElement;
    if (input) input.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = event.currentTarget;
    const fd = new FormData(form);
    
    // Remove default single file and append all files
    fd.delete("file");
    if (files.length === 0) {
      setError("Silakan unggah setidaknya 1 dokumen PDF.");
      setLoading(false);
      return;
    }
    files.forEach((f) => fd.append("files", f));

    try {
      const response = await fetch("/api/submissions", { method: "POST", body: fd });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Permohonan belum dapat dikirim.");
      } else {
        form.reset();
        setFiles([]);
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
            <input id="name" name="name" required placeholder="Masukkan nama lengkap Anda" defaultValue={user?.name || ""} key={user?.name || 'name'} />
          </div>
          <div className="field">
            <label htmlFor="institution">Nama instansi pemohon <em className="optional">(opsional)</em></label>
            <input id="institution" name="institution" placeholder="Masukkan nama instansi Anda" defaultValue={user?.institution || ""} key={user?.institution || 'institution'} />
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="email">Email aktif <span className="required">*</span></label>
            <input id="email" name="email" type="email" required placeholder="contoh@email.com" defaultValue={user?.email || ""} key={user?.email || 'email'} />
          </div>
          <div className="field">
            <label htmlFor="phone">Nomor HP / WhatsApp <span className="required">*</span></label>
            <input id="phone" name="phone" type="tel" required placeholder="08xx xxxx xxxx" defaultValue={user?.phone || ""} key={user?.phone || 'phone'} />
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
          
          <div className="upload-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: files.length > 0 ? '12px' : '0' }}>
            {files.map((file, idx) => (
              <div key={idx} className="file-selected" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div className="file-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0868a9" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>{file.name}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <button type="button" className="file-remove" onClick={() => removeFile(idx)} style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  Hapus
                </button>
              </div>
            ))}
          </div>

          <label className="upload-box" htmlFor="file">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <b>Klik untuk memilih file PDF</b>
            <small>Bisa lebih dari 1 file Maksimal total 10 MB</small>
          </label>
          <input
            id="file"
            name="file"
            accept="application/pdf"
            type="file"
            multiple
            onChange={(e) => selectFiles(e.target.files)}
            style={{ display: "none" }}
          />
        </div>

        {error && <p className="form-note error-note" role="alert">{error}</p>}

        <button className="button button-primary wide" disabled={loading} type="submit">
          {loading ? "Mengirim permohonan..." : "Kirim permohonan"}
        </button>
      </form>

      {receiptCode && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setReceiptCode(""); }}>
          <section className="bg-white rounded-[24px] p-8 md:p-10 w-full max-w-[500px] text-center shadow-2xl relative" role="dialog" aria-modal="true">
            <div className="w-20 h-20 bg-[#22c55e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Permohonan berhasil dikirim!</h2>
            <p className="text-slate-500 mb-8 text-[15px] leading-relaxed">
              Simpan kode resi berikut untuk melacak perkembangan surat Anda.
            </p>
            
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
              <span className="block text-xs font-bold text-slate-500 tracking-wider mb-2">KODE RESI</span>
              <b className="block text-xl md:text-2xl font-bold text-[#0868a9] mb-6">{receiptCode}</b>
              
              <button 
                className="inline-flex items-center gap-2 bg-[#0868a9] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/20" 
                onClick={copyReceipt} 
                type="button"
              >
                {copied ? (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Tersalin!</>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Salin kode resi</>
                )}
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              <a 
                className="flex items-center justify-center text-center p-3 rounded-xl border-2 border-[#0868a9] text-[#0868a9] font-bold text-sm hover:bg-blue-50 transition-colors" 
                href={`/cetak-resi/${encodeURIComponent(receiptCode)}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Cetak Bukti Resi
              </a>
              <Link 
                className="flex items-center justify-center text-center p-3 rounded-xl bg-[#0868a9] text-white font-bold text-sm hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/20" 
                href={`/lacak-surat?resi=${encodeURIComponent(receiptCode)}`}
              >
                Lacak surat
              </Link>
              <button 
                className="flex items-center justify-center text-center p-3 rounded-xl border-2 border-slate-200 text-[#0868a9] font-bold text-sm hover:border-[#0868a9] hover:bg-blue-50 transition-colors" 
                onClick={() => setReceiptCode("")} 
                type="button"
              >
                Ajukan permohonan baru
              </button>
            </div>
            
            {!user && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[13px] text-amber-800 font-medium">
                Buat akun atau masuk untuk menyimpan dan mengelola riwayat permohonan Anda di satu tempat.
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
