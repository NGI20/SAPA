"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { STATUS_LABELS, formatDate, statusClass } from "@/lib/submission-utils";
import { submitRevision, deleteSubmission } from "@/app/riwayat-surat/actions";

export type HistorySubmission = {
  id: string;
  receiptCode: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  institution: string | null;
  category: string;
  subject: string;
  documentName: string | null;
  documentUrl: string | null;
  responseDocUrl?: string | null;
  responseDocName?: string | null;
  responseNomor?: string | null;
  catatanStaf?: string | null;
  status: string;
  createdAt: string;
  statusLogs: { id: string; status: string; note: string | null; createdAt: string }[];
};

function getCleanDocUrl(url: string | null | undefined): string { 
  if (!url) return ''; 
  if (url.startsWith('[')) { 
    try { 
      const arr = JSON.parse(url); 
      if (Array.isArray(arr) && arr.length > 0) return String(arr[0]); 
    } catch { 
      return url; 
    } 
  } 
  return url; 
}

function getCleanDocName(name: string | null | undefined): string { 
  if (!name) return 'Dokumen PDF'; 
  if (name.startsWith('[')) { 
    try { 
      const arr = JSON.parse(name); 
      if (Array.isArray(arr) && arr.length > 0) return String(arr[0]); 
    } catch { 
      return name; 
    } 
  } 
  return name; 
}

const statusOptions = ["", "MENUNGGU", "PERLU_REVISI", "DITERUSKAN", "DISETUJUI", "DITOLAK"];

function StatusBadge({ status }: { status: string }) {
  const displayLabel = (STATUS_LABELS[status] || status || "").replace(/_/g, " ");
  return (
    <span className={`status-badge ${statusClass(status)}`}>
      <span className="status-dot" />
      {displayLabel}
    </span>
  );
}

export function HistoryTable({ submissions }: { submissions: HistorySubmission[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<HistorySubmission | null>(null);
  const [revising, setRevising] = useState<HistorySubmission | null>(null);
  const [deleting, setDeleting] = useState<HistorySubmission | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);
  const perPage = 5;

  const filtered = useMemo(
    () =>
      submissions.filter(
        (item) =>
          `${item.receiptCode} ${item.institution || ""} ${item.subject}`
            .toLowerCase()
            .includes(query.toLowerCase()) && (!status || item.status === status)
      ),
    [submissions, query, status]
  );

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeletingLoading(true);
    try {
      await deleteSubmission(deleting.receiptCode);
      setDeleting(null);
      if (selected?.id === deleting.id) setSelected(null);
      alert("Permohonan surat berhasil dibatalkan dan dihapus.");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus permohonan.");
    } finally {
      setIsDeletingLoading(false);
    }
  };

  return (
    <>
      <div className="history-card">
        <div className="table-tools">
          <div>
            <h2>Riwayat permohonan</h2>
            <p>Data ini hanya menampilkan permohonan yang terhubung dengan akun Anda.</p>
          </div>
          <div className="table-filters">
            <div className="search-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                aria-label="Cari riwayat surat"
                placeholder="Cari kode resi, instansi, perihal"
              />
            </div>
            <div className="select-wrap">
              <select
                aria-label="Filter status"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                {statusOptions.map((option) => (
                  <option value={option} key={option}>
                    {option ? (STATUS_LABELS[option] || option).replace(/_/g, " ") : "Semua status"}
                  </option>
                ))}
              </select>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {visible.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode resi</th>
                    <th>Instansi tujuan</th>
                    <th>Kategori</th>
                    <th>Tanggal pengajuan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr key={item.id}>
                      <td><span className="resi-code">{item.receiptCode}</span></td>
                      <td>{item.institution || "Perseorangan"}</td>
                      <td>{item.category}</td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <button className="detail-btn" onClick={() => setSelected(item)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Detail
                          </button>
                          
                          {/* If status is MENUNGGU, applicant can delete/cancel submission */}
                          {(item.status === "MENUNGGU" || item.status === "MENUNGGU_VERIFIKASI") && (
                            <button 
                              className="detail-btn" 
                              onClick={() => setDeleting(item)}
                              style={{ color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2" }}
                              title="Batalkan & Hapus Pengajuan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          )}

                          <Link 
                            href={`/cetak-resi?resi=${encodeURIComponent(item.receiptCode)}`}
                            target="_blank"
                            className="detail-btn"
                            style={{ background: "#f8fafc", borderColor: "#e2e8f0", color: "#0868a9" }}
                            title="Cetak Tanda Terima Resmi"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                            Cetak
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Menampilkan {visible.length} dari {filtered.length} permohonan</span>
              <div className="pagination">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>‹</button>
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    onClick={() => setPage(i + 1)}
                    className={page === i + 1 ? "current" : ""}
                    key={i}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}>›</button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>{submissions.length ? "Tidak ada permohonan yang sesuai" : "Belum ada riwayat permohonan"}</h3>
            <p>
              {submissions.length
                ? "Coba ubah kata kunci atau filter status Anda."
                : "Ajukan surat melalui SAPA, atau tambahkan pengajuan tamu menggunakan kode resi."}
            </p>
            {!submissions.length && (
              <Link className="button button-primary" href="/ajukan-surat">Ajukan surat</Link>
            )}
          </div>
        )}
      </div>

      {selected && (
        <DetailModal 
          item={selected} 
          onClose={() => setSelected(null)} 
          onRevise={(item) => { setSelected(null); setRevising(item); }}
          onDelete={(item) => setDeleting(item)}
        />
      )}

      {revising && (
        <RevisionModal item={revising} onClose={() => setRevising(null)} />
      )}

      {/* Confirmation Modal to Delete Submission */}
      {deleting && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setDeleting(null); }}>
          <section className="detail-modal" style={{ maxWidth: "450px" }} role="dialog" aria-modal="true">
            <div className="modal-top">
              <div>
                <span className="eyebrow" style={{ color: "#dc2626" }}>BATALKAN PENGAJUAN</span>
                <h2>Hapus Permohonan?</h2>
              </div>
              <button className="close-btn" onClick={() => setDeleting(null)} aria-label="Tutup">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px", display: "flex", gap: "10px", alignItems: "flex-start", marginTop: "10px" }}>
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div style={{ fontSize: "13px", color: "#991b1b" }}>
                <b>Perhatian:</b> Permohonan dengan nomor resi <b>{deleting.receiptCode}</b> belum diproses oleh staf dan akan dihapus permanen dari sistem.
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="button button-ghost" onClick={() => setDeleting(null)}>Batal</button>
              <button 
                disabled={isDeletingLoading}
                onClick={handleDelete}
                style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}
              >
                {isDeletingLoading ? "Menghapus..." : "Ya, Hapus Pengajuan"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function DetailModal({ 
  item, 
  onClose, 
  onRevise,
  onDelete
}: { 
  item: HistorySubmission; 
  onClose: () => void;
  onRevise: (item: HistorySubmission) => void;
  onDelete: (item: HistorySubmission) => void;
}) {
  const lastLog = item.statusLogs.length ? item.statusLogs[item.statusLogs.length - 1] : null;
  const isApproved = item.status === "DISETUJUI";
  const canDelete = item.status === "MENUNGGU" || item.status === "MENUNGGU_VERIFIKASI";

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="detail-modal" role="dialog" aria-modal="true">
        <div className="modal-top">
          <div>
            <span className="eyebrow">DETAIL PERMOHONAN</span>
            <h2>{item.receiptCode}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <StatusBadge status={item.status} />

        {/* Approved Official Card */}
        {isApproved && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "12px", padding: "16px", marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#065f46" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <b style={{ fontSize: "14px" }}>Surat Balasan / Rekomendasi Resmi Tersedia</b>
            </div>
            {item.responseNomor && (
              <div style={{ fontSize: "13px", color: "#064e3b" }}>
                <span>Nomor Surat Resmi: </span>
                <strong style={{ fontFamily: "monospace" }}>{item.responseNomor}</strong>
              </div>
            )}
            {item.responseDocUrl && (
              <a 
                href={item.responseDocUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "#059669", color: "#ffffff", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "13px", width: "fit-content" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Unduh Dokumen Balasan Resmi (PDF)
              </a>
            )}
          </div>
        )}

        {item.status === "DITOLAK" && lastLog?.note && (
          <div className="reject-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <div>
              <b>Alasan penolakan</b>
              <p>{lastLog.note}</p>
            </div>
          </div>
        )}

        {item.status === "PERLU_REVISI" && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px", marginTop: "14px", display: "flex", gap: "10px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <b style={{ color: "#92400e", fontSize: "13px" }}>Catatan Revisi dari Staf TU:</b>
              <p style={{ color: "#78350f", fontSize: "13px", marginTop: "4px" }}>{item.catatanStaf || lastLog?.note || "Silakan perbaiki dokumen pengajuan Anda sesuai catatan yang diberikan."}</p>
            </div>
          </div>
        )}

        <div className="detail-grid">
          <div><small>Nama pemohon</small><b>{item.applicantName}</b></div>
          <div><small>Email</small><b>{item.applicantEmail}</b></div>
          <div><small>Nomor HP / WhatsApp</small><b>{item.applicantPhone}</b></div>
          <div><small>Instansi</small><b>{item.institution || "Perseorangan"}</b></div>
          <div><small>Kategori surat</small><b>{item.category}</b></div>
          <div><small>Tanggal pengajuan</small><b>{formatDate(item.createdAt)}</b></div>
        </div>

        <div className="detail-subject">
          <small>Isi atau maksud surat</small>
          <p>{item.subject}</p>
        </div>

        <div className="detail-doc">
          <small>Dokumen pendukung (Pemohon)</small>
          {getCleanDocUrl(item.documentUrl) && getCleanDocName(item.documentName) ? (
            <a href={getCleanDocUrl(item.documentUrl)} target="_blank" rel="noopener noreferrer" className="doc-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              {getCleanDocName(item.documentName)}
            </a>
          ) : (
            <span className="no-doc">Tidak tersedia</span>
          )}
        </div>

        <div className="detail-timeline">
          <h3>Riwayat status</h3>
          <div className="timeline-list">
            {item.statusLogs.map((log, i) => (
              <div className={`tl-item ${i === item.statusLogs.length - 1 ? "latest" : ""}`} key={log.id}>
                <div className="tl-dot" />
                <div>
                  <b>{(STATUS_LABELS[log.status] || log.status).replace(/_/g, " ")}</b>
                  <small>{formatDate(log.createdAt)}{log.note ? ` · ${log.note}` : ""}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions" style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
          {item.status === "PERLU_REVISI" && (
            <button 
              className="button button-gold" 
              onClick={() => onRevise(item)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", height: "40px", padding: "0 16px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Revisi Dokumen
            </button>
          )}

          {canDelete && (
            <button 
              className="button button-ghost" 
              onClick={() => onDelete(item)}
              style={{ color: "#dc2626", borderColor: "#fecaca", background: "#fef2f2", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", height: "40px", padding: "0 16px" }}
            >
              <Trash2 className="w-4 h-4" />
              Batalkan Pengajuan
            </button>
          )}

          <Link 
            href={`/cetak-resi?resi=${encodeURIComponent(item.receiptCode)}`}
            target="_blank"
            className="button button-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", height: "40px", padding: "0 16px" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            Cetak Tanda Terima & QR
          </Link>
          
          <button 
            className="button button-ghost" 
            onClick={onClose}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "40px", padding: "0 16px", whiteSpace: "nowrap" }}
          >
            Tutup
          </button>
        </div>

      </section>
    </div>
  );
}

function RevisionModal({ item, onClose }: { item: HistorySubmission; onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const revisiLog = item.statusLogs.find(l => l.status === "PERLU_REVISI");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Silakan pilih file dokumen PDF yang telah direvisi.");
      return;
    }
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Format file harus berupa PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5 MB.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("receiptCode", item.receiptCode);
      fd.append("file", file);

      await submitRevision(fd);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah revisi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="detail-modal" style={{ maxWidth: "520px" }} role="dialog" aria-modal="true">
        <div className="modal-top">
          <div>
            <span className="eyebrow" style={{ color: "#d97706" }}>REVISI BERKAS</span>
            <h2>{item.receiptCode}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 14px", marginTop: "12px", fontSize: "13px" }}>
          <b style={{ color: "#92400e" }}>Catatan Permintaan Revisi:</b>
          <p style={{ color: "#78350f", marginTop: "4px" }}>
            {item.catatanStaf || revisiLog?.note || "Silakan perbaiki dokumen pengajuan Anda sesuai catatan staf."}
          </p>
        </div>

        {success ? (
          <div style={{ padding: "30px 20px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "24px" }}>✓</div>
            <h3 style={{ color: "#065f46", fontSize: "16px", fontWeight: "bold" }}>Dokumen Berhasil Diperbarui!</h3>
            <p style={{ color: "#047857", fontSize: "13px", marginTop: "4px" }}>Permohonan akan segera dicek kembali oleh Staf TU.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                Upload Dokumen PDF Baru (Maks 5 MB) <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div 
                onClick={() => fileRef.current?.click()}
                style={{ 
                  border: "2px dashed #cbd5e1", 
                  borderRadius: "10px", 
                  padding: "20px", 
                  textAlign: "center", 
                  cursor: "pointer",
                  background: fileName ? "#f0fdf4" : "#f8fafc"
                }}
              >
                <input 
                  type="file" 
                  ref={fileRef} 
                  accept="application/pdf,.pdf" 
                  style={{ display: "none" }} 
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ margin: "0 auto 8px" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {fileName ? (
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>{fileName}</span>
                ) : (
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Klik untuk memilih file PDF pengganti</span>
                )}
              </div>
            </div>

            {error && (
              <p style={{ color: "#ef4444", fontSize: "13px", background: "#fef2f2", padding: "8px 12px", borderRadius: "6px" }}>{error}</p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
              <button type="button" className="button button-ghost" onClick={onClose}>Batal</button>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? "Mengunggah..." : "Kirim Berkas Revisi"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export function ClaimSubmission() {
  const [open, setOpen] = useState(false);
  const [receiptCode, setReceiptCode] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function claim(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    const response = await fetch("/api/submissions/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptCode }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(data.error || "Pengajuan belum dapat ditambahkan.");
    setSuccess(true);
    setMessage("Pengajuan berhasil ditambahkan ke riwayat Anda.");
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div className="claim-section">
      <button className="claim-toggle" onClick={() => setOpen(!open)}>
        <div className="claim-toggle-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Punya pengajuan tanpa akun? <b>Tambahkan ke riwayat</b></span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform: open ? 'rotate(180deg)' : 'none', transition: '.2s'}}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <form className="claim-form" onSubmit={claim}>
          <p>Masukkan kode resi pengajuan Anda. Email akun harus sama dengan email saat mengajukan.</p>
          <div className="claim-input-row">
            <input
              value={receiptCode}
              onChange={(e) => setReceiptCode(e.target.value)}
              placeholder="Contoh: BWS/2026/2608/0001"
            />
            <button className="button button-primary" disabled={loading} type="submit">
              {loading ? "Memeriksa..." : "Tambahkan"}
            </button>
          </div>
          {message && (
            <p className={`claim-msg ${success ? "success" : "error"}`}>{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
